FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY . .

RUN npm ci
RUN npm run build

EXPOSE 3000

CMD ["npx", "serve", "-s", "dist", "-p", "3000"]