export type Gender = 'Nam' | 'Nữ' | 'Khác';

export type AllergenGrade = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export type ResultStatus = 'normal' | 'low' | 'high';

// ─── DOMAIN STATUS TYPES ─────────────────────────────────────────────────────
export type ClinicalStatus = 'Chờ xét nghiệm' | 'Đã có kết quả' | 'Đã trả kết quả';
export type DocumentStatus = 'Chưa xuất PDF' | 'Đã xuất Cloud' | 'Cần cập nhật PDF';
export type BillingStatus = 'Chưa thu phí' | 'Đã thanh toán' | 'Đã hủy / Hoàn tiền';
export type SampleStatus = 'Đạt' | 'Không đạt' | 'Đang lấy mẫu';
export type PaymentMethod = 'Tiền mặt' | 'Chuyển khoản (VietQR)' | 'Quẹt thẻ' | 'Khác';
export type InvoiceStatus = BillingStatus;
export type ReportStatus = 
  | 'Chờ xét nghiệm' 
  | 'Đã có kết quả' 
  | 'Đã xuất Cloud' 
  | 'Cần cập nhật PDF' 
  | 'Đã trả kết quả';

export interface Patient {
  code: string;
  secretToken: string;
  name: string;
  dob: string;
  gender: Gender;
  phone: string;
  address: string;
  diagnosis: string;
  doctor?: string;
  sampleCode?: string;
  sampleStatus?: SampleStatus | string;
  orderedAt?: string;
  paidAt?: string;
  receivedAt?: string;
  returnedAt?: string;
}

export type EvaluationType = 'range' | 'scale' | 'text' | 'detection';

/** Liên kết giữa một chỉ số xét nghiệm và một loại máy đo cụ thể (kèm ngưỡng tham chiếu riêng cho máy) */
export interface CatalogItemEquipmentLink {
  id: string;
  catalogCode: string;
  equipmentId: string;
  /** Phương thức đánh giá riêng cho máy đo này (Tham chiếu, Thang đo, hoặc Phát hiện) */
  evaluationType?: EvaluationType;
  refMin?: number | null;
  refMax?: number | null;
  unit?: string | null;
  refText?: string | null;
  scaleId?: string | null;
  isDefault?: boolean;
}

export interface ReferenceRangeItem {
  id: string;
  name: string;
  refMin: number | null;
  refMax: number | null;
  unit: string;
  refText: string;
  gender?: 'Nam' | 'Nữ' | 'Tất cả';
  ageGroup?: string;
}

export interface CatalogItem {
  category: string;
  code: string;
  name: string;
  unit: string;
  refText: string;
  price?: number;
  scientific?: string;
  evaluationType?: EvaluationType;
  /** @deprecated Ngưỡng tham chiếu tĩnh — Khuyến nghị phân giải động qua catalog_item_equipments */
  refMin?: number | null;
  /** @deprecated Ngưỡng tham chiếu tĩnh — Khuyến nghị phân giải động qua catalog_item_equipments */
  refMax?: number | null;
  /** Danh sách liên kết máy đo → reference_range/scale riêng (tùy máy) */
  equipmentLinks?: CatalogItemEquipmentLink[];
  /** @deprecated Đã loại bỏ khỏi bảng DB catalog_items — tra cứu/cấu hình máy đo qua catalog_item_equipments */
  equipment?: string;
  /** @deprecated Đã loại bỏ khỏi bảng DB catalog_items — cấu hình dải đo qua catalog_item_equipments */
  referenceRangeId?: string;
  /** @deprecated Đã loại bỏ khỏi bảng DB catalog_items — cấu hình thang đo qua catalog_item_equipments */
  scaleId?: string;
}

export interface SelectedTest extends CatalogItem {
  result: string;
  note: string;
  /** ID thiết bị đo được gán cụ thể cho chỉ số này */
  equipmentId?: string | null;
  /** Tên thiết bị đo được giải quyết */
  equipment?: string;
  /** Ngưỡng tối thiểu được phân giải động từ catalog_item_equipments hoặc thang đo grade 0 */
  refMin?: number | null;
  /** Ngưỡng tối đa được phân giải động từ catalog_item_equipments hoặc thang đo grade 0 */
  refMax?: number | null;
}

