import { useState } from 'react';
import { Card, CardContent, Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { DeleteOutlined as DeleteOutlineIcon } from '@mui/icons-material';
import { DateTime } from 'luxon';
import type { BookingView } from '../../api/models';

interface BookingListItemProps {
  booking: BookingView;
  onCancel: (bookingId: string) => Promise<void>;
  isCancelling: boolean;
}

export function BookingListItem({ booking, onCancel, isCancelling }: BookingListItemProps) {
  const [localError, setLocalError] = useState<string | null>(null);
  const start = DateTime.fromISO(booking.startsAt).setZone(booking.office.timezone);
  const end = DateTime.fromISO(booking.endsAt).setZone(booking.office.timezone);
  const isFuture = DateTime.fromISO(booking.startsAt) > DateTime.now();

  const handleCancel = async () => {
    setLocalError(null);
    try {
      await onCancel(booking.id);
    } catch {
      setLocalError('Не удалось отменить бронирование');
    }
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1">{booking.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {start.toFormat('dd.MM.yyyy')} · {start.toFormat('HH:mm')}–{end.toFormat('HH:mm')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {booking.office.name} · {booking.room.name}
            </Typography>
            {booking.comment && <Typography variant="body2">{booking.comment}</Typography>}
          </Stack>

          <Stack spacing={1} sx={{ alignItems: 'flex-end' }}>
            {!isFuture && <Chip label="Завершено" size="small" />}
            {isFuture && (
              <Tooltip title="Отменить бронирование">
                <span>
                  <IconButton
                    aria-label="Отменить бронирование"
                    color="error"
                    disabled={isCancelling}
                    onClick={() => {
                      void handleCancel();
                    }}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </span>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        {localError && (
          <Typography variant="body2" color="error" sx={{ mt: 1 }}>
            {localError}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
