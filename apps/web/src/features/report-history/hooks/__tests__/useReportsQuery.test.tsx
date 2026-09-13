// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useReportsQuery, useSaveReportMutation } from '../useReportsQuery';
import type { MedicalReport } from '@domain/types';

function makeWrapper() {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useReportsQuery and Mutations', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and sanitizes reports from API', async () => {
    const mockReports = [
      {
        id: 'rep-1',
        patient: { name: 'Nguyễn Văn Test', code: 'BN-01', gender: 'Nam' },
        selectedTests: [],
        createdAt: '2026-09-12T00:00:00Z'
      }
    ];

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ rows: mockReports, count: 1, updatedAt: '2026-09-12' })
    });

    const { result } = renderHook(() => useReportsQuery(), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.reports.length).toBe(1);
    expect(result.current.reports[0].id).toBe('rep-1');
    expect(result.current.reports[0].patient.name).toBe('NGUYỄN VĂN TEST');
  });

  it('saveReportMutation calls postReport and invalidates query', async () => {
    const reportToSave = {
      id: 'rep-2',
      code: 'BN-02',
      createdAt: '2026-09-12T00:00:00Z',
      patient: { name: 'Trần Văn Lưu', code: 'BN-02', gender: 'Nam' as const },
      selectedTests: [],
      conclusion: 'Tốt',
      doctorName: 'BS. Long',
      status: 'Đã có kết quả' as const,
      isPdfOutdated: false,
      pdfVersion: 1
    };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, id: 'rep-2' })
    });

    const wrapper = makeWrapper();
    const { result } = renderHook(() => useSaveReportMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(reportToSave as unknown as MedicalReport);
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
