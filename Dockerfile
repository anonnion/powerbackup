# Use official Node.js image as base
FROM node:20

# Install pg_dump (PostgreSQL client tools)
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

# Set workdir
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy source code
COPY . .

# Default command (can be overridden)
CMD ["node", "src/cli.js"]
