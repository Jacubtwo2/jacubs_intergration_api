import type { INestApplication } from '@nestjs/common';
import type { Request, Response } from 'express';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApiDocument } from './openapi.document';

interface SetupOpenApiDocsOptions {
  apiVersion: string;
}

export function setupOpenApiDocs(
  app: INestApplication,
  { apiVersion }: SetupOpenApiDocsOptions,
): void {
  const document = buildOpenApiDocument(app, { apiVersion });
  const jsonRoute = `/${apiVersion}/docs/openapi.json`;
  const docsPath = `${apiVersion}/docs`;

  SwaggerModule.setup(docsPath, app, document, {
    customSiteTitle: 'Jacubs Integration API Docs',
    swaggerOptions: {
      url: jsonRoute,
      deepLinking: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      operationsSorter: 'alpha',
      persistAuthorization: true,
      tagsSorter: 'alpha',
      tryItOutEnabled: true,
    },
    customCss: `
      :root {
        color-scheme: dark;
      }
      body {
        margin: 0;
        background: #0f172a;
        color: #e2e8f0;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      .swagger-ui .topbar {
        display: none;
      }
      .swagger-ui .information-container,
      .swagger-ui .scheme-container {
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.15);
        border-radius: 1rem;
        box-shadow: 0 20px 45px rgba(15, 23, 42, 0.45);
      }
      .swagger-ui .opblock-tag {
        font-size: 1.4rem;
        font-weight: 600;
        color: #fbbf24;
      }
      .swagger-ui .opblock.opblock-get {
        border-color: rgba(56, 189, 248, 0.4);
        background: rgba(56, 189, 248, 0.08);
      }
      .swagger-ui .btn.authorize {
        background: #22d3ee;
        color: #0f172a;
        border-radius: 999px;
        box-shadow: 0 10px 30px rgba(34, 211, 238, 0.4);
      }
      .swagger-ui .wrapper {
        padding: 2rem 3rem 3rem;
      }
      .swagger-ui .information-container .title {
        font-weight: 700;
        color: #f8fafc;
      }
      .swagger-ui .info .description {
        color: #cbd5f5;
        max-width: 720px;
        font-size: 1.05rem;
        line-height: 1.6;
      }
    `,
  });

  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();

  instance.get(jsonRoute, (_req: Request, res: Response) => {
    res.type('application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.send(document);
  });
}
