import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { OpenAPIObject } from '@nestjs/swagger';

export interface BuildOpenApiDocumentOptions {
  apiVersion: string;
}

const API_TITLE = 'Jacubs Integration API';
const API_DESCRIPTION =
  'Robust API reference for the Jacubs integration platform. Explore endpoints, payloads, and workflows with a concise, API Dog-inspired experience.';

export function buildOpenApiDocument(
  app: INestApplication,
  { apiVersion }: BuildOpenApiDocumentOptions,
): OpenAPIObject {
  const semanticVersion = apiVersion.replace(/^api\//iu, '').trim() || '1.0.0';

  const config = new DocumentBuilder()
    .setTitle(API_TITLE)
    .setDescription(API_DESCRIPTION)
    .setVersion(semanticVersion)
    .setContact('Jacubs Platform Support', 'https://jacubs.example', 'support@jacubs.example')
    .addServer('/', 'Primary API gateway')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Include the access token returned by the authentication workflow.',
      },
      'access-token',
    )
    .addCookieAuth('refresh_token', {
      type: 'apiKey',
      in: 'cookie',
      description: 'Secure HTTP-only cookie containing the refresh token.',
    })
    .build();

  return SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true,
  });
}