/** Một mục chỉ số trong gói xét nghiệm, kèm thông tin máy đo được chọn và giá trị mặc định */
export interface PackageItem {
  code: string;
  /** ID máy đo được chọn cho chỉ số này trong gói. null = dùng máy mặc định của chỉ số */
  equipmentId?: string | null;
  /** Thứ tự sắp xếp của chỉ số trong gói (tương ứng order_index trong package_items) */
  orderIndex?: number;
  /** Giá trị kết quả mặc định điền sẵn khi chọn gói (VD: 'Âm tính', '0', '5.0') */
  defaultValue?: string | null;
  /** Tùy chọn bật/tắt tự động điền giá trị mặc định cho chỉ số này khi chọn gói */
  hasDefaultValue?: boolean | null;
}

export interface TestPackage {
  id: string;
  name: string;
  /** ID máy đo chính / ưu tiên của cả gói xét nghiệm (tự động gán cho các chỉ số trong gói nếu có liên kết) */
  defaultEquipmentId?: string | null;
  /** Danh sách chỉ số trong gói, mỗi item có thể gắn máy đo cụ thể */
  items: PackageItem[];
  price: number;
  /**
   * @deprecated Dùng items thay thế.
   * Giữ lại để backward compat trong quá trình migration.
   */
  codes?: string[];
}

/** Helper: lấy danh sách mã xét nghiệm từ một TestPackage (hỗ trợ an toàn cả format object, string, mảng cũ lẫn mới) */
export function getPkgCodes(pkg: TestPackage | undefined | null): string[] {
  if (!pkg) return [];

  if (Array.isArray(pkg.items) && pkg.items.length > 0) {
    return pkg.items
      .map((i) => (typeof i === 'string' ? i : (i && typeof i === 'object' && 'code' in i ? (i as { code: string }).code : '')))
      .filter((c): c is string => Boolean(c && typeof c === 'string'));
  }

  if (typeof pkg.items === 'string') {
    try {
      const parsed = JSON.parse(pkg.items);
      if (Array.isArray(parsed)) {
        return parsed
          .map((i) => (typeof i === 'string' ? i : (i && typeof i === 'object' && 'code' in i ? (i as { code: string }).code : '')))
          .filter((c): c is string => Boolean(c && typeof c === 'string'));
      }
    } catch {
      // Ignored: invalid JSON string
    }
  }

  if (Array.isArray(pkg.codes) && pkg.codes.length > 0) {
    return pkg.codes.filter((c): c is string => Boolean(c && typeof c === 'string'));
  }

  if (typeof pkg.codes === 'string') {
    try {
      const parsed = JSON.parse(pkg.codes);
      if (Array.isArray(parsed)) {
        return parsed.filter((c): c is string => Boolean(c && typeof c === 'string'));
      }
    } catch {
      // Ignored: invalid JSON string
    }
  }

  return [];
}

/** Helper: lấy danh sách PackageItem [{code, equipmentId}] từ một TestPackage (an toàn với mọi format) */
export function getPkgItems(pkg: TestPackage | undefined | null): PackageItem[] {
  if (!pkg) return [];

  let rawItems: unknown = pkg.items;
  if (typeof rawItems === 'string') {
    try {
      rawItems = JSON.parse(rawItems);
    } catch {
      rawItems = [];
    }
  }

  if (Array.isArray(rawItems) && rawItems.length > 0) {
    const list: PackageItem[] = [];
    for (const i of rawItems) {
      if (typeof i === 'string' && i.trim()) {
        list.push({ code: i.trim(), equipmentId: null });
      } else if (i && typeof i === 'object' && 'code' in i) {
        const c = String((i as { code: unknown }).code || '').trim();
        if (c) {
          const rawOrder = (i as { orderIndex?: unknown }).orderIndex;
          const rawDefVal = (i as { defaultValue?: unknown }).defaultValue;
          const rawHasDef = (i as { hasDefaultValue?: unknown }).hasDefaultValue;
          const itemObj: PackageItem = {
            code: c,
            equipmentId: (i as { equipmentId?: string | null }).equipmentId || null
          };
          if (typeof rawOrder === 'number') {
            itemObj.orderIndex = rawOrder;
          }
          if (rawDefVal !== undefined) {
            itemObj.defaultValue = typeof rawDefVal === 'string' ? rawDefVal : (rawDefVal != null ? String(rawDefVal) : null);
          }
          if (rawHasDef !== undefined) {
            itemObj.hasDefaultValue = Boolean(rawHasDef);
          } else if (itemObj.defaultValue != null && itemObj.defaultValue !== '') {
            itemObj.hasDefaultValue = true;
          }
          list.push(itemObj);
        }
      }
    }
    if (list.length > 0) {
      const hasOrderIndex = list.some((item) => typeof item.orderIndex === 'number');
      if (hasOrderIndex) {
        return list.sort((a, b) => (a.orderIndex ?? 999999) - (b.orderIndex ?? 999999));
      }
      return list;
    }
  }

  let rawCodes: unknown = pkg.codes;
  if (typeof rawCodes === 'string') {
    try {
      rawCodes = JSON.parse(rawCodes);
    } catch {
      rawCodes = [];
    }
  }

  if (Array.isArray(rawCodes) && rawCodes.length > 0) {
    return rawCodes
      .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim()))
      .map((c) => ({ code: c.trim(), equipmentId: null }));
  }

  return [];
}

