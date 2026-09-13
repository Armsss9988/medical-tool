import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import PrintReportView from '../PrintReportView';
import HybridReportView from '../HybridReportView';
import { Patient, SelectedTest, DEFAULT_CLINIC_INFO } from '@domain/types';
import { ReportPaginationDomainService } from '@domain';

describe('ReportPaginationAndIndicatorsMatrix - Comprehensive Tests Across Indicator Quantities & Layouts', () => {
  afterEach(() => {
    cleanup();
  });

  const basePatient: Patient = {
    code: 'BN-20260914-999',
    secretToken: 'tok-999',
    name: 'TRẦN VĂN MẪU',
    dob: '1985',
    gender: 'Nam',
    phone: '0912.345.678',
    address: '456 Lê Duẩn, TP. Đồng Hới, Quảng Bình',
    diagnosis: 'Kiểm tra sức khỏe định kỳ và tổng quát',
    doctor: 'BS. Trần Hoài Long',
    orderedAt: '14/09/2026 08:00',
    receivedAt: '14/09/2026 08:15',
    returnedAt: '14/09/2026 09:45',
    sampleStatus: 'Đạt'
  };

  const createMockTests = (count: number, category = 'Sinh hóa máu'): SelectedTest[] => {
    return Array.from({ length: count }, (_, i) => ({
      code: `IND_${i + 1}`,
      name: `Chỉ số xét nghiệm kiểm tra số ${i + 1}`,
      category,
      result: `${(i * 0.8 + 3.5).toFixed(1)}`,
      unit: i % 2 === 0 ? 'mmol/L' : 'U/L',
      refMin: 3.0,
      refMax: 8.0,
      refText: '3.0 - 8.0',
      price: 45000,
      note: i % 5 === 0 ? 'Hơi cao nhẹ' : 'Bình thường'
    }));
  };

  // ───────────────────────────────────────────────────────────────────────────
  // 1. CASE 0 CHỈ SỐ: DANH SÁCH RỖNG
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 1: 0 indicators - Renders single page gracefully with patient header and signature', () => {
    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={[]}
        conclusion="Chưa thực hiện xét nghiệm chỉ số."
      />
    );

    const pages = container.querySelectorAll('.report-page');
    expect(pages.length).toBe(1);
    expect(screen.getByText('TRẦN VĂN MẪU')).toBeDefined();
    expect(screen.getByText('Chưa thực hiện xét nghiệm chỉ số.')).toBeDefined();
    expect(screen.getByText('PHỤ TRÁCH CHUYÊN MÔN')).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 2. CASE 1 CHỈ SỐ: ĐƠN LẺ (VÍ DỤ: GLUCOSE HOẶC TEST NHANH)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 2: 1 single indicator - Renders 1 page with 14mm left/right margin and bottom footer', () => {
    const singleTest: SelectedTest[] = [
      {
        code: 'GLU',
        name: 'Glucose máu lúc đói',
        category: 'Sinh hóa máu',
        result: '5.4',
        unit: 'mmol/L',
        refMin: 3.9,
        refMax: 6.4,
        refText: '3.9 - 6.4',
        price: 40000,
        note: 'Bình thường'
      }
    ];

    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={singleTest}
        conclusion="Chỉ số đường huyết bình thường."
      />
    );

    const pages = container.querySelectorAll('.report-page');
    expect(pages.length).toBe(1);
    const pageEl = pages[0] as HTMLElement;
    expect(pageEl.style.padding).toBe('10mm 14mm');
    expect(pageEl.style.width).toBe('210mm');
    expect(screen.getByText('Glucose máu lúc đói')).toBeDefined();
    expect(screen.getByText('5.4')).toBeDefined();
    expect(screen.getByText(/Trang 1\/1/i)).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 3. CASE 3 CHỈ SỐ: TIỂU TIẾT (VÍ DỤ BỘ XÉT NGHIỆM CHỨC NĂNG THẬN)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 3: 3 indicators - Renders compact table within 1 page without extra page break', () => {
    const tests = createMockTests(3, 'Chức năng thận');
    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
        conclusion="Chức năng thận trong giới hạn bình thường."
      />
    );

    const pages = container.querySelectorAll('.report-page');
    expect(pages.length).toBe(1);
    expect(screen.getByText('Chỉ số xét nghiệm kiểm tra số 1')).toBeDefined();
    expect(screen.getByText('Chỉ số xét nghiệm kiểm tra số 3')).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 4. CASE 8 CHỈ SỐ: GÓI TIÊU CHUẨN ĐIỂN HÌNH (VỪA KHÍT NỬA TRANG A4)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 4: 8 indicators - Typical routine checkup fitting comfortably on 1 page', () => {
    const tests = createMockTests(8, 'Sinh hóa & Huyết học');
    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
        conclusion="Các chỉ số xét nghiệm kiểm tra sức khỏe tổng quát ổn định."
      />
    );

    const pages = container.querySelectorAll('.report-page');
    expect(pages.length).toBe(1);
    expect(screen.getAllByText(/Sinh hóa & Huyết học/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Chỉ số xét nghiệm kiểm tra số 8')).toBeDefined();
    expect(screen.getByText(/Trang 1\/1/i)).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 5. CASE 10 CHỈ SỐ: NGƯỠNG AN TOÀN CỦA 1 TRANG A4 (BOUNDARY TEST)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 5: 10 indicators with conclusion - Tests single page capacity boundary', () => {
    const tests = createMockTests(10, 'Sinh hóa máu');
    const pages = ReportPaginationDomainService.paginate(tests, 'Đề nghị ăn uống giảm tinh bột.');

    // 10 chỉ số trong 1 danh mục nằm trọn vẹn trong 1 trang A4
    expect(pages.length).toBe(1);
    expect(pages[0].isFirstPage).toBe(true);
    expect(pages[0].isLastPage).toBe(true);
    expect(pages[0].showSignature).toBe(true);

    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
        conclusion="Đề nghị ăn uống giảm tinh bột."
      />
    );
    expect(container.querySelectorAll('.report-page').length).toBe(1);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 6. CASE 18 CHỈ SỐ KÈM KẾT LUẬN DÀI: CHẠM NGƯỠNG CHUYỂN TRANG THÔNG MINH
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 6: 18 indicators with detailed clinical conclusion - Splits into exactly 2 pages', () => {
    const tests = createMockTests(18, 'Tổng quát mở rộng');
    const longConclusion =
      'Bệnh nhân có một số chỉ số men gan AST và ALT tăng nhẹ so với trị số tham chiếu. Khuyến cáo kiêng rượu bia, hạn chế dầu mỡ, uống nhiều nước và theo dõi tái khám sau 30 ngày.';

    const pages = ReportPaginationDomainService.paginate(tests, longConclusion);
    expect(pages.length).toBe(2);
    expect(pages[0].isFirstPage).toBe(true);
    expect(pages[0].isLastPage).toBe(false);
    expect(pages[0].showSignature).toBe(false);

    expect(pages[1].isFirstPage).toBe(false);
    expect(pages[1].isLastPage).toBe(true);
    expect(pages[1].showSignature).toBe(true);
    expect(pages[1].showConclusion).toBe(true);

    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
        conclusion={longConclusion}
      />
    );
    const pageEls = container.querySelectorAll('.report-page');
    expect(pageEls.length).toBe(2);
    expect((pageEls[0] as HTMLElement).style.padding).toBe('10mm 14mm');
    expect((pageEls[1] as HTMLElement).style.padding).toBe('10mm 14mm');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 7. CASE 28 CHỈ SỐ: GÓI XÉT NGHIỆM CHUYÊN SÂU (2 TRANG HOÀN CHỈNH)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 7: 28 indicators - Generates 2 full pages with page 1 full header and page 2 mini-header', () => {
    const tests = createMockTests(28, 'Gói VIP');
    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
        conclusion="Chỉ số lipid máu tăng, chức năng thận bình thường."
      />
    );

    const pages = container.querySelectorAll('.report-page');
    expect(pages.length).toBe(2);

    // Trang 1: Có đầy đủ logo và slogan
    expect(screen.getByText('Vì sức khỏe người Việt')).toBeDefined();
    expect(screen.getByText('69 CHI NHÁNH TRÊN TOÀN QUỐC')).toBeDefined();

    // Trang 2: Có mini header và thông tin tóm tắt bệnh nhân
    expect(screen.getByText('GOLAB CLINICAL LAB')).toBeDefined();
    expect(screen.getByText(/Trang 1\/2/i)).toBeDefined();
    expect(screen.getByText(/Trang 2\/2/i)).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 8. CASE 40 CHỈ SỐ: GÓI TẦM SOÁT TOÀN DIỆN (NĂNG LỰC NHIỀU TRANG)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 8: 40 indicators - Generates multiple pages with seamless pagination and numbering', () => {
    const tests = createMockTests(40, 'Tầm soát đa cơ quan');
    const pages = ReportPaginationDomainService.paginate(tests, 'Cần làm thêm siêu âm ổ bụng.');
    expect(pages.length).toBeGreaterThanOrEqual(2);

    const { container } = render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
        conclusion="Cần làm thêm siêu âm ổ bụng."
      />
    );

    const pageEls = container.querySelectorAll('.report-page');
    expect(pageEls.length).toBe(pages.length);

    // Tất cả các trang đều phải giữ kích thước 210mm và padding 10mm 14mm
    pageEls.forEach((p) => {
      const el = p as HTMLElement;
      expect(el.style.width).toBe('210mm');
      expect(el.style.padding).toBe('10mm 14mm');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 9. CASE HYBRID: 3 CHỈ SỐ THƯỜNG + GÓI 91 DỊ NGUYÊN
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 9: Hybrid report with 3 regular tests + 1 allergen panel - Verifies regular + booklet bundle', () => {
    const tests: SelectedTest[] = [
      ...createMockTests(3, 'Huyết học'),
      {
        code: 'ALLER-01',
        name: 'Dị ứng phấn hoa',
        category: 'Dị nguyên',
        result: '3.5',
        unit: 'kU/L',
        refText: '< 0.35',
        price: 200000,
        note: 'Dương tính'
      }
    ];

    const { container } = render(
      <HybridReportView
        patient={basePatient}
        selectedTests={tests}
        clinicInfo={DEFAULT_CLINIC_INFO}
        conclusion="Bệnh nhân dị ứng với phấn hoa, tránh tiếp xúc vào mùa hoa nở."
      />
    );

    const pages = container.querySelectorAll('.report-page');
    // Ít nhất có trang xét nghiệm thường + các trang dị nguyên
    expect(pages.length).toBeGreaterThanOrEqual(2);

    // Kiểm tra lề chuẩn 10mm 14mm trên tất cả các trang
    pages.forEach((p) => {
      const el = p as HTMLElement;
      expect(el.style.padding).toBe('10mm 14mm');
    });

    expect(screen.getByText(/TỔNG GIÁ:/i)).toBeDefined();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 10. CASE HYBRID VỚI 22 CHỈ SỐ THƯỜNG (PHẦN THƯỜNG TỰ PHÂN THÀNH 2 TRANG)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 10: Hybrid report with 22 regular tests - Regular tests split into 2 pages before allergen pages', () => {
    const tests: SelectedTest[] = [
      ...createMockTests(22, 'Sinh hóa VIP'),
      {
        code: 'ALLER-02',
        name: 'Dị ứng tôm cua',
        category: 'Dị nguyên',
        result: '4.2',
        unit: 'kU/L',
        refText: '< 0.35',
        price: 250000,
        note: 'Dương tính'
      }
    ];

    const { container } = render(
      <HybridReportView
        patient={basePatient}
        selectedTests={tests}
        clinicInfo={DEFAULT_CLINIC_INFO}
      />
    );

    const pages = container.querySelectorAll('.report-page');
    // 2 trang thường + ít nhất 1 trang dị nguyên
    expect(pages.length).toBeGreaterThanOrEqual(3);

    // Kiểm tra lề 10mm 14mm nhất quán
    pages.forEach((p) => {
      const el = p as HTMLElement;
      expect(el.style.padding).toBe('10mm 14mm');
      expect(el.style.width).toBe('210mm');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 11. CASE CHỈ SỐ BẤT THƯỜNG (CẢNH BÁO MÀU ĐỎ / ĐẬM)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 11: Abnormal indicators - Highlights out-of-range values in bold red text', () => {
    const tests: SelectedTest[] = [
      {
        code: 'GLU_HIGH',
        name: 'Glucose máu',
        category: 'Sinh hóa máu',
        result: '12.5', // Rất cao (> 6.4)
        unit: 'mmol/L',
        refMin: 3.9,
        refMax: 6.4,
        refText: '3.9 - 6.4',
        price: 40000,
        note: 'CAO'
      },
      {
        code: 'WBC_NORMAL',
        name: 'Bạch cầu',
        category: 'Huyết học',
        result: '6.0',
        unit: 'G/L',
        refMin: 4.0,
        refMax: 10.0,
        refText: '4.0 - 10.0',
        price: 40000,
        note: 'Bình thường'
      }
    ];

    render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
      />
    );

    const resultCell = screen.getByText('12.5');
    expect(resultCell.className).toContain('text-red-600');
    expect(resultCell.className).toContain('font-bold');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // 12. CASE THIẾT BỊ XỬ LÝ (EQUIPMENT RESOLUTION IN PRINT TABLE)
  // ───────────────────────────────────────────────────────────────────────────
  it('CASE 12: Test equipments - Resolves and formats equipment names neatly without breaking table width', () => {
    const tests: SelectedTest[] = [
      {
        code: 'CRE',
        name: 'Creatinine máu',
        category: 'Sinh hóa máu',
        result: '80.0',
        unit: 'µmol/L',
        refMin: 62,
        refMax: 115,
        refText: '62 - 115',
        price: 45000,
        note: 'Bình thường'
      }
    ];

    const mockEquipments = [
      { id: 'eq-1', code: 'MS-360', name: 'Máy sinh hóa tự động MS-360 Pro High Throughput Analyzer', category: 'Sinh hóa' }
    ];
    const mockLinks = [
      { id: 'l-1', catalogCode: 'CRE', equipmentId: 'eq-1', isPrimary: true, isDefault: true }
    ];

    render(
      <PrintReportView
        patient={basePatient}
        selectedTests={tests}
        equipments={mockEquipments}
        catalogItemEquipments={mockLinks}
      />
    );

    // Tên máy có chứa mã thiết bị (MS-360) được hiển thị chính xác trong bảng
    expect(screen.getByText(/MS-360/)).toBeDefined();
  });
});
