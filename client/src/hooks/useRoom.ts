import { useQuery } from '@tanstack/react-query';
import { fetchRoom } from '../api/rooms';
import { queryKeys } from '../lib/queryClient';

export function useRoom(roomId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.room(roomId ?? ''),
    queryFn: () => fetchRoom(roomId ?? ''),
    enabled: Boolean(roomId),
  });
}
