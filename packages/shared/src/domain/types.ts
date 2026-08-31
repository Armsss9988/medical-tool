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

export type EvaluationType = 'range' | 'scale' | 'text';

/** Liên kết giữa một chỉ số xét nghiệm và một loại máy đo cụ thể (kèm ngưỡng tham chiếu riêng cho máy) */
export interface CatalogItemEquipmentLink {
  id: string;
  catalogCode: string;
  equipmentId: string;
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
  /** @deprecated Dùng equipmentLinks thay thế — giữ để backward compat với dữ liệu cũ */
  equipment?: string;
  /** @deprecated Dùng equipmentLinks thay thế */
  referenceRangeId?: string;
  /** @deprecated Dùng equipmentLinks thay thế */
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

/** Một mục chỉ số trong gói xét nghiệm, kèm thông tin máy đo được chọn */
export interface PackageItem {
  code: string;
  /** ID máy đo được chọn cho chỉ số này trong gói. null = dùng máy mặc định của chỉ số */
  equipmentId?: string | null;
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
          list.push({
            code: c,
            equipmentId: (i as { equipmentId?: string | null }).equipmentId || null
          });
        }
      }
    }
    if (list.length > 0) return list;
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
    codes: codes.length > 0 ? codes : items.map((i) => i.code)
  };
}

/**
 * Helper: Tra cứu tên thiết bị đo phù hợp cho một chỉ số xét nghiệm
 */
export function resolveTestEquipmentName(
  t: { code?: string; category?: string; scaleId?: string; equipment?: string } | undefined | null,
  equipments: TestEquipment[] = [],
  catalogItemEquipments: CatalogItemEquipmentLink[] = []
): string {
  if (!t) return 'Tự động';

  // 1. Nếu đã có tên máy đo cụ thể và không phải là ID thô (eq_...)
  if (t.equipment && t.equipment.trim() !== '') {
    const raw = t.equipment.trim();
    // Nếu trùng tên hoặc code với thiết bị đã có
    const matched = equipments.find((e) => e.id === raw || e.name.toLowerCase() === raw.toLowerCase() || (e.code && e.code.toLowerCase() === raw.toLowerCase()));
    if (matched) return matched.name;
    if (!raw.startsWith('eq_') && raw !== 'Tự động') return raw;
  }

  // 2. Tra cứu từ liên kết catalog_item_equipments
  const code = (t.code || '').trim().toUpperCase();
  if (code && catalogItemEquipments.length > 0) {
    const links = catalogItemEquipments.filter((l) => l.catalogCode.toUpperCase() === code);
    const defaultLink = links.find((l) => l.isDefault) || links[0];
    if (defaultLink) {
      const eq = equipments.find((e) => e.id === defaultLink.equipmentId);
      if (eq) return eq.name;
    }
  }

  // 3. Tra cứu theo nhóm dị nguyên hoặc thang đo
  if (t.category?.includes('Dị Nguyên') || t.scaleId) {
    if (t.scaleId === 'scale_allergen_44') return 'MEDIWISS AlleisaScreen 44 BLOTrix Reader C1';
    return 'Máy Đọc Dị Nguyên PROTIA Smart Analyzer';
  }

  // 4. Fallback mặc định theo nhóm xét nghiệm phổ biến
  const cat = (t.category || '').toLowerCase();
  if (cat.includes('huyết học') || ['rbc', 'wbc', 'plt', 'hgb', 'hct', 'mcv', 'mch', 'mchc'].includes(code.toLowerCase())) {
    const eq = equipments.find((e) => e.name.includes('Huyết Học') || e.code === 'MS-H630');
    if (eq) return eq.name;
    return 'MS-H630 (Máy Phân Tích Huyết Học)';
  }
  if (cat.includes('sinh hóa') || ['glu', 'ure', 'creat', 'ast', 'alt', 'cho', 'tri', 'uric', 'crp', 'fe', 'ferr'].includes(code.toLowerCase())) {
    const eq = equipments.find((e) => e.code === 'MS-360' || e.name.includes('MS-360'));
    if (eq) return eq.name;
    return 'MS-360 (Vi Chất)';
  }
  if (cat.includes('miễn dịch') || ['e2', 'lh', 'fsh', 'prl', 'prog', 'testo', 'hcg', 'afp', 'cea', 'ca125', 'ca19-9', 'ca15-3', 'tsh', 'ft3', 'ft4', 't3', 't4', 'ferritin'].includes(code.toLowerCase())) {
    const eq = equipments.find((e) => e.name.includes('cobas') || e.code === 'COBAS-E801');
    if (eq) return eq.name;
    return 'Roche cobas e 801 (Miễn Dịch)';
  }
  if (cat.includes('huyết sắc tố') || ['hba1c', 'hba2', 'hbf'].includes(code.toLowerCase())) {
    const eq = equipments.find((e) => e.code === 'TOSOH-G11' || e.name.includes('Tosoh'));
    if (eq) return eq.name;
    return 'Tosoh HLC-723G11 (Huyết Sắc Tố)';
  }

  return 'Tự động';
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
  autoSync?: boolean;
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
  doctorName: string;
  items: InvoiceItem[];
  totalAmount: number;
  discountPercent: number;
  discountAmount?: number;
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
  bankId?: string;          // Mã định danh ngân hàng (VD: VBA, ICB, VCB, MB, TCB...)
  bankName?: string;        // Tên ngân hàng (VD: Agribank, VietinBank, Vietcombank...)
  bankAccountNo?: string;   // Số tài khoản
  bankAccountName?: string; // Tên chủ tài khoản
  bankBranch?: string;      // Chi nhánh ngân hàng (VD: Agribank - Chi nhánh Lý Thái Tổ - Quảng Bình)
  bankQrImageUrl?: string;  // Ảnh QR code tùy chỉnh do người dùng upload
  cashierName?: string;     // Tên người lập phiếu (VD: Lê Phan Anh)
  accountantName?: string;  // Tên kế toán xác nhận (VD: Trần Thị Thanh Hương)
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
}

// ─── BATCH IMPORT / EXPORT TYPES ─────────────────────────────────────────────

export interface BatchImportRow {
  patient: Patient;
  selectedTests: SelectedTest[];
  conclusion: string;
  doctorName: string;
}

export interface BatchExportProgress {
  total: number;
  completed: number;
  current: string;
  status: 'idle' | 'running' | 'done' | 'cancelled' | 'error';
  errors: Array<{ code: string; patientName: string; error: string }>;
  results: Array<{ code: string; patientName: string; cloudUrl: string; qrDataUrl: string; blob: Blob }>;
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
