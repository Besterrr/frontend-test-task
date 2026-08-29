import { IconButton, Tooltip } from '@mui/material';
import {
  MeetingRoomOutlined as RoomIcon,
  CalendarMonthOutlined as CalendarIcon,
} from '@mui/icons-material';
import { DateTime } from 'luxon';
import type { BookingView } from '../../api/models';
import { getTimezoneAbbreviation } from '../../lib/officeTime';
import { downloadBookingIcs, isWithinIcsExportWindow } from '../../lib/ics';
import styles from './BookingListItem.module.css';

interface BookingListItemProps {
  booking: BookingView;
  onCancelClick: (booking: BookingView) => void;
}

export function BookingListItem({ booking, onCancelClick }: BookingListItemProps) {
  const start = DateTime.fromISO(booking.startsAt).setZone(booking.office.timezone);
  const end = DateTime.fromISO(booking.endsAt).setZone(booking.office.timezone);
  const isFuture = DateTime.fromISO(booking.startsAt) > DateTime.now();
  const canExportToCalendar = isWithinIcsExportWindow(booking);
  const monthLabel = start.setLocale('ru').toFormat('LLLL').toUpperCase();
  const tz = getTimezoneAbbreviation(booking.office.timezone);

  return (
    <div className={styles.card}>
      <div className={styles.card__date}>
        <span className={styles.card__dateMonth}>{monthLabel}</span>
        <span className={styles.card__dateDay}>{start.toFormat('d')}</span>
      </div>

      <div className={styles.card__body}>
        <span className={styles.card__title}>{booking.title}</span>
        <div className={styles.card__meta}>
          <RoomIcon fontSize="small" className={styles.card__metaIcon} />
          <span className={styles.card__room}>{booking.room.name}</span>
          <span className={styles.card__dot}>•</span>
          <span>{booking.room.floor} этаж</span>
          <span className={styles.card__dot}>•</span>
          <span>
            {start.toFormat('HH:mm')} - {end.toFormat('HH:mm')} {tz}
          </span>
        </div>
      </div>

      <div className={styles.card__actions}>
        {canExportToCalendar && (
          <Tooltip title="Добавить в календарь">
            <IconButton
              aria-label="Добавить в календарь"
              size="small"
              onClick={() => downloadBookingIcs(booking)}
            >
              <CalendarIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {isFuture && (
          <button
            type="button"
            className={styles.card__cancelBtn}
            onClick={() => onCancelClick(booking)}
          >
            Отменить
          </button>
        )}
      </div>
    </div>
  );
}
