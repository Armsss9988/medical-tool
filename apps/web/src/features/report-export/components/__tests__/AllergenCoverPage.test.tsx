import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import AllergenCoverPage from '../allergenReport/AllergenCoverPage';
import { Patient } from '@domain/types';

describe('AllergenCoverPage - 91 Allergen PDF Report Cover Page Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPatient: Patient = {
    code: 'BN-ALLERGEN-091',
    secretToken: 'tok-allergen-091',
    name: 'LÊ PHƯƠNG THẢO',
    dob: '2000',
    gender: 'Nữ',
    phone: '0977112233',
    address: 'Bắc Lý, TP. Đồng Hới, Quảng Bình',
    diagnosis: 'Sàng lọc dị ứng 91 dị nguyên PROTIA',
    doctor: 'BS. Trần Hoài Long',
    orderedAt: '13/09/2026 08:00',
    receivedAt: '13/09/2026 08:30',
    returnedAt: '13/09/2026 11:00',
    sampleStatus: 'Đạt'
  };

  it('renders AllergenCoverPage with branded header and total allergen indicator counts', () => {
    render(
      <AllergenCoverPage
        patient={mockPatient}
        currentDateStr="13/09/2026"
        doctorName="Nguyễn Thị Thành Trung"
        finalQrCode="data:image/png;base64,mockqr"
        currentLogo="data:image/jpeg;base64,mocklogo"
        currentStamp="data:image/jpeg;base64,mockstamp"
        totalCount={91}
        packagePrice={1850000}
        totalPages={4}
      />
    );

    // Header elements
    expect(screen.getByText('Vì sức khỏe người Việt')).toBeDefined();
    expect(screen.getAllByText('HỆ THỐNG XÉT NGHIỆM GOLAB').length).toBeGreaterThan(0);
    expect(screen.getByText('69 CHI NHÁNH TRÊN TOÀN QUỐC')).toBeDefined();
    expect(screen.getAllByText('TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH').length).toBeGreaterThan(0);
    expect(screen.getByText(/Chi nhánh\/điểm tiếp nhận:/i)).toBeDefined();
    expect(screen.getByText(/Trụ sở chính hệ thống:/i)).toBeDefined();
    expect(screen.getAllByText(/Website:/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Hotline:/i).length).toBeGreaterThan(0);
    expect(screen.getByText('QR Tra Cứu')).toBeDefined();
    expect(screen.getByText('kết quả xét nghiệm')).toBeDefined();

    // Cover Page content
    expect(screen.getByText('PHIẾU KẾT QUẢ XÉT NGHIỆM')).toBeDefined();
    expect(screen.getByText('LÊ PHƯƠNG THẢO')).toBeDefined();
    expect(screen.getByText('BN-ALLERGEN-091')).toBeDefined();
    expect(screen.getByText('1.850.000 đ')).toBeDefined();
    expect(screen.getByText('Panel 91 dị nguyên')).toBeDefined();
    expect(screen.getByText(/Nguyễn Thị Thành Trung/i)).toBeDefined();
  });
});
