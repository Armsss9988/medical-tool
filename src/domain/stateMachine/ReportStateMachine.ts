import { MedicalReport, Patient, SelectedTest, ReportStatus } from '../types';
import { ClinicalStatusVO } from '../valueObjects/ClinicalStatusVO';
import { DocumentStatusVO } from '../valueObjects/DocumentStatusVO';
import { BillingStatusVO } from '../valueObjects/BillingStatusVO';

export interface ReportStatusSummary {
  clinical: ClinicalStatusVO;
  document: DocumentStatusVO;
  billing: BillingStatusVO;
  legacyStatus: ReportStatus;
}

export class ReportStateMachine {
  /**
   * Khởi tạo phiếu xét nghiệm mới với các trạng thái ban đầu
   */
  public static createInitialReport(params: {
    id?: string;
    code: string;
    sampleCode: string;
    patient: Patient;
    doctorName: string;
    selectedTests: SelectedTest[];
    conclusion?: string;
    isAllergen?: boolean;
    invoiceId?: string;
  }): MedicalReport {
    const now = new Date().toISOString();
    const hasAnyResult = params.selectedTests.some((t) => t.result && t.result.trim() !== '');

    const patient: Patient = {
      ...params.patient,
      orderedAt: params.patient.orderedAt || now,
      receivedAt: hasAnyResult ? (params.patient.receivedAt || now) : params.patient.receivedAt,
      sampleStatus: params.patient.sampleStatus || 'Đạt'
    };

    const initialStatus: ReportStatus = hasAnyResult ? 'Đã có kết quả' : 'Chờ xét nghiệm';

    return {
      id: params.id || crypto.randomUUID(),
      code: params.code,
      sampleCode: params.sampleCode,
      createdAt: now,
      updatedAt: now,
      patient,
      doctorName: params.doctorName,
      selectedTests: [...params.selectedTests],
      conclusion: params.conclusion || '',
      isAllergen: params.isAllergen || false,
      status: initialStatus,
      testCount: params.selectedTests.length,
      invoiceId: params.invoiceId,
      pdfVersion: 1,
      isPdfOutdated: false
    };
  }

  /**
   * Xử lý khi cập nhật chỉ số hoặc thông tin phiếu
   */
  public static onUpdateReport(
    current: MedicalReport,
    updates: Partial<MedicalReport>
  ): MedicalReport {
    const now = new Date().toISOString();
    const newTests = updates.selectedTests || current.selectedTests;
    const hasAnyResult = newTests.some((t) => t.result && t.result.trim() !== '');

    // Kiểm tra xem dữ liệu có bị thay đổi sau khi đã xuất PDF không (Outdated check)
    let isPdfOutdated = current.isPdfOutdated || false;
    if (current.cloudPdfUrl) {
      const testsChanged = JSON.stringify(newTests.map((t) => ({ c: t.code, r: t.result, n: t.note }))) !==
                           JSON.stringify(current.selectedTests.map((t) => ({ c: t.code, r: t.result, n: t.note })));
      const patientChanged = updates.patient && (
        updates.patient.name !== current.patient.name ||
        updates.patient.dob !== current.patient.dob ||
        updates.patient.gender !== current.patient.gender
      );
      const conclusionChanged = updates.conclusion !== undefined && updates.conclusion !== current.conclusion;

      if (testsChanged || patientChanged || conclusionChanged) {
        isPdfOutdated = true;
      }
    }

    // Xác định trạng thái tiến trình y khoa
    let newStatus: ReportStatus = current.status;
    if (current.zaloSentAt || updates.zaloSentAt) {
      newStatus = 'Đã trả kết quả';
    } else if (current.cloudPdfUrl && !isPdfOutdated) {
      newStatus = 'Đã xuất Cloud';
    } else if (isPdfOutdated) {
      newStatus = 'Cần cập nhật PDF';
    } else if (hasAnyResult) {
      newStatus = 'Đã có kết quả';
    } else {
      newStatus = 'Chờ xét nghiệm';
    }

    const patient: Patient = {
      ...current.patient,
      ...(updates.patient || {}),
      receivedAt: hasAnyResult ? (current.patient.receivedAt || now) : current.patient.receivedAt
    };

    return {
      ...current,
      ...updates,
      patient,
      selectedTests: newTests,
      testCount: newTests.length,
      status: newStatus,
      isPdfOutdated,
      updatedAt: now
    };
  }

