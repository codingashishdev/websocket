import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import { URL, type Url } from "url";
import bcrypt from "bcrypt";
import pool from "./db.js";
import cors from "cors";
import jwt from "jsonwebtoken"

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

const port = process.env.PORT || 8080;
const secret = process.env.JWT_SECRET;

interface ChatWebSocket extends WebSocket {
    username?: string;
}

function sanitize(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39");
}

const limiter = rateLimit({
    max: 200,
    windowMs: 60 * 60 * 1000,
    message: "Too many request from this IP address",
});

app.use(limiter);

const server = app.listen(port, () => {
    console.log(`Server is running on the localhost port: ${port} `);
});

const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:8080",
    "http://localhost:5500",
    "ws://localhost:8080"
];

function getConnectedUsers(): string[] {
    const users: string[] = [];
    wss.clients.forEach((client: ChatWebSocket) => {
        if (client.readyState === WebSocket.OPEN && client.username)
            users.push(client.username);
    });
    return users;
}

//helper function to broadcast list of users to all the connected users(clients)
function broadcastUserList() {
    const connectedUsers = getConnectedUsers();
    const userListMessage = {
        type: "userList",
        users: connectedUsers,
    };

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
            client.send(JSON.stringify(userListMessage));
    });
}

const wss = new WebSocketServer({
    server,
    verifyClient: (info, done) => {
        const origin = info.origin;

        if (!origin) {
            console.log('Origin not found')
        }

        // check if the origin is in our allowedOrigns list
        if (!allowedOrigins.includes(origin)) {
            console.log(`Connection to origin: ${origin} rejected`);
            return done(false);
        }

        if (!info.req.url) {
            console.log("Connection request error: missing URL");
            return done(false);
        }

        const fullUrl = new URL(info.req.url, `http://${info.req.headers.host}`);
        const token = fullUrl.searchParams.get("token");

        if (!token) {
            console.error("Connection rejected: Token not found in URL");
            return done(false)
        }

        if (!secret) {
            console.log("server error: JWT Token is not defined")
            return done(false)
        }

        jwt.verify(token, secret, (error, decoded) => {
            if (error) {
                console.log("Token verification error", error.message)
                return done(false)
            }

            pool
                .query("SELECT * from active_tokens WHERE token= $1", [token])
                .then((result) => {
                    if (result.rows.length == 0) {
                        //meaning the token not found in DB, reject the connection request
                        done(false);
                    } else {
                        (info.req as any).username = result.rows[0].username;
                        done(true);
                    }
                })
                .catch((error) => {
                    console.log("Token verification error: ", error);
                    done(false);
                });
        })


    },
    //because the typical size of the chat message is less than 1024 kilobytes(1 kb)
    maxPayload: 1024,
});

app.post("/register", async (req, res) => {
    try {
        if (!req.body || typeof req.body !== "object") {
            return res.status(400).json({
                message: "Invalid request body",
            });
        }
        const { username, password } = req.body;

        if (!username || !password || password.length < 6) {
            return res.status(400).json({
                message:
                    "Username and a password of at least 6 characters are required.",
            });
        }

        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const newUser = await pool.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING username",
            [username, password_hash],
        );

        res.status(201).json({
            message: "User created successfully",
            username: newUser.rows[0].username,
        });
    } catch (error) {
        // checking for a duplicate username
        if (error instanceof Error && "code" in error && error.code === "23505") {
            return res.status(409).json({
                message: "Username already exists",
            });
        }

        console.error(
            "Registration error: ",
            error instanceof Error ? error.message : error,
        );
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res
            .status(400)
            .json({ message: "username and password are required" });
    }

    try {
        const user = await pool.query(
            "SELECT password_hash from users WHERE username = $1",
            [username],
        );
        if (user.rows.length === 0) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const isValid = await bcrypt.compare(password, user.rows[0].password_hash);

        if (!isValid) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        if (!secret) {
            console.error("JWT_SECRET is not defined");
            return res.status(500).json({ message: "Internal server error" });
        }

        const token = jwt.sign({ username }, secret, { expiresIn: '1h' });

        await pool.query(
            "INSERT INTO active_tokens (token, username) VALUES ($1, $2)",
            [token, username],
        );

        res.json({ token, username });
    } catch (error) {
        console.error("Login error: ", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

app.post('/logout', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res
                .status(400)
                .json({ message: "Token not found" })
        }

        const deletedUser = await pool.query('DELETE FROM active_tokens WHERE token=$1', [token])

        if (deletedUser.rowCount === 0) {
            return res.status(401).json({ message: "Invalid token" });
        }

        return res.status(200).json({
            message: "User logout successfully"
        })
    } catch (err) {
        console.log("Logout error: ", err)
        return res.status(500).json({
            message: "Internal server error"
        })
    }
})

app.get('health', (req, res) => {
    res.status(200).json({ status: 'ok', timeStamp: new Date().toISOString() });
})

wss.on("connection", (ws: ChatWebSocket, req) => {
    console.log("New client has been connected!!");
    ws.username = (req as any).username;

    const announcement = {
        type: "announcement",
        message: `${ws.username || "unknown"} has joined the chat room`,
    };

    wss.clients.forEach((client) => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(announcement));
        }
    });

    // sending broadcase message to all the connected users/clients
    broadcastUserList();

    // listening for messages from specific client
    ws.on("message", (message) => {
        console.log(`Received message: ${message}`);

        try {
            const messageObject = JSON.parse(message.toString());
            if (messageObject.type === "chat") {
                if (!messageObject.message || messageObject.message.length > 250) {
                    return;
                }
                const chatMessage = {
                    username: ws.username,
                    message: sanitize(messageObject.message),
                    timestamp: new Date().toLocaleTimeString(),
                };

                wss.clients.forEach((client) => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify(chatMessage));
                    }
                });
            }
        } catch (error) {
            console.log("Error Parsing JSON: ", error);
        }
    });

    // handling client disconnecting
    ws.on("close", () => {
        console.log("Client has disconneted");

        setTimeout(() => {
            broadcastUserList();
        }, 100);
    });
});
