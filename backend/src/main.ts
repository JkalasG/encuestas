import 'reflect-metadata';
import { existsSync } from 'fs';
import { join } from 'path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  // En produccion (Docker), sirve el frontend compilado si existe en ./public
  const publicDir = join(__dirname, '..', 'public');
  if (existsSync(publicDir)) {
    app.useStaticAssets(publicDir);
    const expressInstance = app.getHttpAdapter().getInstance();
    expressInstance.use((req: any, res: any, next: any) => {
      if (req.method === 'GET' && !req.path.startsWith('/api')) {
        return res.sendFile(join(publicDir, 'index.html'));
      }
      next();
    });
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Servidor CaliTori activo en http://localhost:${port}`);
}
bootstrap();
