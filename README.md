# WebSocket Chat Application

Real-time, multi-client chat built with an Express HTTP server, PostgreSQL database, and the `ws` WebSocket library. Includes user authentication, JWT-like token system, message sanitization, rate limiting, and origin validation.

## Project Structure
```
websocket/
  server/
    src/
      index.ts          # WebSocket + Express server (security & broadcasting)
      db.ts            # PostgreSQL connection pool configuration
    package.json        # Dependencies and scripts
    tsconfig.json       # TypeScript configuration
    dist/               # Compiled JavaScript output (generated)
  client/
    index.html          # Browser chat UI with login/register forms
  .gitignore
  README.md
```

Key files:
- [server/src/index.ts](server/src/index.ts) - Main server with WebSocket and auth endpoints
- [server/src/db.ts](server/src/db.ts) - Database configuration
- [server/package.json](server/package.json) - Dependencies
- [server/tsconfig.json](server/tsconfig.json) - TypeScript config
- [client/index.html](client/index.html) - Frontend with auth forms

## Features

### Server
- **Authentication System**
  - User registration with bcrypt password hashing
  - Login with JWT-like token generation
  - Token-based WebSocket authentication
  - Secure token storage in PostgreSQL
- Real-time broadcasting to all connected clients
- Username registration with sanitization (prevents XSS)
- Rate limiting (200 requests/hour per IP) via Express middleware
- Origin validation (whitelist) on WebSocket handshake
- Message validation (max 250 chars)
- Join/leave announcements
- Connected users list broadcast

### Client
- Modern responsive UI with dark/light theme support
- Login and registration forms
- Connection status indicator with visual feedback
- Username display and message metadata (timestamp)
- Auto-scrolling message history
- Form validation and accessible controls
- Distinguishes user's own messages from others

## Database Setup

### Prerequisites
- PostgreSQL 12+ installed and running
- Database access credentials

### Create Database Tables

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create active_tokens table
CREATE TABLE active_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(64) UNIQUE NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (username) REFERENCES users(username) ON DELETE CASCADE
);

-- Optional: Create index for faster token lookups
CREATE INDEX idx_active_tokens_token ON active_tokens(token);
CREATE INDEX idx_active_tokens_username ON active_tokens(username);
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=websocket_chat
PORT=8080
```

## Getting Started

### Prerequisites
- Node.js v18+ (recommended)
- npm
- PostgreSQL 12+

### Install Dependencies
```bash
# From repo root
cd server
npm ci
```

### Database Setup
```bash
# Create database
createdb websocket_chat

# Or using psql
psql -U postgres -c "CREATE DATABASE websocket_chat;"

# Run the SQL schema from above
psql -U postgres -d websocket_chat -f schema.sql
```

### Run the Server

Choose one of the following options:

```bash
# Option A: Hot reload (compile + restart on changes)
npm run dev:hot

# Option B: One-time build + run
npx tsc
node dist/index.js

# Option C: Two terminals
# Terminal 1 - Watch TypeScript compilation
npm run dev:watch

# Terminal 2 - Run with auto-restart
npm run start:watch
```

### Serve the Client

```bash
# From repo root
npx serve client -l 5500

# Or use Python
python -m http.server 5500 -d client

# Or use PHP
php -S localhost:5500 -t client
```

Open http://localhost:5500 in your browser.

**Note:** Opening the file directly (`file://…`) will be rejected due to origin checks.

## Configuration

### Allowed Origins

Edit the whitelist in [server/src/index.ts](server/src/index.ts):

```ts
const allowedOrigins = [
  'http://127.0.0.1:5500',
  'http://localhost:8080',
  'http://localhost:5500',
  'https://your-production-domain.com',
]
```

### Port Configuration

The server port can be configured via environment variable:

```env
PORT=8080
```

Or it defaults to `8080` if not specified.

## How It Works

### Server Flow

1. **Express HTTP server** starts on configured port (default: 8080)
2. **Registration endpoint** (`/register`) creates user with hashed password
3. **Login endpoint** (`/login`) validates credentials and generates token
4. **WebSocket handshake** validates token against database
5. Messages are parsed as JSON, validated, and sanitized
6. Sanitized messages are broadcast to all connected clients
7. User list is updated and broadcast on connect/disconnect

### Client Flow

1. User registers via registration form (if new user)
2. User logs in via login form
3. Server returns authentication token
4. Client connects to WebSocket with token: `ws://localhost:8080?token=<token>`
5. On successful connection, chat interface is shown
6. Messages are sent/received in real-time
7. Connected users list updates automatically

### Authentication Flow

```
1. User Registration
   Client → POST /register → Server
   Server → Hash password → Store in DB
   Server → Return success

2. User Login
   Client → POST /login → Server
   Server → Verify password → Generate token
   Server → Store token in DB → Return token

3. WebSocket Connection
   Client → WS handshake with token
   Server → Verify token in DB
   Server → Allow connection if valid
```

## Message Protocol

### Client → Server

