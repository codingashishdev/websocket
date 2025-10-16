# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install all dependencies (including dev)
COPY package*.json ./
RUN npm ci

# Copy TypeScript config and source code
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npx tsc

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Expose the port (matches env var in render.yaml)
EXPOSE 10000

# Start the server
CMD ["node", "dist/index.js"]