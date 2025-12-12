# Stage 1: Build Frontend
FROM node:20-alpine as builder

WORKDIR /app

# Copy root package files and install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Production Run
FROM node:20-alpine

WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist

# Copy backend source
COPY --from=builder /app/backend ./backend

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE $PORT

# Start the backend server (which also serves frontend)
CMD ["node", "backend/server.js"]
