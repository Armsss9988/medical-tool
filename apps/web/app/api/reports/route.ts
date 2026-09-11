import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { saveMedicalReport } from '@/lib/repo';
import type { MedicalReport } from '@domain';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const authError = verifyAuth(req);
  if (authError) return authError;

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const report = (await req.json()) as MedicalReport;
    if (!report || !report.id) {
      return NextResponse.json({ error: 'Missing report id' }, { status: 400 });
    }
    await saveMedicalReport(db, report);
    return NextResponse.json({ success: true, id: report.id });
  } catch (err) {
    console.error('[API POST /api/reports] Error:', err);
    return NextResponse.json({ error: 'Failed to save report', message: (err as Error).message }, { status: 500 });
  }
}
