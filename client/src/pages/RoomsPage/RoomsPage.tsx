import { Grid, Typography } from '@mui/material';
import { useOffices } from '../../hooks/useOffices';
import { useRooms } from '../../hooks/useRooms';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { EmptyState } from '../../components/EmptyState';
import { RoomFiltersBar } from './RoomFiltersBar';
import { RoomCard } from './RoomCard';
import { useRoomsFilters } from './useRoomsFilters';

export function RoomsPage() {
  const { filters, setFilters } = useRoomsFilters();
  const { data: offices, isLoading: officesLoading, error: officesError } = useOffices();

  const {
    data: rooms,
    isLoading: roomsLoading,
    error: roomsError,
    refetch,
  } = useRooms({
    officeId: filters.officeId ?? '',
    ...(filters.minCapacity ? { minCapacity: filters.minCapacity } : {}),
    ...(filters.from && filters.to ? { from: filters.from, to: filters.to } : {}),
  });

  if (officesLoading) return <LoadingState />;
  if (officesError) return <ErrorState error={officesError} />;

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Переговорные
      </Typography>

      <RoomFiltersBar offices={offices ?? []} filters={filters} onChange={setFilters} />

      {!filters.officeId ? (
        <EmptyState
          title="Выберите офис"
          description="Комнаты появятся после выбора офиса из списка выше"
        />
      ) : roomsLoading ? (
        <LoadingState />
      ) : roomsError ? (
        <ErrorState
          error={roomsError}
          onRetry={() => {
            void refetch();
          }}
        />
      ) : !rooms?.length ? (
        <EmptyState title="Комнаты не найдены" description="Попробуйте изменить фильтры" />
      ) : (
        <Grid container spacing={2}>
          {rooms.map((room) => (
            <Grid key={room.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <RoomCard room={room} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
