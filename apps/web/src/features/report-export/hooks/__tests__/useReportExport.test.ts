import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportExport } from '../useReportExport';
import * as pdfService from '@infra/pdfService';

vi.mock('@infra/pdfService', () => ({
  downloadPdfDirectly: vi.fn(),
  generateHighQualityPdf: vi.fn()
}));

vi.mock('@infra/qrService', () => ({
  downloadDataUrlAsImage: vi.fn()
}));

vi.mock('@infra/pdfExportTransaction', () => ({
  PdfExportTransaction: vi.fn()
}));

describe('useReportExport - Download Progress Tests', () => {
  const mockShowToast = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('tracks isDownloading and updates downloadProgress during PDF download', async () => {
    vi.mocked(pdfService.downloadPdfDirectly).mockImplementation(
      async (_elementId: string, _filename?: string, options?: pdfService.PdfExportOptions) => {
        options?.onProgress?.({
          step: 'rendering_pages',
          currentPage: 1,
          totalPages: 1,
          message: 'Đang kết xuất trang in...',
          percent: 50
        });
        return new Blob(['dummy pdf'], { type: 'application/pdf' });
      }
    );

    const { result } = renderHook(() => useReportExport(mockShowToast));

    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadProgress).toBeNull();

    let downloadPromise: Promise<void>;
    const customProgressCallback = vi.fn();

    await act(async () => {
      downloadPromise = result.current.handleDownloadPdf(
        'preview-print-element',
        'PhieuKetQua.pdf',
        customProgressCallback
      );
      await downloadPromise;
    });

    // Verifies downloadPdfDirectly was called with progress options
    expect(pdfService.downloadPdfDirectly).toHaveBeenCalledTimes(1);
    expect(customProgressCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'rendering_pages',
        percent: 50
      })
    );

    // After completion, isDownloading and downloadProgress reset to idle
    expect(result.current.isDownloading).toBe(false);
    expect(result.current.downloadProgress).toBeNull();
    expect(mockShowToast).toHaveBeenCalledWith(
      expect.stringContaining('Đã tải file PDF'),
      'success'
    );
  });
});
