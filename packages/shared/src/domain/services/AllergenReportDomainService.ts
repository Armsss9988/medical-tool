import { SelectedTest, TestPackage, AllergenDatabaseItem, AllergenGradingScale, getPkgCodes, getPkgItems } from '../types';
import { calculateAllergenGrade, getAllergenScaleById } from '../allergen';
import { computePricingWithPackages } from '../pricing';
import { isTIgETest } from '../allergenDetector';

export interface AllergenReportItemDTO {
  tt: number;
  code: string;
  name: string;
  allergenName: string;
  route: string;
  normalRef: string;
  result: string;
  unit?: string;
  grade: number;
  isPositive: boolean;
  isTIgE: boolean;
  note: string;
  scale?: AllergenGradingScale;
}

export interface AllergenReportDTO {
  detailedList: AllergenReportItemDTO[];
  positiveList: AllergenReportItemDTO[];
  tigeItem?: AllergenReportItemDTO | null;
  hasTIgE: boolean;
  totalCount: number;
  packagePrice: number;
  packageName?: string;
  detailPages: AllergenReportItemDTO[][];
  totalPages: number;
  appliedScales: AllergenGradingScale[];
}

export interface BuildAllergenReportParams {
  tests: SelectedTest[];
  allTests?: SelectedTest[];
  testPackages?: TestPackage[];
  packagePrice?: number;
  databaseItems?: AllergenDatabaseItem[];
  itemsPerPage?: number;
  customScales?: AllergenGradingScale[];
}

export class AllergenReportDomainService {
  public static readonly DEFAULT_ITEMS_PER_PAGE = 13;
  public static readonly DEFAULT_PACKAGE_PRICE = 1900000;
  public static readonly TIGE_NORMAL_MAX = 15.0;

