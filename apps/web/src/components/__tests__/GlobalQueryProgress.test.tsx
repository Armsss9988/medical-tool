// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { GlobalQueryProgress } from '../GlobalQueryProgress';

function TestComponent({ fetchFn }: { fetchFn: () => Promise<string> }) {
  useQuery({
    queryKey: ['test-key'],
    queryFn: fetchFn
  });
  return <div>Loaded content</div>;
}

describe('GlobalQueryProgress', () => {
  it('renders nothing when there are no active queries or mutations', () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    const { container } = render(
      <QueryClientProvider client={client}>
        <GlobalQueryProgress />
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId('global-query-progress')).toBeNull();
  });

  it('renders progress bar when there is an in-flight query', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });

    let resolvePromise: (val: string) => void;
    const pendingPromise = new Promise<string>((res) => {
      resolvePromise = res;
    });

    render(
      <QueryClientProvider client={client}>
        <GlobalQueryProgress />
        <TestComponent fetchFn={() => pendingPromise} />
      </QueryClientProvider>
    );

    await waitFor(() => {
      const progressBar = screen.getByTestId('global-query-progress');
      expect(progressBar).toBeDefined();
      expect(progressBar.getAttribute('role')).toBe('progressbar');
    });

    // Clean up pending promise
    resolvePromise!('done');
  });
});
