import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { deleteTestPackage } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing package id' }, { status: 400 });
  }

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const decodedId = decodeURIComponent(id);
    await deleteTestPackage(db, decodedId);
    return NextResponse.json({ success: true, id: decodedId });
  } catch (err) {
    console.error(`[API DELETE /api/packages/${id}] Error:`, err);
    return NextResponse.json({ error: 'Failed to delete test package', message: (err as Error).message }, { status: 500 });
  }
}
