import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { resolveApiVersion } from './config/api-version.util';
import { setupOpenApiDocs } from './docs/openapi.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const apiVersion = resolveApiVersion();
  app.setGlobalPrefix(apiVersion);

  setupOpenApiDocs(app, { apiVersion });

  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();
