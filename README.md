# WebSocket Chat Application

Real-time multi-client chat application built with Express HTTP server and the `ws` WebSocket library. Features user authentication, message sanitization, rate limiting, and origin validation for secure communication.

## Project Structure
```
websocket/
  server/
    src/
      index.ts          # WebSocket + Express server with authentication & security
    package.json        # Dependencies and scripts
    tsconfig.json       # TypeScript configuration
    dist/               # Compiled JavaScript output
  client/
    index.html          # Feature-rich browser chat UI with dark/light theme
  .gitignore           # Git ignore rules
  README.md           # This file
```

## Features

### Server Features
- **Real-time messaging** with WebSocket broadcasting
- **User authentication** with username validation and sanitization
- **Rate limiting** (200 requests per hour per IP)
- **Origin validation** for security (configurable allowed origins)
- **Input sanitization** to prevent XSS attacks
- **Message length validation** (max 250 characters)
- **Join/leave announcements** when users connect/disconnect
- **Express.js integration** for potential REST API endpoints

### Client Features
- **Modern responsive UI** with CSS Grid layout
- **Dark/Light theme** support based on system preference
- **Real-time connection status** indicator
- **Username display** and management
- **Message metadata** showing sender and timestamp
- **Auto-scrolling** message history
- **Form validation** and user-friendly interactions
- **Accessible design** with ARIA labels and semantic HTML

## Key Files

- [`server/src/index.ts`](server/src/index.ts) - Main server implementation
- [`server/package.json`](server/package.json) - Dependencies and scripts
- [`server/tsconfig.json`](server/tsconfig.json) - TypeScript configuration
- [`client/index.html`](client/index.html) - Complete chat client UI

## How It Works

### Server Architecture
1. **Express HTTP Server** starts on port 8080
2. **WebSocketServer** wraps the HTTP server with origin validation
3. **Message Processing**: JSON-based protocol with type checking
4. **Broadcasting**: Messages sent to all connected clients
5. **Security**: Input sanitization, rate limiting, and origin checks

### Message Protocol
The application uses a JSON-based message protocol:

**Login Message:**
```json
{
  "type": "login",
  "username": "user123"
}
```

**Chat Message:**
```json
{
  "type": "chat",
  "message": "Hello everyone!"
}
```

**Server Response (Chat):**
```json
{
  "username": "user123",
  "message": "Hello everyone!",
  "timestamp": "3:45:12 PM"
}
```

**Server Response (Announcement):**
```json
{
  "text": "user123 has joined the chat"
}
```

### Security Implementation
- **Origin Validation**: Only allows connections from whitelisted origins
- **Input Sanitization**: HTML entities escaped to prevent XSS
- **Rate Limiting**: 200 requests per hour per IP address
- **Message Validation**: Username and message length limits
- **CORS Protection**: Configurable allowed origins list

## Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn package manager

### Server Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start the server
npm run dev
```

### Client Setup
```bash
# Option 1: Open file directly (may have CORS issues)
xdg-open client/index.html

# Option 2: Serve statically (recommended)
npx serve client
# or
python -m http.server 8000 -d client

# Option 3: Use Live Server (VS Code extension)
# Right-click on index.html and select "Open with Live Server"
```

### Configuration

#### Allowed Origins
Edit the `allowedOrigins` array in [`server/src/index.ts`](server/src/index.ts):
```typescript
const allowedOrigins = [
    'http://127.0.0.1:5500',    // Live Server default
    'http://localhost:8080',     // Local development
    'http://localhost:5500',     // Alternative local port
    'https://your-domain.com'    // Production domain
]
```

#### Environment Variables
Create a `.env` file (optional):
```env
PORT=8080
NODE_ENV=development
```

## Development

### Available Scripts
```bash
# Build TypeScript
npm run build

# Run compiled server
npm run dev

