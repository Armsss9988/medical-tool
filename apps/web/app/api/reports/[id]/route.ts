import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { deleteMedicalReport } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
  }

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    await deleteMedicalReport(db, id);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error(`[API DELETE /api/reports/${id}] Error:`, err);
    return NextResponse.json({ error: 'Failed to delete report', message: (err as Error).message }, { status: 500 });
  }
}
