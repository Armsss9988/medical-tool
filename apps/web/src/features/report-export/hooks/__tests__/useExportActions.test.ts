import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExportActions } from '../useExportActions';
import type { ClinicInfo, ReportTemplate } from '@domain';
import { PRINT_ELEMENT_ID } from '@domain/constants';
import type { useReportExport } from '../useReportExport';

// Mock workspace context
const mockPatient = {
  code: 'BN-20260914-001',
  secretToken: 'tok-001',
  name: 'NGUYỄN VĂN AN',
  dob: '1990',
  gender: 'Nam',
  phone: '0901234567',
  address: 'Huế',
  diagnosis: 'Khám sức khỏe'
};

const mockTests = [
  {
    code: 'GLU',
    name: 'Định lượng Glucose',
    result: '5.2',
    unit: 'mmol/L',
    refMin: 3.9,
    refMax: 6.4,
    category: 'Sinh hóa'
  }
];

vi.mock('../../../../contexts/WorkspaceContext', () => ({
  useWorkspace: () => ({
    patient: mockPatient,
    selectedTests: mockTests,
    conclusion: 'Bình thường',
    doctorName: 'BS. Lê Hoàng',
    setCurrentReportId: vi.fn(),
    reports: [],
    saveOrUpdateReport: vi.fn()
  })
}));

vi.mock('../../../../contexts/ModalContext', () => ({
  useModal: () => ({
    openZaloModal: vi.fn()
  })
}));

vi.mock('../../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn()
  })
}));

describe('useExportActions - Absolute Synchronization Tests', () => {
  const mockClinicInfo: ClinicInfo = {
    name: 'GOLAB',
    address: 'Huế',
    phone: '0905123456',
    defaultDoctor: 'BS. Lê Hoàng',
    logoUrl: ''
  };

  const mockExportHook = {
    cloudLink: '',
    qrCodeDataUrl: '',
    isExporting: false,
    currentStep: null,
    isDownloading: false,
    downloadProgress: null,
    lastError: null,
    lastTransactionResult: null,
    handleExportPdfAndUploadCloud: vi.fn().mockResolvedValue({ success: true, finalUrl: 'https://cloud.pdf' }),
    handleDownloadPdf: vi.fn().mockResolvedValue(undefined),
    handleRetryExport: vi.fn(),
    handleDownloadQrCode: vi.fn(),
    resetExport: vi.fn()
  };

  const mockSaveCurrentReport = vi.fn().mockReturnValue('rep_123');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. Targets PRINT_ELEMENT_ID.MEDICAL_REPORT for default clinical report download', async () => {
    const { result } = renderHook(() =>
      useExportActions(
        mockClinicInfo,
        mockExportHook as unknown as ReturnType<typeof useReportExport>,
        mockSaveCurrentReport
      )
    );

    await act(async () => {
      result.current.handleDownloadPdfDirect();
    });

    expect(mockExportHook.handleDownloadPdf).toHaveBeenCalledTimes(1);
    expect(mockExportHook.handleDownloadPdf).toHaveBeenCalledWith(
      PRINT_ELEMENT_ID.MEDICAL_REPORT,
      expect.stringContaining('BN-20260914-001')
    );
  });

  it('2. Targets PRINT_ELEMENT_ID.DYNAMIC_REPORT when activeTemplate is active', async () => {
    const mockTemplate: ReportTemplate = {
      id: 'custom_tmpl_1',
      name: 'Mẫu Tùy Biến 2026',
      category: 'clinical',
      isDefault: false,
      paperSize: 'A4',
      orientation: 'portrait',
      fontFamily: 'Times New Roman',
      primaryColor: '#0284c7',
      paddingMm: 15,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      blocks: []
    };

    const { result } = renderHook(() =>
      useExportActions(
        mockClinicInfo,
        mockExportHook as unknown as ReturnType<typeof useReportExport>,
        mockSaveCurrentReport,
        mockTemplate
      )
    );

    await act(async () => {
      result.current.handleDownloadPdfDirect();
    });

    expect(mockExportHook.handleDownloadPdf).toHaveBeenCalledTimes(1);
    expect(mockExportHook.handleDownloadPdf).toHaveBeenCalledWith(
      PRINT_ELEMENT_ID.DYNAMIC_REPORT,
      expect.stringContaining('BN-20260914-001')
    );
  });

  it('3. Respects customElementId if explicitly supplied to handleDownloadPdfDirect', async () => {
    const { result } = renderHook(() =>
      useExportActions(
        mockClinicInfo,
        mockExportHook as unknown as ReturnType<typeof useReportExport>,
        mockSaveCurrentReport
      )
    );

    await act(async () => {
      result.current.handleDownloadPdfDirect(PRINT_ELEMENT_ID.HYBRID_REPORT, 'Custom_Report.pdf');
    });

    expect(mockExportHook.handleDownloadPdf).toHaveBeenCalledWith(
      PRINT_ELEMENT_ID.HYBRID_REPORT,
      'Custom_Report.pdf'
    );
  });
});
