// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Header from '../Header';
import type { ClinicInfo } from '@domain/types';

const mockClinicInfo: ClinicInfo = {
  name: 'Phòng Khám Đa Khoa Test',
  address: '123 Đường Test',
  phone: '0901234567',
  defaultDoctor: 'BS Test'
};

function InFlightQueryComponent({ fetchPromise }: { fetchPromise: Promise<string> }) {
  useQuery({
    queryKey: ['header-test-query'],
    queryFn: () => fetchPromise
  });
  return null;
}

describe('Header Component Real-time Sync Indicator', () => {
  it('does not display sync indicator when queries are idle', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    render(
      <QueryClientProvider client={client}>
        <Header
          clinicInfo={mockClinicInfo}
          onOpenSettings={vi.fn()}
          onOpenCatalogModal={vi.fn()}
          onOpenRevenueModal={vi.fn()}
          onOpenReportManagerModal={vi.fn()}
        />
      </QueryClientProvider>
    );

    expect(screen.queryByTestId('header-sync-indicator')).toBeNull();
  });

  it('displays sync indicator badge when queries are in-flight', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    let resolver: (v: string) => void;
    const promise = new Promise<string>((res) => {
      resolver = res;
    });

    render(
      <QueryClientProvider client={client}>
        <Header
          clinicInfo={mockClinicInfo}
          onOpenSettings={vi.fn()}
          onOpenCatalogModal={vi.fn()}
          onOpenRevenueModal={vi.fn()}
          onOpenReportManagerModal={vi.fn()}
        />
        <InFlightQueryComponent fetchPromise={promise} />
      </QueryClientProvider>
    );

    const syncIndicator = screen.getByTestId('header-sync-indicator');
    expect(syncIndicator).toBeTruthy();
    expect(screen.getByText('Đang tải...')).toBeTruthy();

    resolver!('done');
  });
});
