import { useQuery } from '@tanstack/react-query';
import { fetchMyBookings, type MyBookingsQuery } from '../api/bookings';
import { queryKeys } from '../lib/queryClient';

export function useMyBookings(query: MyBookingsQuery = {}) {
  return useQuery({
    queryKey: queryKeys.myBookings({
      ...(query.scope !== undefined ? { scope: query.scope } : {}),
      ...(query.officeId !== undefined ? { officeId: query.officeId } : {}),
    }),
    queryFn: () => fetchMyBookings(query),
  });
}