  /**
   * Xử lý khi Xuất PDF Cloud & Mã QR thành công
   */
  public static onExportCloud(
    current: MedicalReport,
    cloudPdfUrl: string,
    qrCodeDataUrl?: string
  ): MedicalReport {
    const now = new Date().toISOString();
    const newVersion = (current.pdfVersion || 1) + (current.isPdfOutdated ? 1 : 0);

    return {
      ...current,
      cloudPdfUrl,
      qrCodeDataUrl: qrCodeDataUrl || current.qrCodeDataUrl,
      pdfGeneratedAt: now,
      pdfVersion: newVersion,
      isPdfOutdated: false,
      status: current.zaloSentAt ? 'Đã trả kết quả' : 'Đã xuất Cloud',
      updatedAt: now
    };
  }

  /**
   * Xử lý khi Gửi Zalo ZNS thành công cho bệnh nhân
   */
  public static onSendZalo(
    current: MedicalReport,
    msgId?: string
  ): MedicalReport {
    const now = new Date().toISOString();

    const patient: Patient = {
      ...current.patient,
      returnedAt: now
    };

    return {
      ...current,
      patient,
      zaloSentAt: now,
      zaloMsgId: msgId || current.zaloMsgId,
      status: 'Đã trả kết quả',
      updatedAt: now
    };
  }

  /**
   * Xử lý khi Gắn Hóa Đơn (Trạng thái Chưa Thu)
   */
  public static onInvoiceAttached(
    current: MedicalReport,
    invoiceId: string
  ): MedicalReport {
    return {
      ...current,
      invoiceId,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Xử lý khi Thu Tiền Viện Phí & Gắn Hóa Đơn
   */
  public static onPaymentCollected(
    current: MedicalReport,
    invoiceId: string,
    paidAt?: string
  ): MedicalReport {
    const now = paidAt || new Date().toISOString();

    const patient: Patient = {
      ...current.patient,
      paidAt: now
    };

    return {
      ...current,
      patient,
      invoiceId,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Xử lý khi Hủy Hóa Đơn / Hoàn Tiền (Void & Refund)
   */
  public static onPaymentVoided(current: MedicalReport): MedicalReport {
    const patient: Patient = {
      ...current.patient,
      paidAt: undefined
    };

    return {
      ...current,
      patient,
      invoiceId: undefined,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Tính toán tổng hợp 3 chiều trạng thái độc lập từ Report
   */
  public static computeSummary(report: MedicalReport, isPaidOverride?: boolean): ReportStatusSummary {
    // 1. Clinical Status
    let clinical: ClinicalStatusVO;
    if (report.zaloSentAt || report.status === 'Đã trả kết quả') {
      clinical = ClinicalStatusVO.DELIVERED;
    } else if (report.selectedTests.some((t) => t.result && t.result.trim() !== '') || report.status === 'Đã có kết quả' || report.status === 'Đã xuất Cloud' || report.status === 'Cần cập nhật PDF') {
      clinical = ClinicalStatusVO.RESULTED;
    } else {
      clinical = ClinicalStatusVO.DRAFT;
    }

    // 2. Document Status
    let document: DocumentStatusVO;
    if (!report.cloudPdfUrl) {
      document = DocumentStatusVO.UNEXPORTED;
    } else if (report.isPdfOutdated || report.status === 'Cần cập nhật PDF') {
      document = DocumentStatusVO.OUTDATED;
    } else {
      document = DocumentStatusVO.SYNCED;
    }

    // 3. Billing Status
    let billing: BillingStatusVO;
    const isPaid = isPaidOverride !== undefined ? isPaidOverride : Boolean(report.patient?.paidAt);
    if (isPaid) {
      billing = BillingStatusVO.PAID;
    } else {
      billing = BillingStatusVO.UNPAID;
    }

    return {
      clinical,
      document,
      billing,
      legacyStatus: report.status
    };
  }
}
