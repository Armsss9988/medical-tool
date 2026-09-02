import { SelectedTest, TestPackage, AllergenDatabaseItem, AllergenGradingScale, getPkgCodes } from '../types';
import { calculateAllergenGrade } from '../allergen';
import { computePricingWithPackages } from '../pricing';
import { getAllergenScaleById } from '../constants/allergenScales';
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

    const appliedScalesMap = new Map<string, AllergenGradingScale>();

    const detailedList: AllergenReportItemDTO[] = tests.map((t, idx) => {
      const dbItem = dbMap.get((t.code || '').toLowerCase()) || dbMap.get((t.name || '').toLowerCase());
      const isTIgE = isTIgETest(t) || (dbItem ? isTIgETest(dbItem) : false);

      // Lấy thang đo gắn ở cấp chỉ số (ưu tiên t.scaleId -> dbItem.scaleId -> mặc định)
      const scaleId = t.scaleId || dbItem?.scaleId;
      const scale = getAllergenScaleById(scaleId, customScales);

      let isPositive = false;
      let grade = 0;

      const maxTIgERef = t.refMax !== null && t.refMax !== undefined ? Number(t.refMax) : AllergenReportDomainService.TIGE_NORMAL_MAX;

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
        if (scale) {
          appliedScalesMap.set(scale.id, scale);
        }
      }

      const ext = t as SelectedTest & { allergenName?: string; route?: string };
      const normalRef = isTIgE
        ? (t.refText || (t.refMin !== null && t.refMin !== undefined && t.refMax !== null && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : `<${maxTIgERef}`.replace('.', ',')))
        : (dbItem?.normalRef || (t.refMin !== null && t.refMin !== undefined && t.refMax !== null && t.refMax !== undefined ? `${t.refMin} - ${t.refMax}` : (scale?.levels[0]?.rangeText || '<0,34')));

      return {
        tt: idx + 1,
        code: t.code || dbItem?.code || `DN${idx + 1}`,
        name: t.name || dbItem?.name || 'Dị nguyên',
        allergenName: ext.allergenName || dbItem?.allergenName || (isTIgE ? 'Total IgE' : t.name),
        route: ext.route || dbItem?.route || (isTIgE ? 'Kháng thể huyết thanh' : 'Đường tiêu hóa / Hô hấp'),
        normalRef,
        result: t.result || (isTIgE ? '' : (scale?.levels[0]?.rangeText ? `<${scale.levels[1]?.minVal || 0.15}`.replace('.', ',') : '<0,15')),
        unit: t.unit || 'IU/ml',
        grade,
        isPositive,
        isTIgE,
        note: t.note || dbItem?.note || '',
        scale: isTIgE ? undefined : scale
      };
    });

    // Tìm kiếm thông tin chỉ số TIgE (nếu có trong tests hoặc trong allTests)
    let tigeItem: AllergenReportItemDTO | null = detailedList.find((item) => item.isTIgE) || null;
    if (!tigeItem && allTests && allTests.length > 0) {
      const foundTIgE = allTests.find(isTIgETest);
      if (foundTIgE) {
        const maxTIgERef = foundTIgE.refMax !== null && foundTIgE.refMax !== undefined ? Number(foundTIgE.refMax) : AllergenReportDomainService.TIGE_NORMAL_MAX;
        const normalRef = foundTIgE.refText || (foundTIgE.refMin !== null && foundTIgE.refMin !== undefined && foundTIgE.refMax !== null && foundTIgE.refMax !== undefined ? `${foundTIgE.refMin} - ${foundTIgE.refMax}` : `<${maxTIgERef}`.replace('.', ','));
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

    const totalCount = detailedList.length || 41;

    // Tập hợp toàn bộ mã xét nghiệm để tính giá (gộp cả tests, allTests và tigeItem nếu có)
    const pricingTests = allTests && allTests.length > 0 ? allTests : tests;
    const allCodeList = pricingTests.map((t) => (t.code || '').trim().toLowerCase());
    if (tigeItem?.code && !allCodeList.includes(tigeItem.code.trim().toLowerCase())) {
      allCodeList.push(tigeItem.code.trim().toLowerCase());
    }
    const codeSet = new Set(allCodeList);

    // Thuật toán nhận diện gói dị nguyên tối ưu nhất
    let matchedPkg: TestPackage | undefined;
    if (testPackages && testPackages.length > 0) {
      const validPackages = testPackages.filter(
        (p) => getPkgCodes(p).length > 0 && p.price > 0
      );

      // 1. Tìm các gói khớp toàn bộ chỉ số (cho phép có hoặc thiếu TIgE)
      const fullMatches = validPackages.filter((pkg) => {
        const pCodes = getPkgCodes(pkg).map((c) => c.trim().toLowerCase());
        const nonTIgECodes = pCodes.filter((c) => c !== 'tige');
        return pCodes.every((c) => codeSet.has(c)) || (nonTIgECodes.length > 0 && nonTIgECodes.every((c) => codeSet.has(c)));
      });

      if (fullMatches.length > 0) {
        // Chọn gói có số lượng chỉ số gần nhất với số lượng dị nguyên đang phân tích (tránh gói 91 nuốt gói 44/61)
        fullMatches.sort((a, b) => {
          const diffA = Math.abs(getPkgCodes(a).length - totalCount);
          const diffB = Math.abs(getPkgCodes(b).length - totalCount);
          return diffA - diffB;
        });
        matchedPkg = fullMatches[0];
      } else {
        // 2. Nếu không khớp 100%, tìm gói có tỉ lệ bao phủ cao nhất (>= 75%)
        let maxOverlap = 0;
        let minDiff = Infinity;
        for (const pkg of validPackages) {
          const pCodes = getPkgCodes(pkg).map((c) => c.trim().toLowerCase());
          const overlap = pCodes.filter((c) => codeSet.has(c)).length;
          const ratio = overlap / pCodes.length;
          if (ratio >= 0.75) {
            const diff = Math.abs(pCodes.length - totalCount);
            if (overlap > maxOverlap || (overlap === maxOverlap && diff < minDiff)) {
              maxOverlap = overlap;
              minDiff = diff;
              matchedPkg = pkg;
            }
          }
        }
      }
    }

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
        if (totalCount <= 20) finalPackagePrice = 950000;
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

