import { Grid } from '@mui/material';
import { useOffices } from '../../hooks/useOffices';
import { useRooms } from '../../hooks/useRooms';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { RoomFiltersBar } from './RoomFiltersBar';
import { RoomCard } from './RoomCard';
import { useRoomsFilters } from './useRoomsFilters';
import styles from './RoomsPage.module.css';

export function RoomsPage() {
  const { filters, setFilters } = useRoomsFilters();
  const { data: offices, isLoading: officesLoading, error: officesError } = useOffices();

  const roomsParams = {
    officeId: filters.officeId ?? '',
    ...(filters.minCapacity ? { minCapacity: filters.minCapacity } : {}),
    ...(filters.from && filters.to ? { from: filters.from, to: filters.to } : {}),
  };

  const {
    data: rooms,
    isLoading: roomsLoading,
    error: roomsError,
    refetch,
  } = useRooms(roomsParams);

  if (officesLoading) return <LoadingState />;
  if (officesError) return <ErrorState error={officesError} />;

  return (
    <div className={styles.roomsPage}>
      <RoomFiltersBar offices={offices ?? []} filters={filters} onChange={setFilters} />

      {!filters.officeId ? (
        <EmptyState
          title="Выберите офис"
          description="Для просмотра доступных переговорных сначала выберите офис из списка выше"
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
        <EmptyState title="Комнаты не найдены" description="Попробуйте изменить параметры поиска" />
      ) : (
        <Grid container spacing={2} className={styles.roomsPage__grid}>
          {rooms.map((room) => (
            <Grid key={room.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <RoomCard room={room} />
            </Grid>
          ))}
        </Grid>
      )}
    </div>
  );
}
