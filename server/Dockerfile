# Use Node.js 20 as base image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Compile TypeScript
RUN npx tsc

# Expose default port (change if your server uses another port)
EXPOSE 4000

# Start the app
CMD ["node", "server.js"]