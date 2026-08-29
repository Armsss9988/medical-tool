import { Hono } from 'hono';
import { z } from 'zod';
import { ROW_SCHEMAS, tableNameSchema, type TableName } from '@golab/shared/schemas/tables';
import type { AppEnv } from '../env';
import * as repo from '../db/repo';

const rowsBodySchema = z.object({ rows: z.array(z.unknown()) });

export const tableRoutes = new Hono<AppEnv>();

function parseName(raw: string): TableName | null {
  const parsed = tableNameSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

tableRoutes.get('/tables/:name', async (c) => {
  const name = parseName(c.req.param('name'));
  if (!name) return c.json({ error: 'unknown table' }, 404);
  const rows = await repo.getTableRows(c.get('db'), name);
  return c.json({ rows, count: rows.length, updatedAt: new Date().toISOString() });
});

tableRoutes.put('/tables/:name', async (c) => {
  const name = parseName(c.req.param('name'));
  if (!name) return c.json({ error: 'unknown table' }, 404);

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return c.json({ error: 'invalid json body' }, 400);
  }

  const wrap = rowsBodySchema.safeParse(raw);
  if (!wrap.success) return c.json({ error: 'body must be { rows: [...] }' }, 400);

  const rowSchema = ROW_SCHEMAS[name];
  const rowsParse = rowSchema.array().safeParse(wrap.data.rows);
  if (!rowsParse.success) {
    return c.json({ error: 'invalid rows', issues: rowsParse.error.issues }, 400);
  }

  const replaced = await repo.replaceTable(c.get('db'), name, rowsParse.data);
  return c.json({ replaced });
});
