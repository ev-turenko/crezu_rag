FROM node:22-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN ls

RUN npm run build

RUN ls

EXPOSE 3000

ENV NODE_ENV=production

CMD [ "node", "./dist/index.js" ]