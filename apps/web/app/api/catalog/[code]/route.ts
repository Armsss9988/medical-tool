import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { deleteCatalogItem } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const { code } = await params;
  if (!code) {
    return NextResponse.json({ error: 'Missing catalog item code' }, { status: 400 });
  }

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const decodedCode = decodeURIComponent(code);
    const result = await deleteCatalogItem(db, decodedCode);
    if (!result.success) {
      return NextResponse.json({ error: result.message || 'Cannot delete item' }, { status: 409 });
    }
    return NextResponse.json({ success: true, code: decodedCode });
  } catch (err) {
    console.error(`[API DELETE /api/catalog/${code}] Error:`, err);
    return NextResponse.json({ error: 'Failed to delete catalog item', message: (err as Error).message }, { status: 500 });
  }
}
