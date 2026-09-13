import { z } from 'zod';
import type { Invoice } from '../domain/types';
import { BILLING_STATUS } from '../domain/constants';

const flexibleNumber = z.preprocess((val) => {
  if (val === '' || val === null || val === undefined) return null;
  const n = Number(val);
  return isNaN(n) ? null : n;
}, z.number().nullable().optional());

export const invoiceItemSchema = z.object({
  code: z.preprocess((v) => (typeof v === 'string' ? v.trim() : String(v ?? '')), z.string().default('ITEM')),
  name: z.preprocess((v) => (typeof v === 'string' ? v.trim() : String(v ?? '')), z.string().default('Dịch vụ xét nghiệm')),
  quantity: flexibleNumber.transform((v) => v ?? 1).default(1),
  price: flexibleNumber.transform((v) => v ?? 0).default(0),
  discount: flexibleNumber.transform((v) => v ?? 0).default(0),
  finalPrice: flexibleNumber.transform((v) => v ?? 0).default(0)
}).passthrough();

export const invoiceSchema = z.object({
  id: z.string().min(1),
  code: z.preprocess((v) => (typeof v === 'string' && v.trim() ? v.trim() : `HD-${Date.now()}`), z.string().default(() => `HD-${Date.now()}`)),
  reportId: z.string().nullable().optional(),
  patientName: z.preprocess((v) => (typeof v === 'string' ? v.trim() : ''), z.string().default('')),
  patientPhone: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  patientCode: z.preprocess((v) => (v === null || v === undefined ? '' : String(v).trim()), z.string().default('')),
  items: z.preprocess(
    (val) => (Array.isArray(val) ? val : []),
    z.array(invoiceItemSchema).default([])
  ),
  totalAmount: flexibleNumber.transform((v) => v ?? 0).default(0),
  discount: flexibleNumber.transform((v) => v ?? 0).default(0),
  finalAmount: flexibleNumber.transform((v) => v ?? 0).default(0),
  status: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() ? v.trim() : BILLING_STATUS.UNPAID),
    z.string().default(BILLING_STATUS.UNPAID)
  ),
  paymentMethod: z.string().nullable().optional(),
  cashier: z.string().nullable().optional(),
  paidAt: z.string().nullable().optional(),
  createdAt: z.preprocess(
    (v) => (typeof v === 'string' && v ? v : new Date().toISOString()),
    z.string().default(() => new Date().toISOString())
  ),
  updatedAt: z.preprocess(
    (v) => (typeof v === 'string' && v ? v : new Date().toISOString()),
    z.string().default(() => new Date().toISOString())
  )
}).passthrough();

export type ValidatedInvoice = z.infer<typeof invoiceSchema>;

/**
 * An toàn tuyệt đối: Parse danh sách hóa đơn từ DB hoặc Storage, tự động điền default và bỏ qua bản ghi rác.
 */
export function safeParseInvoices(raw: unknown): Invoice[] {
  if (!Array.isArray(raw)) return [];

  const results: Invoice[] = [];

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;

    const candidate = item as Record<string, unknown>;
    if (!candidate.id || typeof candidate.id !== 'string') continue;

    const parseRes = invoiceSchema.safeParse(candidate);
    if (parseRes.success) {
      results.push(parseRes.data as unknown as Invoice);
    }
  }

  return results;
}
