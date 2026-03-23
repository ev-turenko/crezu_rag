FROM node:22-alpine

ARG CACHEBUST=1

# Install Chromium and dependencies for Puppeteer on Alpine
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && \
    npm install --no-cache --prefer-online

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]