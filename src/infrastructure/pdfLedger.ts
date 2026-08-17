/**
 * pdfLedger.ts
 * Sổ cái (Ledger) ghi nhận lịch sử xuất PDF:
 * - Mỗi lần xuất thành công = 1 PdfFileRecord mới
 * - Version tăng dần, version cũ đánh dấu isLatest = false
 * - Chỉ giữ 3 version mới nhất (MAX_VERSIONS_PER_REPORT)
 * - Persist qua storage.ts (localStorage / Electron file)
 */

import { loadData, saveData } from './storage';
import { PdfFileRecord } from '../domain/exportTransaction';

const LEDGER_KEY = 'pdf_ledger';
const MAX_VERSIONS_PER_REPORT = 3;

// ─── Đọc toàn bộ ledger ───────────────────────────────────────────────────────
export async function loadLedger(): Promise<PdfFileRecord[]> {
  return loadData<PdfFileRecord[]>(LEDGER_KEY, []);
}

// ─── Lưu toàn bộ ledger ──────────────────────────────────────────────────────
async function saveLedger(records: PdfFileRecord[]): Promise<void> {
  await saveData(LEDGER_KEY, records);
}

// ─── Thêm bản ghi mới, đánh dấu cũ, giữ ≤ MAX_VERSIONS ─────────────────────
export async function addLedgerEntry(
  record: Omit<PdfFileRecord, 'version' | 'isLatest' | 'id'>
): Promise<PdfFileRecord> {
  const ledger = await loadLedger();

  // Lấy các bản ghi của cùng reportCode
  const existing = ledger.filter((r) => r.reportCode === record.reportCode);

  // Xác định version tiếp theo
  const nextVersion = existing.length > 0
    ? Math.max(...existing.map((r) => r.version)) + 1
    : 1;

  // Đánh dấu tất cả bản ghi cũ là không còn là latest
  const updatedLedger = ledger.map((r) =>
    r.reportCode === record.reportCode ? { ...r, isLatest: false } : r
  );

  // Tạo bản ghi mới
  const newRecord: PdfFileRecord = {
    ...record,
    id: `PDF-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    version: nextVersion,
    isLatest: true
  };

  updatedLedger.unshift(newRecord);

  // Giữ tối đa MAX_VERSIONS_PER_REPORT cho mỗi reportCode
  const final = pruneOldVersions(updatedLedger, record.reportCode);
  await saveLedger(final);

  console.info(`[PdfLedger] Thêm bản ghi v${nextVersion} cho ${record.reportCode}: ${record.cloudUrl}`);
  return newRecord;
}

// ─── Xóa version vượt quá giới hạn (trả về filename bị xóa khỏi ledger) ─────
function pruneOldVersions(ledger: PdfFileRecord[], reportCode: string): PdfFileRecord[] {
  const forReport = ledger
    .filter((r) => r.reportCode === reportCode)
    .sort((a, b) => b.version - a.version);

  const toKeep = new Set(forReport.slice(0, MAX_VERSIONS_PER_REPORT).map((r) => r.id));

  return ledger.filter((r) => r.reportCode !== reportCode || toKeep.has(r.id));
}

// ─── Lấy danh sách version PDF của 1 phiếu (mới nhất trước) ─────────────────
export async function getLedgerByReport(reportCode: string): Promise<PdfFileRecord[]> {
  const ledger = await loadLedger();
  return ledger
    .filter((r) => r.reportCode === reportCode)
    .sort((a, b) => b.version - a.version);
}

// ─── Lấy version mới nhất ────────────────────────────────────────────────────
export async function getLatestVersion(reportCode: string): Promise<PdfFileRecord | null> {
  const records = await getLedgerByReport(reportCode);
  return records.find((r) => r.isLatest) ?? records[0] ?? null;
}

// ─── Đánh dấu 1 bản ghi là không hợp lệ (dùng khi rollback xóa file) ────────
export async function invalidateLedgerEntry(id: string): Promise<void> {
  const ledger = await loadLedger();
  const updated = ledger.map((r) =>
    r.id === id
      ? { ...r, isLatest: false, cloudUrl: '', cloudProvider: 'local' as const }
      : r
  );
  await saveLedger(updated);
  console.info(`[PdfLedger] Đã vô hiệu hóa bản ghi: ${id}`);
}

// ─── Lấy các filename cũ (không phải latest) để cleanup trên Cloud ───────────
export async function getOldVersionFilenames(reportCode: string): Promise<{ filename: string; cloudProvider: string; publicId?: string }[]> {
  const records = await getLedgerByReport(reportCode);
  return records
    .filter((r) => !r.isLatest && r.cloudUrl && !r.cloudUrl.startsWith('data:'))
    .map((r) => ({ filename: r.filename, cloudProvider: r.cloudProvider, publicId: r.publicId }));
}

// ─── Xóa toàn bộ ledger (chỉ dùng khi reset dữ liệu) ────────────────────────
export async function clearLedger(): Promise<void> {
  await saveLedger([]);
}
