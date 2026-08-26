import { useQuery } from '@tanstack/react-query';
import { fetchRoomSchedule } from '../api/rooms';
import { queryKeys } from '../lib/queryClient';

export interface UseRoomScheduleParams {
  roomId: string | undefined;
  from: string;
  to: string;
}

export function useRoomSchedule({ roomId, from, to }: UseRoomScheduleParams) {
  return useQuery({
    queryKey: queryKeys.roomSchedule(roomId ?? '', { from, to }),
    queryFn: () => fetchRoomSchedule({ roomId: roomId ?? '', from, to }),
    enabled: Boolean(roomId),
  });
}
