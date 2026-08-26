import { List, ListItem, ListItemText } from '@mui/material';
import { DateTime } from 'luxon';
import type { BookingView } from '../../api/models';
import { EmptyState } from '../../components/EmptyState';

interface RoomScheduleProps {
  bookings: BookingView[];
  timezone: string;
}

export function RoomSchedule({ bookings, timezone }: RoomScheduleProps) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="На этот день нет бронирований"
        description="Переговорная свободна весь день"
      />
    );
  }

  return (
    <List>
      {bookings.map((booking) => {
        const start = DateTime.fromISO(booking.startsAt).setZone(timezone);
        const end = DateTime.fromISO(booking.endsAt).setZone(timezone);
        return (
          <ListItem key={booking.id} divider>
            <ListItemText
              primary={`${start.toFormat('HH:mm')}–${end.toFormat('HH:mm')} · ${booking.title}`}
              secondary={booking.owner.displayName}
            />
          </ListItem>
        );
      })}
    </List>
  );
}
