import { DEFAULT_CLOUD_DB_CONFIG } from './cloudDbService';

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
  const clean = base64.replace(/^data:application\/pdf;base64,/, '');
  const binaryString = atob(clean);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Tải file PDF ngầm 1-Click lên Cloud Storage (Ưu tiên Supabase Storage -> Cloudinary -> Local Data URL Fallback)
 * Đảm bảo 100% không bao giờ bị crash hoặc ném lỗi chặn quy trình người dùng.
 */
export async function uploadPdfToCloudinary({
  cloudName = 'wzy6qu56',
  uploadPreset = 'golab-clinic',
  pdfBase64,
  filename,
  supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || DEFAULT_CLOUD_DB_CONFIG.supabaseUrl || '',
  supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || DEFAULT_CLOUD_DB_CONFIG.supabaseAnonKey || ''
}: CloudUploadOptions): Promise<CloudUploadResult> {
  const cleanFilename = (filename || 'Phieu_Xet_Nghiem.pdf')
    .replace(/\.pdf$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_') + '.pdf';

  // Chuẩn hóa chuỗi Base64
  const rawBase64 = (pdfBase64 || '').replace(/^data:application\/pdf;base64,/, '').trim();

  // 1. UPLOAD LÊN SUPABASE STORAGE
  if (supabaseUrl && supabaseAnonKey && rawBase64 && rawBase64 !== 'undefined') {
    try {
      const cleanUrl = supabaseUrl.replace(/\/+$/, '');
      const bytes = base64ToUint8Array(rawBase64);

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
        /* Ignore bucket creation error */
      }

      const res = await fetch(`${cleanUrl}/storage/v1/object/reports/${encodeURIComponent(cleanFilename)}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true'
        },
        body: new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      });

      if (res.ok) {
        const publicUrl = `${cleanUrl}/storage/v1/object/public/reports/${encodeURIComponent(cleanFilename)}`;
        return {
          url: publicUrl,
          publicId: cleanFilename
        };
      }
    } catch (err) {
      console.warn('[CloudStorage] Supabase Storage upload error, falling back:', err);
    }
  }

  // 2. FALLBACK LÊN CLOUDINARY
  if (cloudName && uploadPreset && rawBase64 && rawBase64 !== 'undefined') {
    try {
      const cleanCloudName = cloudName.trim();
      const cleanPreset = uploadPreset.trim();

      const formData = new FormData();
      formData.append('file', `data:application/pdf;base64,${rawBase64}`);
      formData.append('upload_preset', cleanPreset);

      let response = await fetch(`https://api.cloudinary.com/v1_1/${cleanCloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        response = await fetch(`https://api.cloudinary.com/v1_1/${cleanCloudName}/raw/upload`, {
          method: 'POST',
          body: formData
        });
      }

      if (response.ok) {
        const data = await response.json();
        return {
          url: data.secure_url || data.url,
          publicId: data.public_id || cleanFilename
        };
      }
    } catch (cloudErr) {
      console.warn('[CloudStorage] Cloudinary upload error, falling back to Data URL:', cloudErr);
    }
  }

  // 3. FALLBACK CỦA TẠO LOCAL DATA URL (ĐẢM BẢO 100% QUY TRÌNH THÀNH CÔNG VÀ TẠO QR CODE ĐƯỢC)
  const dataUrl = rawBase64 && rawBase64 !== 'undefined'
    ? `data:application/pdf;base64,${rawBase64}`
    : 'data:application/pdf;base64,';

  return {
    url: dataUrl,
    publicId: cleanFilename
  };
}

/**
 * Hàm upload PDF lên Cloud tiêu chuẩn cho Transaction Pipeline
 */
export async function uploadPdfToCloud(
  pdfBlobOrBase64: Blob | string,
  filename: string
): Promise<{ url: string; provider: 'supabase' | 'cloudinary' | 'local'; filename: string }> {
  let base64 = '';
  if (typeof pdfBlobOrBase64 === 'string') {
    base64 = pdfBlobOrBase64;
  } else {
    base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(pdfBlobOrBase64);
    });
  }

  const res = await uploadPdfToCloudinary({
    pdfBase64: base64,
    filename
  });

  let provider: 'supabase' | 'cloudinary' | 'local' = 'local';
  if (res.url.includes('supabase.co')) {
    provider = 'supabase';
  } else if (res.url.includes('cloudinary.com')) {
    provider = 'cloudinary';
  }

  return {
    url: res.url,
    provider,
    filename: res.publicId || filename
  };
}
