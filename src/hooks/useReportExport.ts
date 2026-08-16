import { useState } from 'react';
import { ToastType } from '@domain/types';
import { exportElementToPdfBlob } from '@infra/pdfService';
import { uploadPdfToCloudinary } from '@infra/cloudService';
import { generateQrCodeDataUrl, downloadDataUrlAsImage } from '@infra/qrService';

export function useReportExport(
  showToast: (message: string, type?: ToastType) => void
) {
  const [cloudLink, setCloudLink] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const handleExportPdfAndUploadCloud = async (
    elementId: string,
    filename: string
  ) => {
    try {
      showToast('Đang tạo file PDF A4 & tải lên Cloud Storage...', 'info');

      const pdfBlob = await exportElementToPdfBlob(elementId, filename);
      if (!pdfBlob) {
        showToast('Không thể xuất file PDF. Vui lòng kiểm tra lại!', 'error');
        return;
      }

      const cloudRes = await uploadPdfToCloudinary(pdfBlob, filename, (pct) => {
        if (pct === 100) {
          showToast('Đã tải PDF lên Cloud! Đang tạo mã QR...', 'info');
        }
      });

      const uploadedUrl = cloudRes.url;
      setCloudLink(uploadedUrl);

      const qrUrl = await generateQrCodeDataUrl(uploadedUrl);
      setQrCodeDataUrl(qrUrl);

      showToast('Đã tải lên Cloud thành công! Nút "Tải QR Code" đã sẵn sàng.', 'success');
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Không thể tải file lên Cloud';
      console.error('Lỗi quy trình 1-Click:', err);
      showToast(`Có lỗi xảy ra: ${errMsg}`, 'error');
    }
  };

  const handleDownloadQrCode = (patientName: string, patientCode: string) => {
    if (!qrCodeDataUrl) {
      showToast('Chưa có mã QR Code. Hãy nhấn xuất PDF & Cloud trước!', 'error');
      return;
    }

    const safeName = (patientName || 'BenhNhan').replace(/\s+/g, '_');
    const qrFilename = `QRCode_PhieuKham_${safeName}_${patientCode}.png`;
    downloadDataUrlAsImage(qrCodeDataUrl, qrFilename);
    showToast('Đã tải ảnh mã QR Code về máy!', 'success');
  };

  const resetExport = () => {
    setCloudLink('');
    setQrCodeDataUrl('');
  };

  return {
    cloudLink,
    qrCodeDataUrl,
    handleExportPdfAndUploadCloud,
    handleDownloadQrCode,
    resetExport
  };
}
