FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build typescript
RUN npm run dev:watch

# Expose the port
EXPOSE 8080

# Start the server
CMD [ "node", "dist/index.js" ]