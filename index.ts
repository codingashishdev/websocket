import websocket, { websocketServer } from "ws";
import http from "http";

const server = http.createServer(function (request: any, response: any) {
  console.log(request.url);
  response.end("Hi theree");
});

const wss = new websocketServer({ server });

wss.on("message", function connection(ws) {
  ws.on("error", console.error);

  ws.on("message", function messsage(data, isBinary) {
    wss.client.forEach(function each(client) {
      if (client.readyState === websocket.OPEN) {
        client.send(data, { binary: isBinary });
      }
    });
  });

  ws.send("Hello from server");
});

const port = 8080;
server.listen(port, function () {
  console.log(`server listening on ${port}`);
});
