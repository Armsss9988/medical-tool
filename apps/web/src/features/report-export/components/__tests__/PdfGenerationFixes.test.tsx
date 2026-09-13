import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import PrintReportView from '../PrintReportView';
import HybridReportView from '../HybridReportView';
import AllergenCoverPage from '../allergenReport/AllergenCoverPage';
import { DynamicReportView } from '../../../template-builder/components/templateBuilder/DynamicReportView';
import { PRESET_TEMPLATES } from '@domain/templateTypes';
import { Patient, SelectedTest, DEFAULT_CLINIC_INFO } from '@domain/types';

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

  // 1 Total IgE (Lâm sàng) + 43 Allergen tests
  const create43AllergenTests = (): SelectedTest[] => {
    const list: SelectedTest[] = [
      {
        code: 'TIgE',
        name: 'Tổng nồng độ IgE',
        category: 'Dị Nguyên & Miễn Dịch',
        result: '42.8',
        unit: 'IU/mL',
        refMin: 0,
        refMax: 15,
        refText: '< 15.0',
        price: 150000,
        note: 'CAO ↑',
        equipment: 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1',
        evaluationType: 'range'
      }
    ];

    // 43 allergen indicators
    for (let i = 1; i <= 43; i++) {
      list.push({
        code: `ag_${i}`,
        name: `Dị nguyên kiểm tra số ${i}`,
        category: i % 2 === 0 ? 'Dị Nguyên Hô Hấp' : 'Dị Nguyên Thực Phẩm',
        result: i === 1 ? '0.68' : (i === 5 ? '1.25' : ''),
        unit: 'IU/mL',
        refMin: 0,
        refMax: 0.34,
        refText: '<0.34',
        price: 0,
        note: i === 1 ? 'Dương tính yếu (Độ 1)' : (i === 5 ? 'Dương tính (Độ 2)' : 'Âm tính (Độ 0)'),
        equipment: 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1',
        scaleId: 'scale_allergen_44',
        evaluationType: 'scale',
        scientific: `Allergen species ${i}`
      });
    }

    return list;
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

    it('DynamicReportView renders capsule pill with inline-flex and border-box styling', () => {
      const template = PRESET_TEMPLATES[0];
      const { container } = render(
        <DynamicReportView
          template={template}
          patient={mockPatientKhang}
          selectedTests={[]}
        />
      );

      const badge = container.querySelector('div[style*="background-color: rgb(224, 242, 254)"], div[style*="e0f2fe"]') as HTMLElement;
      expect(badge).toBeTruthy();
      expect(badge.style.display).toBe('inline-flex');
      expect(badge.style.flexDirection).toBe('column');
      expect(badge.style.boxSizing).toBe('border-box');
      expect(badge.textContent).toContain('HỆ THỐNG XÉT NGHIỆM GOLAB');
      expect(badge.textContent).toContain('69 CHI NHÁNH TRÊN TOÀN QUỐC');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. TEST CASE 2: QR CODE AUTO-FALLBACK & RESOLUTION
  // ───────────────────────────────────────────────────────────────────────────
  describe('Case 2: QR Code Auto-Fallback & Resolution', () => {
    it('DynamicReportView automatically renders an <img> QR code when qrCodeDataUrl is not provided', async () => {
      const template = PRESET_TEMPLATES[0];
      const { container } = render(
        <DynamicReportView
          template={template}
          patient={mockPatientKhang}
          selectedTests={[]}
          clinicInfo={DEFAULT_CLINIC_INFO}
        />
      );

      // Wait for auto QR fallback hook to generate data URL
      await waitFor(() => {
        const qrImg = container.querySelector('img[alt="QR Code"]') as HTMLImageElement;
        expect(qrImg).toBeTruthy();
        expect(qrImg.src).toContain('data:image/');
      });

      // Assert that the placeholder "QR" text box is NOT displayed
      expect(screen.queryByText(/^QR$/)).toBeNull();
    });

    it('DynamicReportView renders provided qrCodeDataUrl directly without delay', () => {
      const customQr = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      const template = PRESET_TEMPLATES[0];
      const { container } = render(
        <DynamicReportView
          template={template}
          patient={mockPatientKhang}
          selectedTests={[]}
          qrCodeDataUrl={customQr}
        />
      );

      const qrImg = container.querySelector('img[alt="QR Code"]') as HTMLImageElement;
      expect(qrImg).toBeTruthy();
      expect(qrImg.src).toBe(customQr);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. TEST CASE 3: ALLERGEN DETAIL TABLE MULTI-PAGE PAGINATION
  // ───────────────────────────────────────────────────────────────────────────
  describe('Case 3: Allergen Detail Multi-Page Pagination (Minh Khang Case)', () => {
    it('DynamicReportView chunks 43 allergen items across multiple pages with continuation headers and separate scale page', () => {
      const template = PRESET_TEMPLATES[0]; // tpl_standard_clinical
      const tests = create43AllergenTests();

      const { container } = render(
        <DynamicReportView
          template={template}
          patient={mockPatientKhang}
          selectedTests={tests}
          conclusion="Nghi ngờ phản ứng dị ứng với Mạt bụi nhà D1, đề nghị kết hợp lâm sàng."
          doctorName="BS. Trần Hoài Long"
        />
      );

      // 1. Should generate 6 pages (Page 1 clinical, Page 2 guidance, Page 3-5 allergen chunks of <= 15 items, Page 6 scale & notes)
      const pages = container.querySelectorAll('[data-page="true"]');
      expect(pages.length).toBe(6);

      // 2. Page 1: Clinical Info & TIgE
      const page1 = pages[0];
      expect(page1.textContent).toContain('PHIẾU TRẢ KẾT QUẢ XÉT NGHIỆM');
      expect(page1.textContent).toContain('LƯƠNG NGỌC MINH KHANG');
      expect(page1.textContent).toContain('BN-20260911-010');

      // 3. Page 3: Allergen Detail Part 1 (15 items)
      const page3 = pages[2];
      expect(page3.textContent).toContain('KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU');
      const p3Rows = page3.querySelectorAll('tbody tr');
      expect(p3Rows.length).toBe(15);

      // 4. Page 4: Allergen Detail Part 2 (Continuation with Mini Patient Header)
      const page4 = pages[3];
      expect(page4.textContent).toContain('CHI TIẾT KẾT QUẢ XÉT NGHIỆM 44 DỊ NGUYÊN (PHẦN 2)');
      expect(page4.textContent).toContain('Bệnh nhân: LƯƠNG NGỌC MINH KHANG');
      expect(page4.textContent).toContain('Mã BN: BN-20260911-010');
      const p4Rows = page4.querySelectorAll('tbody tr');
      expect(p4Rows.length).toBe(15);

      // 5. Page 5: Allergen Detail Part 3 (14 remaining items)
      const page5 = pages[4];
      expect(page5.textContent).toContain('CHI TIẾT KẾT QUẢ XÉT NGHIỆM 44 DỊ NGUYÊN (PHẦN 3)');
      const p5Rows = page5.querySelectorAll('tbody tr');
      expect(p5Rows.length).toBe(14);

      // 6. Page 6: Dedicated Scale Table, Symptoms Box & TIgE Note (Cleanly separated from the table)
      const page6 = pages[5];
      expect(page6.textContent).toContain('DIỄN GIẢI ĐỘ DƯƠNG TÍNH');
      expect(page6.textContent).toContain('MỘT SỐ TRIỆU CHỨNG THƯỜNG GẶP KHI DỊ ỨNG');
      expect(page6.textContent).toContain('Ghi chú: Tổng nồng độ IgE (TIgE)');

      // None of the pages should contain all 43 rows
      pages.forEach((p) => {
        const rows = p.querySelectorAll('tbody tr');
        expect(rows.length).toBeLessThan(43);
      });
    });

    it('DynamicReportView fits <= 14 allergen items on a single detail page without redundant continuation pages', () => {
      const template = PRESET_TEMPLATES[0];
      // 1 TIgE + 10 allergens
      const shortTests = create43AllergenTests().slice(0, 11);

      const { container } = render(
        <DynamicReportView
          template={template}
          patient={mockPatientKhang}
          selectedTests={shortTests}
        />
      );

      const pages = container.querySelectorAll('[data-page="true"]');
      // Should not have (PHẦN 2) or (PHẦN 3)
      expect(screen.queryByText(/PHẦN 2/i)).toBeNull();
      expect(screen.queryByText(/PHẦN 3/i)).toBeNull();
      // Total pages should be 4 (Page 1 clinical, Page 2 guidance, Page 3 allergen detail single, Page 4 scale/notes)
      expect(pages.length).toBeLessThanOrEqual(4);
    });
  });
});
