FROM node:20-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Use tsx to run TypeScript directly (no build step needed)
CMD ["node", "--import", "tsx", "src/index.ts"]
