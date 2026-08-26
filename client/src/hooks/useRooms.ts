import { useQuery } from '@tanstack/react-query';
import { fetchRooms, RoomsQuery } from '../api/rooms';
import { queryKeys } from '../lib/queryClient';

export function useRooms(query: RoomsQuery) {
  return useQuery({
    queryKey: queryKeys.rooms(query),
    queryFn: () => fetchRooms(query),
    enabled: Boolean(query.officeId),
  });
}
