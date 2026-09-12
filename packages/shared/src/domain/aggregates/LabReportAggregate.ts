import { MedicalReport, Patient, SelectedTest, ReportStatus } from '../types';
import { PatientProfile } from '../valueObjects/PatientProfile';
import { ReportKind, ReportKindResolver } from '../valueObjects/ReportKind';
import {
  ReportDocumentState,
  ReportDocumentStateHelper,
  DocumentStateNode,
  DraftStateNode,
  ResultedStateNode,
  ExportedStateNode,
  OutdatedStateNode,
  DeliveredStateNode
} from '../valueObjects/ReportDocumentState';
import { Result } from '../utils/Result';
import { ClinicalStatusVO } from '../valueObjects/ClinicalStatusVO';
import { DocumentStatusVO } from '../valueObjects/DocumentStatusVO';
import { BillingStatusVO } from '../valueObjects/BillingStatusVO';
import { hasAllergenTests } from '../allergenDetector';

export interface ReportStatusSummary {
  clinical: ClinicalStatusVO;
  document: DocumentStatusVO;
  billing: BillingStatusVO;
  legacyStatus: ReportStatus;
}

export interface CreateReportParams {
  id?: string;
  code: string;
  sampleCode?: string;
  patient: Patient | PatientProfile;
  doctorName: string;
  selectedTests: SelectedTest[];
  conclusion?: string;
  invoiceId?: string;
}

export class LabReportAggregate {
  private readonly _id: string;
  private readonly _code: string;
  private _sampleCode: string;
  private _patientProfile: PatientProfile;
  private _selectedTests: SelectedTest[];
  private _conclusion: string;
  private _doctorName: string;
  private _invoiceId?: string;
  private _isPaid: boolean;
  private _createdAt: string;
  private _updatedAt: string;

  // Lifecycle & Outdated tracking
  private _documentState: ReportDocumentState;
  private _pdfVersion: number;
  private _cloudPdfUrl?: string;
  private _qrCodeDataUrl?: string;
  private _zaloSentAt?: string;
  private _zaloMsgId?: string;

  // Snapshot for dirty tracking
  private _cleanFingerprint: string;

  private constructor(params: {
    id: string;
    code: string;
    sampleCode: string;
    patientProfile: PatientProfile;
    selectedTests: SelectedTest[];
    conclusion: string;
    doctorName: string;
    documentState: ReportDocumentState;
    invoiceId?: string;
    isPaid?: boolean;
    createdAt: string;
    updatedAt: string;
    pdfVersion?: number;
    cloudPdfUrl?: string;
    qrCodeDataUrl?: string;
    zaloSentAt?: string;
    zaloMsgId?: string;
  }) {
    this._id = params.id;
    this._code = params.code;
    this._sampleCode = params.sampleCode;
    this._patientProfile = params.patientProfile;
    this._selectedTests = [...params.selectedTests];
    this._conclusion = params.conclusion;
    this._doctorName = params.doctorName;
    this._documentState = params.documentState;
    this._invoiceId = params.invoiceId;
    this._isPaid = Boolean(params.isPaid);
    this._createdAt = params.createdAt;
    this._updatedAt = params.updatedAt;
    this._pdfVersion = params.pdfVersion || 1;
    this._cloudPdfUrl = params.cloudPdfUrl;
    this._qrCodeDataUrl = params.qrCodeDataUrl;
    this._zaloSentAt = params.zaloSentAt;
    this._zaloMsgId = params.zaloMsgId;

    this._cleanFingerprint = this.computeFingerprint();
  }

