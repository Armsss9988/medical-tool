import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import PrintReportView from '../../features/report-export/components/PrintReportView';
import type { Patient, SelectedTest } from '@domain';

describe('PDF Header Wave, Margin & Color Test', () => {
  const mockPatient: Patient = {
    code: 'BN-20260914-001',
    secretToken: 'SEC123',
    name: 'NGUYỄN VĂN AN',
    dob: '1990',
    gender: 'Nam',
    phone: '0987654321',
    address: 'Đồng Hới, Quảng Bình',
    diagnosis: 'Kiểm tra sức khỏe tổng quát',
    sampleCode: 'BP-001',
    sampleStatus: 'Đạt',
    orderedAt: '14/09/2026 08:00',
    receivedAt: '14/09/2026 08:30',
    returnedAt: '14/09/2026 10:00'
  };

  const mockTests: SelectedTest[] = [
    {
      code: 'GLU',
      name: 'Glucose máu',
      category: 'Sinh Hóa',
      price: 40000,
      unit: 'mmol/L',
      refMin: 3.9,
      refMax: 6.4,
      refText: '3.9 - 6.4',
      note: '',
      result: '5.2',
      evaluationType: 'range'
    }
  ];

  it('renders report-page with exact 10mm 14mm margins and 210mm width', () => {
    const { container } = render(
      <PrintReportView
        patient={mockPatient}
        selectedTests={mockTests}
        conclusion="Các chỉ số trong giới hạn bình thường."
      />
    );

    const page = container.querySelector('.report-page') as HTMLElement;
    expect(page).toBeTruthy();
    expect(page.style.width).toBe('210mm');
    expect(page.style.minHeight).toBe('297mm');
    expect(page.style.padding).toMatch(/10mm 14mm/);
    expect(page.style.paddingTop).toBe('10mm');
    expect(page.style.paddingRight).toBe('14mm');
    expect(page.style.paddingBottom).toBe('10mm');
    expect(page.style.paddingLeft).toBe('14mm');
  });

  it('renders lowered wave paths (Y >= 100) and faded opacities (<= 0.45) in header', () => {
    const { container } = render(
      <PrintReportView
        patient={mockPatient}
        selectedTests={mockTests}
        conclusion="Các chỉ số trong giới hạn bình thường."
      />
    );

    const header = container.querySelector('.header-section');
    expect(header).toBeTruthy();

    const waveContainer = header?.querySelector('.pointer-events-none');
    expect(waveContainer).toBeTruthy();

    const waveSvg = waveContainer?.querySelector('svg');
    expect(waveSvg).toBeTruthy();

    const paths = waveSvg?.querySelectorAll('path');
    expect(paths?.length).toBe(2);

    const path1 = paths?.[0] as SVGPathElement;
    const path2 = paths?.[1] as SVGPathElement;

    // Sóng 1: hạ xuống đáy và làm mờ
    expect(path1.getAttribute('opacity')).toBe('0.45');
    expect(path1.getAttribute('fill')).toBe('#f0f9ff');
    expect(path1.getAttribute('d')).toContain('M0,106');

    // Sóng 2: hạ xuống đáy và làm mờ
    expect(path2.getAttribute('opacity')).toBe('0.3');
    expect(path2.getAttribute('fill')).toBe('#e0f2fe');
    expect(path2.getAttribute('d')).toContain('M0,112');
  });

  it('ensures all 3 header columns have relative position and zIndex: 1 for crisp text', () => {
    const { container } = render(
      <PrintReportView
        patient={mockPatient}
        selectedTests={mockTests}
        conclusion="Các chỉ số trong giới hạn bình thường."
      />
    );

    const header = container.querySelector('.header-section') as HTMLElement;
    expect(header).toBeTruthy();

    // Cột Logo (trái)
    const leftCol = header.querySelector('.flex-col.w-\\[130px\\]') as HTMLElement;
    expect(leftCol).toBeTruthy();
    expect(leftCol.style.position).toBe('relative');
    expect(leftCol.style.zIndex).toBe('1');

    // Cột Thông Tin (giữa)
    const centerCol = header.querySelector('.flex-1.flex-col') as HTMLElement;
    expect(centerCol).toBeTruthy();
    expect(centerCol.style.position).toBe('relative');
    expect(centerCol.style.zIndex).toBe('1');

    // Cột QR (phải)
    const rightCol = header.querySelector('.min-w-\\[68px\\]') as HTMLElement;
    expect(rightCol).toBeTruthy();
    expect(rightCol.style.position).toBe('relative');
    expect(rightCol.style.zIndex).toBe('1');
  });
});
