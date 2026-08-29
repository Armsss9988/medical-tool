import { useCallback } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModal } from '../contexts/ModalContext';
import { useToast } from '../contexts/ToastContext';
import { resolveDoctorName } from '@domain/reportFactory';
import type { Invoice, MedicalReport } from '@domain';

// ─── INVOICE ACTIONS HOOK ───────────────────────────────────────────────────
// Manages billing operations: creating invoices, collecting payments,
// cancelling/refunding, and linking invoices with medical reports.

export function useInvoiceActions(
  onSaveCurrentReport: () => string | null,
  cloudLink?: string,
  qrCodeDataUrl?: string
) {
  const {
    patient,
    setPatient,
    selectedTests,
    setSelectedTests,
    conclusion,
    setConclusion,
    doctorName,
    setDoctorName,
    currentReportId,
    setCurrentReportId,
    saveOrUpdateReport,
    saveOrUpdateInvoice,
    deleteInvoice,
    invoices
  } = useWorkspace();

  const {
    openInvoiceModal,
    closeReportManager,
    closeRevenueModal
  } = useModal();

  const { showToast } = useToast();

  // 1. ACTION: LƯU HÓA ĐƠN & LIÊN KẾT CHÉO VỚI PHIẾU XÉT NGHIỆM
  const handleSaveInvoice = useCallback(
    (inv: Invoice) => {
      let reportIdToLink = inv.reportId || currentReportId;

      // BẮT BUỘC: Hóa đơn KHÔNG THỂ lưu khi chưa lưu Phiếu Kết Quả Xét Nghiệm
      if (!reportIdToLink) {
        const savedReportId = onSaveCurrentReport();
        if (!savedReportId) {
          showToast('Hóa đơn không thể được lưu khi chưa lưu Phiếu Kết Quả Xét Nghiệm!', 'error');
          return;
        }
        reportIdToLink = savedReportId;
      }

      const isPaid = inv.status === 'Đã thanh toán';
      const todayStr = new Date().toLocaleDateString('vi-VN');
      const updatedPatient = {
        ...patient,
        paidAt: isPaid ? patient.paidAt || todayStr : undefined
      };
      setPatient(updatedPatient);

      // A. Lưu hóa đơn vào Sổ Doanh Thu
      const saved = saveOrUpdateInvoice({
        ...inv,
        reportId: reportIdToLink,
        paidAt: isPaid ? inv.paidAt || new Date().toISOString() : undefined
      });

      // B. Liên kết ngược lại vào Sổ Lưu Phiếu Xét Nghiệm
      saveOrUpdateReport({
        id: reportIdToLink,
        patient: updatedPatient,
        selectedTests,
        conclusion,
        doctorName: resolveDoctorName(doctorName, patient.doctor),
        cloudPdfUrl: cloudLink || undefined,
        qrCodeDataUrl: qrCodeDataUrl || undefined,
        invoiceId: saved.id
      });

      if (isPaid) {
        showToast(
          `Đã xác nhận THU TIỀN và lưu hóa đơn ${saved.code} (${saved.finalAmount.toLocaleString('vi-VN')} đ) cho bệnh nhân ${saved.patientName}!`,
          'success'
        );
      } else {
        showToast(
          `Đã tạo hóa đơn ${saved.code} (${saved.finalAmount.toLocaleString('vi-VN')} đ) ở trạng thái CHỜ THU cho bệnh nhân ${saved.patientName}!`,
          'info'
        );
      }
    },
    [
      currentReportId,
      onSaveCurrentReport,
      patient,
      setPatient,
      saveOrUpdateInvoice,
      saveOrUpdateReport,
      selectedTests,
      conclusion,
      doctorName,
      cloudLink,
      qrCodeDataUrl,
      showToast
    ]
  );

  // 2. ACTION: KIỂM TRA ĐIỀU KIỆN TRƯỚC KHI MỞ MODAL THU PHÍ
  const handleOpenInvoiceModalWithCheck = useCallback(() => {
    if (!patient.name.trim()) {
      showToast('Vui lòng nhập họ và tên bệnh nhân trước khi thu phí!', 'error');
      return;
    }
    if (selectedTests.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 chỉ số hoặc gói xét nghiệm để thu phí!', 'warning');
      return;
    }
    if (!currentReportId) {
      showToast("Vui lòng bấm 'Lưu Sổ Lưu' (Ctrl+S) phiếu xét nghiệm trước khi tạo hóa đơn!", 'warning');
      return;
    }
    openInvoiceModal();
  }, [patient, selectedTests, currentReportId, openInvoiceModal, showToast]);

  // 3. ACTION: MỞ HÓA ĐƠN CHO 1 PHIẾU CỤ THỂ TỪ SỔ LƯU / SỔ DOANH THU
  const handleOpenInvoiceForReport = useCallback(
    (rep: MedicalReport) => {
      setCurrentReportId(rep.id);
      setPatient({ ...rep.patient });
      setSelectedTests([...rep.selectedTests]);
      setConclusion(rep.conclusion || '');
      setDoctorName(rep.doctorName || '');
      closeReportManager();
      closeRevenueModal();
      openInvoiceModal();
    },
    [
      setCurrentReportId,
      setPatient,
      setSelectedTests,
      setConclusion,
      setDoctorName,
      closeReportManager,
      closeRevenueModal,
      openInvoiceModal
    ]
  );

  // 4. ACTION: HỦY HÓA ĐƠN & HOÀN TRẢ TRẠNG THÁI CHƯA THU
  const handleCancelInvoice = useCallback(
    (invoiceId: string) => {
      deleteInvoice(invoiceId);

      // Nếu phiếu đang mở là phiếu vừa hủy hóa đơn, giải phóng paidAt trên state
      const matchingInv = invoices.find((i) => i.id === invoiceId);
      if (matchingInv && (matchingInv.reportId === currentReportId || matchingInv.patientCode === patient.code)) {
        setPatient((prev) => ({
          ...prev,
          paidAt: undefined
        }));
      }

      showToast('Đã hủy hóa đơn và khôi phục trạng thái Chưa Thu Viện Phí cho bệnh nhân.', 'info');
    },
    [deleteInvoice, invoices, currentReportId, patient, setPatient, showToast]
  );

  return {
    handleSaveInvoice,
    handleOpenInvoiceModalWithCheck,
    handleOpenInvoiceForReport,
    handleCancelInvoice
  };
}
