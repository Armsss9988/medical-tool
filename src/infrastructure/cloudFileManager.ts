/**
 * cloudFileManager.ts
 * Quản lý file PDF trên Cloud Storage:
 * - Xóa file trên Supabase/Cloudinary (dùng cho Rollback)
 * - Liệt kê file của 1 bệnh nhân
 * - Dọn dẹp các version cũ, chỉ giữ N version mới nhất
 */

// ─── Xóa file trên Supabase Storage ──────────────────────────────────────────
export async function deleteSupabaseFile(
  filename: string,
  config: { url: string; anonKey: string }
): Promise<boolean> {
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    const res = await fetch(
      `${cleanUrl}/storage/v1/object/reports/${encodeURIComponent(filename)}`,
      {
        method: 'DELETE',
        headers: {
          apikey: config.anonKey,
          Authorization: `Bearer ${config.anonKey}`
        }
      }
    );
    if (res.ok) {
      console.info(`[CloudFileManager] Đã xóa file Supabase: ${filename}`);
      return true;
    }
    console.warn(`[CloudFileManager] Supabase DELETE trả về ${res.status} cho ${filename}`);
    return false;
  } catch (err) {
    console.error('[CloudFileManager] Lỗi xóa Supabase:', err);
    return false;
  }
}

// ─── Xóa file trên Cloudinary ────────────────────────────────────────────────
export async function deleteCloudinaryFile(
  publicId: string,
  config: { cloudName: string; uploadPreset?: string }
): Promise<boolean> {
  if (!publicId || !config.cloudName) return false;
  try {
    // Cloudinary destruction thông qua unsigned delete (chỉ hoạt động với upload preset có phép)
    const formData = new FormData();
    formData.append('public_id', publicId);
    if (config.uploadPreset) formData.append('upload_preset', config.uploadPreset);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/raw/destroy`,
      { method: 'POST', body: formData }
    );

    if (res.ok) {
      const data = await res.json();
      const deleted = data.result === 'ok';
      if (deleted) {
        console.info(`[CloudFileManager] Đã xóa file Cloudinary: ${publicId}`);
      } else {
        console.warn(`[CloudFileManager] Cloudinary destroy result: ${data.result}`);
      }
      return deleted;
    }
    return false;
  } catch (err) {
    console.error('[CloudFileManager] Lỗi xóa Cloudinary:', err);
    return false;
  }
}

// ─── Liệt kê tất cả file PDF của 1 bệnh nhân trên Supabase ──────────────────
export async function listPatientFiles(
  reportCode: string,
  config: { url: string; anonKey: string }
): Promise<Array<{ name: string; id: string; updated_at: string; metadata?: Record<string, unknown> }>> {
  try {
    const cleanUrl = config.url.replace(/\/+$/, '');
    // Supabase Storage: List objects với prefix
    const res = await fetch(`${cleanUrl}/storage/v1/object/list/reports`, {
      method: 'POST',
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prefix: reportCode,
        limit: 50,
        sortBy: { column: 'updated_at', order: 'desc' }
      })
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[CloudFileManager] Lỗi list files Supabase:', err);
    return [];
  }
}

// ─── Dọn dẹp version cũ trên Supabase, chỉ giữ N mới nhất ──────────────────
export async function cleanupOldVersions(
  filenames: string[],            // Danh sách filename cũ cần xóa
  config: { url: string; anonKey: string }
): Promise<number> {
  let deleted = 0;
  for (const filename of filenames) {
    const ok = await deleteSupabaseFile(filename, config);
    if (ok) deleted++;
  }
  console.info(`[CloudFileManager] Dọn dẹp xong ${deleted}/${filenames.length} file cũ.`);
  return deleted;
}