```json
// Chat message
{ 
  "type": "chat", 
  "message": "string (<= 250 chars)" 
}
```

### Server → Client

```json
// Chat message
{ 
  "username": "string",
  "message": "string", 
  "timestamp": "HH:MM:SS AM/PM" 
}

// Join announcement
{ 
  "type": "announcement",
  "message": "username has joined the chat room"
}

// Connected users list
{ 
  "type": "userList", 
  "users": ["alice", "bob", "charlie"] 
}
```

**Note:** All user inputs are sanitized server-side before broadcasting.

## API Endpoints

### POST /register
Register a new user.

**Request:**
```json
{
  "username": "string",
  "password": "string (min 6 chars)"
}
```

**Response (201):**
```json
{
  "message": "User created successfully",
  "username": "string"
}
```

**Errors:**
- 400: Invalid request or password too short
- 409: Username already exists
- 500: Internal server error

### POST /login
Authenticate a user and receive token.

**Request:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "hex-string",
  "username": "string"
}
```

**Errors:**
- 400: Missing credentials
- 401: Invalid username or password
- 500: Internal server error

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

- **dev:hot**: Best for development; TypeScript rebuilds and Nodemon restarts on change
- **dev:watch**: TypeScript watch mode only
- **start:watch**: Nodemon watches compiled JS

## Security

### Implemented
- ✅ Token-based authentication
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Origin validation (handshake whitelist)
- ✅ Input sanitization (escape HTML entities)
- ✅ Rate limiting (200 req/hour per IP)
- ✅ Message length limits (250 chars)
- ✅ Username validation
- ✅ SQL injection prevention (parameterized queries)
- ✅ Token storage in database

### Recommendations for Production
- [ ] Use WSS (secure WebSocket) behind reverse proxy
- [ ] Implement token expiration and refresh mechanism
- [ ] Add CORS configuration
- [ ] Implement session management
- [ ] Add IP-based connection limits
- [ ] Use environment-based secrets management
- [ ] Add structured logging (Winston/Pino)
- [ ] Implement rate limiting per user (not just IP)
- [ ] Add message persistence and history
- [ ] Implement proper error handling and monitoring
- [ ] Use Redis for token storage (better performance)
- [ ] Add HTTPS for HTTP endpoints

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d websocket_chat -c "SELECT 1;"
```

**Solution:** Verify `.env` credentials and ensure database exists.

### Client Cannot Connect / 403 During Handshake
- Serve client over HTTP (not `file://`)
- Ensure origin is in `allowedOrigins` array
- Check token is valid and exists in database

### Registration/Login Fails
- Check database connection in server logs
- Verify password meets minimum length (6 chars)
- Check for username conflicts (409 error)

### No Messages Shown
- Check browser console for errors
- Verify WebSocket connection status
- Check server logs for token validation
- Ensure rate limit not exceeded

### "Origin null" Rejected
- Happens when opening HTML directly
- Use a local HTTP server instead

## Deployment

### Docker Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server code
COPY server ./server
WORKDIR /app/server

# Build TypeScript
RUN npx tsc

# Expose port
EXPOSE 8080

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: websocket_chat
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    ports:
      - "5432:5432"

  app:
    build: .
    depends_on:
      - postgres
    environment:
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: websocket_chat
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      PORT: 8080
    ports:
      - "8080:8080"

volumes:
  postgres_data:
```

### NGINX Reverse Proxy

```nginx
server {
  listen 80;
  server_name your-domain.com;

  # Redirect to HTTPS
  return 301 https://$server_name$request_uri;
}

server {
  listen 443 ssl http2;
  server_name your-domain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # WebSocket endpoint
  location / {
    proxy_pass http://localhost:8080;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## Development Notes

- TypeScript config uses ESM (`module: nodenext`, `target: esnext`)
- bcrypt saltRounds set to 10 for password hashing
- Tokens are 32-byte hex strings (64 characters)
- Database uses PostgreSQL with `pg` driver
- Username uniqueness enforced at database level
- Passwords never stored in plaintext

## Roadmap

- [x] User authentication system
- [x] Token-based WebSocket auth
- [x] Database integration
- [x] Password hashing
- [ ] Token expiration and refresh
- [ ] Message persistence and history
- [ ] Private/direct messaging
- [ ] User profiles and avatars
- [ ] Admin/moderation tools
- [ ] Typing indicators
- [ ] Read receipts
- [ ] File/image sharing
- [ ] Message reactions
- [ ] Automated testing suite
- [ ] Health check endpoint
- [ ] Logout endpoint (token invalidation)
- [ ] Redis integration for tokens

---

## Quick Start

```bash
# 1. Set up database
createdb websocket_chat
psql -U postgres -d websocket_chat -f schema.sql

# 2. Configure environment
cd server
cp .env.example .env
# Edit .env with your database credentials

# 3. Install and run
npm ci
npm run dev:hot

# 4. Serve client (in another terminal)
npx serve client -l 5500

# 5. Open http://localhost:5500
```

First time? Register a new account, then login to start chatting!