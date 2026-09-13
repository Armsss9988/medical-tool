import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ClinicalBadge } from '../ClinicalBadge';
import { ClinicalTrustSeal } from '../ClinicalTrustSeal';
import { ClinicalCard } from '../ClinicalCard';
import { ClinicalAlertNotice } from '../ClinicalAlertNotice';
import { ClinicalDemographicsStrip } from '../ClinicalDemographicsStrip';

describe('Clinical Components', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders ClinicalBadge with appropriate content and variants', () => {
    const { rerender } = render(<ClinicalBadge variant="normal">BÌNH THƯỜNG</ClinicalBadge>);
    expect(screen.getByText('BÌNH THƯỜNG')).toBeDefined();

    rerender(<ClinicalBadge variant="abnormal">BẤT THƯỜNG</ClinicalBadge>);
    expect(screen.getByText('BẤT THƯỜNG')).toBeDefined();

    rerender(<ClinicalBadge variant="verified">CHÍNH THỨC</ClinicalBadge>);
    expect(screen.getByText('CHÍNH THỨC')).toBeDefined();

    rerender(<ClinicalBadge variant="pending">CHỜ KQ</ClinicalBadge>);
    expect(screen.getByText('CHỜ KQ')).toBeDefined();
  });

  it('renders ClinicalTrustSeal with clinic name and doctor', () => {
    render(
      <ClinicalTrustSeal
        clinicName="GoLab Test Center"
        doctorName="Nguyễn Văn A"
        verifiedAt="12/09/2026"
        hasCloudPdf={true}
      />
    );

    expect(screen.getByTestId('clinical-trust-seal')).toBeDefined();
    expect(screen.getByText(/GoLab Test Center/i)).toBeDefined();
    expect(screen.getByText(/BS. Nguyễn Văn A/i)).toBeDefined();
    expect(screen.getByText(/Đã lưu trữ an toàn trên Cloud PDF/i)).toBeDefined();
  });

  it('renders ClinicalCard with custom accent', () => {
    render(
      <ClinicalCard accent="emerald" data-testid="card">
        <div>Nội dung thẻ y tế</div>
      </ClinicalCard>
    );

    expect(screen.getByText('Nội dung thẻ y tế')).toBeDefined();
  });

  it('renders ClinicalAlertNotice in pending state with technical analysis message', () => {
    render(
      <ClinicalAlertNotice
        total={5}
        abnormal={0}
        isPending={true}
        showAbnormalOnly={false}
        onToggleFilter={vi.fn()}
      />
    );

    expect(screen.getByText(/đang trong quá trình phân tích kỹ thuật/i)).toBeDefined();
    expect(screen.queryByText(/Tất cả 5 chỉ số xét nghiệm đều nằm trong khoảng tham chiếu/i)).toBeNull();
  });

  it('renders ClinicalDemographicsStrip with pending status badge instead of approved seal', () => {
    render(
      <ClinicalDemographicsStrip
        patientName="Trần Văn Thử Nghiệm"
        code="BN-202609-001"
        status="Chờ xét nghiệm"
        isPending={true}
        onOpenQr={vi.fn()}
        onShare={vi.fn()}
      />
    );

    expect(screen.getByText(/Chờ xét nghiệm/i)).toBeDefined();
    expect(screen.queryByText(/Đã Phê Duyệt Ký Số/i)).toBeNull();
  });
});
