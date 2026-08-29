import { useState } from 'react';
import { Stack, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import { useOffices } from '../../hooks/useOffices';
import { useMyBookings } from '../../hooks/useMyBookings';
import { useCancelBooking } from '../../hooks/useCancelBooking';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { isApiError } from '../../api/errors';
import type { BookingView } from '../../api/models';
import { BookingsFiltersBar } from './BookingsFiltersBar';
import { BookingsTabs } from './BookingsTabs';
import { BookingListItem } from './BookingListItem';
import { CancelBookingDialog } from './CancelBookingDialog';
import { useBookingsFilters } from './useBookingsFilters';

export function BookingsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { filters, setFilters } = useBookingsFilters();
  const [pendingCancel, setPendingCancel] = useState<BookingView | null>(null);

  const { data: offices, isLoading: officesLoading, error: officesError } = useOffices();

  const officeParam = filters.officeId ? { officeId: filters.officeId } : {};

  const upcoming = useMyBookings({ scope: 'upcoming', ...officeParam });
  const past = useMyBookings({ scope: 'past', ...officeParam });

  const activeTab = filters.scope === 'past' ? 'past' : 'upcoming';
  const active = activeTab === 'past' ? past : upcoming;

  const { mutateAsync: cancelMutateAsync, isPending: isCancelling } = useCancelBooking();

  if (officesLoading) return <LoadingState />;
  if (officesError) return <ErrorState error={officesError} />;

  const handleConfirmCancel = async () => {
    if (!pendingCancel) return;
    try {
      await cancelMutateAsync(pendingCancel.id);
      enqueueSnackbar('Бронирование отменено', { variant: 'success' });
      setPendingCancel(null);
    } catch (error) {
      enqueueSnackbar(isApiError(error) ? error.message : 'Не удалось отменить бронирование', {
        variant: 'error',
      });
    }
  };

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
      >
        <Typography variant="h4">Мои бронирования</Typography>
        <BookingsFiltersBar offices={offices ?? []} filters={filters} onChange={setFilters} />
      </Stack>

      <BookingsTabs
        active={activeTab}
        upcomingCount={upcoming.data?.length ?? 0}
        onChange={(tab) => setFilters({ scope: tab })}
      />

      {active.isLoading ? (
        <LoadingState />
      ) : active.error ? (
        <ErrorState
          error={active.error}
          onRetry={() => {
            void active.refetch();
          }}
        />
      ) : !active.data?.length ? (
        <EmptyState
          title="Бронирований не найдено"
          description="Попробуйте изменить фильтры или создайте новое бронирование в разделе «Переговорные»"
        />
      ) : (
        <Stack spacing={1.5}>
          {active.data.map((booking) => (
            <BookingListItem key={booking.id} booking={booking} onCancelClick={setPendingCancel} />
          ))}
        </Stack>
      )}

      <CancelBookingDialog
        booking={pendingCancel}
        isCancelling={isCancelling}
        onConfirm={() => {
          void handleConfirmCancel();
        }}
        onClose={() => setPendingCancel(null)}
      />
    </Stack>
  );
}