  /**
   * Khởi tạo phiếu xét nghiệm mới từ thông tin ban đầu.
   */
  public static create(params: CreateReportParams): LabReportAggregate {
    const now = new Date().toISOString();
    const id = params.id || crypto.randomUUID();
    const profile = params.patient instanceof PatientProfile
      ? params.patient
      : PatientProfile.from({
          ...params.patient,
          orderedAt: params.patient.orderedAt || now
        });

    const hasAnyResult = params.selectedTests.some((t) => String(t.result ?? '').trim() !== '');
    const completedCount = params.selectedTests.filter((t) => String(t.result ?? '').trim() !== '').length;

    const stateNode: DocumentStateNode = hasAnyResult
      ? new ResultedStateNode(params.selectedTests.length, completedCount, now)
      : new DraftStateNode(params.selectedTests.length, 0, false);
    const documentState: ReportDocumentState = stateNode.toSnapshot();

    return new LabReportAggregate({
      id,
      code: params.code,
      sampleCode: params.sampleCode || params.code,
      patientProfile: profile,
      selectedTests: params.selectedTests,
      conclusion: params.conclusion || '',
      doctorName: params.doctorName,
      documentState,
      invoiceId: params.invoiceId,
      isPaid: Boolean(profile.paidAt),
      createdAt: now,
      updatedAt: now,
      pdfVersion: 1
    });
  }

  /**
   * Khôi phục Aggregate từ snapshot lưu trữ (100% tương thích ngược).
   */
  public static fromSnapshot(report: MedicalReport): LabReportAggregate {
    const profile = PatientProfile.from(report.patient);
    const hasAnyResult = (report.selectedTests || []).some((t) => String(t.result ?? '').trim() !== '');
    const completedCount = (report.selectedTests || []).filter((t) => String(t.result ?? '').trim() !== '').length;

    let stateNode: DocumentStateNode;
    if (report.zaloSentAt || report.status === 'Đã trả kết quả') {
      stateNode = new DeliveredStateNode(
        report.cloudPdfUrl || '',
        report.zaloSentAt || report.updatedAt,
        'Zalo',
        report.qrCodeDataUrl,
        report.zaloMsgId
      );
    } else if (report.isPdfOutdated || report.status === 'Cần cập nhật PDF') {
      stateNode = new OutdatedStateNode(
        report.cloudPdfUrl || '',
        report.qrCodeDataUrl,
        report.pdfVersion || 1,
        report.pdfGeneratedAt || report.updatedAt,
        ['Dữ liệu đã được chỉnh sửa sau lần xuất PDF gần nhất']
      );
    } else if (report.cloudPdfUrl || report.status === 'Đã xuất Cloud') {
      stateNode = new ExportedStateNode(
        report.cloudPdfUrl || '',
        report.qrCodeDataUrl || '',
        report.pdfVersion || 1,
        report.pdfGeneratedAt || report.updatedAt
      );
    } else if (hasAnyResult || report.status === 'Đã có kết quả') {
      stateNode = new ResultedStateNode(
        report.selectedTests?.length || 0,
        completedCount,
        report.updatedAt
      );
    } else {
      stateNode = new DraftStateNode(
        report.selectedTests?.length || 0,
        0,
        false
      );
    }
    const documentState: ReportDocumentState = stateNode.toSnapshot();

    return new LabReportAggregate({
      id: report.id,
      code: report.code,
      sampleCode: report.sampleCode || report.patient?.sampleCode || report.code,
      patientProfile: profile,
      selectedTests: report.selectedTests || [],
      conclusion: report.conclusion || '',
      doctorName: report.doctorName || '',
      documentState,
      invoiceId: report.invoiceId,
      isPaid: Boolean(profile.paidAt),
      createdAt: report.createdAt || new Date().toISOString(),
      updatedAt: report.updatedAt || new Date().toISOString(),
      pdfVersion: report.pdfVersion || 1,
      cloudPdfUrl: report.cloudPdfUrl,
      qrCodeDataUrl: report.qrCodeDataUrl,
      zaloSentAt: report.zaloSentAt,
      zaloMsgId: report.zaloMsgId
    });
  }

