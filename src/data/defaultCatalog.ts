import { ALLERGEN_91_DATABASE } from './allergenCatalog';
import { CatalogItem, TestPackage, TestGroup, TestEquipment } from '../domain/types';

const ALLERGEN_CATALOG_ITEMS: CatalogItem[] = ALLERGEN_91_DATABASE.map(item => {
  let category = 'Dị Nguyên Thực Phẩm';
  if (item.route.includes('Hô hấp') || item.code.startsWith('d') || item.code.startsWith('e') || item.code.startsWith('m') || item.code.startsWith('g') || item.code.startsWith('w') || item.code.startsWith('h') || item.code.startsWith('t')) {
    category = 'Dị Nguyên Hô Hấp';
  } else if (item.code.startsWith('i') || item.code === 'k82') {
    category = 'Dị Nguyên Côn Trùng & Khác';
  }

  return {
    category,
    code: item.code,
    name: item.name,
    scientific: item.allergenName || item.name,
    refMin: 0,
    refMax: 0.34,
    unit: 'IU/mL',
    refText: item.normalRef || '< 0.35 (Độ 0)',
    equipment: 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer'
  };
});

export const DEFAULT_EQUIPMENTS: TestEquipment[] = [
  { id: crypto.randomUUID(), name: 'Máy Phân Tích Huyết Học Sysmex XN-550', code: 'SYSMEX-XN550' },
  { id: crypto.randomUUID(), name: 'Máy Sinh Hóa Tự Động Mindray BS-240', code: 'MINDRAY-BS240' },
  { id: crypto.randomUUID(), name: 'Máy Phân Tích Nước Tiểu URIT-500B', code: 'URIT-500B' },
  { id: crypto.randomUUID(), name: 'Máy Miễn Dịch Cobas e411', code: 'COBAS-E411' },
  { id: crypto.randomUUID(), name: 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer', code: 'PROTIA-SMART' },
  { id: crypto.randomUUID(), name: 'Máy Đông Máu Tự Động Stago', code: 'STAGO-COMPACT' },
  { id: crypto.randomUUID(), name: 'Thủ Công / Khác', code: 'MANUAL' }
];

export const DEFAULT_TEST_GROUPS: TestGroup[] = [
  { id: crypto.randomUUID(), name: 'Huyết Học' },
  { id: crypto.randomUUID(), name: 'Sinh Hóa Máu' },
  { id: crypto.randomUUID(), name: 'Đông Máu' },
  { id: crypto.randomUUID(), name: 'Nước Tiểu' },
  { id: crypto.randomUUID(), name: 'Miễn Dịch & Tầm Soát' },
  { id: crypto.randomUUID(), name: 'Nội Tiết Tố & Hormone' },
  { id: crypto.randomUUID(), name: 'Tầm Soát Ung Thư (Marker)' },
  { id: crypto.randomUUID(), name: 'Ký Sinh Trùng & Vi Sinh' },
  { id: crypto.randomUUID(), name: 'Bệnh Truyền Nhiễm' },
  { id: crypto.randomUUID(), name: 'Sinh Học Phân Tử (PCR)' },
  { id: crypto.randomUUID(), name: 'Dị Nguyên Thực Phẩm' },
  { id: crypto.randomUUID(), name: 'Dị Nguyên Hô Hấp' },
  { id: crypto.randomUUID(), name: 'Dị Nguyên Côn Trùng & Khác' },
  { id: crypto.randomUUID(), name: 'Giải Phẫu Bệnh & Tế Bào' }
];

export const DEFAULT_CATALOG: CatalogItem[] = [
  // 1. HUYẾT HỌC
  { category: 'Huyết Học', code: 'RBC', name: 'RBC (Số lượng hồng cầu)', refMin: 3.8, refMax: 5.4, unit: 'T/L', refText: '3.8 - 5.4', price: 15000 },
  { category: 'Huyết Học', code: 'HGB', name: 'Hb (Huyết sắc tố)', refMin: 120, refMax: 160, unit: 'g/L', refText: '120 - 160', price: 15000 },
  { category: 'Huyết Học', code: 'HCT', name: 'HCT (Dung tích hồng cầu)', refMin: 35, refMax: 47, unit: '%', refText: '35 - 47', price: 15000 },
  { category: 'Huyết Học', code: 'MCV', name: 'MCV (Thể tích trung bình HC)', refMin: 80, refMax: 100, unit: 'fL', refText: '80 - 100', price: 10000 },
  { category: 'Huyết Học', code: 'WBC', name: 'WBC (Số lượng bạch cầu)', refMin: 4.0, refMax: 10.0, unit: 'G/L', refText: '4.0 - 10.0', price: 15000 },
  { category: 'Huyết Học', code: 'PLT', name: 'PLT (Số lượng tiểu cầu)', refMin: 150, refMax: 450, unit: 'G/L', refText: '150 - 450', price: 15000 },

  // 2. SINH HÓA MÁU
  { category: 'Sinh Hóa Máu', code: 'GLU', name: 'Glucose (Đường huyết lúc đói)', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3.9 - 6.4', price: 35000 },
  { category: 'Sinh Hóa Máu', code: 'URE', name: 'Ure máu', refMin: 2.5, refMax: 7.5, unit: 'mmol/L', refText: '2.5 - 7.5', price: 35000 },
  { category: 'Sinh Hóa Máu', code: 'CREAT', name: 'Creatinine máu', refMin: 53, refMax: 110, unit: 'µmol/L', refText: '53 - 110', price: 40000 },
  { category: 'Sinh Hóa Máu', code: 'AST', name: 'AST (GOT) - Men gan', refMin: 0, refMax: 37, unit: 'U/L', refText: '< 37', price: 40000 },
  { category: 'Sinh Hóa Máu', code: 'ALT', name: 'ALT (GPT) - Men gan', refMin: 0, refMax: 40, unit: 'U/L', refText: '< 40', price: 40000 },
  { category: 'Sinh Hóa Máu', code: 'CHO', name: 'Cholesterol toàn phần', refMin: 3.6, refMax: 5.2, unit: 'mmol/L', refText: '3.6 - 5.2', price: 40000 },
  { category: 'Sinh Hóa Máu', code: 'TRI', name: 'Triglyceride (Mỡ máu)', refMin: 0.4, refMax: 1.7, unit: 'mmol/L', refText: '0.4 - 1.7', price: 40000 },
  { category: 'Sinh Hóa Máu', code: 'URIC', name: 'Acid Uric (Gút)', refMin: 180, refMax: 420, unit: 'µmol/L', refText: '180 - 420', price: 45000 },

  // 3. NƯỚC TIỂU
  { category: 'Nước Tiểu', code: 'LEU_U', name: 'Bạch cầu (LEU) nước tiểu', refMin: 0, refMax: 10, unit: 'Cells/µL', refText: 'Âm tính (< 10)', price: 40000 },
  { category: 'Nước Tiểu', code: 'PRO_U', name: 'Protein (PRO) nước tiểu', refMin: 0, refMax: 0.1, unit: 'g/L', refText: 'Âm tính (< 0.1)', price: 40000 },
  { category: 'Nước Tiểu', code: 'GLU_U', name: 'Glucose (GLU) nước tiểu', refMin: 0, refMax: 0.8, unit: 'mmol/L', refText: 'Âm tính (< 0.8)', price: 40000 },

  // 4. MIỄN DỊCH & TẦM SOÁT
  { category: 'Miễn Dịch & Tầm Soát', code: 'HBSAG', name: 'HBsAg Rapid Test (Viêm gan B)', refMin: null, refMax: null, unit: 'Cut-off', refText: 'Âm tính (Negative)', price: 80000 },
  { category: 'Miễn Dịch & Tầm Soát', code: 'HP', name: 'HP Test (Vi khuẩn dạ dày)', refMin: null, refMax: null, unit: 'Cut-off', refText: 'Âm tính (Negative)', price: 100000 },

  // 5. TRỌN BỘ 91 DỊ NGUYÊN IgE CHUẨN PROTIA
  ...ALLERGEN_CATALOG_ITEMS
];

export const TEST_PACKAGES: TestPackage[] = [
  {
    id: 'all',
    name: '--- Chọn Gói Xét Nghiệm ---',
    codes: [],
    price: 0
  },
  {
    id: 'huyet_hoc',
    name: 'Gói Công Thức Máu (6 chỉ số)',
    codes: ['RBC', 'HGB', 'HCT', 'MCV', 'WBC', 'PLT'],
    price: 80000
  },
  {
    id: 'sinh_hoa',
    name: 'Gói Sinh Hóa Cơ Bản (Gan, Thận, Đường, Mỡ)',
    codes: ['GLU', 'URE', 'CREAT', 'AST', 'ALT', 'CHO', 'TRI', 'URIC'],
    price: 280000
  },
  {
    id: 'nuoc_tieu',
    name: 'Gói Phân Tích Nước Tiểu (3 thông số)',
    codes: ['LEU_U', 'PRO_U', 'GLU_U'],
    price: 40000
  },
  {
    id: 'tong_quat',
    name: 'Gói Xét Nghiệm Tổng Quát',
    codes: ['RBC', 'HGB', 'WBC', 'PLT', 'GLU', 'URE', 'CREAT', 'AST', 'ALT', 'CHO', 'TRI', 'URIC', 'LEU_U', 'PRO_U', 'GLU_U'],
    price: 450000
  },
  {
    id: 'di_nguyen_90',
    name: '🩸 Gói Trọn Bộ Dị Nguyên IgE (91 Panel PROTIA)',
    codes: ALLERGEN_91_DATABASE.map(item => item.code),
    price: 1900000
  },
  {
    id: 'di_nguyen_ho_hap',
    name: '🌸 Gói Dị Nguyên Hô Hấp (Bụi, Lông thú, Nấm mốc)',
    codes: ['d1', 'd2', 'e1', 'e5', 'm1', 'm2', 'm3', 'g2', 'w6', 'k82', 'h1', 't2', 't3', 't7', 'w1', 'w22'],
    price: 950000
  },
  {
    id: 'di_nguyen_thuc_pham',
    name: '🦀 Gói Dị Nguyên Thực Phẩm (Trứng, Sữa, Hải sản, Hạt)',
    codes: ['f1', 'f2', 'f3', 'f4', 'f13', 'f14', 'f23', 'f24', 'f26', 'f27', 'f33', 'f83', 'f88', 'f81', 'f6', 'f9', 'f11', 'f45', 'f8'],
    price: 950000
  }
];

export const DEFAULT_TEST_PACKAGES = TEST_PACKAGES;

export const DEFAULT_DOCTORS = [
  { id: 'doc-1', name: 'BS. Trần Hoài Long', specialty: 'Bác sĩ Đa khoa / Xét nghiệm' },
  { id: 'doc-2', name: 'Nguyễn Thị Thành Trung', specialty: 'Phụ trách chuyên môn' },
  { id: 'doc-3', name: 'BS. CKI Lê Thị Mai', specialty: 'Chuyên khoa Miễn dịch - Dị ứng' },
  { id: 'doc-4', name: 'BS. CKII Phạm Văn Dũng', specialty: 'Chuyên khoa Huyết học - Truyền máu' }
];
