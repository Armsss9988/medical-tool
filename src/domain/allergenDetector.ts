import type { CatalogItem } from './types';

// ─── ALLERGEN DETECTION ─────────────────────────────────────────────────────
// Single source of truth for allergen identification logic.
// RULE: Any test is "allergen" if its category contains "Dị Nguyên" OR unit is "IU/mL",
//       EXCEPT for TIgE (Total IgE) which is a special aggregate indicator.

/**
 * Kiểm tra 1 chỉ số có phải dị nguyên (allergen) không.
 * Áp dụng cho cả CatalogItem và SelectedTest.
 */
export function isAllergenTest(test: Pick<CatalogItem, 'code' | 'category' | 'unit'>): boolean {
  const isTIgE = (test.code || '').toLowerCase() === 'tige';
  if (isTIgE) return false;
  return (test.category?.includes('Dị Nguyên') === true) || test.unit === 'IU/mL';
}

/**
 * Kiểm tra danh sách chỉ số có chứa ít nhất 1 dị nguyên không.
 * Dùng để quyết định render FullAllergenReportView vs PrintReportView.
 */
export function hasAllergenTests(tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>>): boolean {
  return tests.some(isAllergenTest);
}

/**
 * Kiểm tra 1 chỉ số bất kỳ thuộc dạng dị nguyên (bao gồm cả category check lỏng).
 * Dùng khi phân loại item trong danh mục (CatalogManagerModal).
 */
export function isAllergenCatalogItem(item: Pick<CatalogItem, 'category' | 'unit'>): boolean {
  return (item.category?.includes('Dị Nguyên') === true) || item.unit === 'IU/mL';
}

export interface AllergenGradeStyle {
  rowBg: string;
  textColor: string;
  badgeBg: string;
  nameColor: string;
  borderClass: string;
}

/**
 * Ánh xạ độ dương tính (0-6) sang bảng màu UI chuẩn khớp 100% với bảng "DIỄN GIẢI ĐỘ DƯƠNG TÍNH".
 * - Độ 0: Không phản ứng (<0,34) -> Trắng / Xám nhạt
 * - Độ 1: Yếu (0,35 - 0,69) -> Vàng hổ phách nhạt (Amber)
 * - Độ 2: Trung bình (0,70 - 3,49) -> Vàng hổ phách vừa (Amber đậm)
 * - Độ 3: Khá (3,50 - 17,49) -> Đỏ nhạt
 * - Độ 4: Mạnh (17,50 - 49,99) -> Đỏ vừa
 * - Độ 5: Rất mạnh (50,00 - 99,99) -> Đỏ đậm
 * - Độ 6: Cực mạnh (>100,0) -> Đỏ rất đậm
 */
export function getAllergenGradeClasses(grade: number, isTIgE?: boolean, isTIgEPositive?: boolean): AllergenGradeStyle {
  if (isTIgE) {
    if (isTIgEPositive) {
      return {
        rowBg: 'bg-red-50/70',
        textColor: 'text-red-800',
        badgeBg: 'bg-red-100 text-red-800 border-red-300',
        nameColor: 'text-red-900',
        borderClass: 'border-red-300'
      };
    }
    return {
      rowBg: 'bg-sky-50/50',
      textColor: 'text-sky-800',
      badgeBg: 'bg-sky-100 text-sky-800 border-sky-300',
      nameColor: 'text-sky-900',
      borderClass: 'border-sky-300'
    };
  }
  if (grade >= 6) {
    return {
      rowBg: 'bg-red-100',
      textColor: 'text-red-950',
      badgeBg: 'bg-red-200 text-red-950 border-red-500',
      nameColor: 'text-red-950',
      borderClass: 'border-red-400'
    };
  }
  if (grade >= 5) {
    return {
      rowBg: 'bg-red-100/60',
      textColor: 'text-red-900',
      badgeBg: 'bg-red-200 text-red-900 border-red-400',
      nameColor: 'text-red-900',
      borderClass: 'border-red-300'
    };
  }
  if (grade >= 4) {
    return {
      rowBg: 'bg-red-50/70',
      textColor: 'text-red-800',
      badgeBg: 'bg-red-100 text-red-800 border-red-300',
      nameColor: 'text-red-900',
      borderClass: 'border-red-300'
    };
  }
  if (grade >= 3) {
    return {
      rowBg: 'bg-red-50/50',
      textColor: 'text-red-700',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      nameColor: 'text-red-800',
      borderClass: 'border-red-200'
    };
  }
  if (grade >= 2) {
    return {
      rowBg: 'bg-amber-50/70',
      textColor: 'text-amber-900',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      nameColor: 'text-amber-950',
      borderClass: 'border-amber-300'
    };
  }
  if (grade >= 1) {
    return {
      rowBg: 'bg-amber-50/50',
      textColor: 'text-amber-800',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      nameColor: 'text-amber-900',
      borderClass: 'border-amber-200'
    };
  }
  return {
    rowBg: 'bg-white',
    textColor: 'text-slate-800',
    badgeBg: 'bg-slate-100 text-slate-700 border-slate-200',
    nameColor: 'text-slate-900',
    borderClass: 'border-slate-300'
  };
}
