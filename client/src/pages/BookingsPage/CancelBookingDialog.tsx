import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import {
  MeetingRoomOutlined as RoomIcon,
  CalendarMonthOutlined as CalendarIcon,
} from '@mui/icons-material';
import { DateTime } from 'luxon';
import type { BookingView } from '../../api/models';
import styles from './CancelBookingDialog.module.css';

interface CancelBookingDialogProps {
  booking: BookingView | null;
  isCancelling: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function CancelBookingDialog({
  booking,
  isCancelling,
  onConfirm,
  onClose,
}: CancelBookingDialogProps) {
  if (!booking) return null;

  const start = DateTime.fromISO(booking.startsAt).setZone(booking.office.timezone);
  const end = DateTime.fromISO(booking.endsAt).setZone(booking.office.timezone);
  const dateLabel = capitalize(start.setLocale('ru').toFormat('cccc, d MMMM'));
  const timeLabel = `${start.toFormat('HH:mm')} - ${end.toFormat('HH:mm')}`;

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Отменить бронирование?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Это действие нельзя будет отменить. Освободившееся время станет доступно другим
          сотрудникам.
        </Typography>

        <div className={styles.summary}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            {booking.title}
          </Typography>
          <div className={styles.summary__row}>
            <RoomIcon fontSize="small" className={styles.summary__icon} />
            <span>
              Комната «{booking.room.name}», {booking.room.floor} этаж
            </span>
          </div>
          <div className={styles.summary__row}>
            <CalendarIcon fontSize="small" className={styles.summary__icon} />
            <span>
              {dateLabel}, {timeLabel}
            </span>
          </div>
        </div>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={onClose}
          disabled={isCancelling}
          sx={{ textTransform: 'none', borderColor: '#e2e8f0', color: '#0f172a' }}
        >
          Нет, оставить
        </Button>
        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={isCancelling}
          sx={{ textTransform: 'none' }}
        >
          Да, отменить
        </Button>
      </DialogActions>
    </Dialog>
  );
}
