FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY . .

# Build typescript
RUN npx tsc

# Expose the port
EXPOSE 8080

# Start the server
CMD [ "node", "dist/index.js" ]