  /**
   * Xuất ra cấu trúc snapshot tương thích chuẩn với MedicalReport.
   */
  public toSnapshot(): MedicalReport {
    const legacyStatus: ReportStatus = ReportDocumentStateHelper.getLabel(this._documentState) as ReportStatus;
    const isOutdated = this._documentState.status === 'OUTDATED';

    return {
      id: this._id,
      code: this._code,
      sampleCode: this._sampleCode,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
      patient: this._patientProfile.toSnapshot(),
      doctorName: this._doctorName,
      selectedTests: [...this._selectedTests],
      conclusion: this._conclusion,
      isAllergen: hasAllergenTests(this._selectedTests),
      cloudPdfUrl: this._cloudPdfUrl,
      qrCodeDataUrl: this._qrCodeDataUrl,
      invoiceId: this._invoiceId,
      status: legacyStatus,
      testCount: this._selectedTests.length,
      zaloSentAt: this._zaloSentAt,
      zaloMsgId: this._zaloMsgId,
      pdfGeneratedAt: this._documentState.status === 'EXPORTED'
        ? this._documentState.exportedAt
        : (this._documentState.status === 'OUTDATED' ? this._documentState.lastExportedAt : undefined),
      pdfVersion: this._pdfVersion,
      isPdfOutdated: isOutdated
    };
  }

  // ─── BEHAVIORS & INVARIANT ENFORCEMENT ────────────────────────────────────

  /**
   * Cập nhật danh sách chỉ số xét nghiệm và tự động chuyển sang OUTDATED nếu đã từng xuất PDF.
   */
  public updateTests(newTests: SelectedTest[]): void {
    const dirtyReasons: string[] = [];
    const testsChanged = JSON.stringify(newTests.map((t) => ({ c: t.code, r: t.result, n: t.note }))) !==
                         JSON.stringify(this._selectedTests.map((t) => ({ c: t.code, r: t.result, n: t.note })));

    if (testsChanged && this._cloudPdfUrl) {
      dirtyReasons.push('Kết quả hoặc danh sách chỉ số xét nghiệm đã thay đổi');
    }

    this._selectedTests = [...newTests];
    this._updatedAt = new Date().toISOString();

    const hasAnyResult = newTests.some((t) => String(t.result ?? '').trim() !== '');
    const completedCount = newTests.filter((t) => String(t.result ?? '').trim() !== '').length;

    if (dirtyReasons.length > 0) {
      const lastExported = this._documentState.status === 'EXPORTED'
        ? this._documentState.exportedAt
        : (this._documentState.status === 'OUTDATED' ? this._documentState.lastExportedAt : this._updatedAt);

      const node = new OutdatedStateNode(
        this._cloudPdfUrl || '',
        this._qrCodeDataUrl,
        this._pdfVersion,
        lastExported,
        dirtyReasons
      );
      this._documentState = node.toSnapshot();
    } else if (this._documentState.status === 'DRAFT' || this._documentState.status === 'RESULTED') {
      const node: DocumentStateNode = hasAnyResult
        ? new ResultedStateNode(newTests.length, completedCount, this._updatedAt)
        : new DraftStateNode(newTests.length, 0, false);
      this._documentState = node.toSnapshot();
    }
  }

  /**
   * Cập nhật thông tin hành chính bệnh nhân.
   */
  public updatePatient(updates: Partial<Patient>): void {
    const oldProfile = this._patientProfile;
    this._patientProfile = this._patientProfile.withUpdates(updates);
    this._updatedAt = new Date().toISOString();

    if (this._cloudPdfUrl && !this._patientProfile.equals(oldProfile)) {
      const node = new OutdatedStateNode(
        this._cloudPdfUrl,
        this._qrCodeDataUrl,
        this._pdfVersion,
        this._updatedAt,
        ['Thông tin hành chính bệnh nhân đã thay đổi']
      );
      this._documentState = node.toSnapshot();
    }
  }

