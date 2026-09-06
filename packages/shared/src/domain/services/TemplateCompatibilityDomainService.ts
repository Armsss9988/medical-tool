import {
  TemplateBlockType,
  TemplateTargetType,
  ReportTemplate
} from '../templateTypes';
import { CatalogItem } from '../types';
import { isAllergenTest } from '../allergenDetector';

export type BlockCategory = 'common' | 'clinical' | 'allergen';

export interface TemplateValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
}

export interface DataCompatibilityResult {
  readonly isCompatible: boolean;
  readonly matchScore: number; // 0 -> 100
  readonly reason?: string;
  readonly isRecommendedDefault?: boolean;
}

export class TemplateCompatibilityDomainService {
  /**
   * Danh sách khối dùng chung cho mọi loại mẫu in
   */
  public static readonly COMMON_BLOCK_TYPES: ReadonlySet<TemplateBlockType> = new Set([
    'header',
    'title',
    'patient_info',
    'conclusion',
    'signature',
    'custom_text',
    'divider',
    'spacer',
    'page_break'
  ]);

  /**
   * Danh sách khối chuyên biệt cho xét nghiệm thường (Huyết học, Sinh hóa, Nước tiểu...)
   */
  public static readonly CLINICAL_BLOCK_TYPES: ReadonlySet<TemplateBlockType> = new Set([
    'test_table'
  ]);

  /**
   * Danh sách khối chuyên biệt cho xét nghiệm dị nguyên (Panel IgE)
   */
  public static readonly ALLERGEN_BLOCK_TYPES: ReadonlySet<TemplateBlockType> = new Set([
    'allergen_header',
    'allergen_title',
    'allergen_patient_summary',
    'allergen_positive_table',
    'allergen_scale_table',
    'allergen_symptoms_box',
    'allergen_tige_note',
    'allergen_detail_table',
    'allergen_prevention_guide',
    'allergen_cover_summary',
    'allergen_summary',
    'allergen_detail',
    'allergen_scale'
  ]);

  /**
   * Xác định nhóm chức năng của một block type
   */
  public static getBlockCategory(blockType: TemplateBlockType): BlockCategory {
    if (this.ALLERGEN_BLOCK_TYPES.has(blockType)) return 'allergen';
    if (this.CLINICAL_BLOCK_TYPES.has(blockType)) return 'clinical';
    return 'common';
  }

  /**
   * Kiểm tra một block type có tương thích với loại mẫu mục tiêu không
   */
  public static isBlockCompatibleWithTargetType(
    blockType: TemplateBlockType,
    targetType: TemplateTargetType = 'clinical'
  ): boolean {
    const category = this.getBlockCategory(blockType);
    if (category === 'common') return true;

    switch (targetType) {
      case 'hybrid':
      case 'general':
        return true;
      case 'clinical':
        return category === 'clinical';
      case 'allergen':
        return category === 'allergen';
      default:
        return true;
    }
  }

  /**
   * Lấy danh sách block types tương thích với targetType
   */
  public static getCompatibleBlockTypes(
    targetType: TemplateTargetType = 'clinical'
  ): TemplateBlockType[] {
    const allBlocks: TemplateBlockType[] = [
      ...Array.from(this.COMMON_BLOCK_TYPES),
      ...Array.from(this.CLINICAL_BLOCK_TYPES),
      ...Array.from(this.ALLERGEN_BLOCK_TYPES)
    ];
    return allBlocks.filter((type) => this.isBlockCompatibleWithTargetType(type, targetType));
  }

