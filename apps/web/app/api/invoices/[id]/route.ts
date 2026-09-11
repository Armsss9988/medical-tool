import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { deleteInvoice } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 });
  }

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    await deleteInvoice(db, id);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error(`[API DELETE /api/invoices/${id}] Error:`, err);
    return NextResponse.json({ error: 'Failed to delete invoice', message: (err as Error).message }, { status: 500 });
  }
}
