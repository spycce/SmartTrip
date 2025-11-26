FROM node:20-alpine

WORKDIR /app

# Copy root package files and install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy backend package files and install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Copy all source code
COPY . .

# Build the frontend
RUN npm run build

# Expose the port (Heroku sets this env var)
ENV PORT=5000
EXPOSE $PORT

# Start the backend server
CMD ["node", "backend/server.js"]
