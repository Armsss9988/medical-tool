// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useInvoicesQuery,
  usePayInvoiceMutation
} from '../useInvoicesQuery';
import { REPORTS_QUERY_KEY, INVOICES_QUERY_KEY } from '@infra/queryClient';
import type { Invoice, MedicalReport } from '@domain/types';

function makeWrapper(client?: QueryClient) {
  const queryClient = client || new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useInvoicesQuery and Command Mutations', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and sanitizes invoices from API', async () => {
    const mockInvoices = [
      {
        id: 'inv-1',
        code: 'HD-01',
        patientName: 'Lê Văn An',
        finalAmount: 350000,
        status: 'Chưa thu phí',
        items: []
      }
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rows: mockInvoices, count: 1, updatedAt: '2026-09-12' })
    });

    const { result } = renderHook(() => useInvoicesQuery(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.invoices.length).toBe(1);
    expect(result.current.invoices[0].id).toBe('inv-1');
    expect(result.current.invoices[0].finalAmount).toBe(350000);
  });

  it('payInvoiceMutation invalidates BOTH invoices and reports queries', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    const invalidateSpy = vi.spyOn(client, 'invalidateQueries');

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        invoice: { id: 'inv-1', status: 'Đã thu tiền' },
        report: { id: 'rep-1', status: 'Đã có kết quả' }
      })
    });

    const { result } = renderHook(() => usePayInvoiceMutation(), { wrapper: makeWrapper(client) });

    await act(async () => {
      await result.current.mutateAsync({
        id: 'inv-1',
        paymentMethod: 'Tiền mặt',
        cashier: 'Thu ngân 1'
      });
    });

    expect(fetchMock).toHaveBeenCalled();
    // Phải invalidate cả 2 mảng với refetchType: 'none' để đồng bộ ngầm mà không ghi đè dữ liệu
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: INVOICES_QUERY_KEY, refetchType: 'none' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: REPORTS_QUERY_KEY, refetchType: 'none' });
  });

  it('payInvoiceMutation sends full invoice and report in body when provided', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
    });

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        invoice: { id: 'inv-test-pay', status: 'Đã thanh toán' },
        report: { id: 'rep-test-pay', status: 'Đã thanh toán' }
      })
    });

    const { result } = renderHook(() => usePayInvoiceMutation(), { wrapper: makeWrapper(client) });

    const mockInvoice = { id: 'inv-test-pay', code: 'HD-999', patientName: 'NGUYEN VAN A', finalAmount: 200000 } as unknown as Invoice;
    const mockReport = { id: 'rep-test-pay', code: 'BN-999', patient: { name: 'NGUYEN VAN A' } } as unknown as MedicalReport;

    await act(async () => {
      await result.current.mutateAsync({
        id: 'inv-test-pay',
        paymentMethod: 'Chuyển khoản',
        cashier: 'Lê Phan Anh',
        invoice: mockInvoice,
        report: mockReport
      });
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/invoices/inv-test-pay/pay',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          paymentMethod: 'Chuyển khoản',
          cashier: 'Lê Phan Anh',
          invoice: mockInvoice,
          report: mockReport
        })
      })
    );
  });
});
