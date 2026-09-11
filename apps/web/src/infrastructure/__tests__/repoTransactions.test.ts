import { describe, it, expect, vi } from 'vitest';
import {
  getInvoiceById,
  getMedicalReportById,
  payInvoiceTransaction,
  cancelInvoiceTransaction,
  deleteMedicalReport
} from '../../../lib/repo';

describe('Repo Transaction Functions', () => {
  it('should export single-entity query and transaction functions', () => {
    expect(typeof getInvoiceById).toBe('function');
    expect(typeof getMedicalReportById).toBe('function');
    expect(typeof payInvoiceTransaction).toBe('function');
    expect(typeof cancelInvoiceTransaction).toBe('function');
  });

  it('payInvoiceTransaction throws error when invoice not found', async () => {
    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => {
        return await cb({
          select: () => ({
            from: () => ({
              where: () => []
            })
          })
        });
      })
    };

    await expect(
      payInvoiceTransaction(mockDb as any, 'non-existing', { paymentMethod: 'Tiền mặt', cashier: 'Thu ngân A' })
    ).rejects.toThrow('Invoice not found: non-existing');
  });

  it('cancelInvoiceTransaction throws error when invoice not found', async () => {
    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => {
        return await cb({
          select: () => ({
            from: () => ({
              where: () => []
            })
          })
        });
      })
    };

    await expect(
      cancelInvoiceTransaction(mockDb as any, 'non-existing', { reason: 'Sai sót', cancelledBy: 'Thu ngân A' })
    ).rejects.toThrow('Invoice not found: non-existing');
  });

  it('payInvoiceTransaction uses fallbackInvoice when invoice is not found in DB', async () => {
    const mockInvoice: any = {
      id: 'inv-new',
      code: 'HD-001',
      status: 'Chưa thu phí',
      finalAmount: 100000,
      items: []
    };

    const mockTx = {
      select: () => ({
        from: () => ({
          where: () => []
        })
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(true)
        })
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true)
      })
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => {
        return await cb(mockTx);
      })
    };

    const result = await payInvoiceTransaction(
      mockDb as any,
      'inv-new',
      { paymentMethod: 'Chuyển khoản', cashier: 'Thu ngân B' },
      mockInvoice
    );

    expect(result.invoice.id).toBe('inv-new');
    expect(result.invoice.status).toBe('Đã thanh toán');
    expect(result.invoice.cashierName).toBe('Thu ngân B');
  });

  it('payInvoiceTransaction updates linked report using saveMedicalReportInternal without throwing', async () => {
    const mockInvoice: any = {
      id: 'inv-1',
      code: 'HD-001',
      status: 'Chưa thu phí',
      finalAmount: 100000,
      reportId: 'rep-1',
      items: []
    };

    const mockReport: any = {
      id: 'rep-1',
      code: 'BN001',
      patient: { name: 'Nguyen Van A' },
      selectedTests: []
    };

    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            // First call gets invoice, second gets report, third gets tests
            return [mockInvoice];
          }),
          orderBy: vi.fn().mockResolvedValue([])
        })
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          onConflictDoUpdate: vi.fn().mockResolvedValue(true)
        })
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(true)
      })
    };

    // Make select return mockInvoice for invoice, and mockReport for report
    let selectCount = 0;
    mockTx.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockImplementation(() => {
          selectCount++;
          if (selectCount === 1) {
            return Object.assign([mockInvoice], { orderBy: vi.fn().mockResolvedValue([]) });
          }
          if (selectCount === 2) {
            return Object.assign([], { orderBy: vi.fn().mockResolvedValue([]) });
          }
          if (selectCount === 3) {
            return Object.assign([mockReport], { orderBy: vi.fn().mockResolvedValue([]) });
          }
          return Object.assign([], { orderBy: vi.fn().mockResolvedValue([]) });
        })
      })
    });

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => {
        return await cb(mockTx);
      })
    };

    const result = await payInvoiceTransaction(
      mockDb as any,
      'inv-1',
      { paymentMethod: 'Tiền mặt', cashier: 'Thu ngân' }
    );

    expect(result.invoice.status).toBe('Đã thanh toán');
    expect(result.report).toBeDefined();
    expect(result.report?.id).toBe('rep-1');
  });

  it('deleteMedicalReport unlinks invoices.reportId within transaction', async () => {
    const updateWhere = vi.fn().mockResolvedValue(true);
    const updateSet = vi.fn().mockReturnValue({ where: updateWhere });
    const deleteWhere = vi.fn().mockResolvedValue(true);

    const mockTx = {
      delete: vi.fn().mockReturnValue({ where: deleteWhere }),
      update: vi.fn().mockReturnValue({ set: updateSet })
    };

    const mockDb = {
      transaction: vi.fn().mockImplementation(async (cb) => {
        return await cb(mockTx);
      })
    };

    const res = await deleteMedicalReport(mockDb as any, 'rep-del');
    expect(res).toBe(true);
    expect(mockTx.update).toHaveBeenCalledTimes(1);
    expect(updateSet).toHaveBeenCalledWith({ reportId: null });
    expect(mockTx.delete).toHaveBeenCalledTimes(2);
  });
});
