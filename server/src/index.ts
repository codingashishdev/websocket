import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import crypto from "crypto";
import { URL, type Url } from "url";
import bcrypt from "bcrypt";
import pool from "./db.js";

dotenv.config();

const app = express();
app.use(express.json());
const port = process.env.PORT || 3000;

const activeToken = new Map<String, String>();

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
  "https://our-domain-app.com",
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

    if (!token || !activeToken.has(token)) {
      console.log("Connection request error: invalid token");
      return done(false);
    } else {
      // find the username based on the entry from our map (activeToken)
      const username = activeToken.get(token);
      //attaching the username to the request object
      (info.req as any).username = username;
      return done(true);
    }
  },
  //because the typical size of the chat message is less than 1024 kilobytes(1 kb)
  maxPayload: 1024,
});

// dummy users
const users: Record<string, { password: string }> = {
  alice: { password: "123456" },
  bob: { password: "123456" },
};

app.post("register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password || password.length < 6) {
      return res.status(409).json({
        message:
          "Username and a password of at least 6 characters are required.",
      });
    }

    const saltRounds = 10;
    const password_hashed = await bcrypt.hash(password, saltRounds);

    const newUser = await (pool.query(
      "INSERT INTO users (username, password_hashed) VALUES ($1, $2) RETURNING username",
    ),
    [username, password_hashed]);

    return res.status(201).json({
      message: "User created successfully",
      user: newUser.rows[0],
    });
  } catch (error) {
    // checking for a duplicate username
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    console.log("Registration error: ", error);
    res.status(409).json({ message: "Internal server error" });
  }
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "username and password are required" });
  }

  const user = users[username];

  if (!user || user.password !== password) {
    return res.status(401).json({ message: "Invalid username or password!" });
  }

  //simpler way
  const token = crypto.randomBytes(32).toString("hex");

  //because currently we are not using any database, so to make sure the server remembers the valid token we are using Map DS
  // to store token and its username as a key value pair
  activeToken.set(token, username);
  res.json({ token: token, username: username });
});

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
