import { z } from 'zod';
import type { MedicalReport } from '../domain/types';
import { REPORT_STATUS } from '../domain/constants';

const flexibleNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}, z.number().nullable().optional());

export const patientSchema = z.object({
  name: z.preprocess((v) => (typeof v === 'string' ? v.trim().toUpperCase() : ''), z.string().min(1, 'Tên bệnh nhân không được để trống')),
  code: z.preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : `BN-${Date.now()}`), z.string().default(() => `BN-${Date.now()}`)),
  gender: z.preprocess((v) => (typeof v === 'string' && ['Nam', 'Nữ', 'Khác'].includes(v) ? v : 'Nam'), z.string().default('Nam')),
  dob: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  phone: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  address: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  doctor: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  sampleCode: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  orderedAt: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  receivedAt: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  returnedAt: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  paidAt: z.string().nullable().optional()
}).passthrough();

export const selectedTestSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== 'object') return raw;
  const item = { ...raw } as Record<string, unknown>;
  const code = item.code || item.testCode || '';
  const name = item.name || item.testName || '';
  return {
    ...item,
    code: String(code).trim(),
    name: String(name).trim(),
    testCode: String(code).trim(),
    testName: String(name).trim()
  };
}, z.object({
  code: z.string().min(1, 'Mã chỉ số không được để trống'),
  name: z.string().default('Chỉ số xét nghiệm'),
  testCode: z.string().optional(),
  testName: z.string().optional(),
  category: z.preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : 'Sinh hóa'), z.string().default('Sinh hóa')),
  result: z.preprocess((v) => (v === null || v === undefined ? '' : String(v)), z.string().default('')),
  note: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  unit: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  refMin: flexibleNumber,
  refMax: flexibleNumber,
  refText: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  price: flexibleNumber,
  equipmentId: z.string().nullable().optional(),
  equipment: z.string().nullable().optional(),
  evaluationType: z.string().nullable().optional()
}).passthrough());

export const medicalReportSchema = z.object({
  id: z.string().min(1),
  code: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.string().default('')),
  sampleCode: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.string().default('')),
  createdAt: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : new Date().toISOString()),
    z.string().default(() => new Date().toISOString())
  ),
  patient: patientSchema,
  selectedTests: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(selectedTestSchema).default([])
  ),
  conclusion: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  doctorName: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  status: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : REPORT_STATUS.RESULTED),
    z.string().default(REPORT_STATUS.RESULTED)
  ),
  cloudPdfUrl: z.string().nullable().optional(),
  qrCodeDataUrl: z.string().nullable().optional(),
  pdfVersion: z.preprocess((v) => (v !== null && v !== undefined && !isNaN(Number(v)) ? Number(v) : 1), z.number().default(1)),
  isPdfOutdated: z.preprocess((v) => Boolean(v), z.boolean().default(false)),
  dirtyReasons: z.preprocess(
    (v) => (Array.isArray(v) ? v.map((item) => String(item).trim()).filter(Boolean) : []),
    z.array(z.string()).default([])
  ),
  invoiceId: z.string().nullable().optional(),
  zaloSentAt: z.string().nullable().optional(),
  zaloMsgId: z.string().nullable().optional(),
  pdfGeneratedAt: z.string().nullable().optional()
}).passthrough();

export type ValidatedMedicalReport = z.infer<typeof medicalReportSchema>;

/**
 * An toàn tuyệt đối: Parse danh sách reports từ DB hoặc Storage, tự động làm sạch và bỏ qua phần tử hỏng.
 */
export function safeParseMedicalReports(raw: unknown): MedicalReport[] {
  if (!Array.isArray(raw)) return [];

  const results: MedicalReport[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;

    // Chuẩn bị fallback nếu thiếu patient
    const candidate = { ...item } as Record<string, unknown>;
    if (!candidate.patient || typeof candidate.patient !== 'object') {
      if (candidate.id) {
        candidate.patient = {
          name: (typeof candidate.name === 'string' && candidate.name.trim()) || 'BỆNH NHÂN',
          code: candidate.code || candidate.id
        };
      } else {
        continue; // Bỏ qua vì hoàn toàn không có ID và Patient
      }
    }

    const parseRes = medicalReportSchema.safeParse(candidate);
    if (parseRes.success) {
      results.push(parseRes.data as unknown as MedicalReport);
    }
  }

  return results;
}
