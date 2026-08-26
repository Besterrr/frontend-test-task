import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Divider, Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useRoom } from '../../hooks/useRoom';
import { useRoomSchedule } from '../../hooks/useRoomSchedule';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { RoomSchedule } from './RoomSchedule';
import { BookingForm } from './BookingForm';

export function RoomDetailsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: room, isLoading, error, refetch } = useRoom(roomId);
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(null);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!room) return null;

  const timezone = room.office.timezone;
  const day = selectedDate ?? DateTime.now().setZone(timezone);
  const from = day.startOf('day').toUTC().toISO() ?? '';
  const to = day.endOf('day').toUTC().toISO() ?? '';

  return (
    <Stack spacing={3}>
      <div>
        <Typography variant="h4">{room.name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {room.office.name} · этаж {room.floor} · до {room.capacity} чел.
        </Typography>
      </div>

      <DatePicker
        label="День"
        value={day}
        minDate={DateTime.now().setZone(timezone)}
        maxDate={DateTime.now().setZone(timezone).plus({ days: 30 })}
        onChange={(value) => setSelectedDate(value)}
        sx={{ maxWidth: 240 }}
      />

      <RoomScheduleSection roomId={room.id} timezone={timezone} from={from} to={to} />

      <Divider />

      <div>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Забронировать
        </Typography>
        <BookingForm roomId={room.id} timezone={timezone} />
      </div>
    </Stack>
  );
}

interface RoomScheduleSectionProps {
  roomId: string;
  timezone: string;
  from: string;
  to: string;
}

function RoomScheduleSection({ roomId, timezone, from, to }: RoomScheduleSectionProps) {
  const { data, isLoading, error, refetch } = useRoomSchedule({ roomId, from, to });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return <RoomSchedule bookings={data ?? []} timezone={timezone} />;
}
