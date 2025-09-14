import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

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
    "https://our-domain-app.com"
]

function getConnectedUsers(): string[] {
    const users: string[] = [];
    wss.clients.forEach((client: ChatWebSocket) => {
        if (client.readyState === WebSocket.OPEN && client.username) {
            users.push(client.username);
        }
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
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(userListMessage));
        }
    });
}

const wss = new WebSocketServer({
    server,
    verifyClient: (info, done) => {
        const origin = info.origin;

        // check if the origin is in our allowedOrigns list
        if (allowedOrigins.includes(origin)) {
            //approve if true
            done(true);
        } else {
            console.log(`Connection to origin: ${origin} rejected`);
            //reject if false
            done(false);
        }
    },
    //because the typical size of the chat message is less than 1024 kilobytes(1 kb)
    maxPayload: 1024,
});

wss.on("connection", (ws: ChatWebSocket) => {
    console.log("New client has been connected!!");
    // listening for messages from specific client
    ws.on("message", (message) => {
        console.log(`Received message: ${message}`);

        try {
            const messageObject = JSON.parse(message.toString());

            if (messageObject.type === "login") {
                if (
                    !messageObject.username ||
                    messageObject.username.trim().length === 0
                ) {
                    return;
                }
                //so we needs to clean the username before storing it
                ws.username = sanitize(messageObject.username);

                // create and boardcast an announcement message
                const announcement = {
                    type: 'announcement',
                    text: `${ws.username || "Someone"} has joined the chat`,
                };

                wss.clients.forEach((client) => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify(announcement));
                    }
                });

                broadcastUserList();
            } else if (messageObject.type === "chat") {
                if (
                    !messageObject.message ||
                    messageObject.message.length > 250
                ) {
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