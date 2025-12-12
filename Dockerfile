FROM node:20-alpine as builder

WORKDIR /app

# Copy root package files and install frontend dependencies
COPY package*.json ./
RUN npm install

# Copy all source code
COPY . .

# Build the frontend
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