# Watch mode (suggested addition)
npm run dev:watch   # tsc -w
npm run start:watch # nodemon dist/index.js
```

### Development Workflow
1. Make changes to [`server/src/index.ts`](server/src/index.ts)
2. Run `npm run build` to compile TypeScript
3. Run `npm run dev` to start the server
4. Open [`client/index.html`](client/index.html) in browser
5. Test real-time messaging with multiple browser tabs

### Adding Watch Mode
Add these scripts to [`server/package.json`](server/package.json):
```json
{
  "scripts": {
    "dev:watch": "tsc -w",
    "start:watch": "nodemon dist/index.js",
    "dev:hot": "concurrently \"npm run dev:watch\" \"npm run start:watch\""
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "concurrently": "^8.0.0"
  }
}
```

## Testing

### Manual Testing
1. Open multiple browser tabs/windows
2. Set different usernames
3. Send messages and verify broadcasting
4. Test connection status indicators
5. Verify rate limiting and validation

### Automated Testing (Suggested)
```bash
# Install testing dependencies
npm install -D vitest @types/ws

# Create test files
mkdir server/tests
touch server/tests/websocket.test.ts
```

Example test structure:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import WebSocket from 'ws'

describe('WebSocket Chat Server', () => {
  // Test connection, message broadcasting, validation, etc.
})
```

## Deployment

### Production Considerations
- **Environment Variables**: Use `PORT` from environment
- **Process Management**: Use PM2 or systemd for process management
- **Reverse Proxy**: Deploy behind NGINX with SSL/TLS termination
- **Logging**: Add structured logging (winston/pino)
- **Monitoring**: Add health checks and metrics
- **Database**: Add message persistence with Redis/PostgreSQL

### Docker Deployment
Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY server/package*.json ./
RUN npm ci --only=production
COPY server/dist ./dist
EXPOSE 8080
CMD ["node", "dist/index.js"]
```

### NGINX Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

### Common Issues

**Client can't connect:**
- Verify server is running on port 8080
- Check browser console for WebSocket errors
- Ensure origin is in `allowedOrigins` list

**Messages not appearing:**
- Check server logs for "New client has been connected!!"
- Verify JSON message format
- Check for rate limiting (too many requests)

**TypeScript compilation errors:**
- Run `npm run build` after code changes
- Check [`tsconfig.json`](server/tsconfig.json) configuration
- Verify all dependencies are installed

**CORS/Origin issues:**
- Add your client's origin to `allowedOrigins`
- Use `npx serve` instead of opening file directly
- Check browser developer tools for blocked requests

### Debug Mode
Add environment variable for verbose logging:
```typescript
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
    console.log('Debug: Message received:', messageObject)
}
```

## Security Best Practices

### Current Implementation
- ✅ Input sanitization (XSS prevention)
- ✅ Rate limiting (DoS prevention)
- ✅ Origin validation (CSRF prevention)
- ✅ Message length limits
- ✅ Username validation

### Additional Recommendations
- Add authentication/authorization system
- Implement message encryption
- Add IP-based connection limits
- Use secure WebSocket (WSS) in production
- Implement user session management
- Add content moderation/filtering

## API Reference

### WebSocket Events

**Client → Server:**
```javascript
// Login
socket.send(JSON.stringify({
  type: "login",
  username: "string" // required, will be sanitized
}))

// Send message
socket.send(JSON.stringify({
  type: "chat",
  message: "string" // required, max 250 chars, will be sanitized
}))
```

**Server → Client:**
```javascript
// Chat message
{
  username: "string",
  message: "string",
  timestamp: "string" // localized time
}

// Announcement
{
  text: "string" // join/leave notifications
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Update documentation
6. Submit a pull request

## License

ISC License - see [`package.json`](server/package.json) for details.

## Roadmap

### Short Term
- [ ] Add hot reload for development
- [ ] Implement automated testing
- [ ] Add Docker support
- [ ] Create health check endpoint

### Medium Term
- [ ] Add user authentication system
- [ ] Implement message persistence
- [ ] Add private messaging
- [ ] Create admin panel

### Long Term
- [ ] Add file sharing capabilities
- [ ] Implement end-to-end encryption
- [ ] Create mobile app
- [ ] Add video/voice chat

---

**Live Demo**: Open [`client/index.html`](client/index.html) after starting the server

**Quick Start**: `cd server && npm install && npm run build && npm run dev`