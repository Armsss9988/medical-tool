import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: 'GoLab Medical API',
      version: '1.0.0',
      description: 'Native Next.js API for GoLab medical test management'
    },
    paths: {
      '/api/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': { description: 'API is healthy' }
          }
        }
      },
      '/api/tables/{name}': {
        get: {
          summary: 'Get table rows',
          parameters: [
            { name: 'name', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Table rows list' },
            '401': { description: 'Unauthorized' },
            '404': { description: 'Table not found' }
          }
        },
        put: {
          summary: 'Replace table rows',
          parameters: [
            { name: 'name', in: 'path', required: true, schema: { type: 'string' } }
          ],
          responses: {
            '200': { description: 'Rows replaced count' },
            '400': { description: 'Invalid body' },
            '401': { description: 'Unauthorized' }
          }
        }
      }
    }
  };

  return NextResponse.json(spec);
}
