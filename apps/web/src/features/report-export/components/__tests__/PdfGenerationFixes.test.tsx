import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import PrintReportView from '../PrintReportView';
import HybridReportView from '../HybridReportView';
import AllergenCoverPage from '../allergenReport/AllergenCoverPage';
import { Patient } from '@domain/types';

vi.mock('@infra/qrService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@infra/qrService')>();
  return {
    ...actual,
    generateQrCodeDataUrl: vi.fn(async (url: string) => `data:image/png;base64,mockGeneratedQrFor_${encodeURIComponent(url)}`)
  };
});

describe('PDF Generation Tests - Fixed Cases Verification', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockPatientKhang: Patient = {
    code: 'BN-20260911-010',
    secretToken: 'tok-khang-010',
    name: 'LƯƠNG NGỌC MINH KHANG',
    dob: '06/04/2025',
    gender: 'Nam',
    phone: '0869737608',
    address: 'Tỉnh Quảng Trị',
    diagnosis: 'Nghi ngờ dị ứng đạm sữa / thức ăn',
    doctor: 'BS. Trần Hoài Long',
    orderedAt: '08/09/2026 08:30',
    receivedAt: '08/09/2026 08:45',
    returnedAt: '12/09/2026 10:00',
    sampleStatus: 'Đạt'
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. TEST CASE 1: BADGE CAPSULE PILL FORMATTING & CENTERING
  // ───────────────────────────────────────────────────────────────────────────
  describe('Case 1: Badge Capsule Pill Centering & Padding', () => {
    it('PrintReportView renders capsule pill with 5px 18px 6px 18px padding and boxSizing border-box', () => {
      const { container } = render(
        <PrintReportView
          patient={mockPatientKhang}
          selectedTests={[]}
        />
      );

      const badge = container.querySelector('div[style*="background-color: rgb(224, 242, 254)"], div[style*="e0f2fe"]') as HTMLElement;
      expect(badge).toBeTruthy();
      expect(badge.style.padding).toBe('5px 18px 6px');
      expect(badge.style.display).toBe('inline-flex');
      expect(badge.style.flexDirection).toBe('column');
      expect(badge.style.alignItems).toBe('center');
      expect(badge.style.justifyContent).toBe('center');
      expect(badge.style.boxSizing).toBe('border-box');

      // Contains both lines cleanly
      expect(badge.textContent).toContain('HỆ THỐNG XÉT NGHIỆM GOLAB');
      expect(badge.textContent).toContain('69 CHI NHÁNH TRÊN TOÀN QUỐC');
    });

    it('HybridReportView renders capsule pill with 5px 18px 6px 18px padding', () => {
      const { container } = render(
        <HybridReportView
          patient={mockPatientKhang}
          selectedTests={[]}
        />
      );

      const badge = container.querySelector('div[style*="background-color: rgb(224, 242, 254)"], div[style*="e0f2fe"]') as HTMLElement;
      expect(badge).toBeTruthy();
      expect(badge.style.padding).toBe('5px 18px 6px');
      expect(badge.style.display).toBe('inline-flex');
      expect(badge.style.boxSizing).toBe('border-box');
      expect(badge.textContent).toContain('HỆ THỐNG XÉT NGHIỆM GOLAB');
      expect(badge.textContent).toContain('69 CHI NHÁNH TRÊN TOÀN QUỐC');
    });

    it('AllergenCoverPage renders capsule pill with 5px 18px 6px 18px padding', () => {
      const { container } = render(
        <AllergenCoverPage
          patient={mockPatientKhang}
          currentDateStr="14/09/2026"
          doctorName="BS. Long"
          totalCount={43}
          packagePrice={0}
          totalPages={3}
        />
      );

      const badge = container.querySelector('div[style*="background-color: rgb(224, 242, 254)"], div[style*="e0f2fe"]') as HTMLElement;
      expect(badge).toBeTruthy();
      expect(badge.style.padding).toBe('5px 18px 6px');
      expect(badge.style.display).toBe('inline-flex');
      expect(badge.style.boxSizing).toBe('border-box');
      expect(badge.textContent).toContain('HỆ THỐNG XÉT NGHIỆM GOLAB');
      expect(badge.textContent).toContain('69 CHI NHÁNH TRÊN TOÀN QUỐC');
    });
  });
});