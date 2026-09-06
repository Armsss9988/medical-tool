import { assertNever } from '../utils/assertNever';
import { Result } from '../utils/Result';

export type ReportDocumentStatus = 'DRAFT' | 'RESULTED' | 'EXPORTED' | 'OUTDATED' | 'DELIVERED';

export type ReportDocumentState =
  | {
      readonly status: 'DRAFT';
      readonly totalTests: number;
      readonly completedTests: number;
      readonly hasAnyResult: boolean;
    }
  | {
      readonly status: 'RESULTED';
      readonly totalTests: number;
      readonly completedTests: number;
      readonly resultedAt: string;
    }
  | {
      readonly status: 'EXPORTED';
      readonly cloudPdfUrl: string;
      readonly qrCodeDataUrl: string;
      readonly pdfVersion: number;
      readonly exportedAt: string;
    }
  | {
      readonly status: 'OUTDATED';
      readonly previousPdfUrl: string;
      readonly qrCodeDataUrl?: string;
      readonly pdfVersion: number;
      readonly lastExportedAt: string;
      readonly dirtyReasons: ReadonlyArray<string>;
    }
  | {
      readonly status: 'DELIVERED';
      readonly cloudPdfUrl: string;
      readonly qrCodeDataUrl?: string;
      readonly deliveredAt: string;
      readonly channel: 'Zalo' | 'Print' | 'Direct';
      readonly msgId?: string;
    };

export class ReportDocumentStateHelper {
  /**
   * Khớp mẫu đầy đủ (Exhaustive Pattern Matching) trên ADT ReportDocumentState.
   */
  public static match<T>(
    state: ReportDocumentState,
    patterns: {
      draft: (s: Extract<ReportDocumentState, { status: 'DRAFT' }>) => T;
      resulted: (s: Extract<ReportDocumentState, { status: 'RESULTED' }>) => T;
      exported: (s: Extract<ReportDocumentState, { status: 'EXPORTED' }>) => T;
      outdated: (s: Extract<ReportDocumentState, { status: 'OUTDATED' }>) => T;
      delivered: (s: Extract<ReportDocumentState, { status: 'DELIVERED' }>) => T;
    }
  ): T {
    switch (state.status) {
      case 'DRAFT':
        return patterns.draft(state);
      case 'RESULTED':
        return patterns.resulted(state);
      case 'EXPORTED':
        return patterns.exported(state);
      case 'OUTDATED':
        return patterns.outdated(state);
      case 'DELIVERED':
        return patterns.delivered(state);
      default:
        return assertNever(state);
    }
  }

  /**
   * Ánh xạ sang tên hiển thị tiếng Việt trên UI
   */
  public static getLabel(state: ReportDocumentState): string {
    switch (state.status) {
      case 'DRAFT':
        return 'Chờ xét nghiệm';
      case 'RESULTED':
        return 'Đã có kết quả';
      case 'EXPORTED':
        return 'Đã xuất Cloud';
      case 'OUTDATED':
        return 'Cần cập nhật PDF';
      case 'DELIVERED':
        return 'Đã trả kết quả';
      default:
        return assertNever(state);
    }
  }

  /**
   * Ánh xạ sang CSS badge styling trên UI
   */
  public static getBadgeClasses(state: ReportDocumentState): { bg: string; text: string; border: string } {
    switch (state.status) {
      case 'DRAFT':
        return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
      case 'RESULTED':
        return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
      case 'EXPORTED':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/20' };
      case 'OUTDATED':
        return { bg: 'bg-rose-500/10', text: 'text-rose-500', border: 'border-rose-500/20' };
      case 'DELIVERED':
        return { bg: 'bg-purple-500/10', text: 'text-purple-500', border: 'border-purple-500/20' };
      default:
        return assertNever(state);
    }
  }
}

// ─── GOF STATE PATTERN (DEFAULT FALLBACK & POLYMORPHIC TRANSITIONS) ────────────

/**
 * Lớp cơ sở DocumentStateNode:
 * Khai báo toàn bộ hành vi của vòng đời phiếu xét nghiệm dưới dạng Default Implementation.
 * Mặc định trả về Result.fail và cờ can* = false.
 * Lớp con cụ thể chỉ override hành vi mà nó cho phép.
 */
export abstract class DocumentStateNode {
  abstract readonly status: ReportDocumentStatus;
  abstract readonly label: string;

  // Cờ kiểm tra nhanh hỗ trợ giao diện UI (CanExecute)
  public get canExportPdf(): boolean {
    return false;
  }
  public get canSendZalo(): boolean {
    return false;
  }
  public get canModifyTests(): boolean {
    return false;
  }

  // =========================================================================
  // HÀNH VI MẶC ĐỊNH Ở LỚP CHA: Chặn với Result.fail
  // =========================================================================
  public exportPdf(_cloudPdfUrl: string, _qrCodeDataUrl?: string): Result<DocumentStateNode, string> {
    return Result.fail(`Trạng thái [${this.label}] chưa đủ điều kiện hoặc không cho phép xuất PDF.`);
  }

