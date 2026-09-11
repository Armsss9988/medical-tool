import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { getDbSafe } from '@/lib/db';
import { getMedicalReportById, saveMedicalReport } from '@/lib/repo';
import { LabReportAggregate } from '@domain/index';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const body = await req.json().catch(() => ({}));
    const { cloudPdfUrl, qrCodeDataUrl, version, report: clientReport } = body;

    let baseReport = clientReport;
    if (!baseReport) {
      baseReport = await getMedicalReportById(db, id);
    }
    if (!baseReport) {
      return NextResponse.json({ error: `Report not found: ${id}` }, { status: 404 });
    }

    const repAgg = LabReportAggregate.fromSnapshot(baseReport);
    repAgg.recordCloudExport(cloudPdfUrl, qrCodeDataUrl, version);
    const updatedReport = repAgg.toSnapshot();

    await saveMedicalReport(db, updatedReport);

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (err) {
    console.error(`[API POST /api/reports/${id}/export-pdf] Error:`, err);
    return NextResponse.json(
      { error: 'Failed to record pdf export', message: (err as Error).message },
      { status: 500 }
    );
  }
}
