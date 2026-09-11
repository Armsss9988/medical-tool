import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { payInvoiceTransaction } from '@/lib/repo';

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
    const result = await payInvoiceTransaction(db, id, body, body?.invoice);
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    console.error(`[API POST /api/invoices/${id}/pay] Error:`, err);
    return NextResponse.json(
      { error: 'Failed to process invoice payment', message: (err as Error).message },
      { status: 500 }
    );
  }
}
