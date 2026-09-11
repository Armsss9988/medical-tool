import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReportManager } from '../useReportManager';
import { Patient, SelectedTest, domainEventBus, INVOICE_EVENT_TYPES } from '@domain';
import { postReport } from '@infra/apiClient';

// Mock cloudDbService & apiClient to avoid network calls
vi.mock('@infra/cloudDbService', () => ({
  syncReportsToSupabase: vi.fn().mockResolvedValue(true),
  fetchReportsFromSupabase: vi.fn().mockResolvedValue([]),
  DEFAULT_CLOUD_DB_CONFIG: { enabled: false }
}));

vi.mock('@infra/apiClient', () => ({
  postReport: vi.fn().mockResolvedValue({ success: true, id: 'mock-id' }),
  deleteReportApi: vi.fn().mockResolvedValue({ success: true, id: 'mock-id' })
}));

describe('useReportManager - Batch Import & Identity Resolution', () => {
  const dummyTest: SelectedTest = {
    code: 'GLU',
    name: 'Glucose máu',
    category: 'Sinh Hóa',
    unit: 'mmol/L',
    refMin: 3.9,
    refMax: 6.4,
    refText: '3.9 - 6.4',
    result: '5.2',
    note: 'Bình thường'
  };

  const createPatient = (partial: Partial<Patient> & { name: string; dob: string; gender: 'Nam' | 'Nữ' }): Patient => ({
    code: partial.code || 'BN-000',
    secretToken: 'token-123',
    name: partial.name,
    dob: partial.dob,
    gender: partial.gender,
    phone: partial.phone || '0901234567',
    address: partial.address || 'Hà Nội',
    diagnosis: partial.diagnosis || 'Khám sức khỏe'
  });

  it('1. bulkSaveOrUpdateReports saves all patients without stale state dropping', () => {
    const { result } = renderHook(() => useReportManager());

    const batchRows = [
      {
        patient: createPatient({ code: 'BN-01', name: 'Nguyễn Văn A', dob: '1990', gender: 'Nam' }),
        selectedTests: [dummyTest],
        conclusion: 'Khỏe mạnh',
        doctorName: 'BS. Long',
        hasExplicitCode: true
      },
      {
        patient: createPatient({ code: 'BN-02', name: 'Trần Thị B', dob: '1992', gender: 'Nữ' }),
        selectedTests: [dummyTest],
        conclusion: 'Bình thường',
        doctorName: 'BS. Long',
        hasExplicitCode: true
      },
      {
        patient: createPatient({ code: 'BN-03', name: 'Lê Văn C', dob: '1985', gender: 'Nam' }),
        selectedTests: [dummyTest],
        conclusion: 'Theo dõi',
        doctorName: 'BS. Long',
        hasExplicitCode: true
      }
    ];

    act(() => {
      result.current.bulkSaveOrUpdateReports(batchRows);
    });

    expect(result.current.reports.length).toBe(3);
    const codes = result.current.reports.map((r) => r.code);
    expect(codes).toContain('BN-01');
    expect(codes).toContain('BN-02');
    expect(codes).toContain('BN-03');
  });

  it('2. Detects existing patient by Composite Identity (Name + DOB + Gender) when code is generated/empty', () => {
    const { result } = renderHook(() => useReportManager());

    // Bước 1: Lưu bệnh nhân ban đầu với mã chính thức
    act(() => {
      result.current.saveOrUpdateReport({
        patient: createPatient({ code: 'BN-VIP-999', name: 'Phan Hoàng Long', dob: '1988', gender: 'Nam' }),
        selectedTests: [dummyTest],
        conclusion: 'Tốt',
        doctorName: 'BS. Trung',
        hasExplicitCode: true
      });
    });

    expect(result.current.reports.length).toBe(1);
    expect(result.current.reports[0].code).toBe('BN-VIP-999');

    // Bước 2: Import batch mới, file Excel KHÔNG có mã BN (tự sinh mã BN-xxx ngẫu nhiên)
    // Nhưng trùng Tên "phan hoang long", Năm sinh 1988, Giới tính Nam
    const updatedTest: SelectedTest = { ...dummyTest, result: '7.8', note: 'Cao' };
    act(() => {
      result.current.bulkSaveOrUpdateReports([
        {
          patient: createPatient({ code: 'BN-AUTO-123456', name: '  PHAN HOÀNG LONG  ', dob: '1988', gender: 'Nam' }),
          selectedTests: [updatedTest],
          conclusion: 'Tiểu đường cần theo dõi',
          doctorName: 'BS. Trung',
          hasExplicitCode: false // Không có mã rõ ràng trong file
        }
      ]);
    });

    // Kết quả: Không được sinh thêm phiếu mới, vẫn chỉ có 1 phiếu duy nhất
    expect(result.current.reports.length).toBe(1);
    // Mã gốc BN-VIP-999 phải được bảo toàn
    expect(result.current.reports[0].code).toBe('BN-VIP-999');
    // Kết quả mới phải được cập nhật
    expect(result.current.reports[0].selectedTests[0].result).toBe('7.8');
    expect(result.current.reports[0].conclusion).toBe('Tiểu đường cần theo dõi');
  });

  it('3. Does NOT overwrite old report when saving a new visit for returning patient with generated BN- code', () => {
    const { result } = renderHook(() => useReportManager());

    // Lần khám 1: Nguyễn Văn A đến khám ngày hôm qua, hệ thống sinh mã BN-20260905-001
    act(() => {
      result.current.saveOrUpdateReport({
        patient: createPatient({ code: 'BN-20260905-001', name: 'Nguyễn Văn A', dob: '1990', gender: 'Nam' }),
        selectedTests: [{ ...dummyTest, result: '5.0', note: 'Bình thường' }],
        conclusion: 'Khám tổng quát lần 1',
        doctorName: 'BS. Long'
      });
    });

    expect(result.current.reports.length).toBe(1);
    expect(result.current.reports[0].code).toBe('BN-20260905-001');

    // Lần khám 2: Nguyễn Văn A quay lại tái khám tuần sau, hệ thống sinh mã mới BN-20260912-002
    act(() => {
      result.current.saveOrUpdateReport({
        patient: createPatient({ code: 'BN-20260912-002', name: 'Nguyễn Văn A', dob: '1990', gender: 'Nam' }),
        selectedTests: [{ ...dummyTest, result: '6.5', note: 'Hơi cao' }],
        conclusion: 'Tái khám lần 2',
        doctorName: 'BS. Long'
      });
    });

    // PHẢI LƯU CẢ 2 PHIẾU KHÁM, KHÔNG ĐƯỢC GHI ĐÈ LẦN 1!
    expect(result.current.reports.length).toBe(2);
    const codes = result.current.reports.map((r) => r.code);
    expect(codes).toContain('BN-20260905-001');
    expect(codes).toContain('BN-20260912-002');
  });

  it('4. Persists report payment status via postReport when INVOICE_PAID domain event is received', () => {
    const { result } = renderHook(() => useReportManager());

    act(() => {
      result.current.saveOrUpdateReport({
        id: 'rep-test-paid',
        patient: createPatient({ code: 'BN-100', name: 'Trần Văn B', dob: '1985', gender: 'Nam' }),
        selectedTests: [dummyTest],
        conclusion: 'Bình thường',
        doctorName: 'BS. Test'
      });
    });

    const mockPostReport = vi.mocked(postReport);
    mockPostReport.mockClear();

    // Phát domain event: INVOICE_PAID
    act(() => {
      domainEventBus.emit(INVOICE_EVENT_TYPES.PAID, {
        invoice: { id: 'inv-100', reportId: 'rep-test-paid' } as never,
        paymentMethod: 'Tiền mặt',
        paidAt: '2026-09-12T00:00:00Z',
        reportId: 'rep-test-paid'
      });
    });

    // Kiểm tra report state đã cập nhật
    expect(result.current.reports[0].patient.paidAt).toBe('2026-09-12T00:00:00Z');
    // Kiểm tra postReport đã được gọi để lưu xuống DB
    expect(mockPostReport).toHaveBeenCalledTimes(1);
    expect(mockPostReport).toHaveBeenCalledWith(expect.objectContaining({
      id: 'rep-test-paid'
    }));
  });
});

