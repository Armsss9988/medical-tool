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
  if (customWebsite && customWebsite.trim()) {
    const raw = customWebsite.trim();
    return raw.startsWith('http') ? raw.replace(/\/+$/, '') : `https://${raw.replace(/\/+$/, '')}`;
  }

  if (typeof process !== 'undefined' && process.env) {
    const envUrl = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXT_PUBLIC_APP_URL;
    if (envUrl && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, '');
    }
  }

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.startsWith('192.168.')) {
      return origin;
    }
  }

  return 'https://golab.com.vn';
}

export function buildPortalUrl(reportCode: string, customWebsite?: string): string {
  const baseUrl = getPortalBaseUrl(customWebsite);
  return `${baseUrl}/portal?code=${encodeURIComponent(reportCode)}`;
}
