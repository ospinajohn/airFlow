import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 🌐 Permitir comunicación con el frontend
  app.setGlobalPrefix('api'); // 🛣️ Rutas como /api/tasks
  await app.listen(process.env.PORT ?? 3001); // 🚀 Puerto 3001 para no chocar con el frontend
  console.log(`Application is running on: localhost:${process.env.PORT ?? 3001}`);
}
bootstrap();
