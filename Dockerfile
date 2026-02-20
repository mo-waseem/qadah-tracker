# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy built assets and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# The application runs on port 5000 by default
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
