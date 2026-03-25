FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY src ./src/
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY prisma.config.ts ./

RUN npm ci
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]