  /**
   * Cập nhật kết luận lâm sàng.
   */
  public updateConclusion(conclusion: string): void {
    if (this._conclusion !== conclusion) {
      this._conclusion = conclusion;
      this._updatedAt = new Date().toISOString();

      if (this._cloudPdfUrl) {
        const node = new OutdatedStateNode(
          this._cloudPdfUrl,
          this._qrCodeDataUrl,
          this._pdfVersion,
          this._updatedAt,
          ['Kết luận bác sĩ đã thay đổi']
        );
        this._documentState = node.toSnapshot();
      }
    }
  }

  /**
   * Cập nhật bác sĩ chỉ định.
   */
  public updateDoctor(doctorName: string): void {
    if (this._doctorName !== doctorName) {
      this._doctorName = doctorName;
      this._updatedAt = new Date().toISOString();

      if (this._cloudPdfUrl) {
        const node = new OutdatedStateNode(
          this._cloudPdfUrl,
          this._qrCodeDataUrl,
          this._pdfVersion,
          this._updatedAt,
          ['Bác sĩ chỉ định đã thay đổi']
        );
        this._documentState = node.toSnapshot();
      }
    }
  }

  /**
   * Ghi nhận đã xuất PDF Cloud & sinh mã QR thành công.
   */
  public recordCloudExport(cloudPdfUrl: string, qrCodeDataUrl?: string, explicitVersion?: number): void {
    const now = new Date().toISOString();
    if (explicitVersion !== undefined && explicitVersion > 0) {
      this._pdfVersion = explicitVersion;
    } else {
      const isUpgrade = this._documentState.status === 'OUTDATED';
      this._pdfVersion = isUpgrade ? this._pdfVersion + 1 : this._pdfVersion;
    }
    this._cloudPdfUrl = cloudPdfUrl;
    this._qrCodeDataUrl = qrCodeDataUrl || this._qrCodeDataUrl;
    this._updatedAt = now;

    const node = new ExportedStateNode(
      cloudPdfUrl,
      this._qrCodeDataUrl || '',
      this._pdfVersion,
      now
    );
    this._documentState = node.toSnapshot();
  }

  /**
   * Ghi nhận đã gửi kết quả qua Zalo ZNS thành công.
   */
  public recordZaloSent(msgId?: string): void {
    const now = new Date().toISOString();
    this._zaloSentAt = now;
    this._zaloMsgId = msgId || this._zaloMsgId;
    this._patientProfile = this._patientProfile.withUpdates({ returnedAt: now });
    this._updatedAt = now;

    const node = new DeliveredStateNode(
      this._cloudPdfUrl || '',
      now,
      'Zalo',
      this._qrCodeDataUrl,
      msgId
    );
    this._documentState = node.toSnapshot();
  }

  /**
   * Thử nghiệm xuất bản PDF Cloud có bảo vệ theo State Machine (Guarded Transition)
   */
  public tryExportPdf(cloudPdfUrl: string, qrCodeDataUrl?: string): Result<LabReportAggregate, string> {
    const nextNodeResult = this.stateNode.exportPdf(cloudPdfUrl, qrCodeDataUrl);
    if (!nextNodeResult.ok) {
      return Result.fail(nextNodeResult.error);
    }
    const nextSnapshot = nextNodeResult.value.toSnapshot();
    this._cloudPdfUrl = cloudPdfUrl;
    this._qrCodeDataUrl = qrCodeDataUrl || this._qrCodeDataUrl;
    if (nextSnapshot.status === 'EXPORTED') {
      this._pdfVersion = nextSnapshot.pdfVersion;
    }
    this._documentState = nextSnapshot;
    this._updatedAt = new Date().toISOString();
    return Result.ok(this);
  }

