export interface CloudUploadOptions {
  cloudName?: string;
  uploadPreset?: string;
  pdfBase64: string;
  filename: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export interface CloudUploadResult {
  url: string;
  publicId: string;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Tải file PDF ngầm 1-Click lên Cloud Storage (Ưu tiên Supabase Storage, fallback Cloudinary)
 */
export async function uploadPdfToCloudinary({
  cloudName,
  uploadPreset,
  pdfBase64,
  filename,
  supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '',
  supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || ''
}: CloudUploadOptions): Promise<CloudUploadResult> {
  const cleanFilename = (filename || 'Phieu_Xet_Nghiem.pdf')
    .replace(/\.pdf$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_') + '.pdf';

  // 1. UPLOAD LÊN SUPABASE STORAGE (NẾU ĐÃ CẤU HÌNH SUPABASE)
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      const bytes = base64ToUint8Array(pdfBase64);

      // Thử tạo bucket 'reports' nếu chưa có
      try {
        await fetch(`${cleanUrl}/storage/v1/bucket`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`
          },
          body: JSON.stringify({ id: 'reports', name: 'reports', public: true })
        });
      } catch {
        /* Ignore bucket creation error if already exists */
      }

      const res = await fetch(`${cleanUrl}/storage/v1/object/reports/${encodeURIComponent(cleanFilename)}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true'
        },
        body: bytes
      });

      if (res.ok) {
        const publicUrl = `${cleanUrl}/storage/v1/object/public/reports/${encodeURIComponent(cleanFilename)}`;
        return {
          url: publicUrl,
          publicId: cleanFilename
        };
      }
    } catch (err) {
      console.warn('[CloudStorage] Không thể upload Supabase Storage, thử Cloudinary:', err);
    }
  }

  // 2. FALLBACK LÊN CLOUDINARY
  if (!cloudName || !uploadPreset) {
    throw new Error('Chưa cấu hình Supabase Storage hoặc Cloudinary (Cloud Name / Preset)!');
  }

  const cleanCloudName = cloudName.trim();
  const cleanPreset = uploadPreset.trim();

  // Thử gửi Unsigned Preset không kèm public_id trước (chống lỗi HTTP 401 Unknown API key)
  const formData = new FormData();
  formData.append('file', `data:application/pdf;base64,${pdfBase64}`);
  formData.append('upload_preset', cleanPreset);

  let response = await fetch(`https://api.cloudinary.com/v1_1/${cleanCloudName}/auto/upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    // Thử endpoint /raw/upload
    response = await fetch(`https://api.cloudinary.com/v1_1/${cleanCloudName}/raw/upload`, {
      method: 'POST',
      body: formData
    });
  }

  const data = await response.json();
  if (!response.ok) {
    const errMsg = data.error ? data.error.message : 'Tải file lên Cloudinary thất bại.';
    if (errMsg.includes('Unknown API key') || response.status === 401) {
      throw new Error('Cloudinary yêu cầu Unsigned Upload Preset hợp lệ. Vui lòng kiểm tra Cloud Name & Upload Preset trong Cấu Hình!');
    }
    throw new Error(errMsg);
  }

  return {
    url: data.secure_url || data.url,
    publicId: data.public_id
  };
}
