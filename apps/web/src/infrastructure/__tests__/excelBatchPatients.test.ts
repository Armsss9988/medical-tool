import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcelBatchPatients } from '../excelService';
import { CatalogItem } from '@domain';

describe('parseExcelBatchPatients - Matrix & Deduplication', () => {
  const dummyCatalog: CatalogItem[] = [
    {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4'
    },
    {
      code: 'URE',
      name: 'Ure máu',
      category: 'Sinh Hóa',
      unit: 'mmol/L',
      refMin: 2.5,
      refMax: 7.5,
      refText: '2.5 - 7.5'
    }
  ];

  it('1. Ignores _DataLookup sheet and parses single-sheet matrix without error', async () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Main Matrix
    const dataSheetRows = [
      {
        'Mã BN': 'BN-001',
        'Họ và Tên': 'Nguyễn Văn Test',
        'Năm Sinh': '1995',
        'Giới Tính': 'Nam',
        'Glucose máu [GLU]': '5.5',
        'Ure máu [URE]': '4.2'
      }
    ];
    const ws1 = XLSX.utils.json_to_sheet(dataSheetRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Khám Đoàn Tổng Quát');

    // Sheet 2: Auxiliary Lookup Sheet (like GoLab template)
    const lookupRows = [
      { 'Giới tính': 'Nam', 'Bác sĩ': 'BS. Long' },
      { 'Giới tính': 'Nữ', 'Bác sĩ': 'BS. Trung' }
    ];
    const ws2 = XLSX.utils.json_to_sheet(lookupRows);
    XLSX.utils.book_append_sheet(wb, ws2, '_DataLookup');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const rows = await parseExcelBatchPatients(buffer, dummyCatalog);

    expect(rows.length).toBe(1);
    expect(rows[0].patient.name).toBe('NGUYỄN VĂN TEST');
    expect(rows[0].patient.code).toBe('BN-001');
    expect(rows[0].hasExplicitCode).toBe(true);
    expect(rows[0].selectedTests.length).toBe(2);
  });

  it('2. Deduplicates multiple columns pointing to the same test indicator', async () => {
    const wb = XLSX.utils.book_new();

    // Row has two columns that both map to 'GLU'
    const dataSheetRows = [
      {
        'Họ và Tên': 'Trần Văn Dupe',
        'Năm Sinh': '1980',
        'Giới Tính': 'Nam',
        'GLU': '5.0',
        'Glucose máu': '5.4' // Duplicate reference to GLU
      }
    ];
    const ws = XLSX.utils.json_to_sheet(dataSheetRows);
    XLSX.utils.book_append_sheet(wb, ws, 'DupeTest');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const rows = await parseExcelBatchPatients(buffer, dummyCatalog);

    expect(rows.length).toBe(1);
    // Should deduplicate GLU so patient only has 1 GLU test
    expect(rows[0].selectedTests.length).toBe(1);
    expect(rows[0].selectedTests[0].code).toBe('GLU');
  });

  it('3. Dynamically matches medical synonyms (Creatinine, Acid Uric, Cholesterol, NEU%) without hardcoding', async () => {
    const extendedCatalog: CatalogItem[] = [
      ...dummyCatalog,
      { code: 'CREAT', name: 'Creatinine máu', category: 'Sinh Hóa', unit: 'µmol/L', refMin: 53, refMax: 110, refText: '53 - 110' },
      { code: 'URIC', name: 'Acid Uric (Gút)', category: 'Sinh Hóa', unit: 'µmol/L', refMin: 180, refMax: 420, refText: '180 - 420' },
      { code: 'CHO', name: 'Cholesterol toàn phần', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 3.6, refMax: 5.2, refText: '3.6 - 5.2' },
      { code: 'TRI', name: 'Triglyceride (Mỡ máu)', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 0.4, refMax: 1.7, refText: '0.4 - 1.7' },
      { code: 'WBC', name: 'WBC Số lượng bạch cầu', category: 'Huyết Học', unit: 'G/L', refMin: 4.0, refMax: 10.0, refText: '4.0 - 10.0' },
      { code: 'NEUPCT', name: 'Tỷ lệ bạch cầu trung tính (NEU%)', category: 'Huyết Học', unit: '%', refMin: 40, refMax: 70, refText: '40 - 70' }
    ];

    const wb = XLSX.utils.book_new();
    const dataSheetRows = [
      {
        'Họ và Tên': 'Bùi Văn Test',
        'Năm Sinh': '1988',
        'Giới Tính (*) [Chọn Dropdown]': 'Nam',
        'BS Chỉ Định [Chọn Dropdown]': 'BS. Lê Phan Anh',
        'Creatinine': '88',
        'Acid Uric': '350',
        'Cholesterol': '4.8',
        'Triglyceride': '1.2',
        'Bạch Cầu': '6.5',
        'NEU%': '55'
      }
    ];
    const ws = XLSX.utils.json_to_sheet(dataSheetRows);
    XLSX.utils.book_append_sheet(wb, ws, 'SynonymTest');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const rows = await parseExcelBatchPatients(buffer, extendedCatalog);

    expect(rows.length).toBe(1);
    const row = rows[0];
    expect(row.patient.name).toBe('BÙI VĂN TEST');
    expect(row.patient.gender).toBe('Nam');
    expect(row.doctorName).toBe('BS. Lê Phan Anh');

    // Verify all 6 tests matched correctly to catalog codes
    const codes = row.selectedTests.map((t) => t.code);
    expect(codes).toContain('CREAT');
    expect(codes).toContain('URIC');
    expect(codes).toContain('CHO');
    expect(codes).toContain('TRI');
    expect(codes).toContain('WBC');
    expect(codes).toContain('NEUPCT');

    // Verify administrative columns did NOT leak into selectedTests
    expect(codes).not.toContain('GIỚI_TÍNH_(*)');
    expect(codes).not.toContain('BS_CHỈ_ĐỊNH');
  });

  it('4. Preserves active test columns for patients with empty cells while ignoring unused columns', async () => {
    const testCatalog: CatalogItem[] = [
      { code: 'GLU', name: 'Glucose', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 3.9, refMax: 6.4, refText: '3.9 - 6.4' },
      { code: 'URE', name: 'Ure', category: 'Sinh Hóa', unit: 'mmol/L', refMin: 2.5, refMax: 7.5, refText: '2.5 - 7.5' },
      { code: 'CREAT', name: 'Creatinine', category: 'Sinh Hóa', unit: 'µmol/L', refMin: 53, refMax: 110, refText: '53 - 110' }
    ];

    const wb = XLSX.utils.book_new();
    const dataSheetRows = [
      {
        'Họ và Tên': 'Bệnh Nhân 1',
        'Glucose': '5.2',
        'Ure': '4.5',
        'Creatinine': '' // Empty across row 1
      },
      {
        'Họ và Tên': 'Bệnh Nhân 2',
        'Glucose': '5.6',
        'Ure': '4.8',
        'Creatinine': '95' // Active in row 2!
      }
    ];
    const ws = XLSX.utils.json_to_sheet(dataSheetRows);
    XLSX.utils.book_append_sheet(wb, ws, 'ActiveColumnsTest');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const rows = await parseExcelBatchPatients(buffer, testCatalog);

    expect(rows.length).toBe(2);
    // Patient 1 has Creatinine preserved as empty string because it is active in the batch
    const p1Creat = rows[0].selectedTests.find((t) => t.code === 'CREAT');
    expect(p1Creat).toBeDefined();
    expect(p1Creat?.result).toBe('');

    // Patient 2 has Creatinine with value 95
    const p2Creat = rows[1].selectedTests.find((t) => t.code === 'CREAT');
    expect(p2Creat).toBeDefined();
    expect(p2Creat?.result).toBe('95');
  });

  it('5. Generates optimized Excel batch template and round-trips correctly through parseExcelBatchPatients', async () => {
    const { generateBatchTemplateWorkbook } = await import('../excel/excelBatchPatients');
    const doctors = [
      { id: 'doc-1', name: 'BS. Trần Hoài Long', active: true },
      { id: 'doc-2', name: 'BS. Nguyễn Thị Thành Trung', active: true }
    ];

    const wb = await generateBatchTemplateWorkbook(dummyCatalog, null, doctors);

    // 1. Verify worksheets
    expect(wb.worksheets.length).toBe(3);
    const [wsMain, wsGuide, wsLookup] = wb.worksheets;
    expect(wsMain.name).toBe('Danh Sách Khám Đoàn');
    expect(wsGuide.name).toBe('Hướng Dẫn & Danh Mục Chỉ Số');
    expect(wsLookup.name).toBe('_DataLookup');
    expect(wsLookup.state).toBe('hidden');

    // 2. Verify text format protection (@) on patient code, dob and phone
    expect(wsMain.getCell('B2').numFmt).toBe('@');
    expect(wsMain.getCell('D2').numFmt).toBe('@');
    expect(wsMain.getCell('F2').numFmt).toBe('@');

    // 3. Verify round-trip parsing
    const buffer = await wb.xlsx.writeBuffer();
    const parsedRows = await parseExcelBatchPatients(buffer as ArrayBuffer, dummyCatalog);

    expect(parsedRows.length).toBe(3);
    expect(parsedRows[0].patient.name).toBe('NGUYỄN VĂN A');
    expect(parsedRows[0].patient.code).toBe('XN-2026-001');
    expect(parsedRows[0].patient.gender).toBe('Nam');
    expect(parsedRows[0].patient.phone).toBe('0987654321');
    expect(parsedRows[0].selectedTests.length).toBe(2);

    expect(parsedRows[1].patient.name).toBe('TRẦN THỊ B');
    expect(parsedRows[1].patient.gender).toBe('Nữ');

    expect(parsedRows[2].patient.name).toBe('LÊ PHAN C');
    expect(parsedRows[2].doctorName).toBe('BS. Nguyễn Thị Thành Trung');
  });
});

