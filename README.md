# WebSocket Chat Application

Real-time chat with authentication, built using Express, PostgreSQL, WebSockets, and JWT tokens.

## Features

- **Authentication**: User registration/login with bcrypt password hashing and JWT tokens
- **Real-time Chat**: WebSocket-based messaging with automatic reconnection
- **Security**: Rate limiting, input sanitization, origin validation, token-based auth
- **Monitoring**: Winston logging and Sentry error tracking
- **Modern UI**: Responsive dark/light theme, connection status, user list
- **Graceful Shutdown**: Ensures all connections are closed properly before the server exits.

## Quick Start

```bash
# 1. Database setup
createdb websocket_chat
psql -U postgres -d websocket_chat << EOF
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE active_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);
EOF

# 2. Configure environment
cd server
cat > .env << EOF
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=websocket_chat
PORT=8080
JWT_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
EOF

# 3. Install & run server
npm ci
npm run dev:hot

# 4. Serve client (new terminal)
npx serve client -l 5500

# 5. Open http://localhost:5500
```

## Project Structure

```
websocket/
├── server/
│   ├── src/
│   │   ├── index.ts       # Main server (WebSocket + auth endpoints)
│   │   ├── db.ts          # PostgreSQL pool
│   │   ├── logger.ts      # Winston logger
│   │   └── instrument.ts  # Sentry setup
│   ├── package.json
│   └── tsconfig.json
└── client/
    └── index.html         # Chat UI with login/register
```

## API Endpoints

### POST /register
```json
// Request
{ "username": "alice", "password": "secret123" }

// Response (201)
{ "message": "User created successfully", "username": "alice" }
```

### POST /login
```json
// Request
{ "username": "alice", "password": "secret123" }

// Response (200)
{ "token": "jwt-token-string", "username": "alice" }
```

### POST /logout
```json
// Request
{ "token": "jwt-token-string" }

// Response (200)
{ "message": "User logout successfully" }
```

### GET /health
```json
// Response (200)
{ "status": "ok", "timeStamp": "2025-10-14T12:34:56.789Z" }
```

### GET /debug-sentry
Triggers a test error to verify Sentry integration.

## WebSocket Protocol

**Connect:** `ws://localhost:8080?token=<jwt-token>`

**Client → Server:**
```json
{ "type": "chat", "message": "Hello!" }
```

**Server → Client:**
```json
// Chat message
{ "username": "alice", "message": "Hello!", "timestamp": "12:34:56 PM" }

// System announcement
{ "type": "announcement", "message": "alice has joined the chat room" }

// User list update
{ "type": "userList", "users": ["alice", "bob"] }
```

## Configuration

### Allowed Origins
Edit `allowedOrigins` in `server/src/index.ts`:
```ts
const allowedOrigins = [
    "http://127.0.0.1:5500",
    "http://localhost:8080",
    "http://localhost:5500",
    "ws://localhost:8080",
    "https://websocket-chat-server-ptfw.onrender.com",
    "wss://websocket-chat-server-ptfw.onrender.com",
    "https://websocket-chat-client-ptfw.onrender.com",
    "wss://websocket-chat-client-ptfw.onrender.com"
];
```

### Environment Variables
```env
# Database
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=websocket_chat

# Server
PORT=8080
NODE_ENV=development

# Auth
JWT_SECRET=your-secret-key  # Generate with: openssl rand -hex 32

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

## Development Scripts

```bash
npm run dev:hot        # Hot reload (TypeScript + Nodemon)
npm run dev:watch      # Watch TypeScript compilation only
npm run start:watch    # Watch and restart server only
npm run build          # Compile TypeScript to JavaScript
npm run start          # Run the compiled JavaScript server
```

## Security Features

- ✅ JWT authentication with 1-hour expiration
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Input sanitization (XSS prevention)
- ✅ Rate limiting: 200 req/hour per IP, 20 msg/10sec per connection
- ✅ Origin validation whitelist
- ✅ Message length limits (250 chars, 1KB payload)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Token invalidation on logout
- ✅ Graceful shutdown

## Troubleshooting

**Can't connect to database?**
```bash
sudo systemctl status postgresql
psql -U postgres -d websocket_chat -c "SELECT 1;"
```

**WebSocket handshake fails (403)?**
- Use HTTP server, not `file://`
- Check token is valid
- Verify origin is in `allowedOrigins`

**JWT_SECRET error?**
- Add `JWT_SECRET` to `.env`
- Generate: `openssl rand -hex 32`

**Rate limit hit?**
- Wait 10 seconds (20 messages per 10 seconds limit)
- Client reconnects automatically

## Docker Deployment

The project includes a `Dockerfile` for building a production-ready Docker image and a `docker-compose.yml` for local development.

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: websocket_chat
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  app:
    build: .
    depends_on: [postgres]
    environment:
      DB_HOST: postgres
      JWT_SECRET: ${JWT_SECRET}
    ports:
      - "8080:8080"

volumes:
  postgres_data:
```

To run the application with Docker Compose:
```bash
docker-compose up -d
```

## License

MIT