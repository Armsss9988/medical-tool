import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ROW_SCHEMAS, tableNameSchema, type TableName } from '@golab/shared/schemas/tables';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import * as repo from '@/lib/repo';

export const dynamic = 'force-dynamic';

const rowsBodySchema = z.object({ rows: z.array(z.unknown()) });

function parseName(raw: string): TableName | null {
  const parsed = tableNameSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name: rawName } = await params;
  const name = parseName(rawName);
  if (!name) {
    return NextResponse.json({ error: 'unknown table' }, { status: 404 });
  }

  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    if (process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL) {
      return NextResponse.json({ rows: [], count: 0, updatedAt: new Date().toISOString() });
    }
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const rows = await repo.getTableRows(db, name);
    return NextResponse.json({ rows, count: rows.length, updatedAt: new Date().toISOString() });
  } catch (err) {
    console.warn(`[API /api/tables/${name}] Warning: Không thể đọc bảng từ Postgres (${(err as Error).message}), fallback dữ liệu rỗng`);
    return NextResponse.json({ rows: [], count: 0, updatedAt: new Date().toISOString(), warning: (err as Error).message });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name: rawName } = await params;
  const name = parseName(rawName);
  if (!name) {
    return NextResponse.json({ error: 'unknown table' }, { status: 404 });
  }

  const authError = verifyAuth(req);
  if (authError) return authError;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json body' }, { status: 400 });
  }

  const wrap = rowsBodySchema.safeParse(raw);
  if (!wrap.success) {
    return NextResponse.json({ error: 'body must be { rows: [...] }' }, { status: 400 });
  }

  const rowSchema = ROW_SCHEMAS[name];
  const rowsParse = rowSchema.array().safeParse(wrap.data.rows);
  if (!rowsParse.success) {
    return NextResponse.json({ error: 'invalid rows', issues: rowsParse.error.issues }, { status: 400 });
  }

  const db = getDbSafe();
  if (!db) {
    if (process.env.NODE_ENV === 'development' || !process.env.DATABASE_URL) {
      return NextResponse.json({ replaced: wrap.data.rows.length });
    }
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const replaced = await repo.replaceTable(db, name, rowsParse.data);
    return NextResponse.json({ replaced });
  } catch (err) {
    return NextResponse.json({ error: 'failed to replace table', message: (err as Error).message }, { status: 500 });
  }
}
