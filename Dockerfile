FROM node:22-alpine

ARG CACHEBUST=1

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && \
    npm install --no-cache --prefer-online

RUN npm install tsc -g
RUN tsc

# COPY . .

# RUN npm run build

EXPOSE 3000


CMD ["npx", "ts-node", "src/index.ts"]