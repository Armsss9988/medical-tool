import QRCode from 'qrcode';

export async function generateQrCodeDataUrl(text: string): Promise<string> {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    });
  } catch (err) {
    console.error('Lỗi khi tạo mã QR:', err);
    return '';
  }
}

export function downloadDataUrlAsImage(dataUrl: string, filename: string): void {
  if (!dataUrl) return;
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
