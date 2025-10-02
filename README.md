# WebSocket Chat Application

Real-time, multi-client chat built with an Express HTTP server and the `ws` WebSocket library. Includes username registration, message sanitization, rate limiting, and origin validation.

## Project Structure
```
websocket/
  server/
    src/
      index.ts          # WebSocket + Express server (security & broadcasting)
    package.json        # Dependencies and scripts
    tsconfig.json       # TypeScript configuration
    dist/               # Compiled JavaScript output (generated)
  client/
    index.html          # Browser chat UI with responsive theme
  .gitignore
  README.md
```

Key files:
- [server/src/index.ts](server/src/index.ts)
- [server/package.json](server/package.json)
- [server/tsconfig.json](server/tsconfig.json)
- [client/index.html](client/index.html)

## Features

Server
- Real-time broadcasting to all connected clients
- Username registration with sanitization (prevents XSS)
- Rate limiting (200 requests/hour per IP) via Express middleware
- Origin validation (whitelist) on WebSocket handshake
- Message validation (max 250 chars)
- Join/leave announcements
- Connected users list broadcast

Client
- Modern responsive UI with dark/light support
- Connection status indicator
- Username display and message metadata
- Auto-scrolling message history
- Form validation and accessible controls

## Getting Started

Prerequisites
- Node.js v18+ (recommended)
- npm

Install
```bash
# From repo root
cd server
npm ci
```

Run the server (choose one)
```bash
# Option A: Hot reload (compile + restart on changes)
npm run dev:hot

# Option B: One-time build + run
npx tsc
node dist/index.js

# Option C: Two terminals
# 1) Terminal A
npm run dev:watch
# 2) Terminal B
npm run start:watch
```

Serve the client (recommended)
```bash
# From repo root
npx serve client -l 5500
# or
python -m http.server 5500 -d client
```

Open http://localhost:5500 in your browser.
Note: Opening the file directly (file://…) will likely be rejected due to origin checks.

## Configuration

Allowed Origins
Edit the whitelist in [server/src/index.ts](server/src/index.ts):
```ts
const allowedOrigins = [
  'http://127.0.0.1:5500', // Live Server / static server
  'http://localhost:8080', // Server itself (if you serve client from here)
  'http://localhost:5500',
  'https://our-domain-app.com',
]
```

Port
- The server currently listens on a hard-coded port 8080 in [server/src/index.ts](server/src/index.ts).
- Update `port` there if needed and reconnect your client to `ws://localhost:<port>`.

## How It Works

Server flow
1. Express HTTP server starts on port 8080
2. WebSocketServer wraps the HTTP server and validates Origin during handshake
3. Messages are parsed as JSON and validated by type
4. Sanitized messages are broadcast to all connected clients
5. User list is updated and broadcast on login and disconnect

Client flow
- Connects to `ws://localhost:8080`
- Prompts for a username and sends a login event
- Sends chat messages via a form and renders broadcasts from the server
- Receives the connected users list and updates the sidebar

## Message Protocol

Client → Server
```json
// Login
{ "type": "login", "username": "string" }

// Chat
{ "type": "chat", "message": "string (<= 250 chars)" }
```

Server → Client
```json
// Chat message
{ "username": "string | undefined", "message": "string", "timestamp": "HH:MM:SS AM/PM" }

// Announcement (join)
{ "text": "user123 has joined the chat" }

// Connected users
{ "type": "userList", "users": ["alice", "bob"] }
```

Note: All user inputs are sanitized server-side before broadcasting.

## Scripts

Defined in [server/package.json](server/package.json):
```json
{
  "scripts": {
    "dev:watch": "tsc -w",
    "start:watch": "nodemon dist/index.js",
    "dev:hot": "concurrently \"npm run dev:watch\" \"npm run start:watch\""
  }
}
```

- dev:hot: Best for development; TypeScript rebuilds and Nodemon restarts on change.
- dev:watch: TypeScript watch-only.
- start:watch: Nodemon watches compiled JS.

## Security

Implemented
- Origin validation (handshake whitelist)
- Input sanitization (escape HTML entities)
- Rate limiting on HTTP server
- Message length limits
- Basic username validation

Recommendations
- Use WSS behind a reverse proxy in production
- Add authentication/authorization if needed
- Add IP/connection limits and structured logging
- Consider persistence (DB/Redis) if you need history

## Troubleshooting

Client cannot connect / 403 during handshake
- Serve the client over HTTP (do not open file://).
- Ensure your client origin is in `allowedOrigins` (see [server/src/index.ts](server/src/index.ts)).

No messages shown
- Check server logs for “New client has been connected!!”.
- Ensure messages follow the JSON protocol above.
- Check rate limiting (200/hr/IP).

Origin “null” rejected
- Happens when opening the HTML file directly. Serve via a local HTTP server.

Auto-reload not working
- Use `npm run dev:hot` and ensure both TypeScript and Nodemon are running.

## Deployment

Docker (simple example)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server ./server
WORKDIR /app/server
RUN npx tsc
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

NGINX (WebSocket reverse proxy)
```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## Development Notes

- TypeScript config: [server/tsconfig.json](server/tsconfig.json) uses ESM (module: nodenext, target: esnext).
- The server currently doesn’t read PORT from env; change `port` in code if needed.

## Roadmap

- [ ] Hot reload for client
- [ ] Automated testing suite
- [ ] Docker compose
- [ ] Health check endpoint
- [ ] Authentication system
- [ ] Message persistence
- [ ] Private messaging
- [ ] Admin/Moderation tools

---

Quick start:
```bash
cd server && npm ci && npm run dev:hot
# then open http://localhost:5500 after serving the client directory
```