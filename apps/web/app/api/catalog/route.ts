import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { saveCatalogItem } from '@/lib/repo';
import type { CatalogItem } from '@domain';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const item = (await req.json()) as CatalogItem;
    if (!item || !item.code || !item.name) {
      return NextResponse.json({ error: 'Missing required fields: code and name' }, { status: 400 });
    }
    await saveCatalogItem(db, item);
    return NextResponse.json({ success: true, code: item.code });
  } catch (err) {
    console.error('[API POST /api/catalog] Error:', err);
    return NextResponse.json({ error: 'Failed to save catalog item', message: (err as Error).message }, { status: 500 });
  }
}
