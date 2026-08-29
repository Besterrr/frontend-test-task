import { useQuery } from '@tanstack/react-query';
import { fetchCurrentUser } from '../api/me';
import { queryKeys } from '../lib/queryClient';

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: fetchCurrentUser,
    staleTime: Infinity,
  });
}
