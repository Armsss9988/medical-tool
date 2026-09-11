// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getNextVersionForReport,
  addLedgerRecord,
  getLedgerByReport
} from '../pdfLedger';
import { PdfFileRecord } from '@domain/exportTransaction';

describe('pdfLedger - Smart Version Resolution & Anti-Overwrite', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('1. Returns 1 for brand new patient with no export history anywhere', async () => {
    const version = await getNextVersionForReport('BN-20260912-001');
    expect(version).toBe(1);
  });

  it('2. Returns 1 when currentVersion is 1 (default for new report) but has never been exported', async () => {
    const version = await getNextVersionForReport(
      'BN-20260907-012',
      1, // default currentVersion from DB / Aggregate
      undefined
    );
    expect(version).toBe(1);
  });

  it('2b. Returns 3 when currentVersion is already 2 (prior export) even if localStorage is empty', async () => {
    const version = await getNextVersionForReport(
      'BN-20260907-012',
      2,
      undefined
    );
    expect(version).toBe(3);
  });

  it('3. Extracts version from cloudPdfUrl (_v1.pdf -> next version 2) when currentVersion is undefined', async () => {
    const cloudUrl = 'https://zfpsgycfqybgqytjmeck.supabase.co/storage/v1/object/public/reports/Phieu_Xet_Nghiem_Hoang_Tuan_Kiet_BN-20260907-012_v1.pdf';
    const version = await getNextVersionForReport(
      'BN-20260907-012',
      undefined,
      cloudUrl
    );
    expect(version).toBe(2);
  });

  it('4. Correctly extracts higher version from cloudPdfUrl (_v2.pdf -> next version 3)', async () => {
    const cloudUrl = 'https://supabase.co/reports/Phieu_BN-123_v2.pdf';
    const version = await getNextVersionForReport(
      'BN-123',
      undefined,
      cloudUrl
    );
    expect(version).toBe(3);
  });

  it('5. Prioritizes the highest version between currentVersion, URL, and localStorage ledger', async () => {
    // Giả sử URL là v1, nhưng DB là v2
    const cloudUrl = 'https://supabase.co/reports/Phieu_BN-999_v1.pdf';
    const version = await getNextVersionForReport(
      'BN-999',
      2,
      cloudUrl
    );
    expect(version).toBe(3);

    // Thêm bản ghi v3 vào localStorage ledger
    const ledgerRecord: PdfFileRecord = {
      id: 'rec-1',
      reportId: 'BN-999',
      patientCode: 'BN-999',
      patientName: 'Test Patient',
      filename: 'Phieu_BN-999_v3.pdf',
      version: 3,
      cloudProvider: 'supabase',
      cloudUrl: 'https://supabase.co/reports/Phieu_BN-999_v3.pdf',
      createdAt: new Date().toISOString(),
      isLatest: true
    };
    await addLedgerRecord(ledgerRecord);

    // Lần xuất tiếp theo phải lên v4
    const nextVer = await getNextVersionForReport('BN-999', 2, cloudUrl);
    expect(nextVer).toBe(4);
  });

  it('6. addLedgerRecord marks previous records of same patient as isLatest: false', async () => {
    const rec1: PdfFileRecord = {
      id: 'rec-1',
      reportId: 'BN-001',
      patientCode: 'BN-001',
      patientName: 'Nguyen Van A',
      filename: 'Phieu_BN-001_v1.pdf',
      version: 1,
      cloudProvider: 'supabase',
      cloudUrl: 'https://url/v1.pdf',
      createdAt: new Date().toISOString(),
      isLatest: true
    };
    await addLedgerRecord(rec1);

    const rec2: PdfFileRecord = {
      id: 'rec-2',
      reportId: 'BN-001',
      patientCode: 'BN-001',
      patientName: 'Nguyen Van A',
      filename: 'Phieu_BN-001_v2.pdf',
      version: 2,
      cloudProvider: 'supabase',
      cloudUrl: 'https://url/v2.pdf',
      createdAt: new Date().toISOString(),
      isLatest: true
    };
    await addLedgerRecord(rec2);

    const records = await getLedgerByReport('BN-001');
    expect(records.length).toBe(2);
    // records are sorted by version descending
    expect(records[0].version).toBe(2);
    expect(records[0].isLatest).toBe(true);
    expect(records[1].version).toBe(1);
    expect(records[1].isLatest).toBe(false);
  });
});
