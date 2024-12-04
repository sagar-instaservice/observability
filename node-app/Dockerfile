FROM node:20.15.1

WORKDIR /app

COPY package*.json ./
RUN npm cache clean --force && npm install


RUN npm install prom-client

COPY . .

EXPOSE 3000
CMD ["node", "app.js"]