  public sendZalo(_channel?: 'Zalo' | 'Print' | 'Direct', _msgId?: string): Result<DocumentStateNode, string> {
    return Result.fail(`Trạng thái [${this.label}] chưa có tệp PDF hợp lệ trên Cloud để gửi.`);
  }

  public modifyTests(
    _hasAnyResult: boolean,
    _completedTests: number,
    _totalTests: number
  ): Result<DocumentStateNode, string> {
    return Result.fail(`Trạng thái [${this.label}] không cho phép chỉnh sửa chỉ số xét nghiệm.`);
  }

  /**
   * Chuyển đổi sang Snapshot Union phục vụ lưu DB hoặc gửi qua mạng.
   */
  public abstract toSnapshot(): ReportDocumentState;

  /**
   * Khôi phục lớp trạng thái cụ thể từ Snapshot Union.
   */
  public static fromSnapshot(snapshot: ReportDocumentState): DocumentStateNode {
    switch (snapshot.status) {
      case 'DRAFT':
        return new DraftStateNode(snapshot.totalTests, snapshot.completedTests, snapshot.hasAnyResult);
      case 'RESULTED':
        return new ResultedStateNode(snapshot.totalTests, snapshot.completedTests, snapshot.resultedAt);
      case 'EXPORTED':
        return new ExportedStateNode(
          snapshot.cloudPdfUrl,
          snapshot.qrCodeDataUrl,
          snapshot.pdfVersion,
          snapshot.exportedAt
        );
      case 'OUTDATED':
        return new OutdatedStateNode(
          snapshot.previousPdfUrl,
          snapshot.qrCodeDataUrl,
          snapshot.pdfVersion,
          snapshot.lastExportedAt,
          snapshot.dirtyReasons
        );
      case 'DELIVERED':
        return new DeliveredStateNode(
          snapshot.cloudPdfUrl,
          snapshot.deliveredAt,
          snapshot.channel,
          snapshot.qrCodeDataUrl,
          snapshot.msgId
        );
      default:
        return assertNever(snapshot);
    }
  }
}

/** Trạng thái 1: Đang chờ xét nghiệm */
export class DraftStateNode extends DocumentStateNode {
  readonly status = 'DRAFT';
  readonly label = 'Chờ xét nghiệm';

  constructor(
    readonly totalTests: number,
    readonly completedTests: number,
    readonly hasAnyResult: boolean
  ) {
    super();
  }

  override get canModifyTests(): boolean {
    return true;
  }

  override modifyTests(
    hasAnyResult: boolean,
    completedTests: number,
    totalTests: number
  ): Result<DocumentStateNode, string> {
    if (hasAnyResult) {
      return Result.ok(
        new ResultedStateNode(totalTests, completedTests, new Date().toISOString())
      );
    }
    return Result.ok(new DraftStateNode(totalTests, 0, false));
  }

  public override toSnapshot(): ReportDocumentState {
    return {
      status: 'DRAFT',
      totalTests: this.totalTests,
      completedTests: this.completedTests,
      hasAnyResult: this.hasAnyResult
    };
  }
}

/** Trạng thái 2: Đã có kết quả (Đủ điều kiện xuất PDF) */
export class ResultedStateNode extends DocumentStateNode {
  readonly status = 'RESULTED';
  readonly label = 'Đã có kết quả';

  constructor(
    readonly totalTests: number,
    readonly completedTests: number,
    readonly resultedAt: string
  ) {
    super();
  }

  override get canExportPdf(): boolean {
    return true;
  }

  override get canModifyTests(): boolean {
    return true;
  }

  override exportPdf(cloudPdfUrl: string, qrCodeDataUrl?: string): Result<DocumentStateNode, string> {
    if (!cloudPdfUrl) {
      return Result.fail('Cần cung cấp đường dẫn Cloud PDF hợp lệ để xuất bản.');
    }
    const now = new Date().toISOString();
    return Result.ok(
      new ExportedStateNode(cloudPdfUrl, qrCodeDataUrl || '', 1, now)
    );
  }

  override modifyTests(
    hasAnyResult: boolean,
    completedTests: number,
    totalTests: number
  ): Result<DocumentStateNode, string> {
    if (!hasAnyResult) {
      return Result.ok(new DraftStateNode(totalTests, 0, false));
    }
    return Result.ok(new ResultedStateNode(totalTests, completedTests, new Date().toISOString()));
  }

  public override toSnapshot(): ReportDocumentState {
    return {
      status: 'RESULTED',
      totalTests: this.totalTests,
      completedTests: this.completedTests,
      resultedAt: this.resultedAt
    };
  }
}

/** Trạng thái 3: Đã xuất bản lên Cloud */
export class ExportedStateNode extends DocumentStateNode {
  readonly status = 'EXPORTED';
  readonly label = 'Đã xuất Cloud';

  constructor(
    readonly cloudPdfUrl: string,
    readonly qrCodeDataUrl: string,
    readonly pdfVersion: number,
    readonly exportedAt: string
  ) {
    super();
  }

  override get canSendZalo(): boolean {
    return true;
  }

  override get canModifyTests(): boolean {
    return true;
  }

