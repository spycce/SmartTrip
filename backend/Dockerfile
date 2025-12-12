FROM node:18-alpine

# Standard Node Alpine image
# Removed Chromium/Puppeteer dependencies as we now use RapidAPI
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
