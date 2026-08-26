import { useQuery } from '@tanstack/react-query';
import { fetchOffices } from '../api/offices';
import { queryKeys } from '../lib/queryClient';

export function useOffices() {
  return useQuery({
    queryKey: queryKeys.offices(),
    queryFn: fetchOffices,
    staleTime: Infinity,
  });
}
