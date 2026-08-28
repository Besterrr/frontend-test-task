import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { cancelBooking } from '../api/bookings';
import type { BookingView } from '../api/models';

interface CancelBookingContext {
  previousQueries: [QueryKey, BookingView[] | undefined][];
}

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    meta: { suppressGlobalError: true },
    onMutate: async (bookingId): Promise<CancelBookingContext> => {
      await queryClient.cancelQueries({ queryKey: ['bookings'] });

      const previousQueries = queryClient.getQueriesData<BookingView[]>({
        queryKey: ['bookings'],
      });

      for (const [queryKey, data] of previousQueries) {
        if (!data) continue;
        queryClient.setQueryData<BookingView[]>(
          queryKey,
          data.filter((booking) => booking.id !== bookingId),
        );
      }

      return { previousQueries };
    },
    onError: (_error, _bookingId, context) => {
      if (!context) return;
      for (const [queryKey, data] of context.previousQueries) {
        queryClient.setQueryData(queryKey, data);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
      ]);
    },
  });
}