  /**
   * Thử nghiệm gửi kết quả Zalo ZNS có bảo vệ theo State Machine (Guarded Transition)
   */
  public trySendZalo(channel: 'Zalo' | 'Print' | 'Direct' = 'Zalo', msgId?: string): Result<LabReportAggregate, string> {
    const nextNodeResult = this.stateNode.sendZalo(channel, msgId);
    if (!nextNodeResult.ok) {
      return Result.fail(nextNodeResult.error);
    }
    const nextSnapshot = nextNodeResult.value.toSnapshot();
    const now = new Date().toISOString();
    this._zaloSentAt = now;
    this._zaloMsgId = msgId || this._zaloMsgId;
    this._patientProfile = this._patientProfile.withUpdates({ returnedAt: now });
    this._documentState = nextSnapshot;
    this._updatedAt = now;
    return Result.ok(this);
  }

  /**
   * Gắn liên kết hóa đơn viện phí.
   */
  public linkInvoice(invoiceId: string, isPaid = false): void {
    this._invoiceId = invoiceId;
    this._isPaid = isPaid;
    if (isPaid && !this._patientProfile.paidAt) {
      this._patientProfile = this._patientProfile.withUpdates({ paidAt: new Date().toISOString() });
    }
    this._updatedAt = new Date().toISOString();
  }