/** Helper: chuẩn hóa gói xét nghiệm đảm bảo luôn có items, codes và price mảng chuẩn */
export function normalizeTestPackage(pkg: TestPackage): TestPackage {
  if (!pkg) {
    return { id: '', name: '', items: [], codes: [], price: 0 };
  }
  const items = getPkgItems(pkg);
  const codes = getPkgCodes(pkg);
  const numPrice = typeof pkg.price === 'number' && !isNaN(pkg.price) ? pkg.price : (Number(pkg.price) || 0);
  return {
    ...pkg,
    price: numPrice,
    items,
    codes: items.length > 0 ? items.map((i) => i.code) : codes
  };
}

export const DEFAULT_TEST_EQUIPMENTS: ReadonlyArray<TestEquipment> = [
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
  { id: 'eq_protia_smart', name: 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer', code: 'PROTIA-SMART' },
  { id: '81e15751-ec5a-4cce-9fb6-9860d859950e', name: 'Thermo Scientific Phadia 250 (Dị Ứng Kháng Sinh)', code: 'PHADIA-250' },
  { id: 'eq_manual', name: 'Thủ Công / Khác', code: 'MANUAL' }
];

/**
 * Helper: Tra cứu tên thiết bị đo phù hợp cho một chỉ số xét nghiệm (luôn trả về tên hiển thị thân thiện, không bao giờ lộ ID thô)
 */
export function resolveTestEquipmentName(
  t: { code?: string; category?: string; scaleId?: string; equipment?: string; equipmentId?: string | null } | undefined | null,
  equipments: TestEquipment[] = [],
  catalogItemEquipments: CatalogItemEquipmentLink[] = []
): string {
  if (!t) return 'Tự động';

  const allEquipments: ReadonlyArray<TestEquipment> = equipments.length > 0 ? equipments : DEFAULT_TEST_EQUIPMENTS;

  const findEq = (query?: string | null): TestEquipment | undefined => {
    if (!query || typeof query !== 'string' || !query.trim() || query === 'Tự động') return undefined;
    const qRaw = query.trim().toLowerCase();
    const aliasMap: Record<string, string> = {
      eq_mediwiss: 'eq_mediwiss_c1',
      eq_protia: 'eq_protia_q'
    };
    const q = aliasMap[qRaw] || qRaw;

    // 1. Tìm trong danh sách truyền vào
    const inCurrent = allEquipments.find((e) =>
      e.id.toLowerCase() === q ||
      e.id.toLowerCase() === qRaw ||
      (e.code && (e.code.toLowerCase() === q || e.code.toLowerCase() === qRaw)) ||
      e.name.toLowerCase() === q ||
      e.name.toLowerCase() === qRaw
    );
    if (inCurrent) return inCurrent;
    // 2. Tìm fallback trong DEFAULT_TEST_EQUIPMENTS
    return DEFAULT_TEST_EQUIPMENTS.find((e) =>
      e.id.toLowerCase() === q ||
      e.id.toLowerCase() === qRaw ||
      (e.code && (e.code.toLowerCase() === q || e.code.toLowerCase() === qRaw)) ||
      e.name.toLowerCase() === q ||
      e.name.toLowerCase() === qRaw
    );
  };

  // 1. Ưu tiên 1: Tra cứu theo `t.equipmentId` (nếu đã có gán máy đo trực tiếp)
  if (t.equipmentId) {
    const eq = findEq(t.equipmentId);
    if (eq) return eq.name;
  }

  // 2. Ưu tiên 2: Tra cứu theo `t.equipment`
  if (t.equipment && t.equipment.trim() !== '') {
    const raw = t.equipment.trim();
    const eq = findEq(raw);
    if (eq) return eq.name;
    // Nếu là tên hiển thị thông thường (không phải ID thô dạng eq_... hoặc uuid)
    const isRawId = raw.startsWith('eq_') || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(raw);
    if (!isRawId && raw !== 'Tự động') return raw;
  }

  // 3. Ưu tiên 3: Tra cứu từ liên kết catalog_item_equipments
  const code = (t.code || '').trim().toUpperCase();
  if (code && catalogItemEquipments.length > 0) {
    const links = catalogItemEquipments.filter((l) => (l.catalogCode || '').toUpperCase() === code);
    const defaultLink = links.find((l) => l.isDefault) || links[0];
    if (defaultLink && defaultLink.equipmentId) {
      const eq = findEq(defaultLink.equipmentId);
      if (eq) return eq.name;
    }
  }

  // 4. Ưu tiên 4: Tra cứu theo nhóm dị nguyên hoặc thang đo
  if (t.category?.includes('Dị Nguyên') || t.scaleId) {
    if (t.scaleId === 'scale_allergen_44') return 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1';
    return 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer';
  }

  // 5. Fallback mặc định theo nhóm xét nghiệm phổ biến
  const cat = (t.category || '').toLowerCase();
  if (cat.includes('huyết học') || ['rbc', 'wbc', 'plt', 'hgb', 'hct', 'mcv', 'mch', 'mchc'].includes(code.toLowerCase())) {
    const eq = allEquipments.find((e) => e.name.includes('Huyết Học') || e.code === 'MS-H630');
    if (eq) return eq.name;
    return 'MS-H630 (Máy Phân Tích Huyết Học)';
  }
  if (cat.includes('sinh hóa') || ['glu', 'ure', 'creat', 'ast', 'alt', 'cho', 'tri', 'uric', 'crp', 'fe', 'ferr'].includes(code.toLowerCase())) {
    const eq = allEquipments.find((e) => e.code === 'MS-360' || e.name.includes('MS-360'));
    if (eq) return eq.name;
    return 'MS-360 (Vi Chất)';
  }
  if (cat.includes('miễn dịch') || ['e2', 'lh', 'fsh', 'prl', 'prog', 'testo', 'hcg', 'afp', 'cea', 'ca125', 'ca19-9', 'ca15-3', 'tsh', 'ft3', 'ft4', 't3', 't4', 'ferritin'].includes(code.toLowerCase())) {
    const eq = allEquipments.find((e) => e.name.includes('cobas') || e.code === 'COBAS-E801');
    if (eq) return eq.name;
    return 'Roche cobas e 801 (Miễn Dịch)';
  }
  if (cat.includes('huyết sắc tố') || ['hba1c', 'hba2', 'hbf'].includes(code.toLowerCase())) {
    const eq = allEquipments.find((e) => e.code === 'TOSOH-G11' || e.name.includes('Tosoh'));
    if (eq) return eq.name;
    return 'Tosoh HLC-723G11 (Huyết Sắc Tố)';
  }

  return 'Tự động';
}

/**
 * Helper: Rút gọn và chuẩn hóa tên thiết bị để in vừa vặn trong cột hẹp (12% ~ 80px)
 * Lược bỏ chú thích mở rộng trong ngoặc đơn và các tiền tố dài dòng (ví dụ "Roche cobas e 801" -> "cobas e 801")
 */
export function formatEquipmentForPrint(equipmentName?: string | null): string {
  if (!equipmentName || !equipmentName.trim() || equipmentName === 'Tự động') return 'Tự động';
  const trimmed = equipmentName.trim();
  
  // Nếu là ID thô (ví dụ "eq_ms360", "eq_msh630", "eq_cobas_e801", uuid), chuyển đổi về tên chuẩn
  if (trimmed.startsWith('eq_') || /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(trimmed)) {
    const matched = DEFAULT_TEST_EQUIPMENTS.find((e) =>
      e.id.toLowerCase() === trimmed.toLowerCase() ||
      (e.code && e.code.toLowerCase() === trimmed.toLowerCase())
    );
    if (matched) return formatEquipmentForPrint(matched.name);
    return 'Tự động';
  }

  // Bỏ phần chú thích trong ngoặc đơn, ví dụ "MS-H630 (Máy Phân Tích Huyết Học)" -> "MS-H630"
  let clean = trimmed.replace(/\s*\([^)]*\)/g, '').trim();
  // Rút gọn các tiền tố phổ biến
  clean = clean.replace(/^Roche\s+/i, '');
  clean = clean.replace(/^Tosoh\s+HLC-723G11/i, 'Tosoh G11');
  clean = clean.replace(/^MEDIWISS AlleisaScreen 44 BLOTrix Reader C1/i, 'MEDIWISS C1');
  clean = clean.replace(/^Máy Đọc Dị Nguyên PROTIA Smart Analyzer/i, 'PROTIA');
  clean = clean.replace(/^PROTIA Allergy-Q Smart Q-processor/i, 'PROTIA Q');
  return clean || trimmed;
}

