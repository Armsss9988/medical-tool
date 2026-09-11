import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { saveInvoice } from '@/lib/repo';
import type { Invoice } from '@domain';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const invoice = (await req.json()) as Invoice;
    if (!invoice || !invoice.id) {
      return NextResponse.json({ error: 'Missing invoice id' }, { status: 400 });
    }
    await saveInvoice(db, invoice);
    return NextResponse.json({ success: true, id: invoice.id });
  } catch (err) {
    console.error('[API POST /api/invoices] Error:', err);
    return NextResponse.json({ error: 'Failed to save invoice', message: (err as Error).message }, { status: 500 });
  }
}
