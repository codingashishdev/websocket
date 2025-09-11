# WebSocket Chat Application

Real‑time multi-client chat using Express HTTP server and the `ws` WebSocket library.  
Server broadcasts any received message to all connected clients.

## Project Structure
```
websocket/
  server/
    src/
      index.ts          # WebSocket + Express server
    package.json
    tsconfig.json
  client/
    index.html          # Simple browser chat UI
```

Key files:
- [server/src/index.ts](server/src/index.ts)
- [server/package.json](server/package.json)
- [server/tsconfig.json](server/tsconfig.json)
- [client/index.html](client/index.html)

## How It Works

1. Express starts an HTTP server on port 8080.
2. A `WebSocketServer` wraps the HTTP server:  
   See [`index.ts`](server/src/index.ts):
   ```ts
   // Broadcast logic
   wss.on("connection", (ws) => {
     ws.on("message", (message) => {
       wss.clients.forEach(client => {
         if (client.readyState === ws.OPEN) client.send(message.toString());
       });
     });
   });
   ```
3. Client connects: `new WebSocket("ws://localhost:8080")`
4. Messages are sent as plain text; no JSON schema yet.
5. All connected clients receive each message (no sender filtering).

## Installation

From repository root:
```bash
cd server
npm install
npm run build
npm run dev   # runs: node dist/index.js
```

Open the client:
```bash
# Option 1: Open file directly
xdg-open ../client/index.html

# Option 2 (recommended): Serve statically (example using npx serve)
npx serve ../client
```

Ensure browser connects to: `ws://localhost:8080`

## Development Notes

Current limitations:
- No hot reload (TypeScript not watched).
- No message metadata (sender id, timestamp).
- No persistence / history.
- No authentication / authorization.
- No heartbeat / ping for stale connection cleanup.

Suggested scripts (not yet added):
```jsonc
// In server/package.json
"scripts": {
  "dev:watch": "tsc -w",
  "start:watch": "nodemon dist/index.js"
}
```

## Message Flow Example

Client A -> Server:
```
"hello"
```
Server -> All clients (A, B, C):
```
"hello"
```

## Extending

Possible enhancements:
- JSON message envelope: `{ type, userId, text, timestamp }`
- Assign client IDs on connection.
- Add `/health` HTTP endpoint.
- Add ping/pong: `ws.ping()` to detect dead connections.
- Rate limiting / basic moderation.
- Deploy behind reverse proxy (NGINX) with TLS termination (wss://).

## Production Tips

- Use environment variable for PORT.
- Add logging library (pino / winston).
- Use a process manager (pm2 / systemd).
- Configure CORS / origin checks if exposed publicly.

## Minimal Env Support

Add (optional) `.env` (currently ignored in .gitignore):
```
PORT=8080
```
Adjust code:
```ts
const port = Number(process.env.PORT) || 8080;
```

## TypeScript Configuration

[`tsconfig.json`](server/tsconfig.json):
- `module: "nodenext"` enables native ESM resolution.
- `strict: true` + `noUncheckedIndexedAccess` for safer types.
- Outputs declarations + source maps to `dist/`.

## Testing (Not Implemented)

Suggested approach:
- Use `vitest` or `jest`.
- Spin up server in test lifecycle.
- Use `ws` as a test client to assert broadcast behavior.

## Security Considerations

Add later if exposed:
- Origin validation.
- Message size limits.
- Input sanitation (if rendering HTML).
- Throttle connections per IP.

## License

ISC (see `package.json`).

## Quick Start Summary

```bash
cd server
npm install
npm run build
npm run dev
# Open client/index.html in browser
```

## Troubleshooting

- If client does not connect: confirm port 8080 free.
- If no messages: check server logs for "New client has been connected!!".
- If TypeScript changes not reflected: re-run `npm run build`.

## Future Work Roadmap

1. Introduce JSON protocol.
2. Add user nicknames.
3. Add persistence (Redis or in-memory ring buffer).
4. Add Dockerfile.
5. Add automated tests + CI.

---
Concise implementation; safe to extend