export interface TestGroup {
  id: string;
  name: string;
}

export interface TestEquipment {
  id: string;
  name: string;
  code?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty?: string;
  phone?: string;
}

export interface CloudDbConfig {
  enabled: boolean;
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface InvoiceItem {
  code: string;
  name: string;
  price: number;
  quantity?: number;
  discount?: number;
  category?: string;
  unit?: string;
}

export interface Invoice {
  id: string;
  code: string;
  createdAt: string;
  patientName: string;
  patientDob: string;
  patientPhone: string;
  patientGender: Gender;
  patientAddress?: string;
  doctorName: string;
  items: InvoiceItem[];
  totalAmount: number;
  discountPercent: number;
  discountAmount?: number;
  discountType?: 'amount' | 'percent';
  surchargeAmount?: number;
  surchargeNote?: string;
  finalAmount: number;
  paymentMethod: PaymentMethod;
  status: InvoiceStatus;
  notes?: string;
  patientCode?: string;
  packageName?: string;
  cashierName?: string;
  reportId?: string;
  paidAt?: string;
  cancelledAt?: string;
  cloudPdfUrl?: string;
  qrCodeDataUrl?: string;
}

export interface ClinicInfo {
  name: string;
  address: string;
  phone: string;
  website?: string;
  defaultDoctor: string;
  logoUrl?: string;
  stampUrl?: string;
  headquartersAddress?: string; // Trụ sở chính hệ thống (VD: Số 36 BT5, Khu đô thị Pháp Vân, phường Hoàng Liệt, thành phố Hà Nội)
  bankId?: string;          // Mã định danh ngân hàng (VD: VBA, ICB, VCB, MB, TCB...)
  bankName?: string;        // Tên ngân hàng (VD: Agribank, VietinBank, Vietcombank...)
  bankAccountNo?: string;   // Số tài khoản
  bankAccountName?: string; // Tên chủ tài khoản
  bankBranch?: string;      // Chi nhánh ngân hàng (VD: Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình)
  bankQrImageUrl?: string;  // Ảnh QR code tùy chỉnh do người dùng upload
  cashierName?: string;     // Tên người lập phiếu (VD: Lê Phan Anh)
  accountantName?: string;  // Tên kế toán xác nhận (VD: Trần Thị Thanh Hương)
}

export const DEFAULT_CLINIC_INFO: ClinicInfo = {
  name: 'TRUNG TÂM XÉT NGHIỆM GOLAB QUẢNG BÌNH',
  address: 'Cổng BV-VNCB-ĐH, phường Đồng Hới, tỉnh Quảng Trị',
  headquartersAddress: 'Số 36 BT5, Khu đô thị Pháp Vân, phường Hoàng Liệt, thành phố Hà Nội',
  phone: '032.855.3773',
  website: 'golab.com.vn',
  defaultDoctor: 'Nguyễn Thị Thành Trung',
  bankId: 'VBA',
  bankName: 'Agribank',
  bankAccountNo: '8888876781225',
  bankAccountName: 'LE PHAN ANH',
  bankBranch: 'Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình',
  cashierName: 'Lê Phan Anh',
  accountantName: 'Trần Thị Thanh Hương'
};

export function isCorruptedClinicInfo(info?: Partial<ClinicInfo> | null): boolean {
  if (!info || !info.name) return false;
  const lowerName = info.name.toLowerCase();
  const lowerAddr = (info.address || '').toLowerCase();
  return (
    lowerName.includes('diễn giải') ||
    lowerName.includes('thang đo') ||
    lowerName.includes('mediwiss') ||
    lowerName.includes('protia') ||
    lowerAddr.includes('alleisascreen') ||
    lowerAddr.includes('blotrix') ||
    lowerAddr.includes('processor')
  );
}

export function getSafeClinicInfo(info?: ClinicInfo | null): ClinicInfo {
  if (!info || isCorruptedClinicInfo(info)) {
    return DEFAULT_CLINIC_INFO;
  }
  return {
    ...DEFAULT_CLINIC_INFO,
    ...info,
    name: info.name && !isCorruptedClinicInfo(info) ? info.name : DEFAULT_CLINIC_INFO.name,
    address: info.address && !isCorruptedClinicInfo(info) ? info.address : DEFAULT_CLINIC_INFO.address,
    headquartersAddress: info.headquartersAddress && !isCorruptedClinicInfo(info) ? info.headquartersAddress : DEFAULT_CLINIC_INFO.headquartersAddress,
    phone: info.phone && info.phone !== 'IU/ml' ? info.phone : DEFAULT_CLINIC_INFO.phone,
    website: info.website && !info.website.includes('+00') && !info.website.includes('T') ? info.website : DEFAULT_CLINIC_INFO.website,
  };
}

export interface AllergenGradeResult {
  grade: AllergenGrade;
  iuValue: string;
  note: string;
  statusStr: 'Dương tính' | 'Âm tính' | 'Bình thường';
}

export interface TestResultEvaluation {
  status: ResultStatus;
  label: string;
}

export interface StorageResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface ZaloZnsConfig {
  enabled: boolean;
  appId: string;
  secretKey: string;
  oaId: string;
  accessToken: string;
  refreshToken?: string;
  templateId: string;
  autoSendOnExport: boolean;
  proxyUrl?: string;
}

export interface ZaloSendResult {
  success: boolean;
  msgId?: string;
  error?: number;
  message?: string;
}

export interface MedicalReport {
  id: string;
  code: string;
  sampleCode: string;
  createdAt: string;
  updatedAt: string;
  patient: Patient;
  doctorName: string;
  selectedTests: SelectedTest[];
  conclusion: string;
  isAllergen: boolean;
  cloudPdfUrl?: string;
  qrCodeDataUrl?: string;
  invoiceId?: string;
  status: ReportStatus;
  testCount: number;
  zaloSentAt?: string;
  zaloMsgId?: string;
  /** Dấu mốc thời gian xuất PDF gần nhất (ISO String) */
  pdfGeneratedAt?: string;
  /** Số phiên bản PDF (1, 2, 3...) */
  pdfVersion?: number;
  /** Cờ đánh dấu dữ liệu đã bị chỉnh sửa sau lần xuất PDF gần nhất */
  isPdfOutdated?: boolean;
  /** Danh sách chi tiết các trường hoặc chỉ số đã thay đổi sau lần xuất PDF gần nhất (ví dụ: 'Sửa giới tính: Nam → Nữ') */
  dirtyReasons?: string[];
}

// ─── BATCH IMPORT / EXPORT TYPES ─────────────────────────────────────────────

export interface BatchImportRow {
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion: string;
  doctorName: string;
  hasExplicitCode?: boolean;
}

export interface BatchExportProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'running' | 'done' | 'cancelled' | 'error';
  errors: Array<{ code: string; patientName: string; error: string }>;
  results: Array<{ code: string; patientName: string; cloudUrl: string; qrDataUrl: string; blob: Blob; version?: number }>;
}

export interface AllergenDatabaseItem {
  tt: number;
  code: string;
  name: string;
  allergenName: string;
  route: string;
  normalRef: string;
  note: string;
  scaleId?: string;
}

export interface AllergenGradeLevel {
  grade: number;
  minVal: number;
  maxVal: number | null;
  rangeText: string;
  label: string;
  isPositive: boolean;
  colorKey?: string;
}

export interface AllergenGradingScale {
  id: string;
  name: string;
  equipment?: string;
  unit: string;
  levels: AllergenGradeLevel[];
}
