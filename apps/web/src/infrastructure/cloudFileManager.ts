import { getLedgerByReport, pruneLedgerRecords } from './pdfLedger';

/**
 * Xóa file trên Supabase Storage qua REST API
 */
export async function deleteSupabaseFile(
  supabaseUrl: string,
  anonKey: string,
  bucket: string,
  filePath: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const cleanPath = filePath.replace(/^\//, '');
    const url = `${cleanUrl}/storage/v1/object/${bucket}/${cleanPath}`;

    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey
      }
    });

    if (res.ok || res.status === 404) {
      return { success: true };
    }

    const text = await res.text();
    return { success: false, message: `Lỗi xóa file Supabase (${res.status}): ${text}` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi xóa file';
    return { success: false, message: msg };
  }
}

/**
 * Xóa file trên Cloudinary (nếu cấu hình)
 */
export async function deleteCloudinaryFile(
  _publicId: string
): Promise<{ success: boolean; message?: string }> {
  // Cloudinary client-side upload unsigned preset không cho phép direct delete không qua signature.
  // Khi cần xóa sâu, hệ thống sẽ bỏ qua hoặc ghi log.
  return { success: true };
}

/**
 * Dọn dẹp các phiên bản PDF cũ của cùng 1 bệnh nhân, chỉ giữ lại N phiên bản mới nhất
 */
export async function cleanupOldVersions(
  patientCode: string,
  maxKeepVersions: number = 3,
  supabaseConfig?: { url: string; anonKey: string; bucket?: string }
): Promise<{ deletedCount: number; errors: string[] }> {
  const records = await getLedgerByReport(patientCode);
  if (records.length <= maxKeepVersions) {
    return { deletedCount: 0, errors: [] };
  }

  // Sắp xếp giảm dần theo version / createdAt
  const sorted = [...records].sort((a, b) => b.version - a.version);
  const toDelete = sorted.slice(maxKeepVersions);
  const toKeepIds = sorted.slice(0, maxKeepVersions).map((r) => r.id);

  let deletedCount = 0;
  const errors: string[] = [];

  for (const record of toDelete) {
    if (record.cloudProvider === 'supabase' && supabaseConfig) {
      const res = await deleteSupabaseFile(
        supabaseConfig.url,
        supabaseConfig.anonKey,
        supabaseConfig.bucket || 'reports',
        record.filename
      );
      if (res.success) {
        deletedCount++;
      } else if (res.message) {
        errors.push(res.message);
      }
    }
  }

  // Cập nhật lại Ledger chỉ giữ các bản hợp lệ
  await pruneLedgerRecords(patientCode, toKeepIds);

  return { deletedCount, errors };
}
