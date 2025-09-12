import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import rateLimit from "express-rate-limit";

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

const app = express();
const port = 8080;

const limiter = rateLimit({
    max: 200,
    windowMs: 60 * 60 * 1000,
    message: "Too many request from this IP address",
});

app.use(limiter);

const server = app.listen(port, () => {
    console.log(`Server is running on the localhost port: ${port} `);
});

const wss = new WebSocketServer({ server });

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
                    text: `${ws.username || "Someone"} has joined the chat`,
                };

                wss.clients.forEach((client) => {
                    if (client.readyState === ws.OPEN) {
                        client.send(JSON.stringify(announcement));
                    }
                });
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
    });
});
