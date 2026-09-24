import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, within } from '@testing-library/react';
import FullAllergenReportView from '../FullAllergenReportView';
import { generateHighQualityPdf, oklchToRgb } from '@infra/pdfService';
import {
  Patient,
  SelectedTest,
  ClinicInfo,
  TestPackage,
  AllergenGradingScale,
  DEFAULT_CLINIC_INFO
} from '@domain/types';

// Mock QR code generator to return fast deterministic Base64
vi.mock('@infra/qrService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@infra/qrService')>();
  return {
    ...actual,
    generateQrCodeDataUrl: vi.fn(async (url: string) => `data:image/png;base64,mockGeneratedQrFor_${encodeURIComponent(url)}`),
    buildPortalUrl: vi.fn((code: string) => `https://tra-cuu.golab.vn/ket-qua/${code}`)
  };
});

// Mock html2canvas for lossless canvas capture in jsdom
vi.mock('html2canvas', () => {
  return {
    default: vi.fn(async (_el: HTMLElement) => {
      return {
        width: 1600,
        height: 2262,
        toDataURL: vi.fn(() => 'data:image/png;base64,mockLosslessCanvasImageData')
      };
    })
  };
});

// Mock jsPDF class constructor
vi.mock('jspdf', () => {
  class MockJsPdf {
    addPage = vi.fn();
    addImage = vi.fn();
    setPage = vi.fn();
    output = vi.fn((type: string) => {
      if (type === 'blob') return new Blob(['mock-pdf-content'], { type: 'application/pdf' });
      if (type === 'datauristring') return 'data:application/pdf;base64,mockPdfBase64String';
      return '';
    });
    internal = {
      pageSize: {
        getWidth: () => 210,
        getHeight: () => 297
      }
    };
  }

  return {
    default: MockJsPdf,
    jsPDF: MockJsPdf
  };
});

