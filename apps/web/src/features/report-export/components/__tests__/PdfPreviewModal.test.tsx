import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import PdfPreviewModal from '../PdfPreviewModal';
import { Patient, SelectedTest, ClinicInfo } from '@domain/types';
import type { PdfProgressInfo } from '../../types';

describe('PdfPreviewModal - PDF Download & Export Progress Display', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const mockClinicInfo: ClinicInfo = {
    name: 'PHÒNG XÉT NGHIỆM Y KHOA GOLAB',
    address: '123 Nguyễn Huệ, TP. Huế',
    phone: '0905.123.456',
    defaultDoctor: 'BS. Lê Hoàng',
    logoUrl: ''
  };

  const mockPatient: Patient = {
    code: 'BN-20260914-001',
    secretToken: 'tok-001',
    name: 'NGUYỄN VĂN AN',
    dob: '1990',
    gender: 'Nam',
    phone: '0901234567',
    address: 'TP. Huế',
    diagnosis: 'Kiểm tra sức khỏe tổng quát',
    doctor: 'BS. Lê Hoàng',
    sampleCode: 'SP-001',
    sampleStatus: 'Đạt',
    orderedAt: '14/09/2026 08:00',
    receivedAt: '14/09/2026 08:15',
    returnedAt: '14/09/2026 09:30'
  };

  const mockTests: SelectedTest[] = [
    {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh hóa',
      result: '5.2',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      price: 40000,
      note: ''
    }
  ];

  it('renders preview modal with action buttons in idle state', () => {
    render(
      <PdfPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        clinicInfo={mockClinicInfo}
        patient={mockPatient}
        selectedTests={mockTests}
        showToast={vi.fn()}
        onExportPdfAndUpload={vi.fn()}
        onDownloadPdf={vi.fn()}
        onPrintDirect={vi.fn()}
        onDownloadQrCode={vi.fn()}
      />
    );

    // Verify presence of primary download button
    const downloadBtn = screen.getByRole('button', { name: /Tải File PDF/i });
    expect(downloadBtn).toBeDefined();
    expect(downloadBtn.hasAttribute('disabled')).toBe(false);

    // Should not display download progress banner initially
    expect(screen.queryByText(/Tiến trình tải PDF:/i)).toBeNull();
    expect(screen.queryByText(/Đang Tạo & Tải File PDF/i)).toBeNull();
  });

  it('displays real-time progress indicators and disables buttons when downloading PDF', async () => {
    let progressCallbackHolder: ((progress: PdfProgressInfo) => void) | undefined;
    let resolveDownload: () => void;

    // Simulate async onDownloadPdf that delivers multi-step progress
    const mockDownload = vi.fn((_elementId: string, _filename: string, onProgress?: (p: PdfProgressInfo) => void) => {
      progressCallbackHolder = onProgress;
      return new Promise<void>((resolve) => {
        resolveDownload = resolve;
      });
    });

    render(
      <PdfPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        clinicInfo={mockClinicInfo}
        patient={mockPatient}
        selectedTests={mockTests}
        showToast={vi.fn()}
        onExportPdfAndUpload={vi.fn()}
        onDownloadPdf={mockDownload}
        onPrintDirect={vi.fn()}
        onDownloadQrCode={vi.fn()}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Tải File PDF/i });
    fireEvent.click(downloadBtn);

    // 1. Verifies download handler was called
    expect(mockDownload).toHaveBeenCalledTimes(1);

    // 2. Verifies button immediately enters loading state
    expect(screen.getByText(/Đang Tải PDF/i)).toBeDefined();

    // 3. Verifies top progress banner and center preview overlay are displayed
    expect(screen.getByText(/Tiến trình tải PDF:/i)).toBeDefined();
    expect(screen.getByText(/Đang Tạo & Tải File PDF/i)).toBeDefined();

    // 4. Update progress via callback
    if (progressCallbackHolder) {
      progressCallbackHolder({
        step: 'rendering_pages',
        currentPage: 1,
        totalPages: 2,
        message: 'Đang kết xuất đồ họa trang 1/2 (Lossless Canvas 2.0x)...',
        percent: 65
      });
    }

    await waitFor(() => {
      expect(screen.getAllByText(/65%/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Đang kết xuất đồ họa trang 1\/2/i).length).toBeGreaterThan(0);
    });

    // 5. Verifies other buttons are disabled during download
    await waitFor(() => {
      const printBtn = screen.getByRole('button', { name: /In Phiếu A4/i });
      expect(printBtn.hasAttribute('disabled')).toBe(true);
      const cloudBtn = screen.getByRole('button', { name: /Lưu PDF & Cloud/i });
      expect(cloudBtn.hasAttribute('disabled')).toBe(true);
    });

    // Clean up
    resolveDownload!();
  });

  it('renders progress correctly when controlled via isDownloading and downloadProgress props', () => {
    render(
      <PdfPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        clinicInfo={mockClinicInfo}
        patient={mockPatient}
        selectedTests={mockTests}
        isDownloading={true}
        downloadProgress={{
          step: 'generating_pdf',
          message: 'Đang tối ưu & đóng gói tệp PDF chất lượng cao...',
          percent: 90
        }}
        showToast={vi.fn()}
        onExportPdfAndUpload={vi.fn()}
        onDownloadPdf={vi.fn()}
        onPrintDirect={vi.fn()}
        onDownloadQrCode={vi.fn()}
      />
    );

    // Verifies progress percentage is displayed
    expect(screen.getAllByText(/90%/i).length).toBeGreaterThan(0);

    // Verifies step message is rendered in banner and overlay
    expect(screen.getAllByText(/Đang tối ưu & đóng gói tệp PDF chất lượng cao/i).length).toBeGreaterThan(0);

    // Verifies buttons are disabled
    const downloadBtn = screen.getByRole('button', { name: /Đang Tải PDF \(90%\)/i });
    expect(downloadBtn.hasAttribute('disabled')).toBe(true);
  });

  it('synchronizes target element with PrintLayer (printable-medical-report) when available in document to ensure 100% identical unscaled PDF output', async () => {
    // Setup PrintLayer element in the DOM (identical to App.tsx runtime environment)
    const printLayerDiv = document.createElement('div');
    printLayerDiv.id = 'printable-medical-report';
    printLayerDiv.className = 'print-layer-container';
    document.body.appendChild(printLayerDiv);

    const mockDownload = vi.fn().mockResolvedValue(undefined);

    render(
      <PdfPreviewModal
        isOpen={true}
        onClose={vi.fn()}
        clinicInfo={mockClinicInfo}
        patient={mockPatient}
        selectedTests={mockTests}
        showToast={vi.fn()}
        onExportPdfAndUpload={vi.fn()}
        onDownloadPdf={mockDownload}
        onPrintDirect={vi.fn()}
        onDownloadQrCode={vi.fn()}
      />
    );

    const downloadBtn = screen.getByRole('button', { name: /Tải File PDF/i });
    fireEvent.click(downloadBtn);

    expect(mockDownload).toHaveBeenCalledTimes(1);
    // Verifies that PrintLayer's unscaled element is targeted instead of the zoom-scaled preview element
    expect(mockDownload).toHaveBeenCalledWith(
      'printable-medical-report',
      expect.stringContaining('NGUYỄN_VĂN_AN'),
      expect.any(Function)
    );

    document.body.removeChild(printLayerDiv);
  });
});
