import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrintReportView from '../PrintReportView';
import { Patient, SelectedTest, ClinicInfo, DEFAULT_CLINIC_INFO } from '@domain/types';

describe('PrintReportView - Medical PDF Report Generation Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPatient: Patient = {
    code: 'BN-20260913-001',
    secretToken: 'tok-20260913-001',
    name: 'NGUYỄN VĂN AN',
    dob: '1990',
    gender: 'Nam',
    phone: '0988776655',
    address: '123 Đường Trần Phú, TP. Đồng Hới, Quảng Bình',
    diagnosis: 'Kiểm tra sức khỏe định kỳ',
    doctor: 'BS. Trần Hoài Long',
    orderedAt: '13/09/2026 08:30',
    receivedAt: '13/09/2026 08:45',
    returnedAt: '13/09/2026 10:15',
    sampleStatus: 'Đạt'
  };

  const sampleSinglePageTests: SelectedTest[] = [
    {
      code: 'GLU',
      name: 'Glucose máu (Đường huyết)',
      category: 'Sinh hóa máu',
      result: '5.2',
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      price: 50000,
      note: 'Bình thường'
    },
    {
      code: 'URE',
      name: 'Ure máu',
      category: 'Sinh hóa máu',
      result: '4.8',
      unit: 'mmol/L',
      refMin: 2.5,
      refMax: 7.5,
      refText: '2.5 - 7.5',
      price: 50000,
      note: 'Bình thường'
    },
    {
      code: 'CRE',
      name: 'Creatinine máu',
      category: 'Sinh hóa máu',
      result: '82.0',
      unit: 'umol/L',
      refMin: 62.0,
      refMax: 106.0,
      refText: '62 - 106',
      price: 60000,
      note: 'Bình thường'
    },
    {
      code: 'WBC',
      name: 'Số lượng bạch cầu (WBC)',
      category: 'Huyết học',
      result: '6.5',
      unit: 'G/L',
      refMin: 4.0,
      refMax: 10.0,
      refText: '4.0 - 10.0',
      price: 70000,
      note: 'Bình thường'
    },
    {
      code: 'RBC',
      name: 'Số lượng hồng cầu (RBC)',
      category: 'Huyết học',
      result: '4.8',
      unit: 'T/L',
      refMin: 4.0,
      refMax: 5.5,
      refText: '4.0 - 5.5',
      price: 70000,
      note: 'Bình thường'
    }
  ];

  it('1. CASE SINGLE-PAGE: Renders full branded header according to medical template image', () => {
    render(
      <PrintReportView
        patient={mockPatient}
        selectedTests={sampleSinglePageTests}
        conclusion="Các chỉ số sinh hóa và huyết học trong giới hạn bình thường."
        doctorName="Nguyễn Thị Thành Trung"
      />
    );

    // 1. Khối Logo & Slogan
    expect(screen.getByText('Vì sức khỏe người Việt')).toBeDefined();

    // 2. Khối Badge Hệ Thống
    expect(screen.getAllByText('HỆ THỐNG XÉT NGHIỆM GOLAB').length).toBeGreaterThan(0);
    expect(screen.getByText('69 CHI NHÁNH TRÊN TOÀN QUỐC')).toBeDefined();

    // 3. Tên phòng khám
    expect(screen.getAllByText('TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH').length).toBeGreaterThan(0);

    // 4. Chi nhánh & Trụ sở chính
    expect(screen.getByText(/Chi nhánh\/điểm tiếp nhận:/i)).toBeDefined();
    expect(screen.getByText(/Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị/i)).toBeDefined();
    expect(screen.getByText(/Trụ sở chính hệ thống:/i)).toBeDefined();
    expect(screen.getByText(/Số 36 BT5, Khu đô thị Pháp Vân, phường Hoàng Liệt, thành phố Hà Nội/i)).toBeDefined();

    // 5. Website & Hotline
    expect(screen.getAllByText(/Website:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('golab.com.vn').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hotline:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('032.855.3773').length).toBeGreaterThan(0);

    // 6. Khung QR Tra cứu
    expect(screen.getByText('QR Tra Cứu')).toBeDefined();
    expect(screen.getByText('kết quả xét nghiệm')).toBeDefined();

    // 7. Tiêu đề tài liệu và bảng 12 trường hành chính bệnh nhân
    expect(screen.getByText('PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM')).toBeDefined();
    expect(screen.getByText('NGUYỄN VĂN AN')).toBeDefined();
    expect(screen.getByText('BN-20260913-001')).toBeDefined();

    // 8. Chữ ký và kết luận trên trang đơn
    expect(screen.getByText(/Các chỉ số sinh hóa và huyết học trong giới hạn bình thường/i)).toBeDefined();
    expect(screen.getByText(/PHỤ TRÁCH CHUYÊN MÔN/i)).toBeDefined();
    expect(screen.getByText('Nguyễn Thị Thành Trung')).toBeDefined();
  });

  it('2. CASE CUSTOM CLINIC INFO: Supports dynamic clinic overrides with fallback', () => {
    const customClinic: ClinicInfo = {
      ...DEFAULT_CLINIC_INFO,
      name: 'TRUNG TÂM XÉT NGHIỆM Y KHOA GOLAB ĐÀ NẴNG',
      address: '456 Đường Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng',
      headquartersAddress: 'Tòa nhà Central Park, 20 Láng Hạ, Đống Đa, Hà Nội',
      phone: '0905.123.456',
      website: 'danang.golab.com.vn',
      defaultDoctor: 'BS. Lê Thị Mai'
    };

    render(
      <PrintReportView
        patient={mockPatient}
        selectedTests={sampleSinglePageTests}
        clinicInfo={customClinic}
      />
    );

    expect(screen.getAllByText('TRUNG TÂM XÉT NGHIỆM Y KHOA GOLAB ĐÀ NẴNG').length).toBeGreaterThan(0);
    expect(screen.getByText(/456 Đường Nguyễn Văn Linh, Quận Hải Châu, TP. Đà Nẵng/i)).toBeDefined();
    expect(screen.getByText(/Tòa nhà Central Park, 20 Láng Hạ, Đống Đa, Hà Nội/i)).toBeDefined();
    expect(screen.getByText('danang.golab.com.vn')).toBeDefined();
    expect(screen.getAllByText('0905.123.456').length).toBeGreaterThan(0);
  });

  it('3. CASE MULTI-PAGE: Generates page 1 with full header, and page 2 with mini-header', () => {
    // Tạo danh sách 25 chỉ số vượt quá sức chứa của 1 trang A4
    const largeTests: SelectedTest[] = Array.from({ length: 25 }, (_, i) => ({
      code: `T${i + 1}`,
      name: `Xét nghiệm chỉ số chuyên sâu số ${i + 1}`,
      category: i < 12 ? 'Sinh hóa máu mở rộng' : 'Miễn dịch & Dị ứng',
      result: `${(i * 1.5 + 2).toFixed(1)}`,
      unit: 'U/L',
      refMin: 5,
      refMax: 40,
      refText: '5 - 40',
      price: 80000,
      note: i % 4 === 0 ? 'Giá trị cảnh báo nhẹ' : 'Bình thường'
    }));

    const { container } = render(
      <PrintReportView
        patient={mockPatient}
        selectedTests={largeTests}
        conclusion="Bệnh nhân có chỉ số men gan tăng nhẹ, đề nghị tái khám sau 2 tuần."
      />
    );

    // Kiểm tra có ít nhất 2 trang A4 được render
    const pages = container.querySelectorAll('.report-page');
    expect(pages.length).toBeGreaterThanOrEqual(2);

    // Trang 1 có full header
    expect(screen.getByText('Vì sức khỏe người Việt')).toBeDefined();
    expect(screen.getAllByText('HỆ THỐNG XÉT NGHIỆM GOLAB').length).toBeGreaterThan(0);

    // Trang 2 có mini-header
    expect(screen.getByText('GOLAB CLINICAL LAB')).toBeDefined();
    expect(screen.getByText(/Trang 2\//i)).toBeDefined();
  });
});
