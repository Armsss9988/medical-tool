import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTable, putTable, type TableData } from './apiClient';
import { tableQueryKey } from './queryClient';

export function useTableQuery(name: string) {
  return useQuery<TableData>({
    queryKey: tableQueryKey(name),
    queryFn: () => getTable(name)
  });
}

export function useTableMutation(name: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: unknown[]) => putTable(name, rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: tableQueryKey(name) });
    }
  });
}
