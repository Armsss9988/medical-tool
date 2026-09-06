import { NextRequest, NextResponse } from 'next/server';
import { eq, or } from 'drizzle-orm';
import { getDbSafe } from '@/lib/db';
import * as schema from '@/lib/schema';
import { evaluateResult } from '@domain/testResult';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = (searchParams.get('code') || '').trim();
  const sample = (searchParams.get('sample') || '').trim();

  if (!code && !sample) {
    return NextResponse.json(
      { found: false, message: 'Vui lòng cung cấp mã bệnh nhân hoặc mã mẫu để tra cứu.' },
      { status: 400 }
    );
  }

  const db = getDbSafe();
  if (!db) {
    return NextResponse.json(
      { found: false, message: 'Hệ thống cơ sở dữ liệu tạm thời gián đoạn. Vui lòng thử lại sau.' },
      { status: 503 }
    );
  }

  try {
    const conditions = [];
    if (code) conditions.push(eq(schema.medicalReports.code, code));
    if (sample) conditions.push(eq(schema.medicalReports.sampleCode, sample));

    const query = conditions.length === 1 ? conditions[0] : or(...conditions);
    const reports = await db
      .select()
      .from(schema.medicalReports)
      .where(query)
      .limit(1);

    if (reports.length === 0) {
      return NextResponse.json({
        found: false,
        message: `Không tìm thấy phiếu xét nghiệm cho mã: ${code || sample}`
      });
    }

    const report = reports[0];
    const tests = await db
      .select()
      .from(schema.medicalReportTests)
      .where(eq(schema.medicalReportTests.reportId, report.id))
      .orderBy(schema.medicalReportTests.testOrder);

    // Lấy thông tin phòng khám để hiển thị logo / hotline nếu có
    const clinicRows = await db.select().from(schema.clinicInfo).limit(1);
    const clinic = clinicRows[0] || null;

    return NextResponse.json({
      found: true,
      report: {
        id: report.id,
        code: report.code,
        sampleCode: report.sampleCode || report.code,
        status: report.status,
        patientName: report.patientName,
        patientDob: report.patientDob,
        patientGender: report.patientGender,
        patientAddress: report.patientAddress,
        patientDiagnosis: report.patientDiagnosis,
        doctorName: report.doctorName,
        conclusion: report.conclusion,
        isAllergen: report.isAllergen,
        cloudPdfUrl: report.cloudPdfUrl,
        pdfGeneratedAt: report.pdfGeneratedAt,
        createdAt: report.createdAt,
        tests: tests.map((t) => {
          const evalRes = evaluateResult(t.result, t.refMin, t.refMax);
          const displayNote = t.note ? t.note.trim() : evalRes.label;
          const isAbnormalByNote = displayNote
            ? displayNote.includes('CAO') ||
              displayNote.includes('THẤP') ||
              displayNote.includes('Dương') ||
              displayNote.includes('H ') ||
              displayNote.includes('L ') ||
              /Độ\s*[1-6]/i.test(displayNote)
            : false;
          const isAbnormal = isAbnormalByNote || evalRes.status !== 'normal';

          return {
            testCode: t.testCode,
            testName: t.testName,
            category: t.category,
            result: t.result,
            unit: t.unit,
            refText: t.refText,
            evaluation: isAbnormal ? 'ABNORMAL' : 'NORMAL'
          };
        })
      },
      clinic: clinic
        ? {
            name: clinic.name,
            address: clinic.address,
            phone: clinic.phone,
            website: clinic.website,
            logoUrl: clinic.logoUrl
          }
        : null
    });
  } catch (err) {
    console.error('[API /api/tra-cuu] Error querying report:', err);
    return NextResponse.json(
      { found: false, message: 'Lỗi truy vấn cơ sở dữ liệu.' },
      { status: 500 }
    );
  }
}
