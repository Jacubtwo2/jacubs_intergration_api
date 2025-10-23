export interface BuildOpenApiDocumentOptions {
  apiVersion: string;
}

export type OpenApiDocument = Record<string, unknown>;

const API_TITLE = 'Jacubs Integration API';
const API_DESCRIPTION =
  'Robust API reference for the Jacubs integration platform. Explore endpoints, payloads, and workflows with a concise, API Dog-inspired experience.';

export function buildOpenApiDocument({
  apiVersion,
}: BuildOpenApiDocumentOptions): OpenApiDocument {
  const document: OpenApiDocument = {
    openapi: '3.1.0',
    info: {
      title: API_TITLE,
      version: apiVersion,
      description: API_DESCRIPTION,
      contact: {
        name: 'Jacubs Platform Support',
        email: 'support@jacubs.example',
      },
    },
    servers: [
      {
        url: `/${apiVersion}`,
        description: 'Primary API gateway (versioned)',
      },
    ],
    tags: [
      {
        name: 'Status',
        description:
          'Endpoints that provide service readiness, health checks, and documentation entry points for the platform.',
      },
    ],
    paths: {
      '/': {
        get: {
          operationId: 'getServiceStatus',
          summary: 'Retrieve API status overview',
          description:
            'Returns a structured summary describing the Jacubs Integration API runtime, including uptime, documentation entry points, and helpful metadata for quick onboarding.',
          tags: ['Status'],
          responses: {
            '200': {
              description: 'Service status response',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/ApiStatusResponse',
                  },
                  examples: {
                    default: {
                      summary: 'Operational response example',
                      value: {
                        status: 'ok',
                        service: 'Jacubs Integration API',
                        message: 'Jacubs Integration API is online and accepting requests.',
                        version: apiVersion,
                        docs: {
                          url: `/${apiVersion}/docs`,
                          description:
                            'Interactive API reference powered by Swagger UI with curated guidance inspired by API Dog.',
                        },
                        uptime: {
                          seconds: 42,
                          humanReadable: '00h 00m 42s',
                        },
                        timestamp: new Date().toISOString(),
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        ApiStatusResponse: {
          type: 'object',
          description:
            'Details the operational readiness of the Jacubs Integration API alongside discoverability hints for the interactive documentation.',
          required: ['status', 'service', 'message', 'version', 'docs', 'uptime', 'timestamp'],
          properties: {
            status: {
              type: 'string',
              description: 'Indicates the operational state of the API gateway.',
              enum: ['ok'],
            },
            service: {
              type: 'string',
              description: 'Human-friendly display name for the platform.',
              example: 'Jacubs Integration API',
            },
            message: {
              type: 'string',
              description: 'Short narrative describing the current behaviour of the API.',
              example: 'Jacubs Integration API is online and accepting requests.',
            },
            version: {
              type: 'string',
              description: 'The active routing prefix used for this deployment.',
              example: apiVersion,
            },
            docs: {
              type: 'object',
              description: 'Documentation entry point metadata.',
              required: ['url', 'description'],
              properties: {
                url: {
                  type: 'string',
                  description: 'Location of the interactive API explorer.',
                  example: `/${apiVersion}/docs`,
                },
                description: {
                  type: 'string',
                  description: 'Guidance for how to use the documentation experience.',
                  example:
                    'Interactive API reference powered by Swagger UI with curated guidance inspired by API Dog.',
                },
              },
            },
            uptime: {
              type: 'object',
              description:
                'Duration metrics describing how long the service has been active since the last restart.',
              required: ['seconds', 'humanReadable'],
              properties: {
                seconds: {
                  type: 'integer',
                  format: 'int64',
                  description: 'Total uptime measured in seconds.',
                  example: 42,
                },
                humanReadable: {
                  type: 'string',
                  description: 'Friendly representation of the uptime duration.',
                  example: '00h 00m 42s',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'ISO-8601 timestamp representing when the payload was generated.',
              example: new Date().toISOString(),
            },
          },
        },
      },
    },
  };

  return document;
}
