FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm ci
RUN npm run build

EXPOSE 3000

CMD ["npx", "serve", "-s", "dist", "-p", "3000"]