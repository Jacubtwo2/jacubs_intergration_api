import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { AppModule } from './app.module';
import { resolveApiVersion } from './config/api-version.util';
import { setupOpenApiDocs } from './docs/openapi.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);

  const apiVersion = resolveApiVersion();
  app.setGlobalPrefix(apiVersion);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.use(helmet());
  app.use(cookieParser());

  const frontendOrigin = configService.get<string>('FRONTEND_ORIGIN');
  app.enableCors({
    origin: frontendOrigin ?? true,
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  setupOpenApiDocs(app, { apiVersion });

  const port = configService.get<number>('PORT') ?? 3001;
  await app.listen(port);
}

bootstrap();
