import { PdfFileRecord } from '@domain/exportTransaction';
import { loadState, saveState } from './storage';

const LEDGER_STORAGE_KEY = 'golab_pdf_ledger';

/**
 * Lấy toàn bộ danh sách phiên bản PDF trong sổ cái Ledger
 */
export async function getAllLedgerRecords(): Promise<PdfFileRecord[]> {
  return loadState<PdfFileRecord[]>(LEDGER_STORAGE_KEY, []);
}

/**
 * Lấy danh sách các phiên bản PDF của 1 hồ sơ / bệnh nhân cụ thể
 */
export async function getLedgerByReport(patientCode: string): Promise<PdfFileRecord[]> {
  const all = await getAllLedgerRecords();
  return all
    .filter((r) => r.patientCode === patientCode || r.reportId === patientCode)
    .sort((a, b) => b.version - a.version);
}

/**
 * Xác định số phiên bản tiếp theo cho bệnh nhân
 */
export async function getNextVersionForReport(patientCode: string): Promise<number> {
  const existing = await getLedgerByReport(patientCode);
  if (existing.length === 0) return 1;
  const maxVer = Math.max(...existing.map((r) => r.version || 1));
  return maxVer + 1;
}

/**
 * Ghi nhận một bản ghi xuất PDF mới vào sổ cái Ledger
 */
export async function addLedgerRecord(record: PdfFileRecord): Promise<void> {
  const all = await getAllLedgerRecords();

  // Đánh dấu các bản ghi cũ của cùng bệnh nhân thành isLatest = false
  const updatedAll = all.map((item) => {
    if (item.patientCode === record.patientCode || item.reportId === record.reportId) {
      return { ...item, isLatest: false };
    }
    return item;
  });

  const nextList = [record, ...updatedAll];
  saveState(LEDGER_STORAGE_KEY, nextList);
}

/**
 * Xóa các bản ghi cũ khỏi sổ cái Ledger khi đã dọn dẹp trên Cloud
 */
export async function pruneLedgerRecords(
  patientCode: string,
  keepRecordIds: string[]
): Promise<void> {
  const all = await getAllLedgerRecords();
  const keepSet = new Set(keepRecordIds);

  const filtered = all.filter((item) => {
    if (item.patientCode === patientCode || item.reportId === patientCode) {
      return keepSet.has(item.id);
    }
    return true;
  });

  saveState(LEDGER_STORAGE_KEY, filtered);
}
