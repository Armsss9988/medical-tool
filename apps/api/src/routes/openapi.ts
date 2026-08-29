import { Hono } from 'hono';
import { apiDocument } from '../openapi/document';

export const openApiRoutes = new Hono();

openApiRoutes.get('/openapi.json', (c) => c.json(apiDocument));
