import { zodToJsonSchema } from 'zod-to-json-schema';
import { ROW_SCHEMAS } from '@golab/shared/schemas/tables';

const rowSchemasJson = Object.fromEntries(
  Object.entries(ROW_SCHEMAS).map(([name, schema]) => [
    name,
    zodToJsonSchema(schema, { name })
  ])
);

export const apiDocument = {
  openapi: '3.0.3',
  info: { title: 'GoLab API', version: '1.0.0' },
  security: [{ AppPassword: [] }],
  paths: {
    '/api/health': {
      get: {
        summary: 'Health check',
        security: [],
        responses: {
          '200': {
            description: 'Service healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ok: { type: 'boolean' },
                    service: { type: 'string' },
                    time: { type: 'string' }
                  }
                }
              }
            }
          },
          '503': { description: 'Server not configured (APP_ACCESS_PASSWORD unset)' }
        }
      }
    },
    '/api/tables/{name}': {
      get: {
        summary: 'Get all rows of a table',
        parameters: [
          { name: 'name', in: 'path', required: true, schema: { type: 'string' } }
        ],
        responses: {
          '200': {
            description: 'Rows',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    rows: { type: 'array', items: { type: 'object' } },
                    count: { type: 'number' },
                    updatedAt: { type: 'string' }
                  }
                }
              }
            }
          },
          '401': { description: 'Unauthorized (missing/wrong x-app-password)' },
          '404': { description: 'Unknown table' }
        }
      },
      put: {
        summary: 'Replace all rows of a table (full-table replace)',
        parameters: [
          { name: 'name', in: 'path', required: true, schema: { type: 'string' } }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: { rows: { type: 'array', items: { type: 'object' } } },
                required: ['rows']
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Replaced',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { replaced: { type: 'number' } }
                }
              }
            }
          },
          '400': { description: 'Invalid body or invalid rows' },
          '401': { description: 'Unauthorized (missing/wrong x-app-password)' },
          '404': { description: 'Unknown table' }
        }
      }
    }
  },
  components: {
    securitySchemes: {
      AppPassword: { type: 'apiKey', in: 'header', name: 'x-app-password' }
    },
    schemas: rowSchemasJson
  }
} as const;
