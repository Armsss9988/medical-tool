import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { DynamicReportView } from '../DynamicReportView';
import { PRESET_TEMPLATES } from '@domain/templateTypes';
import { Patient } from '@domain/types';

describe('DynamicReportView - Template Builder PDF Header Tests', () => {
  afterEach(() => {
    cleanup();
  });

  const mockPatient: Patient = {
    code: 'BN-DYNAMIC-003',
    secretToken: 'tok-dynamic-003',
    name: 'VÕ VĂN KIỆT',
    dob: '1988',
    gender: 'Nam',
    phone: '0933445566',
    address: 'Đồng Hới, Quảng Bình',
    diagnosis: 'Mẫu động từ Template Builder',
    doctor: 'BS. Trần Hoài Long',
    orderedAt: '13/09/2026 08:30',
    receivedAt: '13/09/2026 08:45',
    returnedAt: '13/09/2026 10:30',
    sampleStatus: 'Đạt'
  };

  it('renders DynamicReportView with branded header block matching GoLab standards', () => {
    const template = PRESET_TEMPLATES[0];

    render(
      <DynamicReportView
        template={template}
        patient={mockPatient}
        selectedTests={[]}
      />
    );

    // Branded header elements in dynamic template
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
  });
});