  /**
   * Kiểm tra tính toàn vẹn và cấu trúc của một Template theo TargetType
   */
  public static validateTemplateStructure(template: ReportTemplate): TemplateValidationResult {
    const targetType = template.targetType || 'clinical';
    const errors: string[] = [];
    const warnings: string[] = [];

    const visibleBlocks = (template.blocks || []).filter((b) => b.visible);
    const visibleTypes = new Set(visibleBlocks.map((b) => b.type));

    // 1. Kiểm tra các thành phần cốt lõi chung
    if (!visibleTypes.has('header') && !visibleTypes.has('allergen_header')) {
      warnings.push('Mẫu in chưa có khối Header phòng khám/đơn vị.');
    }
    if (!visibleTypes.has('patient_info') && !visibleTypes.has('allergen_patient_summary')) {
      warnings.push('Mẫu in chưa có khối Thông tin bệnh nhân.');
    }

    // 2. Ràng buộc theo loại Xét nghiệm thường (Clinical)
    if (targetType === 'clinical') {
      if (!visibleTypes.has('test_table')) {
        errors.push('Mẫu xét nghiệm thường bắt buộc phải có khối "Bảng Chỉ Số Xét Nghiệm" (test_table).');
      }
      const allergenBlocksFound = visibleBlocks.filter((b) => this.ALLERGEN_BLOCK_TYPES.has(b.type));
      if (allergenBlocksFound.length > 0) {
        warnings.push(
          `Mẫu xét nghiệm thường đang chứa ${allergenBlocksFound.length} khối dị nguyên không phù hợp.`
        );
      }
    }

    // 3. Ràng buộc theo loại Dị nguyên (Allergen)
    if (targetType === 'allergen') {
      const hasAllergenTable =
        visibleTypes.has('allergen_detail_table') ||
        visibleTypes.has('allergen_positive_table') ||
        visibleTypes.has('allergen_detail');
      if (!hasAllergenTable) {
        errors.push('Mẫu báo cáo dị nguyên bắt buộc phải có bảng kết quả dị nguyên (chi tiết hoặc dương tính).');
      }
      if (visibleTypes.has('test_table')) {
        warnings.push('Mẫu báo cáo dị nguyên đang chứa khối bảng chỉ số xét nghiệm thường (test_table).');
      }
    }

    // 4. Mẫu hỗn hợp (Hybrid)
    if (targetType === 'hybrid') {
      if (!visibleTypes.has('test_table')) {
        warnings.push('Mẫu hỗn hợp nên có bảng chỉ số thường (test_table).');
      }
      const hasAllergenTable =
        visibleTypes.has('allergen_detail_table') ||
        visibleTypes.has('allergen_positive_table') ||
        visibleTypes.has('allergen_detail');
      if (!hasAllergenTable) {
        warnings.push('Mẫu hỗn hợp nên có bảng kết quả dị nguyên.');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * So khớp mức độ tương thích giữa một mẫu in và dữ liệu xét nghiệm thực tế của bệnh nhân
   */
  public static isTemplateCompatibleWithData(
    template: ReportTemplate,
    tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>> | null | undefined
  ): DataCompatibilityResult {
    const safeTests = tests || [];
    const targetType = template.targetType || 'clinical';

    let clinicalCount = 0;
    let allergenCount = 0;

    for (const t of safeTests) {
      if (isAllergenTest(t)) {
        allergenCount++;
      } else {
        clinicalCount++;
      }
    }

    // Trường hợp 1: Dữ liệu trống
    if (safeTests.length === 0) {
      return {
        isCompatible: true,
        matchScore: 50,
        reason: 'Chưa có chỉ số xét nghiệm nào.',
        isRecommendedDefault: false
      };
    }

    // Trường hợp 2: Dữ liệu hỗn hợp (vừa có chỉ số thường, vừa có dị nguyên)
    if (clinicalCount > 0 && allergenCount > 0) {
      if (targetType === 'hybrid') {
        return {
          isCompatible: true,
          matchScore: 100,
          reason: 'Hoàn hảo cho kết quả gồm cả xét nghiệm thường và dị nguyên.',
          isRecommendedDefault: template.isDefault
        };
      }
      if (targetType === 'general') {
        return {
          isCompatible: true,
          matchScore: 70,
          reason: 'Mẫu in đa năng có thể hiển thị một phần kết quả.'
        };
      }
      return {
        isCompatible: true,
        matchScore: 60,
        reason: `Mẫu chỉ hiển thị một phần (${targetType === 'clinical' ? 'chỉ số thường' : 'dị nguyên'}).`
      };
    }

    // Trường hợp 3: Chỉ có xét nghiệm dị nguyên
    if (allergenCount > 0 && clinicalCount === 0) {
      if (targetType === 'allergen') {
        return {
          isCompatible: true,
          matchScore: 100,
          reason: 'Tương thích hoàn hảo với dữ liệu dị nguyên.',
          isRecommendedDefault: template.isDefault
        };
      }
      if (targetType === 'hybrid') {
        return {
          isCompatible: true,
          matchScore: 80,
          reason: 'Mẫu hỗn hợp hỗ trợ đầy đủ các khối dị nguyên.'
        };
      }
      return {
        isCompatible: false,
        matchScore: 20,
        reason: 'Mẫu được thiết kế cho Xét nghiệm thường, không có khối hiển thị dị nguyên phù hợp.'
      };
    }

    // Trường hợp 4: Chỉ có xét nghiệm thường (Sinh hóa, Huyết học...)
    if (clinicalCount > 0 && allergenCount === 0) {
      if (targetType === 'clinical') {
        return {
          isCompatible: true,
          matchScore: 100,
          reason: 'Tương thích hoàn hảo với chỉ số xét nghiệm thường.',
          isRecommendedDefault: template.isDefault
        };
      }
      if (targetType === 'hybrid' || targetType === 'general') {
        return {
          isCompatible: true,
          matchScore: 80,
          reason: 'Mẫu hỗ trợ hiển thị bảng chỉ số xét nghiệm thường.'
        };
      }
      return {
        isCompatible: false,
        matchScore: 15,
        reason: 'Mẫu chuyên cho Dị nguyên, không phù hợp cho chỉ số xét nghiệm sinh hóa/huyết học thông thường.'
      };
    }

    return {
      isCompatible: true,
      matchScore: 50
    };
  }

  /**
   * Tự động tìm mẫu in tối ưu nhất cho tập dữ liệu thực tế
   */
  public static getRecommendedTemplate(
    templates: ReportTemplate[],
    tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>> | null | undefined
  ): ReportTemplate | undefined {
    if (!templates || templates.length === 0) return undefined;

    const scored = templates.map((t) => ({
      template: t,
      res: this.isTemplateCompatibleWithData(t, tests)
    }));

    // Ưu tiên mẫu tương thích cao nhất
    scored.sort((a, b) => {
      // 1. Điểm tương thích
      if (b.res.matchScore !== a.res.matchScore) {
        return b.res.matchScore - a.res.matchScore;
      }
      // 2. Mẫu mặc định
      if (a.template.isDefault !== b.template.isDefault) {
        return a.template.isDefault ? -1 : 1;
      }
      return 0;
    });

    return scored[0]?.template;
  }
}
