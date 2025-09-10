import express from "express";
import { WebSocketServer } from "ws";

// step 1: setup express server
const app = express();
const port = 8080;

const server = app.listen(port, () => {
    console.log(`Server is running on the localhost port: ${port} `);
});

// step 2: setup a websocket server
const wss = new WebSocketServer({ server });

// step 3: listen for any incoming client requests
// wss.on(connection, ()=>{}) -> so it is an entry point for any user in order to establish connection
// here ws an object that represents individual, unique connection for a single client that has been connected to your server
wss.on("connection", (ws) => {
    console.log("New client has been connected!!");

    //listening for messages from specific client
    ws.on("message", (message) => {
        console.log(`Received message: ${message}`);

        //sending Broadcast message to all the connected clients
        wss.clients.forEach((client) => {
            //we check if the client connection is still open before sending message
            if (client.readyState === ws.OPEN) {
                //converting from raw data(buffer) to string type
                client.send(message.toString());
            }
        });
    });

    // handling client disconnecting
    ws.on("close", () => {
        console.log("Client has disconneted");
    });
});