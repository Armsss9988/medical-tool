import { ALLERGEN_91_DATABASE } from './allergenCatalog';
import { NHI_CATALOG } from './nhiCatalog';
import { CatalogItem, TestPackage, TestGroup, TestEquipment } from '../../domain/types';

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

  const scaleId = item.tt <= 61 ? 'scale_allergen_44' : 'scale_protia_91';
  const normalRef = item.tt <= 61 ? '< 0,35 (Độ 0)' : '< 0,34 (Độ 0)';

  return {
    category,
    code: item.code,
    name: item.name,
    scientific: item.allergenName || (isTIgE ? 'Total IgE' : item.name),
    refMin: 0,
    refMax: isTIgE ? 15.0 : (item.tt <= 61 ? 0.35 : 0.34),
    unit: 'IU/mL',
    refText: isTIgE ? '< 15,0' : (item.normalRef || normalRef),
    referenceRangeId: isTIgE ? 'ref_tige' : undefined,
    scaleId: isTIgE ? undefined : scaleId,
    evaluationType: isTIgE ? 'range' : 'scale',
    equipment: item.tt <= 61 ? 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1' : 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer'
  };
});

export const DEFAULT_EQUIPMENTS: TestEquipment[] = [
  // Thiết bị từ Excel UPLOAD_PHAN_MEM_NHI (12 máy)
  { id: 'eq_msh630', name: 'MS-H630 (Máy Phân Tích Huyết Học)', code: 'MS-H630' },
  { id: 'eq_dynex_ds2', name: 'Dynex DS2 (ELISA Reader)', code: 'DYNEX-DS2' },
  { id: 'eq_cobas_e801', name: 'Roche cobas e 801 (Miễn Dịch)', code: 'COBAS-E801' },
  { id: 'eq_tosoh_g11', name: 'Tosoh HLC-723G11 (Huyết Sắc Tố)', code: 'TOSOH-G11' },
  { id: 'eq_ms360', name: 'MS-360 (Vi Chất)', code: 'MS-360' },
  { id: 'eq_protia_q', name: 'PROTIA Allergy-Q Smart Q-processor (Dị Nguyên)', code: 'PROTIA-ALLERGY-Q' },
  { id: 'eq_agilent_7850', name: 'Agilent 7850 ICP-MS (Nguyên Tố Vi Lượng)', code: 'AGILENT-7850' },
  { id: 'eq_mediwiss_c1', name: 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1', code: 'MEDIWISS-C1' },
  { id: 'eq_madx_alex2', name: 'MADx ALEX2 MAX 9k (Dị Nguyên Panel)', code: 'MADX-ALEX2' },
  { id: 'eq_veritipro_pcr', name: 'Applied Biosystems VeritiPro PCR (Di Truyền)', code: 'VERITIPRO-PCR' },
  { id: 'eq_microscope', name: 'Kính Hiển Vi Quang Học', code: 'MICROSCOPE' },
  { id: 'eq_abl90_flex', name: 'Radiometer ABL90 FLEX (Khí Máu)', code: 'ABL90-FLEX' },
  // Thiết bị bổ sung
  { id: 'eq_protia_smart', name: 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer', code: 'PROTIA-SMART' },
  { id: 'eq_manual', name: 'Thủ Công / Khác', code: 'MANUAL' }
];

export const DEFAULT_TEST_GROUPS: TestGroup[] = [
  // Nhóm từ Excel Nhi
  { id: 'grp_huyet_hoc', name: 'Huyết Học' },
  { id: 'grp_sinh_hoa', name: 'Sinh Hóa' },
  { id: 'grp_huyet_sac_to', name: 'Huyết Sắc Tố' },
  { id: 'grp_ky_sinh_trung', name: 'Ký Sinh Trùng' },
  { id: 'grp_vi_chat', name: 'Vi Chất' },
  { id: 'grp_hoc_mon', name: 'Hóc Môn' },
  { id: 'grp_mien_dich', name: 'Miễn Dịch' },
  { id: 'grp_di_nguyen', name: 'Dị Nguyên' },
  { id: 'grp_di_truyen', name: 'Di Truyền' },
  // Nhóm bổ sung
  { id: 'grp_sinh_hoa_mau', name: 'Sinh Hóa Máu' },
  { id: 'grp_dong_mau', name: 'Đông Máu' },
  { id: 'grp_nuoc_tieu', name: 'Nước Tiểu' },
  { id: 'grp_mien_dich_tam_soat', name: 'Miễn Dịch & Tầm Soát' },
  { id: 'grp_noi_tiet_to', name: 'Nội Tiết Tố & Hormone' },
  { id: 'grp_ung_thu_marker', name: 'Tầm Soát Ung Thư (Marker)' },
  { id: 'grp_ky_sinh_trung_vi_sinh', name: 'Ký Sinh Trùng & Vi Sinh' },
  { id: 'grp_benh_truyen_nhiem', name: 'Bệnh Truyền Nhiễm' },
  { id: 'grp_pcr', name: 'Sinh Học Phân Tử (PCR)' },
  { id: 'grp_di_nguyen_thuc_pham', name: 'Dị Nguyên Thực Phẩm' },
  { id: 'grp_di_nguyen_ho_hap', name: 'Dị Nguyên Hô Hấp' },
  { id: 'grp_di_nguyen_con_trung', name: 'Dị Nguyên Côn Trùng & Khác' },
  { id: 'grp_giai_phau_benh', name: 'Giải Phẫu Bệnh & Tế Bào' }
];

export const STANDARD_CLINICAL_ITEMS: CatalogItem[] = [
  // 1. SINH HÓA MÁU CƠ BẢN
  { category: 'Sinh Hóa', code: 'GLU', name: 'Glucose (Đường huyết lúc đói)', refMin: 3.9, refMax: 6.4, unit: 'mmol/L', refText: '3.9 - 6.4', price: 35000, referenceRangeId: 'ref_glucose', evaluationType: 'range', equipment: 'MS-360' },
  { category: 'Sinh Hóa', code: 'URE', name: 'Ure máu', refMin: 2.5, refMax: 7.5, unit: 'mmol/L', refText: '2.5 - 7.5', price: 35000, referenceRangeId: 'ref_ure', evaluationType: 'range', equipment: 'MS-360' },
  { category: 'Sinh Hóa', code: 'CREAT', name: 'Creatinine máu', refMin: 53, refMax: 110, unit: 'µmol/L', refText: '53 - 110', price: 40000, referenceRangeId: 'ref_creatinine', evaluationType: 'range', equipment: 'MS-360' },
  { category: 'Sinh Hóa', code: 'AST', name: 'AST (GOT) - Men gan', refMin: 0, refMax: 37, unit: 'U/L', refText: '< 37', price: 40000, referenceRangeId: 'ref_ast', evaluationType: 'range', equipment: 'MS-360' },
  { category: 'Sinh Hóa', code: 'ALT', name: 'ALT (GPT) - Men gan', refMin: 0, refMax: 40, unit: 'U/L', refText: '< 40', price: 40000, referenceRangeId: 'ref_alt', evaluationType: 'range', equipment: 'MS-360' },
  { category: 'Sinh Hóa', code: 'CHO', name: 'Cholesterol toàn phần', refMin: 3.6, refMax: 5.2, unit: 'mmol/L', refText: '3.6 - 5.2', price: 40000, referenceRangeId: 'ref_cholesterol', evaluationType: 'range', equipment: 'MS-360' },
  { category: 'Sinh Hóa', code: 'TRI', name: 'Triglyceride (Mỡ máu)', refMin: 0.4, refMax: 1.7, unit: 'mmol/L', refText: '0.4 - 1.7', price: 40000, referenceRangeId: 'ref_triglyceride', evaluationType: 'range', equipment: 'MS-360' },
  { category: 'Sinh Hóa', code: 'URIC', name: 'Acid Uric (Gút)', refMin: 180, refMax: 420, unit: 'µmol/L', refText: '180 - 420', price: 45000, referenceRangeId: 'ref_uric', evaluationType: 'range', equipment: 'MS-360' },

  // 2. NƯỚC TIỂU
  { category: 'Nước Tiểu', code: 'LEU_U', name: 'Bạch cầu (LEU) nước tiểu', refMin: 0, refMax: 10, unit: 'Cells/µL', refText: 'Âm tính (< 10)', price: 40000, evaluationType: 'text' },
  { category: 'Nước Tiểu', code: 'PRO_U', name: 'Protein (PRO) nước tiểu', refMin: 0, refMax: 0.1, unit: 'g/L', refText: 'Âm tính (< 0.1)', price: 40000, evaluationType: 'text' },
  { category: 'Nước Tiểu', code: 'GLU_U', name: 'Glucose (GLU) nước tiểu', refMin: 0, refMax: 0.8, unit: 'mmol/L', refText: 'Âm tính (< 0.8)', price: 40000, evaluationType: 'text' },

  // 3. MIỄN DỊCH & TẦM SOÁT
  { category: 'Miễn Dịch', code: 'HP', name: 'HP Test (Vi khuẩn dạ dày)', refMin: null, refMax: null, unit: 'Cut-off', refText: 'Âm tính (Negative)', price: 100000, evaluationType: 'text' }
];

export const DEFAULT_CATALOG: CatalogItem[] = (() => {
  const map = new Map<string, CatalogItem>();
  for (const item of STANDARD_CLINICAL_ITEMS) map.set(item.code.toUpperCase(), item);
  for (const item of NHI_CATALOG) map.set(item.code.toUpperCase(), item);
  for (const item of ALLERGEN_CATALOG_ITEMS) map.set(item.code.toUpperCase(), item);
  return Array.from(map.values());
})();

export const TEST_PACKAGES: TestPackage[] = [
  {
    id: 'all',
    name: '--- Chọn Gói Xét Nghiệm ---',
    items: [],
    codes: [],
    price: 0
  },
  {
    id: 'huyet_hoc',
    name: 'Gói Công Thức Máu (6 chỉ số)',
    items: ['RBC', 'HGB', 'HCT', 'MCV', 'WBC', 'PLT'].map((c) => ({ code: c, equipmentId: null })),
    codes: ['RBC', 'HGB', 'HCT', 'MCV', 'WBC', 'PLT'],
    price: 80000
  },
  {
    id: 'sinh_hoa',
    name: 'Gói Sinh Hóa Cơ Bản (Gan, Thận, Đường, Mỡ)',
    items: ['GLU', 'URE', 'CREAT', 'AST', 'ALT', 'CHO', 'TRI', 'URIC'].map((c) => ({ code: c, equipmentId: null })),
    codes: ['GLU', 'URE', 'CREAT', 'AST', 'ALT', 'CHO', 'TRI', 'URIC'],
    price: 280000
  },
  {
    id: 'nuoc_tieu',
    name: 'Gói Phân Tích Nước Tiểu (3 thông số)',
    items: ['LEU_U', 'PRO_U', 'GLU_U'].map((c) => ({ code: c, equipmentId: null })),
    codes: ['LEU_U', 'PRO_U', 'GLU_U'],
    price: 40000
  },
  {
    id: 'tong_quat',
    name: 'Gói Xét Nghiệm Tổng Quát',
    items: ['RBC', 'HGB', 'WBC', 'PLT', 'GLU', 'URE', 'CREAT', 'AST', 'ALT', 'CHO', 'TRI', 'URIC', 'LEU_U', 'PRO_U', 'GLU_U'].map((c) => ({ code: c, equipmentId: null })),
    codes: ['RBC', 'HGB', 'WBC', 'PLT', 'GLU', 'URE', 'CREAT', 'AST', 'ALT', 'CHO', 'TRI', 'URIC', 'LEU_U', 'PRO_U', 'GLU_U'],
    price: 450000
  },
  {
    id: 'di_nguyen_90',
    name: '🩸 Gói Trọn Bộ Dị Nguyên IgE (91 Panel PROTIA)',
    items: ALLERGEN_91_DATABASE.map(item => ({ code: item.code, equipmentId: 'eq_protia' })),
    codes: ALLERGEN_91_DATABASE.map(item => item.code),
    price: 1900000
  },
  {
    id: 'di_nguyen_61',
    name: '🧬 Gói 61 Dị Nguyên IgE (PROTIA Smart Q-Processor)',
    items: ALLERGEN_91_DATABASE.slice(0, 61).map(item => ({ code: item.code, equipmentId: 'eq_protia' })),
    codes: ALLERGEN_91_DATABASE.slice(0, 61).map(item => item.code),
    price: 1600000
  },
  {
    id: 'di_nguyen_44',
    name: '🔬 Gói 44 Dị Nguyên IgE (MEDIWISS / Hô Hấp & Thực Phẩm)',
    items: ALLERGEN_91_DATABASE.slice(0, 44).map(item => ({ code: item.code, equipmentId: 'eq_mediwiss' })),
    codes: ALLERGEN_91_DATABASE.slice(0, 44).map(item => item.code),
    price: 1400000
  },
  {
    id: 'di_nguyen_ho_hap',
    name: '🌸 Gói Dị Nguyên Hô Hấp (Bụi, Lông thú, Nấm mốc)',
    items: ['d1', 'd2', 'e1', 'e5', 'm1', 'm2', 'm3', 'g2', 'w6', 'k82', 'h1', 't2', 't3', 't7', 'w1', 'w22'].map((c) => ({ code: c, equipmentId: null })),
    codes: ['d1', 'd2', 'e1', 'e5', 'm1', 'm2', 'm3', 'g2', 'w6', 'k82', 'h1', 't2', 't3', 't7', 'w1', 'w22'],
    price: 950000
  },
  {
    id: 'di_nguyen_thuc_pham',
    name: '🦀 Gói Dị Nguyên Thực Phẩm (Trứng, Sữa, Hải sản, Hạt)',
    items: ['f1', 'f2', 'f3', 'f4', 'f13', 'f14', 'f23', 'f24', 'f26', 'f27', 'f33', 'f83', 'f88', 'f81', 'f6', 'f9', 'f11', 'f45', 'f8'].map((c) => ({ code: c, equipmentId: null })),
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
