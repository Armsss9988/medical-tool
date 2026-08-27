import { SelectedTest, TestPackage, AllergenDatabaseItem, AllergenGradingScale } from '../types';
import { calculateAllergenGrade } from '../allergen';
import { computePricingWithPackages } from '../pricing';
import { getAllergenScaleById, DEFAULT_PROTIA_91_SCALE } from '../constants/allergenScales';

export interface AllergenReportItemDTO {
  tt: number;
  code: string;
  name: string;
  allergenName: string;
  route: string;
  normalRef: string;
  result: string;
  grade: number;
  isPositive: boolean;
  isTIgE: boolean;
  note: string;
  scale?: AllergenGradingScale;
}

export interface AllergenReportDTO {
  detailedList: AllergenReportItemDTO[];
  positiveList: AllergenReportItemDTO[];
  totalCount: number;
  packagePrice: number;
  detailPages: AllergenReportItemDTO[][];
  totalPages: number;
  appliedScales: AllergenGradingScale[];
}

export interface BuildAllergenReportParams {
  tests: SelectedTest[];
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
      const itemCode = (t.code || dbItem?.code || '').toLowerCase();
      const isTIgE = itemCode === 'tige';

      // Lấy thang đo gắn ở cấp chỉ số (ưu tiên t.scaleId -> dbItem.scaleId -> mặc định)
      const scaleId = t.scaleId || dbItem?.scaleId;
      const scale = getAllergenScaleById(scaleId, customScales);

      let isPositive = false;
      let grade = 0;

      if (isTIgE) {
        const numVal = parseFloat(String(t.result || '').replace(',', '.'));
        const isHighByNote = t.note
          ? t.note.includes('Cao') || t.note.includes('Tăng') || t.note.includes('Dương tính')
          : false;
        isPositive = (!isNaN(numVal) && numVal > AllergenReportDomainService.TIGE_NORMAL_MAX) || isHighByNote;
        grade = 0;
      } else {
        const gradeRes = calculateAllergenGrade(t.result || t.note, scale);
        grade = gradeRes.grade;
        isPositive = grade >= 1;
        appliedScalesMap.set(scale.id, scale);
      }

      const ext = t as SelectedTest & { allergenName?: string; route?: string };

      return {
        tt: idx + 1,
        code: t.code || dbItem?.code || `DN${idx + 1}`,
        name: t.name || dbItem?.name || 'Dị nguyên',
        allergenName: ext.allergenName || dbItem?.allergenName || (isTIgE ? 'Total IgE' : t.name),
        route: ext.route || dbItem?.route || (isTIgE ? 'Kháng thể huyết thanh' : 'Đường tiêu hóa / Hô hấp'),
        normalRef: isTIgE
          ? '<15,0'
          : (dbItem?.normalRef || (t.refMin !== null && t.refMax !== null ? `${t.refMin} - ${t.refMax}` : (scale.levels[0]?.rangeText || '<0,34'))),
        result: t.result || (isTIgE ? '' : (scale.levels[0]?.rangeText ? `<${scale.levels[1]?.minVal || 0.15}`.replace('.', ',') : '<0,15')),
        grade,
        isPositive,
        isTIgE,
        note: t.note || dbItem?.note || '',
        scale: isTIgE ? undefined : scale
      };
    });

    // Lọc danh sách hiển thị trên Trang 2 (Bảng Dị Nguyên Dương Tính):
    // Chỉ hiển thị các mục dương tính (TIgE khi > 15.0 IU/mL hoặc các dị nguyên đặc hiệu có Độ >= 1).
    // Ưu tiên đưa TIgE lên hàng đầu nếu TIgE dương tính (> 15.0).
    const tIgEPositiveItem = detailedList.find((item) => item.isTIgE && item.isPositive);
    const positiveList: AllergenReportItemDTO[] = [
      ...(tIgEPositiveItem ? [tIgEPositiveItem] : []),
      ...detailedList.filter((item) => !item.isTIgE && item.isPositive)
    ];

    const totalCount = detailedList.length || 41;

    // Tính giá gói động
    let finalPackagePrice = AllergenReportDomainService.DEFAULT_PACKAGE_PRICE;
    if (explicitPackagePrice !== undefined && explicitPackagePrice > 0) {
      finalPackagePrice = explicitPackagePrice;
    } else if (testPackages && testPackages.length > 0) {
      const pricing = computePricingWithPackages(
        tests.map((t) => t.code),
        tests,
        testPackages
      );
      if (pricing.total > 0) {
        finalPackagePrice = pricing.total;
      } else {
        const sumIndividual = tests.reduce((sum, item) => sum + (item.price || 0), 0);
        if (sumIndividual > 0) finalPackagePrice = sumIndividual;
      }
    } else {
      const sumIndividual = tests.reduce((sum, item) => sum + (item.price || 0), 0);
      if (sumIndividual > 0) finalPackagePrice = sumIndividual;
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

    const appliedScales = Array.from(appliedScalesMap.values());
    if (appliedScales.length === 0) {
      appliedScales.push(DEFAULT_PROTIA_91_SCALE);
    }

    return {
      detailedList,
      positiveList,
      totalCount,
      packagePrice: finalPackagePrice,
      detailPages,
      totalPages,
      appliedScales
    };
  }
}
