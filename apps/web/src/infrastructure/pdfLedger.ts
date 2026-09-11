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
 * Xác định số phiên bản tiếp theo cho bệnh nhân.
 * Đồng bộ đa nguồn (Cloud DB / Snapshot, URL hiện hữu và Sổ cái localStorage)
 * Đảm bảo KHÔNG BAO GIỜ ghi đè file _v1.pdf khi cập nhật phiếu đã có kết quả.
 */
export async function getNextVersionForReport(
  patientCode: string,
  currentVersion?: number,
  cloudPdfUrl?: string
): Promise<number> {
  // 1. Phân tích phiên bản từ cloudPdfUrl hiện có (ví dụ: ..._v1.pdf -> 1)
  let urlVer = 0;
  if (cloudPdfUrl) {
    const match = cloudPdfUrl.match(/_v(\d+)\.pdf$/i);
    if (match) {
      urlVer = parseInt(match[1], 10);
    }
  }

  // 2. So khớp với sổ cái Ledger trong localStorage
  const existing = await getLedgerByReport(patientCode);
  const ledgerMaxVer = existing.length > 0 ? Math.max(...existing.map((r) => r.version || 1)) : 0;

  // 3. Kiểm tra xem phiếu này đã từng được xuất bản lần nào chưa:
  // - Hoặc đã có URL Cloud
  // - Hoặc đã có lịch sử trong sổ cái Ledger
  // - Hoặc currentVersion > 1 (đã qua ít nhất 1 lần nâng cấp phiên bản)
  const hasPriorExport = Boolean(cloudPdfUrl) || existing.length > 0 || (currentVersion !== undefined && currentVersion > 1);

  if (!hasPriorExport) {
    return 1;
  }

  const baseVer = Math.max(currentVersion || 0, urlVer);
  const maxExisting = Math.max(baseVer, ledgerMaxVer, 1);

  return maxExisting + 1;
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