  public static buildReportDTO(params: BuildAllergenReportParams): AllergenReportDTO {
    const {
      tests = [],
      allTests = [],
      testPackages = [],
      packagePrice: explicitPackagePrice,
      databaseItems = [],
      itemsPerPage = AllergenReportDomainService.DEFAULT_ITEMS_PER_PAGE,
      customScales = []
    } = params;

    const dbMap = new Map<string, AllergenDatabaseItem>();
    databaseItems.forEach((item) => {
      if (item.code) dbMap.set(item.code.toLowerCase(), item);
      if (item.name) dbMap.set(item.name.toLowerCase(), item);
    });

    const pricingTests = allTests && allTests.length > 0 ? allTests : tests;
    const allCodeList = pricingTests.map((t) => (t.code || '').trim().toLowerCase());
    const codeSet = new Set(allCodeList);
    const testCount = tests.length;

    // 1. Nhận diện gói dị nguyên tối ưu nhất trước để áp dụng đúng thứ tự chỉ số
    let matchedPkg: TestPackage | undefined;
    if (testPackages && testPackages.length > 0) {
      const validPackages = testPackages.filter(
        (p) => getPkgCodes(p).length > 0 && p.price > 0
      );

      // Tìm các gói khớp toàn bộ chỉ số (cho phép có hoặc thiếu TIgE bất kể biến thể)
      const fullMatches = validPackages.filter((pkg) => {
        const pCodes = getPkgCodes(pkg).map((c) => c.trim().toLowerCase());
        const nonTIgECodes = pCodes.filter((c) => !isTIgETest({ code: c }));
        return pCodes.every((c) => codeSet.has(c)) || (nonTIgECodes.length > 0 && nonTIgECodes.every((c) => codeSet.has(c)));
      });

      if (fullMatches.length > 0) {
        fullMatches.sort((a, b) => {
          const diffA = Math.abs(getPkgCodes(a).length - testCount);
          const diffB = Math.abs(getPkgCodes(b).length - testCount);
          return diffA - diffB;
        });
        matchedPkg = fullMatches[0];
      } else {
        let maxOverlap = 0;
        let minDiff = Infinity;
        for (const pkg of validPackages) {
          const pCodes = getPkgCodes(pkg).map((c) => c.trim().toLowerCase());
          const overlap = pCodes.filter((c) => codeSet.has(c)).length;
          const ratio = overlap / pCodes.length;
          if (ratio >= 0.75) {
            const diff = Math.abs(pCodes.length - testCount);
            if (overlap > maxOverlap || (overlap === maxOverlap && diff < minDiff)) {
              maxOverlap = overlap;
              minDiff = diff;
              matchedPkg = pkg;
            }
          }
        }
      }
    }

    // Xây dựng bản đồ orderIndex từ gói dị nguyên phù hợp nhất (hoặc gói 90 mặc định)
    const allergenPkg = matchedPkg || testPackages.find((p) => p.id === 'di_nguyen_90') ||
      testPackages.find((p) => p.id.includes('di_nguyen'));
    const allergenOrderMap = new Map<string, number>();
    if (allergenPkg) {
      const pkgItems = getPkgItems(allergenPkg);
      pkgItems.forEach((item, idx) => {
        const order = typeof item.orderIndex === 'number' ? item.orderIndex : idx;
        allergenOrderMap.set(item.code.trim().toLowerCase(), order);
      });
    }

    // Sắp xếp các chỉ số dị nguyên theo đúng order_index của package_items (TIgE luôn đứng đầu)
    const sortedTests = [...tests].sort((a, b) => {
      const isA = isTIgETest(a);
      const isB = isTIgETest(b);
      if (isA) return -1;
      if (isB) return 1;

      const codeA = (a.code || '').trim().toLowerCase();
      const codeB = (b.code || '').trim().toLowerCase();
      const orderA = allergenOrderMap.has(codeA) ? allergenOrderMap.get(codeA)! : (dbMap.get(codeA)?.tt ?? 999);
      const orderB = allergenOrderMap.has(codeB) ? allergenOrderMap.get(codeB)! : (dbMap.get(codeB)?.tt ?? 999);
      return orderA - orderB;
    });

    const appliedScalesMap = new Map<string, AllergenGradingScale>();

    const detailedList: AllergenReportItemDTO[] = sortedTests.map((t, idx) => {
      const dbItem = dbMap.get((t.code || '').toLowerCase()) || dbMap.get((t.name || '').toLowerCase());
      const isTIgE = isTIgETest(t) || (dbItem ? isTIgETest(dbItem) : false);

      // Lấy thang đo gắn ở cấp chỉ số (ưu tiên t.scaleId -> dbItem.scaleId -> mặc định)
      const scaleId = t.scaleId || dbItem?.scaleId;
      const scale = getAllergenScaleById(scaleId, customScales);

      let isPositive = false;
      let grade = 0;

      const maxTIgERef = t.refMax !== null && t.refMax !== undefined ? Number(t.refMax) : AllergenReportDomainService.TIGE_NORMAL_MAX;

      let allergenNote = t.note || dbItem?.note || '';
      if (isTIgE) {
        const numVal = parseFloat(String(t.result || '').replace(',', '.'));
        const isHighByNote = t.note
          ? t.note.includes('Cao') || t.note.includes('Tăng') || t.note.includes('Dương tính')
          : false;
        isPositive = (!isNaN(numVal) && numVal > maxTIgERef) || isHighByNote;
        grade = 0;
      } else {
        const gradeRes = calculateAllergenGrade(t.result || t.note, scale);
        grade = gradeRes.grade;
        isPositive = grade >= 1;
        if (!allergenNote) {
          allergenNote = gradeRes.note;
        }
        if (scale) {
          appliedScalesMap.set(scale.id, scale);
        }
      }

      const ext = t as SelectedTest & { allergenName?: string; route?: string };
      const cleanRefText = t.refText ? t.refText.replace(/\s*\(Độ\s*0\)/i, '').trim() : '';
      const formattedMaxTIgE = Number.isInteger(maxTIgERef) ? `<${maxTIgERef},0` : `<${maxTIgERef}`.replace('.', ',');
      let normalRef = isTIgE
        ? (t.refText || formattedMaxTIgE)
        : (scale?.levels[0]?.rangeText
            || cleanRefText
            || dbItem?.normalRef
            || (scale?.levels[0]?.maxVal !== undefined && scale?.levels[0]?.maxVal !== null ? `<${scale.levels[0].maxVal}` : '<0.34'));

      // Chuẩn hóa và làm sạch normalRef cho dị nguyên
      if (!isTIgE) {
        normalRef = normalRef.replace(/\s*\(Độ\s*0\)/i, '').trim();
        const isStandardAllergen = scaleId === 'scale_allergen_44' || scaleId === 'scale_protia_91' || scale?.levels[0]?.maxVal === 0.34;
        if (isStandardAllergen && /0[.,]35/.test(normalRef)) {
          normalRef = '<0.34';
        }
        // Chuẩn hóa dấu phẩy thành dấu chấm cho đồng nhất giữa các cột
        normalRef = normalRef.replace(',', '.');
      }

      const rawResultStr = (t.result !== undefined && t.result !== null && String(t.result).trim() !== '')
        ? String(t.result).trim()
        : '';

      // Tự động điền giá trị kết quả Độ 0 chuẩn theo thang đo cho dị nguyên:
      // - Với Total IgE (TIgE): Giữ nguyên chuỗi nhập (không tự ý điền kết quả nếu chưa đo)
      // - Với dị nguyên thông thường:
      //   + Nếu trống (''), tự động điền normalRef (ví dụ <0.34)
      //   + Nếu mang giá trị âm tính Độ 0 (ví dụ <0.35, <0.34, < 0.35, Âm tính...) và không dương tính (grade === 0):
      //     Đồng bộ 100% với normalRef để cột BÌNH THƯỜNG và KẾT QUẢ khớp hoàn toàn, không bị lệch
      let effectiveResult = '';
      if (isTIgE) {
        effectiveResult = rawResultStr;
      } else {
        const isNegativeOrPlaceholder =
          rawResultStr === '' ||
          /^<\s*0[.,]3[45]$/i.test(rawResultStr) ||
          /^<\s*0[.,]34/i.test(rawResultStr) ||
          /^Âm tính/i.test(rawResultStr) ||
          /^Không phản ứng/i.test(rawResultStr) ||
          (grade === 0 && rawResultStr.startsWith('<')) ||
          rawResultStr.replace(',', '.') === normalRef;

        effectiveResult = isNegativeOrPlaceholder ? normalRef : rawResultStr;
      }

      return {
        tt: idx + 1,
        code: t.code || dbItem?.code || `DN${idx + 1}`,
        name: t.name || dbItem?.name || 'Dị nguyên',
        allergenName: ext.allergenName || dbItem?.allergenName || (isTIgE ? 'Total IgE' : t.name),
        route: ext.route || dbItem?.route || (isTIgE ? 'Kháng thể huyết thanh' : 'Đường tiêu hóa / Hô hấp'),
        normalRef,
        result: effectiveResult,
        unit: t.unit || 'IU/ml',
        grade,
        isPositive,
        isTIgE,
        note: allergenNote,
        scale: isTIgE ? undefined : scale
      };
    });

    // Tìm kiếm thông tin chỉ số TIgE (nếu có trong tests hoặc trong allTests)
    let tigeItem: AllergenReportItemDTO | null = detailedList.find((item) => item.isTIgE) || null;
    if (!tigeItem && allTests && allTests.length > 0) {
      const foundTIgE = allTests.find(isTIgETest);
      if (foundTIgE) {
        const maxTIgERef = foundTIgE.refMax !== null && foundTIgE.refMax !== undefined ? Number(foundTIgE.refMax) : AllergenReportDomainService.TIGE_NORMAL_MAX;
        const formattedMax = Number.isInteger(maxTIgERef) ? `<${maxTIgERef},0` : `<${maxTIgERef}`.replace('.', ',');
        const normalRef = foundTIgE.refText || formattedMax;
        const numVal = parseFloat(String(foundTIgE.result || '').replace(',', '.'));
        const isHigh = (!isNaN(numVal) && numVal > maxTIgERef) || (foundTIgE.note?.includes('Tăng') || foundTIgE.note?.includes('Cao') || foundTIgE.note?.includes('Dương tính') || false);

        tigeItem = {
          tt: 0,
          code: foundTIgE.code || 'TIgE',
          name: foundTIgE.name || 'Tổng nồng độ IgE (Total IgE)',
          allergenName: 'Total IgE',
          route: 'Kháng thể huyết thanh',
          normalRef,
          result: foundTIgE.result || '',
          unit: foundTIgE.unit || 'IU/ml',
          grade: 0,
          isPositive: !!isHigh,
          isTIgE: true,
          note: foundTIgE.note || (isHigh ? `Tăng (>${maxTIgERef} IU/ml)`.replace('.', ',') : 'Bình thường')
        };
      }
    }

    const hasTIgE = tigeItem !== null;

    // Lọc danh sách hiển thị trên Trang 2 (Bảng Dị Nguyên Dương Tính):
    // Chỉ hiển thị các mục dương tính (TIgE khi > 15.0 IU/mL hoặc các dị nguyên đặc hiệu có Độ >= 1).
    const tIgEPositiveItem = (tigeItem && tigeItem.isPositive) ? tigeItem : null;
    const positiveList: AllergenReportItemDTO[] = [
      ...(tIgEPositiveItem ? [tIgEPositiveItem] : []),
      ...detailedList.filter((item) => !item.isTIgE && item.isPositive)
    ];

    const totalCount = detailedList.length;

    // Tính giá gói
    let finalPackagePrice = 0;
    if (explicitPackagePrice !== undefined && explicitPackagePrice > 0) {
      finalPackagePrice = explicitPackagePrice;
    } else if (matchedPkg) {
      finalPackagePrice = matchedPkg.price;
    } else if (testPackages && testPackages.length > 0) {
      const pricing = computePricingWithPackages(
        allCodeList,
        pricingTests,
        testPackages
      );
      if (pricing.total > 0) {
        finalPackagePrice = pricing.total;
      }
    }

    // Fallback nếu không có cấu hình gói
    if (!finalPackagePrice || finalPackagePrice <= 0) {
      const sumIndividual = tests.reduce((sum, item) => sum + (item.price || 0), 0);
      if (sumIndividual > 0) {
        finalPackagePrice = sumIndividual;
      } else {
        if (totalCount === 0) finalPackagePrice = 0;
        else if (totalCount <= 20) finalPackagePrice = 950000;
        else if (totalCount <= 44) finalPackagePrice = 1400000;
        else if (totalCount <= 61) finalPackagePrice = 1600000;
        else finalPackagePrice = 1900000;
      }
    }

    // Phân chia danh sách chi tiết (13 dòng / trang)
    const detailPages: AllergenReportItemDTO[][] = [];
    for (let i = 0; i < detailedList.length; i += itemsPerPage) {
      detailPages.push(detailedList.slice(i, i + itemsPerPage));
    }
    if (detailPages.length === 0) {
      detailPages.push([]);
    }

    const totalPages = detailPages.length + 3; // Trang 1 bìa + Trang 2 tổng hợp + Các trang chi tiết + Trang cuối lưu ý

    // Nếu không có thang đo nào trong chi tiết nhưng có xét nghiệm dị nguyên không phải TIgE, lấy thang đo đầu tiên từ customScales nếu có
    const nonTIgECount = detailedList.filter((i) => !i.isTIgE).length;
    if (appliedScalesMap.size === 0 && nonTIgECount > 0) {
      const defaultScale = getAllergenScaleById(undefined, customScales);
      if (defaultScale) {
        appliedScalesMap.set(defaultScale.id, defaultScale);
      }
    }

    const appliedScales = Array.from(appliedScalesMap.values());

    return {
      detailedList,
      positiveList,
      tigeItem,
      hasTIgE,
      totalCount,
      packagePrice: finalPackagePrice,
      packageName: matchedPkg?.name,
      detailPages,
      totalPages,
      appliedScales
    };
  }
}

