import type { INestApplication } from '@nestjs/common';
import type { Request, Response } from 'express';
import { buildOpenApiDocument } from './openapi.document';

interface SetupOpenApiDocsOptions {
  apiVersion: string;
}

function buildSwaggerUiHtml(title: string, specUrl: string, description: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css" />
    <style>
      body {
        margin: 0;
        background: #0f172a;
        color: #e2e8f0;
        font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      header {
        padding: 2rem 3rem 1rem;
        border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        background: linear-gradient(120deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.15));
      }
      header h1 {
        margin: 0;
        font-size: 2.5rem;
        font-weight: 700;
        color: #f8fafc;
      }
      header p {
        max-width: 720px;
        font-size: 1.1rem;
        line-height: 1.6;
      }
      .swagger-ui {
        background: #0f172a;
      }
      .swagger-ui .topbar {
        display: none;
      }
      .swagger-ui .scheme-container,
      .swagger-ui .information-container {
        background: rgba(15, 23, 42, 0.8);
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
    </style>
  </head>
  <body>
    <header>
      <h1>${title}</h1>
      <p>${description}</p>
      <p style="margin-top: 1.25rem; color: #94a3b8;">
        Empower your team with interactive documentation tailored for fast discovery and onboarding. Generated automatically
        using OpenAPI and presented with a premium experience inspired by API Dog.
      </p>
    </header>
    <div id="swagger-ui" />
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '${specUrl}',
          dom_id: '#swagger-ui',
          deepLinking: true,
          displayRequestDuration: true,
          filter: true,
          tryItOutEnabled: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'BaseLayout',
        });
      };
    </script>
  </body>
</html>`;
}

export function setupOpenApiDocs(app: INestApplication, { apiVersion }: SetupOpenApiDocsOptions): void {
  const document = buildOpenApiDocument({ apiVersion });
  const jsonRoute = `/${apiVersion}/docs/openapi.json`;
  const docsRoute = `/${apiVersion}/docs`;
  const httpAdapter = app.getHttpAdapter();
  const instance = httpAdapter.getInstance();

  instance.get(jsonRoute, (_req: Request, res: Response) => {
    res.type('application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.send(document);
  });

  instance.get(docsRoute, (_req: Request, res: Response) => {
    res.type('text/html');
    res.setHeader('Cache-Control', 'no-store');
    res.send(
      buildSwaggerUiHtml(
        document.info?.title as string,
        jsonRoute,
        (document.info?.description as string) ?? 'Interactive API documentation.',
      ),
    );
  });
}
