import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBooking } from '../api/bookings';

export function useCancelBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelBooking,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['bookings'] }),
        queryClient.invalidateQueries({ queryKey: ['rooms'] }),
      ]);
    },
  });
}
