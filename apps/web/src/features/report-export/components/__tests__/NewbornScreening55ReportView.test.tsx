import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import NewbornScreening55ReportView from '../NewbornScreening55ReportView';

describe('NewbornScreening55ReportView', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPatient = {
    code: 'BN-20261008-004',
    name: 'TRẦN GIA HƯNG',
    dob: '2026-10-05',
    gender: 'Nam',
    phone: '0988776655',
    address: 'Thành phố Đồng Hới, Quảng Bình',
    sampleStatus: 'Đạt',
    samplingDate: '2026-10-08',
    receiveDate: '2026-10-08',
    resultDate: '2026-10-09',
    weight: '3200',
    sampleSender: 'BV Hữu Nghị Việt Nam - Cu Ba'
  };

  const mockClinicInfo = {
    name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'Đồng Hới, Quảng Bình',
    hotline: '032.855.3773',
    website: 'golab.com.vn'
  };

  const mockTests = [
    { code: 'SS_C0', name: 'Free Carnitine (C0)', value: '25.0', unit: 'µmol/L', refText: '9,0 – 55,0', refMin: 9.0, refMax: 55.0 },
    { code: 'SS_C2', name: 'Acetylcarnitine (C2)', value: '16.8', unit: 'µmol/L', refText: '> 8,0', refMin: 8.0, refMax: null },
    { code: 'SS_C3', name: 'Propionylcarnitine (C3)', value: '4.20', unit: 'µmol/L', refText: '< 4,20', refMin: 0, refMax: 4.2 },
    { code: 'SS55_01', name: 'Bệnh thiếu Phenylalanine hydroxylase (PKU)', value: 'Nguy cơ thấp', unit: '', refText: 'Phe > 120 AND Phe/Tyr > 2.0' },
    { code: 'SS55_28', name: 'Bệnh Methylmalonic acidemia (Cbl A, B)', value: 'Nguy cơ thấp', unit: '', refText: 'C3 > 4.20 AND C3/C2 > 0.25' }
  ];

  it('renders đúng tiêu đề chính và thông tin hành chính của bệnh nhân', () => {
    render(
      <NewbornScreening55ReportView
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        selectedTests={mockTests}
      />
    );

    // Tiêu đề
    expect(screen.getByText('PHIẾU KẾT QUẢ SÀNG LỌC 55 BỆNH CHUYỂN HÓA BẨM SINH')).toBeDefined();
    // Tên bệnh nhân (xuất hiện ở cả header trang 1, 2, 3)
    expect(screen.getAllByText('TRẦN GIA HƯNG').length).toBeGreaterThan(0);
    // Mã bệnh phẩm
    expect(screen.getAllByText('BN-20261008-004').length).toBeGreaterThan(0);
    // Tuổi tại ngày lấy mẫu = 3 ngày
    expect(screen.getByText('3 ngày')).toBeDefined();
  });

  it('renders bảng định lượng MS/MS và bảng 55 bệnh phân tách 01-28 và 29-55', () => {
    render(
      <NewbornScreening55ReportView
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        selectedTests={mockTests}
      />
    );

    expect(screen.getByText('PROFILE ĐỊNH LƯỢNG MS/MS')).toBeDefined();
    expect(screen.getByText(/DANH SÁCH BỆNH 01 - 28/i)).toBeDefined();
    expect(screen.getByText(/DANH SÁCH BỆNH 29 - 55/i)).toBeDefined();
  });

  it('renders 8 mục lưu ý cố định và kết luận tự sinh không chứa ký hiệu so sánh kép', () => {
    const { container } = render(
      <NewbornScreening55ReportView
        patient={mockPatient}
        clinicInfo={mockClinicInfo}
        selectedTests={mockTests}
      />
    );

    // Lưu ý và kết luận
    expect(screen.getByText(/LƯU Ý/i)).toBeDefined();
    expect(screen.getByText(/KẾT LUẬN/i)).toBeDefined();
    expect(screen.getByText(/Các chỉ số được báo cáo nằm trong giới hạn sàng lọc/i)).toBeDefined();

    // Tuyệt đối không hiển thị ≤, ≥, <=, >=, =<, =>
    const textContent = container.textContent || '';
    expect(textContent).not.toMatch(/[≤≥]|<=|>=|=<|=>/);
  });
});
