import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { cancelInvoiceTransaction } from '@/lib/repo';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const body = await req.json().catch(() => ({}));
    const result = await cancelInvoiceTransaction(db, id, body);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error(`[API POST /api/invoices/${id}/cancel] Error:`, err);
    return NextResponse.json(
      { error: 'Failed to cancel invoice', message: (err as Error).message },
      { status: 500 }
    );
  }
}
