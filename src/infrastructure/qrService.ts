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
