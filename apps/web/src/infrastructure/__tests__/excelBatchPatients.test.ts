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
});
