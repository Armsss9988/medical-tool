import type { CatalogItem } from './types';

// ─── ALLERGEN DETECTION ─────────────────────────────────────────────────────
// Single source of truth for allergen identification logic.
// RULE: Any test is "allergen" if its category contains "Dị Nguyên" OR unit is "IU/mL",
//       EXCEPT for TIgE (Total IgE) which is a special aggregate indicator.

/**
 * Kiểm tra 1 chỉ số có phải là Tổng IgE (TIgE / Total IgE) hay không.
 */
export function isTIgETest(test: Pick<CatalogItem, 'code'> & { name?: string }): boolean {
  const code = (test.code || '').toLowerCase().trim();
  const name = (test.name || '').toLowerCase().trim();
  return code === 'tige' || code === 'total_ige' || code === 'total-ige' || code.includes('tige') || name.includes('tổng ige') || name.includes('total ige');
}

/**
 * Kiểm tra 1 chỉ số có phải dị nguyên (allergen) không.
 * Áp dụng cho cả CatalogItem và SelectedTest.
 */
export function isAllergenTest(test: Pick<CatalogItem, 'code' | 'category' | 'unit'> & { name?: string }): boolean {
  if (isTIgETest(test)) return false;
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
 * Kiểm tra danh sách chỉ số có chứa ít nhất 1 chỉ số thường (Huyết học, Sinh hóa, Vi chất...) không.
 */
export function hasRegularTests(tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>>): boolean {
  return tests.some((t) => !isAllergenTest(t));
}

/**
 * Kiểm tra danh sách có phải dạng Hỗn Hợp (chứa cả chỉ số thường và chỉ số dị nguyên) không.
 */
export function hasMixedTests(tests: ReadonlyArray<Pick<CatalogItem, 'code' | 'category' | 'unit'>>): boolean {
  return hasRegularTests(tests) && hasAllergenTests(tests);
}

/**
 * Phân loại danh sách chỉ số thành 2 mảng: thường và dị nguyên
 */
export function classifyTests<T extends Pick<CatalogItem, 'code' | 'category' | 'unit'>>(tests: ReadonlyArray<T>): {
  regularTests: T[];
  allergenTests: T[];
  isMixed: boolean;
  isAllergenOnly: boolean;
  isRegularOnly: boolean;
} {
  const regularTests: T[] = [];
  const allergenTests: T[] = [];

  for (const t of tests) {
    if (isAllergenTest(t)) {
      allergenTests.push(t);
    } else {
      regularTests.push(t);
    }
  }

  const isMixed = regularTests.length > 0 && allergenTests.length > 0;
  const isAllergenOnly = regularTests.length === 0 && allergenTests.length > 0;
  const isRegularOnly = regularTests.length > 0 && allergenTests.length === 0;

  return {
    regularTests,
    allergenTests,
    isMixed,
    isAllergenOnly,
    isRegularOnly
  };
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

/**
 * Tạo Data URI SVG cho badge độ dương tính (0 - 6).
 * Dùng thẻ <img> với SVG Data URI giúp khóa cứng tọa độ và font vector,
 * đảm bảo con số luôn nằm chính giữa 100% trong khung vuông khi render trên DOM và xuất PDF qua html2canvas.
 */
export function getAllergenBadgeSvg(grade: number, size: number = 20): string {
  let bg = '#f1f5f9';
  let text = '#334155';
  let border = '#cbd5e1';

  if (grade >= 6) {
    bg = '#fee2e2';
    text = '#450a0a';
    border = '#ef4444';
  } else if (grade >= 5) {
    bg = '#fee2e2';
    text = '#7f1d1d';
    border = '#f87171';
  } else if (grade >= 4) {
    bg = '#fee2e2';
    text = '#991b1b';
    border = '#fca5a5';
  } else if (grade >= 3) {
    bg = '#fef2f2';
    text = '#b91c1c';
    border = '#fecaca';
  } else if (grade >= 2) {
    bg = '#fef3c7';
    text = '#78350f';
    border = '#fcd34d';
  } else if (grade >= 1) {
    bg = '#fffbeb';
    text = '#92400e';
    border = '#fde68a';
  }

  const radius = Math.round(size * 0.2);
  const fontSize = Math.round(size * 0.6);
  const strokeWidth = 1.2;

  // Dùng y="50%" + dy="0.35em" để căn giữa chính xác dọc/ngang
  // bất kể font-metrics, không bị lệch trong html2canvas / PDF export
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="0.6" y="0.6" width="${size - 1.2}" height="${size - 1.2}" rx="${radius}" fill="${bg}" stroke="${border}" stroke-width="${strokeWidth}"/>
    <text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="${text}" font-size="${fontSize}" font-weight="900" font-family="Arial, Helvetica, sans-serif">${grade}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg.trim())}`;
}

