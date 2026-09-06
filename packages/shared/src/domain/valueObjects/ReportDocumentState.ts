import { assertNever } from '../utils/assertNever';

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
