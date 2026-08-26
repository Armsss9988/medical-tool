import { ALLERGEN_91_DATABASE } from './allergenCatalog';
import { NHI_CATALOG } from './nhiCatalog';
import { CatalogItem, TestPackage, TestGroup, TestEquipment } from '../domain/types';

const ALLERGEN_CATALOG_ITEMS: CatalogItem[] = ALLERGEN_91_DATABASE.map(item => {
  const isTIgE = item.code.toLowerCase() === 'tige';
  let category = 'Dị Nguyên Thực Phẩm';

  if (isTIgE) {
    category = 'Dị Nguyên & Miễn Dịch';
  } else if (item.route.includes('Hô hấp') || item.code.startsWith('d') || item.code.startsWith('e') || item.code.startsWith('m') || item.code.startsWith('g') || item.code.startsWith('w') || item.code.startsWith('h') || item.code.startsWith('t')) {
    category = 'Dị Nguyên Hô Hấp';
  } else if (item.code.startsWith('i') || item.code === 'k82') {
    category = 'Dị Nguyên Côn Trùng & Khác';
  }

  return {
    category,
    code: item.code,
    name: item.name,
    scientific: item.allergenName || (isTIgE ? 'Total IgE' : item.name),
    refMin: 0,
    refMax: isTIgE ? 15.0 : 0.34,
    unit: 'IU/mL',
    refText: isTIgE ? '< 15,0' : (item.normalRef || '< 0.35 (Độ 0)'),
    equipment: 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer'
  };
});

export const DEFAULT_EQUIPMENTS: TestEquipment[] = [
  // Thiết bị từ Excel UPLOAD_PHAN_MEM_NHI (12 máy)
  { id: crypto.randomUUID(), name: 'MS-H630 (Máy Phân Tích Huyết Học)', code: 'MS-H630' },
  { id: crypto.randomUUID(), name: 'Dynex DS2 (ELISA Reader)', code: 'DYNEX-DS2' },
  { id: crypto.randomUUID(), name: 'Roche cobas e 801 (Miễn Dịch)', code: 'COBAS-E801' },
  { id: crypto.randomUUID(), name: 'Tosoh HLC-723G11 (Huyết Sắc Tố)', code: 'TOSOH-G11' },
  { id: crypto.randomUUID(), name: 'MS-360 (Vi Chất)', code: 'MS-360' },
  { id: crypto.randomUUID(), name: 'PROTIA Allergy-Q Smart Q-processor (Dị Nguyên)', code: 'PROTIA-ALLERGY-Q' },
  { id: crypto.randomUUID(), name: 'Agilent 7850 ICP-MS (Nguyên Tố Vi Lượng)', code: 'AGILENT-7850' },
  { id: crypto.randomUUID(), name: 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1', code: 'MEDIWISS-C1' },
  { id: crypto.randomUUID(), name: 'MADx ALEX2 MAX 9k (Dị Nguyên Panel)', code: 'MADX-ALEX2' },
  { id: crypto.randomUUID(), name: 'Applied Biosystems VeritiPro PCR (Di Truyền)', code: 'VERITIPRO-PCR' },
  { id: crypto.randomUUID(), name: 'Kính Hiển Vi Quang Học', code: 'MICROSCOPE' },
  { id: crypto.randomUUID(), name: 'Radiometer ABL90 FLEX (Khí Máu)', code: 'ABL90-FLEX' },
  // Thiết bị cũ giữ lại
  { id: crypto.randomUUID(), name: 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer', code: 'PROTIA-SMART' },
  { id: crypto.randomUUID(), name: 'Thủ Công / Khác', code: 'MANUAL' }
];

export const DEFAULT_TEST_GROUPS: TestGroup[] = [
  // Nhóm từ Excel Nhi
  { id: crypto.randomUUID(), name: 'Huyết Học' },
  { id: crypto.randomUUID(), name: 'Sinh Hóa' },
  { id: crypto.randomUUID(), name: 'Huyết Sắc Tố' },
  { id: crypto.randomUUID(), name: 'Ký Sinh Trùng' },
  { id: crypto.randomUUID(), name: 'Vi Chất' },
  { id: crypto.randomUUID(), name: 'Hóc Môn' },
  { id: crypto.randomUUID(), name: 'Miễn Dịch' },
  { id: crypto.randomUUID(), name: 'Dị Nguyên' },
  { id: crypto.randomUUID(), name: 'Di Truyền' },
  // Nhóm bổ sung
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
  // === 76 CHỈ SỐ NHI KHOA (từ Excel UPLOAD_PHAN_MEM_NHI) ===
  ...NHI_CATALOG,

  // === 91 DỊ NGUYÊN IgE CHUẨN PROTIA (giữ nguyên) ===
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
