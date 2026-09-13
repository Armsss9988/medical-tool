import QRCode from 'qrcode';

/**
 * Tạo Data URL dạng base64 của QR Code chứa đường dẫn xem file PDF
 */
export async function generateQrCodeDataUrl(url: string): Promise<string> {
  if (!url) return '';
  try {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Lỗi tạo QR Code:', err);
    return '';
  }
}

/**
 * Tải ảnh QR Code (.png) về máy tính
 */
export function downloadQrCodeImage(qrDataUrl: string, filename = 'QRCode.png'): boolean {
  if (!qrDataUrl) return false;
  try {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    const cleanName = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.download = cleanName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('Lỗi tải QR Code:', err);
    return false;
  }
}

export function downloadDataUrlAsImage(dataUrl: string, filename: string): void {
  downloadQrCodeImage(dataUrl, filename);
}

/**
 * Lấy base URL cho cổng tra cứu trực tuyến (hỗ trợ clinic website, biến môi trường, hoặc fallback thông minh khi chạy localhost)
 */
export function getPortalBaseUrl(customWebsite?: string): string {
  // 1. Tùy biến từ phòng khám nếu được chỉ định và KHÁC giá trị mặc định golab.com.vn
  const trimmed = (customWebsite || '').trim();
  const isDefaultGolabDomain =
    !trimmed ||
    trimmed === 'golab.com.vn' ||
    trimmed === 'http://golab.com.vn' ||
    trimmed === 'https://golab.com.vn' ||
    trimmed === 'http://golab.com.vn/' ||
    trimmed === 'https://golab.com.vn/';

  if (!isDefaultGolabDomain) {
    return trimmed.startsWith('http') ? trimmed.replace(/\/+$/, '') : `https://${trimmed.replace(/\/+$/, '')}`;
  }

  // 2. Biến môi trường cấu hình rõ ràng (ưu tiên cao khi customWebsite là mặc định)
  if (typeof process !== 'undefined' && process.env) {
    const envUrl = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, '');
    }
  }

  // 3. Trình duyệt thực tế (ưu tiên origin nếu không phải localhost)
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, origin } = window.location;
    if (origin && origin !== 'null' && hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return origin.replace(/\/+$/, '');
    }
  }

  return 'https://golab.com.vn';
}

export function buildPortalUrl(reportCode: string, customWebsite?: string): string {
  const baseUrl = getPortalBaseUrl(customWebsite);
  return `${baseUrl}/portal?code=${encodeURIComponent(reportCode)}`;
}