  public unlinkInvoice(): void {
    this._invoiceId = undefined;
    this._isPaid = false;
    this._patientProfile = this._patientProfile.withUpdates({ paidAt: undefined });
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Đánh dấu đã thu phí từ hóa đơn
   */
  public markPaymentCollected(invoiceId: string, paidAt?: string): void {
    const now = paidAt || new Date().toISOString();
    this._invoiceId = invoiceId;
    this._isPaid = true;
    this._patientProfile = this._patientProfile.withUpdates({ paidAt: now });
    this._updatedAt = now;
  }

  /**
   * Hủy thu phí hoặc hủy liên kết hóa đơn
   */
  public markPaymentVoided(): void {
    this.unlinkInvoice();
  }

  /**
   * Cập nhật trạng thái phiếu thông qua State Machine class node (DocumentStateNode)
   */
  public updateLegacyStatus(status: ReportStatus): void {
    this.transitionTo(status);
  }

  /**
   * Chuyển đổi trạng thái theo State Machine (DocumentStateNode)
   */
  public transitionTo(status: ReportStatus): void {
    const now = new Date().toISOString();
    const totalTests = this._selectedTests.length;
    const completedTests = this._selectedTests.filter((t) => String(t.result ?? '').trim() !== '').length;

    const nextNode = DocumentStateNode.fromLegacyStatus(status, {
      totalTests,
      completedTests,
      cloudPdfUrl: this._cloudPdfUrl,
      qrCodeDataUrl: this._qrCodeDataUrl,
      pdfVersion: this._pdfVersion,
      timestamp: now
    });

    this._documentState = nextNode.toSnapshot();
    this._updatedAt = now;
  }

  /**
   * Chuyển trực tiếp sang StateNode cụ thể
   */
  public transitionToState(node: DocumentStateNode): void {
    this._documentState = node.toSnapshot();
    this._updatedAt = new Date().toISOString();
  }

  /**
   * Áp dụng nhiều thay đổi đồng thời lên Aggregate
   */
  public updateReport(updates: Partial<MedicalReport>): void {
    if (updates.patient) {
      this.updatePatient(updates.patient);
    }
    if (updates.selectedTests) {
      this.updateTests(updates.selectedTests);
    }
    if (updates.conclusion !== undefined) {
      this.updateConclusion(updates.conclusion);
    }
    if (updates.doctorName !== undefined) {
      this.updateDoctor(updates.doctorName);
    }
    if (updates.cloudPdfUrl && (updates.status === 'Đã xuất Cloud' || updates.cloudPdfUrl !== this._cloudPdfUrl)) {
      this.recordCloudExport(updates.cloudPdfUrl, updates.qrCodeDataUrl, updates.pdfVersion);
    }
    if (updates.zaloSentAt && updates.zaloSentAt !== this._zaloSentAt) {
      this.recordZaloSent(updates.zaloMsgId);
    }
    if (updates.status && updates.status !== 'Đã xuất Cloud') {
      this.updateLegacyStatus(updates.status);
    }
  }

  /**
   * Tính toán tóm tắt trạng thái 3 trụ cột (Lâm sàng, Tài liệu PDF, Viện phí)
   */
  public computeStatusSummary(isPaidOverride?: boolean): ReportStatusSummary {
    const isPaid = isPaidOverride !== undefined ? isPaidOverride : (this._isPaid || Boolean(this._patientProfile.paidAt));

    // 1. Clinical Status
    let clinical: ClinicalStatusVO;
    if (this._documentState.status === 'DELIVERED') {
      clinical = ClinicalStatusVO.DELIVERED;
    } else if (this._documentState.status === 'RESULTED' || this._documentState.status === 'EXPORTED' || this._documentState.status === 'OUTDATED') {
      clinical = ClinicalStatusVO.RESULTED;
    } else {
      clinical = ClinicalStatusVO.DRAFT;
    }

    // 2. Document Status
    let document: DocumentStatusVO;
    if (this._documentState.status === 'EXPORTED' || this._documentState.status === 'DELIVERED') {
      document = DocumentStatusVO.SYNCED;
    } else if (this._documentState.status === 'OUTDATED') {
      document = DocumentStatusVO.OUTDATED;
    } else {
      document = DocumentStatusVO.UNEXPORTED;
    }

    // 3. Billing Status
    const billing = isPaid ? BillingStatusVO.PAID : BillingStatusVO.UNPAID;
    const legacyStatus: ReportStatus = ReportDocumentStateHelper.getLabel(this._documentState) as ReportStatus;

    return {
      clinical,
      document,
      billing,
      legacyStatus
    };
  }

  /**
   * So sánh sâu toàn diện xem dữ liệu hiện tại có bị sửa đổi so với snapshot sạch không (triệt tiêu bug mất dữ liệu).
   */
  public isDirty(): boolean {
    return this.computeFingerprint() !== this._cleanFingerprint;
  }

  public markClean(): void {
    this._cleanFingerprint = this.computeFingerprint();
  }

  private computeFingerprint(): string {
    return JSON.stringify({
      p: this._patientProfile.toSnapshot(),
      t: this._selectedTests.map((t) => ({ c: t.code, r: t.result, n: t.note, eq: t.equipmentId })),
      c: this._conclusion,
      d: this._doctorName,
      sc: this._sampleCode
    });
  }

  // ─── GETTERS ─────────────────────────────────────────────────────────────
  public get id(): string { return this._id; }
  public get code(): string { return this._code; }
  public get sampleCode(): string { return this._sampleCode; }
  public get patient(): PatientProfile { return this._patientProfile; }
  public get selectedTests(): ReadonlyArray<SelectedTest> { return this._selectedTests; }
  public get conclusion(): string { return this._conclusion; }
  public get doctorName(): string { return this._doctorName; }
  public get documentState(): ReportDocumentState { return this._documentState; }
  public get stateNode(): DocumentStateNode { return DocumentStateNode.fromSnapshot(this._documentState); }
  public get canExportPdf(): boolean { return this.stateNode.canExportPdf; }
  public get canSendZalo(): boolean { return this.stateNode.canSendZalo; }
  public get canModifyTests(): boolean { return this.stateNode.canModifyTests; }
  public get kind(): ReportKind { return ReportKindResolver.resolve(this._selectedTests); }
  public get invoiceId(): string | undefined { return this._invoiceId; }
  public get isPaid(): boolean { return this._isPaid; }
  public get cloudPdfUrl(): string | undefined { return this._cloudPdfUrl; }
  public get qrCodeDataUrl(): string | undefined { return this._qrCodeDataUrl; }
  public get pdfVersion(): number { return this._pdfVersion; }
}