describe('Allergen 107 PDF Report Comprehensive Tests (Content, Margins, Colors, PDF Export)', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // MOCK DATA FACTORY FOR 107 ALLERGEN PANEL
  // ─────────────────────────────────────────────────────────────────────────────

  const mockPatient107: Patient = {
    code: 'BN-DN107-888',
    sampleCode: 'BP-DN107-001',
    secretToken: 'tok-dn107-888',
    name: 'NGUYỄN VĂN AN',
    dob: '1992',
    gender: 'Nam',
    phone: '0912.345.678',
    address: '456 Lê Duẩn, TP. Đồng Hới, Quảng Bình',
    diagnosis: 'Nghi ngờ dị ứng đa dị nguyên hô hấp & thức ăn',
    doctor: 'BS. Trần Hoài Long',
    orderedAt: '19/09/2026 08:00',
    receivedAt: '19/09/2026 08:30',
    returnedAt: '19/09/2026 11:00',
    paidAt: '19/09/2026 09:00',
    sampleStatus: 'Đạt'
  };

  const mockClinicInfo: ClinicInfo = {
    ...DEFAULT_CLINIC_INFO,
    name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
    address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
    headquartersAddress: 'Số 36 BT5, Khu đô thị Pháp Vân, phường Hoàng Liệt, thành phố Hà Nội',
    phone: '032.855.3773',
    website: 'golab.com.vn',
    defaultDoctor: 'Nguyễn Thị Thành Trung'
  };

  const mockProtia91Scale: AllergenGradingScale = {
    id: 'scale_protia_91',
    name: 'DIỄN GIẢI ĐỘ DƯƠNG TÍNH (PROTIA 91)',
    unit: 'IU/ml',
    equipment: 'Máy PROTIA Allergy-Q Smart và Q-processor',
    levels: [
      { grade: 0, minVal: 0, maxVal: 0.34, rangeText: '<0,34', label: 'Không phản ứng', isPositive: false },
      { grade: 1, minVal: 0.35, maxVal: 0.69, rangeText: '0,35 - 0,69', label: 'Yếu', isPositive: true },
      { grade: 2, minVal: 0.70, maxVal: 3.49, rangeText: '0,70 - 3,49', label: 'Trung bình', isPositive: true },
      { grade: 3, minVal: 3.50, maxVal: 17.49, rangeText: '3,50 - 17,49', label: 'Khá', isPositive: true },
      { grade: 4, minVal: 17.50, maxVal: 49.99, rangeText: '17,50 - 49,99', label: 'Mạnh', isPositive: true },
      { grade: 5, minVal: 50.00, maxVal: 99.99, rangeText: '50,00 - 99,99', label: 'Rất mạnh', isPositive: true },
      { grade: 6, minVal: 100.0, maxVal: null, rangeText: '>100,0', label: 'Cực mạnh', isPositive: true }
    ]
  };

  /**
   * Tạo chính xác 107 chỉ số xét nghiệm:
   * - 1 chỉ số TIgE (Tổng IgE)
   * - 106 dị nguyên cụ thể bao quát các độ phản ứng từ Độ 0 đến Độ 6
   */
  const create107AllergenTests = (): SelectedTest[] => {
    const tige: SelectedTest = {
      code: 'TIgE',
      name: 'Tổng nồng độ IgE',
      category: 'Dị Nguyên Miễn Dịch',
      result: '45.8',
      unit: 'IU/ml',
      refMin: 0,
      refMax: 15.0,
      refText: '< 15,0',
      price: 150000,
      note: 'Tăng (>15,0 IU/ml)'
    };

    const realisticPrototypes = [
      // Inhalants
      { code: 'd1', name: 'Mạt bụi nhà D. pteronyssinus', en: 'House dust mite', route: 'Đường hô hấp', res: '2.45', note: 'Dương tính (Độ 2)' },
      { code: 'd2', name: 'Mạt bụi nhà D. farinae', en: 'House dust mite', route: 'Đường hô hấp', res: '24.8', note: 'Dương tính (Độ 4)' },
      { code: 'e1', name: 'Lông biểu mô mèo', en: 'Cat epithelium', route: 'Đường hô hấp', res: '0.12', note: 'Âm tính (Độ 0)' },
      { code: 'e2', name: 'Lông biểu mô chó', en: 'Dog dander', route: 'Đường hô hấp', res: '0.55', note: 'Dương tính (Độ 1)' },
      { code: 'i6', name: 'Gián Đức', en: 'Cockroach, German', route: 'Đường hô hấp', res: '0.20', note: 'Âm tính (Độ 0)' },
      { code: 'm1', name: 'Nấm mốc Penicillium notatum', en: 'P. notatum', route: 'Đường hô hấp', res: '0.10', note: 'Âm tính (Độ 0)' },
      { code: 'm6', name: 'Nấm mốc Alternaria alternata', en: 'A. alternata', route: 'Đường hô hấp', res: '0.15', note: 'Âm tính (Độ 0)' },
      { code: 'w1', name: 'Cỏ phấn hương Ambrosia elatior', en: 'Common ragweed', route: 'Đường hô hấp', res: '0.08', note: 'Âm tính (Độ 0)' },
      { code: 'w6', name: 'Cỏ ngải tây Artemisia vulgaris', en: 'Mugwort', route: 'Đường hô hấp', res: '0.05', note: 'Âm tính (Độ 0)' },
      // Foods
      { code: 'f1', name: 'Lòng trắng trứng gà', en: 'Egg white', route: 'Đường tiêu hóa', res: '6.20', note: 'Dương tính (Độ 3)' },
      { code: 'f2', name: 'Sữa bò tươi', en: 'Cow milk', route: 'Đường tiêu hóa', res: '65.0', note: 'Dương tính (Độ 5)' },
      { code: 'f3', name: 'Cá tuyết', en: 'Codfish', route: 'Đường tiêu hóa', res: '0.18', note: 'Âm tính (Độ 0)' },
      { code: 'f4', name: 'Bột lúa mì', en: 'Wheat', route: 'Đường tiêu hóa', res: '0.22', note: 'Âm tính (Độ 0)' },
      { code: 'f13', name: 'Đậu phộng (Lạc)', en: 'Peanut', route: 'Đường tiêu hóa', res: '120.0', note: 'Dương tính (Độ 6)' },
      { code: 'f14', name: 'Hạt đậu nành', en: 'Soybean', route: 'Đường tiêu hóa', res: '0.19', note: 'Âm tính (Độ 0)' },
      { code: 'f24', name: 'Tôm biển', en: 'Shrimp', route: 'Đường tiêu hóa', res: '8.40', note: 'Dương tính (Độ 3)' },
      { code: 'f23', name: 'Cua biển', en: 'Crab', route: 'Đường tiêu hóa', res: '1.40', note: 'Dương tính (Độ 2)' },
      { code: 'f27', name: 'Thịt bò tươi', en: 'Beef', route: 'Đường tiêu hóa', res: '0.11', note: 'Âm tính (Độ 0)' },
      { code: 'f26', name: 'Thịt heo tươi', en: 'Pork', route: 'Đường tiêu hóa', res: '0.15', note: 'Âm tính (Độ 0)' }
    ];

    const list: SelectedTest[] = [tige];

    for (let i = 1; i <= 106; i++) {
      const proto = realisticPrototypes[(i - 1) % realisticPrototypes.length];
      const code = i <= realisticPrototypes.length ? proto.code : `DN_${i}`;
      const name = i <= realisticPrototypes.length ? proto.name : `Dị nguyên kiểm nghiệm số ${i}`;
      const allergenName = i <= realisticPrototypes.length ? proto.en : `Allergen test item ${i}`;
      const route = i <= realisticPrototypes.length ? proto.route : (i % 2 === 0 ? 'Đường hô hấp' : 'Đường tiêu hóa');
      const result = i <= realisticPrototypes.length ? proto.res : (i % 6 === 0 ? '5.60' : '<0.15');
      const note = i <= realisticPrototypes.length ? proto.note : (i % 6 === 0 ? 'Dương tính (Độ 3)' : 'Âm tính (Độ 0)');

      list.push({
        code,
        name,
        category: route === 'Đường hô hấp' ? 'Dị Nguyên Hô Hấp' : 'Dị Nguyên Thực Phẩm',
        result,
        unit: 'IU/ml',
        refMin: 0,
        refMax: 0.34,
        refText: '< 0.34 (Độ 0)',
        price: 22000,
        note,
        scaleId: 'scale_protia_91',
        ...( { allergenName, route } as unknown as object )
      });
    }

    return list;
  };

  const tests107Initial = create107AllergenTests();

  const mock107Package: TestPackage = {
    id: 'pkg_dn107',
    name: 'Panel 107 Dị Nguyên Chuyên Sâu',
    price: 2220000,
    codes: tests107Initial.map((t) => t.code),
    items: tests107Initial.map((t) => ({ code: t.code, equipmentId: null }))
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 1: CẤU TRÚC PHÂN TRANG VÀ TỔNG THỂ TÀI LIỆU (12 TRANG BOOKLET)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 1: Page Structure & Pagination (12-page Booklet for 107 Allergens)', () => {
    it('generates exactly 12 pages in Booklet for 107 allergen tests (1 Cover + 1 Summary + 9 Details + 1 Guidance)', () => {
      const tests107 = create107AllergenTests();
      expect(tests107.length).toBe(107);

      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          packagePrice={2220000}
          allergenScales={[mockProtia91Scale]}
        />
      );

      const pages = container.querySelectorAll('.report-page');
      expect(pages.length).toBe(12);

      // Tất cả 12 trang đều phải có data-page="true"
      pages.forEach((page) => {
        expect(page.getAttribute('data-page')).toBe('true');
      });

      // Trang 1: Trang Bìa
      expect(pages[0].textContent).toContain('PHIẾU KẾT QUẢ XÉT NGHIỆM');
      expect(pages[0].textContent).toContain('Trang 1/12');

      // Trang 2: Trang Tổng Hợp Kết Quả & Dương Tính
      expect(pages[1].textContent).toContain('KẾT QUẢ ĐỊNH LƯỢNG KHÁNG THỂ IGE ĐẶC HIỆU');
      expect(pages[1].textContent).toContain('GOLAB CLINICAL LABORATORY • PHIẾU ĐỊNH LƯỢNG IgE ĐẶC HIỆU DỊ NGUYÊN • TRANG 2');

      // Trang 3 đến 11: 9 trang Chi Tiết Kết Quả
      for (let i = 0; i < 9; i++) {
        const detailPage = pages[2 + i];
        expect(detailPage.textContent).toContain(`CHI TIẾT KẾT QUẢ XÉT NGHIỆM PANEL 107 DỊ NGUYÊN CHUYÊN SÂU (PHẦN ${i + 1})`);
        expect(detailPage.textContent).toContain(`TRANG ${i + 3}`);
      }

      // Trang 12: Trang Hướng Dẫn & Lưu Ý Phòng Ngừa
      expect(pages[11].textContent).toContain('MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG');
      expect(pages[11].textContent).toContain('GOLAB CLINICAL LABORATORY • HƯỚNG DẪN PHÒNG NGỪA DỊ ỨNG • TRANG 12');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 2: CĂN LỀ & KÍCH THƯỚC CHUẨN A4 (MARGINS, PADDING & DIMENSIONS)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 2: Margins, Padding & Dimensions (A4 210mm x 297mm & 10mm 14mm Margins)', () => {
    it('applies exact medical standard padding 10mm 14mm and A4 dimensions to all 12 pages', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          packagePrice={2220000}
        />
      );

      const pages = container.querySelectorAll('.report-page');
      expect(pages.length).toBe(12);

      pages.forEach((pageEl, idx) => {
        const el = pageEl as HTMLElement;
        expect(el.style.width, `Page ${idx + 1} width must be 210mm`).toBe('210mm');
        expect(el.style.minWidth, `Page ${idx + 1} minWidth must be 210mm`).toBe('210mm');
        expect(el.style.maxWidth, `Page ${idx + 1} maxWidth must be 210mm`).toBe('210mm');
        expect(el.style.minHeight, `Page ${idx + 1} minHeight must be 297mm`).toBe('297mm');
        expect(el.style.boxSizing, `Page ${idx + 1} boxSizing must be border-box`).toBe('border-box');

        // Padding chuẩn y khoa: Top 10mm, Right 14mm, Bottom 10mm, Left 14mm
        expect(el.style.paddingTop, `Page ${idx + 1} paddingTop must be 10mm`).toBe('10mm');
        expect(el.style.paddingRight, `Page ${idx + 1} paddingRight must be 14mm`).toBe('14mm');
        expect(el.style.paddingBottom, `Page ${idx + 1} paddingBottom must be 10mm`).toBe('10mm');
        expect(el.style.paddingLeft, `Page ${idx + 1} paddingLeft must be 14mm`).toBe('14mm');

        // Font chữ Times New Roman serif sang trọng
        expect(el.style.fontFamily, `Page ${idx + 1} fontFamily must be Times New Roman serif`).toContain('Times New Roman');
      });
    });

    it('verifies 3-column header layout and wave alignment on Page 1', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
        />
      );

      const page1 = container.querySelectorAll('.report-page')[0] as HTMLElement;
      const header = page1.querySelector('.header-section') as HTMLElement;
      expect(header).toBeTruthy();

      // Cột Logo bên trái: 130px, position: relative, z-index: 1
      const leftCol = header.querySelector('.flex-col.w-\\[130px\\]') as HTMLElement;
      expect(leftCol).toBeTruthy();
      expect(leftCol.style.position).toBe('relative');
      expect(leftCol.style.zIndex).toBe('1');
      expect(leftCol.style.width).toBe('130px');

      // Cột Thông Tin cơ sở ở giữa: flex-1, relative, z-index: 1
      const centerCol = header.querySelector('.flex-1.flex-col') as HTMLElement;
      expect(centerCol).toBeTruthy();
      expect(centerCol.style.position).toBe('relative');
      expect(centerCol.style.zIndex).toBe('1');

      // Cột QR bên phải: min-w-[68px], relative, z-index: 1
      const rightCol = header.querySelector('.min-w-\\[68px\\]') as HTMLElement;
      expect(rightCol).toBeTruthy();
      expect(rightCol.style.position).toBe('relative');
      expect(rightCol.style.zIndex).toBe('1');

      // Capsule pill căn giữa tuyệt đối với padding 5px 18px 6px
      const capsule = header.querySelector('div[style*="background-color: rgb(224, 242, 254)"], div[style*="e0f2fe"]') as HTMLElement;
      expect(capsule).toBeTruthy();
      expect(capsule.style.display).toBe('inline-flex');
      expect(capsule.style.flexDirection).toBe('column');
      expect(capsule.style.alignItems).toBe('center');
      expect(capsule.style.justifyContent).toBe('center');
      expect(capsule.style.padding).toBe('5px 18px 6px');

      // Họa tiết sóng tràn đáy header không che chữ
      const waveSvg = header.querySelector('svg[viewBox="0 0 800 120"]') as SVGElement;
      expect(waveSvg).toBeTruthy();
      expect(waveSvg.style.position).toBe('absolute');
      expect(waveSvg.style.bottom).toBe('0px');
      expect(waveSvg.style.left).toBe('0px');
      expect(waveSvg.style.width).toBe('100%');
    });

    it('verifies column alignments in detail tables (center for codes/results, left for names, right for price)', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          packagePrice={2220000}
        />
      );

      // Kiểm tra căn lề bảng giá ở Trang 1
      const page1 = container.querySelectorAll('.report-page')[0];
      const priceCell = page1.querySelector('td.text-right') as HTMLElement;
      expect(priceCell).toBeTruthy();
      expect(priceCell.textContent).toContain('2.220.000 đ');

      // Kiểm tra căn lề ở bảng chi tiết (Trang 3)
      const page3 = container.querySelectorAll('.report-page')[2];
      const tableHead = page3.querySelector('thead tr') as HTMLElement;
      expect(tableHead).toBeTruthy();

      const ths = tableHead.querySelectorAll('th');
      expect(ths[0].className).toContain('text-center'); // TT
      expect(ths[1].className).toContain('text-center'); // CODE
      expect(ths[2].className).toContain('text-left');   // TÊN CHỈ SỐ
      expect(ths[3].className).toContain('text-left');   // TÊN DỊ NGUYÊN
      expect(ths[4].className).toContain('text-left');   // Đường dị ứng
      expect(ths[5].className).toContain('text-center'); // BÌNH THƯỜNG
      expect(ths[6].className).toContain('text-center'); // KẾT QUẢ
      expect(ths[7].className).toContain('text-center'); // ĐỘ (+)
      expect(ths[8].className).toContain('text-left');   // GHI CHÚ
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 3: MÀU SẮC Y KHOA & PHÂN CẤP CẢNH BÁO (COLORS & VISUAL GRADING)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 3: Medical Colors & Visual Grading Accuracy', () => {
    it('verifies medical branding colors: Red Patient Name & Sample Code, Emerald Status, Sky Blue Accents', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
        />
      );

      const page1 = container.querySelectorAll('.report-page')[0];

      // Họ tên bệnh nhân: Chữ đỏ in đậm
      const nameEl = page1.querySelector('td.font-bold.text-red-600');
      expect(nameEl).toBeTruthy();
      expect(nameEl?.textContent).toBe('NGUYỄN VĂN AN');

      // Số bệnh phẩm: Chữ đỏ in đậm font-mono
      const sampleCodeEl = page1.querySelector('td.font-mono.font-bold.text-red-600');
      expect(sampleCodeEl).toBeTruthy();
      expect(sampleCodeEl?.textContent).toBe('BP-DN107-001');

      // Tình trạng mẫu: Màu xanh ngọc lục bảo
      const statusEl = page1.querySelector('td.text-emerald-700.font-bold');
      expect(statusEl).toBeTruthy();
      expect(statusEl?.textContent).toBe('Đạt');

      // Header viền xanh sky-400 và slogan màu xanh sky-600
      const header = page1.querySelector('.header-section') as HTMLElement;
      expect(header.style.borderBottom).toMatch(/#38bdf8|rgb\(56,\s*189,\s*248\)/);

      const sloganEl = header.querySelector('span[style*="#0284c7"], span[style*="rgb(2, 132, 199)"]') as HTMLElement;
      expect(sloganEl).toBeTruthy();
      expect(sloganEl.textContent).toContain('Vì sức khỏe người Việt');

      // Sóng nền mờ nhẹ nhàng với fill chuẩn (#f0f9ff và #e0f2fe)
      const waveContainer = header.querySelector('.pointer-events-none');
      expect(waveContainer).toBeTruthy();
      const waveSvg = waveContainer?.querySelector('svg');
      expect(waveSvg).toBeTruthy();

      const wavePaths = waveSvg!.querySelectorAll('path');
      expect(wavePaths.length).toBe(2);
      expect(wavePaths[0].getAttribute('fill')).toBe('#f0f9ff');
      expect(wavePaths[0].getAttribute('opacity')).toBe('0.45');
      expect(wavePaths[1].getAttribute('fill')).toBe('#e0f2fe');
      expect(wavePaths[1].getAttribute('opacity')).toBe('0.3');
    });

    it('verifies Page 2 colors: Red Allergen Report Badge, Positive Grade Highlight Rows', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          allergenScales={[mockProtia91Scale]}
        />
      );

      const page2 = container.querySelectorAll('.report-page')[1];

      // Badge "Báo Cáo Dị Nguyên": Nền đỏ, chữ trắng
      const reportBadge = page2.querySelector('.bg-red-600.text-white');
      expect(reportBadge).toBeTruthy();
      expect(reportBadge?.textContent).toContain('Báo Cáo Dị Nguyên');

      // Tiêu đề phụ: text-red-700 italic
      const subtitle = page2.querySelector('.text-red-700.italic');
      expect(subtitle).toBeTruthy();
      expect(subtitle?.textContent).toContain('(Tổng hợp các dị nguyên dương tính & nồng độ IgE toàn phần)');

      // Bảng thang đo: Tiêu đề đỏ đậm
      const scaleHeader = page2.querySelector('.text-red-700.uppercase');
      expect(scaleHeader).toBeTruthy();
      expect(scaleHeader?.textContent).toContain('DIỄN GIẢI ĐỘ DƯƠNG TÍNH');
    });

    it('verifies grade color classification in detail pages (Amber for Grade 1-2, Red for Grade 3-6, White for Grade 0)', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          allergenScales={[mockProtia91Scale]}
        />
      );

      // Trang 3 (Phần 1) chứa TIgE (Tăng -> đỏ nhạt) và các dị nguyên đầu tiên
      const page3 = container.querySelectorAll('.report-page')[2];
      const rows = page3.querySelectorAll('tbody tr');
      expect(rows.length).toBe(13); // 13 chỉ số / trang

      // Dòng TIgE: rowBg = bg-red-50/70, text-red-800
      const tigeRow = rows[0];
      expect(tigeRow.className).toContain('bg-red-50/70');
      expect(tigeRow.textContent).toContain('TIgE');
      expect(tigeRow.textContent).toContain('Tăng (> 15,0 IU/ml)');

      // Dòng d1 (Độ 2): rowBg = bg-amber-50/70
      const d1Row = rows[1];
      expect(d1Row.className).toContain('bg-amber-50/70');
      expect(d1Row.textContent).toContain('d1');

      // Dòng d2 (Độ 4): rowBg = bg-red-50/70
      const d2Row = rows[2];
      expect(d2Row.className).toContain('bg-red-50/70');
      expect(d2Row.textContent).toContain('d2');

      // Dòng e1 (Độ 0 - Âm tính): rowBg = bg-white
      const e1Row = rows[3];
      expect(e1Row.className).toContain('bg-white');
      expect(e1Row.textContent).toContain('e1');
      expect(e1Row.textContent).toContain('Âm tính (Độ 0)');

      // Dòng e2 (Độ 1): rowBg = bg-amber-50/50
      const e2Row = rows[4];
      expect(e2Row.className).toContain('bg-amber-50/50');
      expect(e2Row.textContent).toContain('e2');
    });

    it('sanitizes modern OKLCH/OKLab colors to valid sRGB colors for clean PDF rendering', () => {
      const oklchSample = 'oklch(0.623 0.214 259.815)';
      const converted = oklchToRgb(oklchSample);

      expect(converted).not.toContain('oklch');
      expect(converted).toMatch(/^rgba?\(\d+,\s*\d+,\s*\d+/);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 4: NỘI DUNG TOÀN VẸN 107 CHỈ SỐ & BẢNG THÔNG TIN 12 TRƯỜNG
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 4: Complete Medical Content & Invariants Across All 107 Items', () => {
    it('verifies full 12-field patient administrative grid layout on Page 1', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          currentDateStr="19/09/2026"
        />
      );

      const page1 = container.querySelectorAll('.report-page')[0] as HTMLElement;
      const p1 = within(page1);

      // 12 trường hành chính được định vị chính xác trên Trang 1
      expect(p1.getByText('Họ và tên:')).toBeDefined();
      expect(p1.getByText('NGUYỄN VĂN AN')).toBeDefined();

      expect(p1.getByText('T/G chỉ định')).toBeDefined();
      expect(p1.getByText('19/09/2026 08:00')).toBeDefined();

      expect(p1.getByText('Năm sinh:')).toBeDefined();
      expect(p1.getByText('1992')).toBeDefined();

      expect(p1.getByText('T/G đóng phí')).toBeDefined();
      expect(p1.getByText('19/09/2026 09:00')).toBeDefined();

      expect(p1.getByText('Địa chỉ')).toBeDefined();
      expect(p1.getByText('456 Lê Duẩn, TP. Đồng Hới, Quảng Bình')).toBeDefined();

      expect(p1.getByText('Số bệnh phẩm')).toBeDefined();
      expect(p1.getByText('BP-DN107-001')).toBeDefined();

      expect(p1.getByText('Giới tính:')).toBeDefined();
      expect(p1.getByText('Nam')).toBeDefined();

      expect(p1.getByText('Tình trạng mẫu')).toBeDefined();
      expect(p1.getByText('Đạt')).toBeDefined();

      expect(p1.getByText('Số điện thoại')).toBeDefined();
      expect(p1.getByText('0912.345.678')).toBeDefined();

      expect(p1.getByText('T/G nhận mẫu')).toBeDefined();
      expect(p1.getByText('19/09/2026 08:30')).toBeDefined();

      expect(p1.getByText('Bác sĩ chỉ định')).toBeDefined();
      expect(p1.getByText('BS. Trần Hoài Long')).toBeDefined();

      expect(p1.getByText('T/G trả kết quả')).toBeDefined();
      expect(p1.getByText('19/09/2026 11:00')).toBeDefined();
    });

    it('verifies all 107 indicators are rendered sequentially from TT 1 to TT 107 without drops', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          packagePrice={2220000}
        />
      );

      const pages = container.querySelectorAll('.report-page');
      const detailPages = Array.from(pages).slice(2, 11); // 9 trang chi tiết (Trang 3 -> 11)
      expect(detailPages.length).toBe(9);

      // Thu thập toàn bộ các số thứ tự (TT) từ tất cả 9 trang chi tiết
      const collectedTTs: number[] = [];
      detailPages.forEach((dp) => {
        const rows = dp.querySelectorAll('tbody tr');
        rows.forEach((r) => {
          const ttCell = r.querySelector('td:first-child');
          if (ttCell && ttCell.textContent) {
            collectedTTs.push(Number(ttCell.textContent.trim()));
          }
        });
      });

      // Tổng số chỉ số phải đúng bằng 107
      expect(collectedTTs.length).toBe(107);

      // Kiểm tra tính tuần tự liên tục 1, 2, 3, ..., 107 không bị gián đoạn hay nhảy số
      for (let i = 1; i <= 107; i++) {
        expect(collectedTTs[i - 1]).toBe(i);
      }

      // Trang 3 (Phần 1): 13 chỉ số (TT 1..13)
      expect(detailPages[0].querySelectorAll('tbody tr').length).toBe(13);

      // Trang 10 (Phần 8): 13 chỉ số (TT 92..104)
      expect(detailPages[7].querySelectorAll('tbody tr').length).toBe(13);

      // Trang 11 (Phần 9): 3 chỉ số cuối (TT 105..107)
      expect(detailPages[8].querySelectorAll('tbody tr').length).toBe(3);
    });

    it('verifies 5 clinical preventive guidance points on Page 12', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
        />
      );

      const page12 = container.querySelectorAll('.report-page')[11];
      expect(page12.textContent).toContain('MỘT SỐ LƯU Ý VỀ PHÒNG NGỪA DỊ ỨNG');
      expect(page12.textContent).toContain('1. Tìm nguyên nhân gây dị ứng hoặc dị ứng chéo bằng các xét nghiệm tìm dị nguyên.');
      expect(page12.textContent).toContain('2. Khi xét nghiệm không tìm thấy nguyên nhân dị ứng thì cần tiến hành cô lập từng yếu tố');
      expect(page12.textContent).toContain('3. Mức độ dị ứng tỷ lệ thuận với số lần tiếp xúc với nguồn gây dị ứng');
      expect(page12.textContent).toContain('4. Nếu phát hiện ra có biểu hiện dị ứng');
      expect(page12.textContent).toContain('5. Không nên tự dùng thuốc tây đặc biệt là thuốc đông y');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 5: TRANG TỔNG HỢP DƯƠNG TÍNH & THANG ĐO PANEL 107
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 5: Summary Page Positive Filtering & Panel 107 Scale Title', () => {
    it('filters only positive allergens (Grade >= 1 and TIgE > 15) on Page 2 summary table', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          allergenScales={[mockProtia91Scale]}
        />
      );

      const page2 = container.querySelectorAll('.report-page')[1];
      const summaryRows = page2.querySelectorAll('tbody tr');
      expect(summaryRows.length).toBeGreaterThan(0);

      // TIgE dương tính (>15.0) xuất hiện ở dòng đầu tiên
      const firstRow = summaryRows[0];
      expect(firstRow.textContent).toContain('TIgE');
      expect(firstRow.textContent).toContain('45.8');

      // Mạt bụi nhà d1 (Độ 2) và d2 (Độ 4) xuất hiện
      expect(page2.textContent).toContain('d1');
      expect(page2.textContent).toContain('d2');

      // Lông mèo e1 (Âm tính, Độ 0) TUYỆT ĐỐI KHÔNG xuất hiện trên bảng dương tính Trang 2
      const positiveCodes = Array.from(summaryRows).map((r) => r.querySelector('td:nth-child(4)')?.textContent?.trim());
      expect(positiveCodes).not.toContain('e1');
    });

    it('renders scale title with exact Panel 107 package name', () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          allergenScales={[mockProtia91Scale]}
        />
      );

      const page2 = container.querySelectorAll('.report-page')[1];
      expect(page2.textContent).toContain('DIỄN GIẢI ĐỘ DƯƠNG TÍNH (Panel 107 Dị Nguyên Chuyên Sâu)');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // SUITE 6: KẾT XUẤT PDF THÔNG QUA generateHighQualityPdf (MULTI-PAGE LOSSLESS CANVAS)
  // ─────────────────────────────────────────────────────────────────────────────
  describe('Suite 6: PDF Export Integration & Multi-Page Lossless Canvas', () => {
    it('executes generateHighQualityPdf detecting all 12 pages and triggers progress callback 1 to 12', async () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          elementId="printable-allergen-report-107"
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          packagePrice={2220000}
        />
      );

      // Gắn container vào document để getElementById tìm thấy
      document.body.appendChild(container);

      const progressSteps: number[] = [];
      const onProgress = vi.fn((info: { currentPage?: number; totalPages?: number; step: string }) => {
        if (info.currentPage) {
          progressSteps.push(info.currentPage);
        }
      });

      const result = await generateHighQualityPdf('printable-allergen-report-107', 'PhieuKetQua_Panel107.pdf', {
        onProgress
      });

      expect(result).toBeDefined();
      expect(result.pdf).toBeDefined();
      expect(result.blob).toBeDefined();
      expect(result.base64).toContain('mockPdfBase64String');

      // Xác nhận onProgress được gọi đầy đủ cho cả 12 trang từ trang 1 đến trang 12
      expect(progressSteps).toContain(1);
      expect(progressSteps).toContain(2);
      expect(progressSteps).toContain(6);
      expect(progressSteps).toContain(12);
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPage: 12,
          totalPages: 12
        })
      );

      // Dọn dẹp DOM
      document.body.removeChild(container);
    });

    it('supports custom scale (e.g. 1.0 or 1.25) and fast imageFormat (jpeg/png) to optimize generation speed', async () => {
      const tests107 = create107AllergenTests();
      const { container } = render(
        <FullAllergenReportView
          elementId="printable-allergen-report-fast"
          patient={mockPatient107}
          selectedTests={tests107}
          clinicInfo={mockClinicInfo}
          testPackages={[mock107Package]}
          packagePrice={2220000}
        />
      );
      document.body.appendChild(container);

      const onProgress = vi.fn();
      const fastResult = await generateHighQualityPdf('printable-allergen-report-fast', 'PhieuKetQua_Nhanh.pdf', {
        scale: 1.0,
        imageFormat: 'jpeg',
        imageQuality: 0.85,
        onProgress
      });

      expect(fastResult).toBeDefined();
      expect(fastResult.base64).toContain('mockPdfBase64String');
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Canvas 1x')
        })
      );

      document.body.removeChild(container);
    });
  });
});