  override sendZalo(
    channel: 'Zalo' | 'Print' | 'Direct' = 'Zalo',
    msgId?: string
  ): Result<DocumentStateNode, string> {
    return Result.ok(
      new DeliveredStateNode(
        this.cloudPdfUrl,
        new Date().toISOString(),
        channel,
        this.qrCodeDataUrl,
        msgId
      )
    );
  }

  // Tự động phát hiện lệch tầng khi sửa kết quả đã xuất bản -> Chuyển sang OUTDATED
  override modifyTests(
    _hasAnyResult: boolean,
    _completedTests: number,
    _totalTests: number
  ): Result<DocumentStateNode, string> {
    return Result.ok(
      new OutdatedStateNode(
        this.cloudPdfUrl,
        this.qrCodeDataUrl,
        this.pdfVersion,
        new Date().toISOString(),
        ['Dữ liệu xét nghiệm đã thay đổi sau khi xuất PDF Cloud']
      )
    );
  }

  public override toSnapshot(): ReportDocumentState {
    return {
      status: 'EXPORTED',
      cloudPdfUrl: this.cloudPdfUrl,
      qrCodeDataUrl: this.qrCodeDataUrl,
      pdfVersion: this.pdfVersion,
      exportedAt: this.exportedAt
    };
  }
}

/** Trạng thái 4: Dữ liệu đã thay đổi, cần cập nhật PDF */
export class OutdatedStateNode extends DocumentStateNode {
  readonly status = 'OUTDATED';
  readonly label = 'Cần cập nhật PDF';

  constructor(
    readonly previousPdfUrl: string,
    readonly qrCodeDataUrl: string | undefined,
    readonly pdfVersion: number,
    readonly lastExportedAt: string,
    readonly dirtyReasons: ReadonlyArray<string>
  ) {
    super();
  }

  override get canExportPdf(): boolean {
    return true;
  }

  override get canModifyTests(): boolean {
    return true;
  }

  // Cho phép xuất lại PDF mới và nâng số phiên bản
  override exportPdf(cloudPdfUrl: string, qrCodeDataUrl?: string): Result<DocumentStateNode, string> {
    if (!cloudPdfUrl) {
      return Result.fail('Cần cung cấp đường dẫn Cloud PDF hợp lệ để cập nhật bản in.');
    }
    const now = new Date().toISOString();
    return Result.ok(
      new ExportedStateNode(
        cloudPdfUrl,
        qrCodeDataUrl || this.qrCodeDataUrl || '',
        this.pdfVersion + 1,
        now
      )
    );
  }

  override modifyTests(
    _hasAnyResult: boolean,
    _completedTests: number,
    _totalTests: number
  ): Result<DocumentStateNode, string> {
    return Result.ok(this);
  }

  public override toSnapshot(): ReportDocumentState {
    return {
      status: 'OUTDATED',
      previousPdfUrl: this.previousPdfUrl,
      qrCodeDataUrl: this.qrCodeDataUrl,
      pdfVersion: this.pdfVersion,
      lastExportedAt: this.lastExportedAt,
      dirtyReasons: this.dirtyReasons
    };
  }
}

/** Trạng thái 5: Đã trả kết quả cho bệnh nhân */
export class DeliveredStateNode extends DocumentStateNode {
  readonly status = 'DELIVERED';
  readonly label = 'Đã trả kết quả';

  constructor(
    readonly cloudPdfUrl: string,
    readonly deliveredAt: string,
    readonly channel: 'Zalo' | 'Print' | 'Direct',
    readonly qrCodeDataUrl?: string,
    readonly msgId?: string
  ) {
    super();
  }

  // Cho phép gửi lại kết quả qua Zalo nếu cần
  override get canSendZalo(): boolean {
    return true;
  }

  override get canModifyTests(): boolean {
    return true;
  }

  override sendZalo(
    channel: 'Zalo' | 'Print' | 'Direct' = 'Zalo',
    msgId?: string
  ): Result<DocumentStateNode, string> {
    return Result.ok(
      new DeliveredStateNode(
        this.cloudPdfUrl,
        new Date().toISOString(),
        channel,
        this.qrCodeDataUrl,
        msgId || this.msgId
      )
    );
  }

  // Sửa kết quả sau khi đã giao bệnh nhân -> Bắt buộc đánh dấu OUTDATED kèm cảnh báo
  override modifyTests(
    _hasAnyResult: boolean,
    _completedTests: number,
    _totalTests: number
  ): Result<DocumentStateNode, string> {
    return Result.ok(
      new OutdatedStateNode(
        this.cloudPdfUrl,
        this.qrCodeDataUrl,
        1,
        new Date().toISOString(),
        ['Dữ liệu xét nghiệm đã bị chỉnh sửa sau khi trả kết quả cho bệnh nhân']
      )
    );
  }

  public override toSnapshot(): ReportDocumentState {
    return {
      status: 'DELIVERED',
      cloudPdfUrl: this.cloudPdfUrl,
      qrCodeDataUrl: this.qrCodeDataUrl,
      deliveredAt: this.deliveredAt,
      channel: this.channel,
      msgId: this.msgId
    };
  }
}

