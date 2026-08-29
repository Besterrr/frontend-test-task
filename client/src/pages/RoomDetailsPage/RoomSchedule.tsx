import { DateTime } from 'luxon';
import type { BookingView } from '../../api/models';
import { EmptyState } from '../../components/EmptyState';
import { WORKDAY_START, WORKDAY_END } from '../../lib/officeTime';
import styles from './RoomSchedule.module.css';

interface RoomScheduleProps {
  bookings: BookingView[];
  timezone: string;
  currentUserId?: string;
}

const HOUR_HEIGHT = 56;
const MIN_EVENT_HEIGHT = 28;
const HOURS = Array.from(
  { length: WORKDAY_END - WORKDAY_START + 1 },
  (_, index) => WORKDAY_START + index,
);

export function RoomSchedule({ bookings, timezone, currentUserId }: RoomScheduleProps) {
  if (bookings.length === 0) {
    return (
      <EmptyState
        title="На этот день нет бронирований"
        description="Переговорная свободна весь день"
      />
    );
  }

  return (
    <div className={styles.schedule}>
      <div className={styles.schedule__hours}>
        {HOURS.map((hour) => (
          <div key={hour} className={styles.schedule__hourRow}>
            <span className={styles.schedule__hourLabel}>{String(hour).padStart(2, '0')}:00</span>
          </div>
        ))}
      </div>

      <div className={styles.schedule__grid} style={{ height: HOURS.length * HOUR_HEIGHT }}>
        {HOURS.map((hour) => (
          <div key={hour} className={styles.schedule__gridLine} />
        ))}

        {bookings.map((booking) => {
          const start = DateTime.fromISO(booking.startsAt).setZone(timezone);
          const end = DateTime.fromISO(booking.endsAt).setZone(timezone);
          const startOffsetMinutes = (start.hour - WORKDAY_START) * 60 + start.minute;
          const durationMinutes = end.diff(start, 'minutes').minutes;
          const top = (startOffsetMinutes / 60) * HOUR_HEIGHT;
          const height = Math.max((durationMinutes / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT);
          const isOwn = currentUserId !== undefined && booking.userId === currentUserId;

          return (
            <div
              key={booking.id}
              className={`${styles.schedule__event} ${
                isOwn ? styles.schedule__event_own : styles.schedule__event_busy
              }`}
              style={{ top, height }}
            >
              <span className={styles.schedule__eventTitle}>
                {isOwn ? booking.title : 'Занято'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
