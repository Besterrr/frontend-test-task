import { Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useOffices } from '../../hooks/useOffices';
import { useMyBookings } from '../../hooks/useMyBookings';
import { useCancelBooking } from '../../hooks/useCancelBooking';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { isApiError } from '../../api/errors';
import { BookingsFiltersBar } from './BookingsFiltersBar';
import { BookingListItem } from './BookingListItem';
import { useBookingsFilters } from './useBookingsFilters';

export function BookingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { filters, setFilters } = useBookingsFilters();
  const { data: offices, isLoading: officesLoading, error: officesError } = useOffices();

  const {
    data: bookings,
    isLoading: bookingsLoading,
    error: bookingsError,
    refetch,
  } = useMyBookings({
    scope: filters.scope,
    ...(filters.officeId ? { officeId: filters.officeId } : {}),
  });

  const { mutateAsync: cancelMutateAsync, variables: cancellingBookingId } = useCancelBooking();

  if (officesLoading) return <LoadingState />;
  if (officesError) return <ErrorState error={officesError} />;

  const handleCancel = async (bookingId: string) => {
    try {
      await cancelMutateAsync(bookingId);
      enqueueSnackbar('Бронирование отменено', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(isApiError(error) ? error.message : 'Не удалось отменить бронирование', {
        variant: 'error',
      });
      throw error;
    }
  };

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Мои бронирования</Typography>

      <BookingsFiltersBar offices={offices ?? []} filters={filters} onChange={setFilters} />

      {bookingsLoading ? (
        <LoadingState />
      ) : bookingsError ? (
        <ErrorState
          error={bookingsError}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !bookings?.length ? (
        <EmptyState
          title="Бронирований не найдено"
          description="Попробуйте изменить фильтры или создайте новое бронирование в разделе «Переговорные»"
        />
      ) : (
        <Stack spacing={1.5}>
          {bookings.map((booking) => (
            <BookingListItem
              key={booking.id}
              booking={booking}
              onCancel={handleCancel}
              isCancelling={cancellingBookingId === booking.id}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}
