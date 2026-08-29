// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTableQuery } from '../tableHooks';
import type { TableData } from '../apiClient';

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}

describe('useTableQuery', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls /tables/catalog and returns parsed rows', async () => {
    const payload: TableData = { rows: [{ id: 1 }], count: 1, updatedAt: '2026-08-29T00:00:00Z' };
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => payload
    });

    const { result } = renderHook(() => useTableQuery('catalog'), { wrapper: makeWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const callUrl = fetchMock.mock.calls[0][0] as string;
    expect(callUrl.endsWith('/tables/catalog')).toBe(true);
    expect(result.current.data).toEqual(payload);
  });
});
