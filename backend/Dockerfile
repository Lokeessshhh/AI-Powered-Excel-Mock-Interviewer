FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY ../shared/package.json ../shared/

# Install dependencies
RUN npm ci --only=production

# Copy shared types
COPY ../shared ../shared

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build the application
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]