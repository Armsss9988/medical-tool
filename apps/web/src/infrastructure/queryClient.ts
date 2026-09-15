import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false
    }
  }
});

export function tableQueryKey(name: string) {
  return ['table', name] as const;
}

export const REPORTS_QUERY_KEY = ['reports'] as const;
export const INVOICES_QUERY_KEY = ['invoices'] as const;
