FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy TypeScript config
COPY tsconfig.json ./

# Copy source code
COPY src ./src

# Build TypeScript
RUN npx tsc

# Expose the port
EXPOSE 8080

# Start the server
CMD [ "node", "dist/index.js" ]