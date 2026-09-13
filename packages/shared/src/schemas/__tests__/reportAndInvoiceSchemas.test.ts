import { describe, expect, it } from 'vitest';
import {
  medicalReportSchema,
  safeParseMedicalReports,
  patientSchema,
  selectedTestSchema
} from '../reportSchemas';
import {
  invoiceSchema,
  safeParseInvoices
} from '../invoiceSchemas';

describe('patientSchema', () => {
  it('parses valid patient correctly', () => {
    const raw = {
      name: 'Nguyễn Văn A',
      code: 'BN-001',
      gender: 'Nam',
      dob: '1990',
      phone: '0987654321'
    };
    const parsed = patientSchema.parse(raw);
    expect(parsed.name).toBe('NGUYỄN VĂN A');
    expect(parsed.code).toBe('BN-001');
    expect(parsed.gender).toBe('Nam');
  });

  it('resilient: supplies fallback values for missing optional fields', () => {
    const raw = {
      name: 'Trần Thị B'
    };
    const parsed = patientSchema.parse(raw);
    expect(parsed.name).toBe('TRẦN THỊ B');
    expect(parsed.code).toBeDefined();
    expect(parsed.gender).toBe('Nam');
    expect(parsed.dob).toBe('');
    expect(parsed.phone).toBe('');
  });
});

describe('selectedTestSchema', () => {
  it('parses valid test item', () => {
    const raw = {
      testCode: 'GLU',
      testName: 'Glucose máu',
      category: 'Sinh hóa',
      result: '5.4',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4
    };
    const parsed = selectedTestSchema.parse(raw);
    expect(parsed.testCode).toBe('GLU');
    expect(parsed.result).toBe('5.4');
    expect(parsed.refMin).toBe(3.9);
  });

  it('parses valid test item with standard domain properties code and name', () => {
    const raw = {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh hóa',
      result: '5.4',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      note: 'Bình thường'
    };
    const parsed = selectedTestSchema.parse(raw);
    expect(parsed.code).toBe('GLU');
    expect(parsed.name).toBe('Glucose máu');
    expect(parsed.testCode).toBe('GLU');
    expect(parsed.testName).toBe('Glucose máu');
    expect(parsed.result).toBe('5.4');
    expect(parsed.note).toBe('Bình thường');
  });

  it('resilient: converts null or missing numerical ranges safely', () => {
    const raw = {
      testCode: 'WBC',
      testName: 'Bạch cầu',
      result: 7.2,
      refMin: '',
      refMax: null
    };
    const parsed = selectedTestSchema.parse(raw);
    expect(parsed.testCode).toBe('WBC');
    expect(parsed.code).toBe('WBC');
    expect(parsed.result).toBe('7.2');
    expect(parsed.refMin).toBeNull();
    expect(parsed.refMax).toBeNull();
  });
});

describe('medicalReportSchema & safeParseMedicalReports', () => {
  it('parses complete medical report', () => {
    const raw = {
      id: 'rep-001',
      code: 'BN-001',
      createdAt: new Date().toISOString(),
      patient: {
        name: 'Hoàng Bảo Ngọc',
        code: 'BN-001',
        gender: 'Nữ'
      },
      selectedTests: [
        { testCode: 'GLU', testName: 'Glucose', result: '5.2' }
      ],
      conclusion: 'Bình thường',
      doctorName: 'BS. Long',
      status: 'Đã có kết quả'
    };
    const parsed = medicalReportSchema.parse(raw);
    expect(parsed.id).toBe('rep-001');
    expect(parsed.patient.name).toBe('HOÀNG BẢO NGỌC');
    expect(parsed.selectedTests.length).toBe(1);
    expect(parsed.isPdfOutdated).toBe(false);
    expect(parsed.pdfVersion).toBe(1);
  });

  it('safeParseMedicalReports parses reports with standard domain items having code and name', () => {
    const rawReports = [
      {
        id: 'rep-real-001',
        code: 'BN-20260908-005',
        sampleCode: 'BN-20260908-005',
        status: 'Đã xuất Cloud',
        doctorName: 'BS. Trần Hoài Long',
        conclusion: 'Bình thường',
        patient: {
          code: 'BN-20260908-005',
          name: 'PHẠM NHẬT MINH HOÀNG',
          dob: '18/11/2023',
          gender: 'Nam',
          phone: '0968706507',
          address: 'tỉnh Quảng Trị'
        },
        selectedTests: [
          {
            code: 'ASCARIS',
            name: 'A. lumbricoides IgM/IgG Giun đũa',
            category: 'Ký Sinh Trùng',
            result: '0,28',
            note: 'Bình thường',
            unit: 'OD',
            refMin: 0,
            refMax: 0.89,
            refText: '0 - 0.89',
            price: 250000
          }
        ]
      }
    ];
    const parsed = safeParseMedicalReports(rawReports);
    expect(parsed.length).toBe(1);
    expect(parsed[0].patient.name).toBe('PHẠM NHẬT MINH HOÀNG');
    expect(parsed[0].selectedTests[0].code).toBe('ASCARIS');
    expect(parsed[0].selectedTests[0].name).toBe('A. lumbricoides IgM/IgG Giun đũa');
  });

  it('safeParseMedicalReports filters out corrupted entries and sanitizes legacy entries', () => {
    const rawList = [
      null,
      'string-invalid',
      { id: 'valid-1', patient: { name: 'Lê Văn C' } },
      { id: 'valid-2', code: 'BN-002', patient: { name: 'Phạm Thị D', gender: 'Nữ' } },
      { someWeirdObj: true } // missing id and patient -> should be discarded
    ];

    const result = safeParseMedicalReports(rawList);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('valid-1');
    expect(result[0].patient.name).toBe('LÊ VĂN C');
    expect(result[1].id).toBe('valid-2');
  });
});

describe('invoiceSchema & safeParseInvoices', () => {
  it('parses valid invoice', () => {
    const raw = {
      id: 'inv-001',
      code: 'HD-001',
      reportId: 'rep-001',
      patientName: 'Nguyễn Văn A',
      finalAmount: 150000,
      status: 'Đã thu tiền',
      paymentMethod: 'Tiền mặt',
      cashier: 'Thu ngân 1',
      paidAt: new Date().toISOString()
    };
    const parsed = invoiceSchema.parse(raw);
    expect(parsed.id).toBe('inv-001');
    expect(parsed.finalAmount).toBe(150000);
    expect(parsed.status).toBe('Đã thu tiền');
  });

  it('resilient: defaults missing fields on legacy invoices', () => {
    const raw = {
      id: 'inv-002'
    };
    const parsed = invoiceSchema.parse(raw);
    expect(parsed.id).toBe('inv-002');
    expect(parsed.finalAmount).toBe(0);
    expect(parsed.items).toEqual([]);
    expect(parsed.status).toBe('Chưa thu phí');
  });

  it('safeParseInvoices skips non-object or invalid records safely', () => {
    const rawList = [
      null,
      { id: 'inv-100', finalAmount: 200000 },
      undefined,
      { id: 'inv-101', patientName: 'Test' }
    ];
    const result = safeParseInvoices(rawList);
    expect(result.length).toBe(2);
    expect(result[0].id).toBe('inv-100');
    expect(result[1].id).toBe('inv-101');
  });
});
