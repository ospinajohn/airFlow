import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: process.env.FRONTEND_URL || '*' }); // 🌐 Permitir comunicación con el frontend
  app.setGlobalPrefix('api'); // 🛣️ Rutas como /api/tasks

  // 🛡️ Validación Global: Rechaza datos no válidos automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 🧹 Elimina campos no definidos en el DTO
      forbidNonWhitelisted: true, // 🚫 Error si se envían campos extra
      transform: true, // 🔄 Transforma los tipos automáticamente
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api`);
}
bootstrap();
