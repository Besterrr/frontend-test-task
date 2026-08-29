import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Button, Dialog, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useRoom } from '../../hooks/useRoom';
import { useRoomSchedule } from '../../hooks/useRoomSchedule';
import { useMe } from '../../hooks/useMe';
import { LoadingState } from '../../components/LoadingState';
import { ErrorState } from '../../components/ErrorState';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { RoomInfoCard } from './RoomInfoCard';
import { RoomSchedule } from './RoomSchedule';
import { BookingForm } from './BookingForm';
import { MAX_ADVANCE_DAYS } from '../../lib/officeTime';
import styles from './RoomDetailsPage.module.css';

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function RoomDetailsPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const { data: room, isLoading, error, refetch } = useRoom(roomId);
  const { data: me } = useMe();
  const [selectedDate, setSelectedDate] = useState<DateTime | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (!room) return null;

  const timezone = room.office.timezone;
  const now = DateTime.now().setZone(timezone);
  const day = selectedDate ?? DateTime.now().setZone(timezone);
  const from = day.startOf('day').toUTC().toISO() ?? '';
  const to = day.endOf('day').toUTC().toISO() ?? '';

  return (
    <div className={styles.page}>
      <Breadcrumbs
        items={[
          { label: 'Переговорные', to: '/rooms' },
          { label: room.office.name },
          { label: `Комната «${room.name}»` },
        ]}
      />

      <div className={styles.page__layout}>
        <RoomInfoCard room={room} />

        <div className={styles.scheduleCard}>
          <div className={styles.scheduleCard__header}>
            <div>
              <Typography variant="h6" className={styles.scheduleCard__title}>
                Расписание на день
              </Typography>
              <Typography variant="body2" className={styles.scheduleCard__date}>
                {capitalize(day.setLocale('ru').toFormat('cccc, d MMMM'))}
              </Typography>
            </div>
            <DatePicker
              label="Выбрать дату"
              value={day}
              onChange={(value) => setSelectedDate(value)}
              minDate={now.startOf('day')}
              maxDate={now.plus({ days: MAX_ADVANCE_DAYS }).endOf('day')}
              slotProps={{
                textField: { size: 'small', className: styles.scheduleCard__dateField },
              }}
            />
          </div>

          <RoomScheduleSection
            roomId={room.id}
            timezone={timezone}
            from={from}
            to={to}
            {...(me?.id !== undefined ? { currentUserId: me.id } : {})}
          />

          <div className={styles.scheduleCard__footer}>
            <Button
              variant="contained"
              onClick={() => setIsBookingOpen(true)}
              className={styles.scheduleCard__bookButton}
            >
              Забронировать комнату
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isBookingOpen} onClose={() => setIsBookingOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle className={styles.dialog__title}>
          Новое бронирование
          <IconButton onClick={() => setIsBookingOpen(false)} size="small" aria-label="Закрыть">
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <BookingForm
            roomId={room.id}
            timezone={timezone}
            onCreated={() => setIsBookingOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RoomScheduleSectionProps {
  roomId: string;
  timezone: string;
  from: string;
  to: string;
  currentUserId?: string;
}

function RoomScheduleSection({
  roomId,
  timezone,
  from,
  to,
  currentUserId,
}: RoomScheduleSectionProps) {
  const { data, isLoading, error, refetch } = useRoomSchedule({ roomId, from, to });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <RoomSchedule
      bookings={data ?? []}
      timezone={timezone}
      {...(currentUserId !== undefined ? { currentUserId } : {})}
    />
  );
}
