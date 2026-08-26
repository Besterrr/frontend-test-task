import { DateTime } from 'luxon';

const STEP_MINUTES = 15;
const WORKDAY_START_HOUR = 9;
const WORKDAY_END_HOUR = 20;

export function toOfficeIso(date: string, time: string, timezone: string): string | null {
  const dt = DateTime.fromISO(`${date}T${time}`, { zone: timezone });
  return dt.isValid ? dt.toUTC().toISO() : null;
}

export function addMinutesIso(iso: string, minutes: number): string {
  return DateTime.fromISO(iso).plus({ minutes }).toISO() ?? iso;
}

export interface IntervalValidationError {
  code:
    'OUTSIDE_WORKING_HOURS' | 'TIME_NOT_ALIGNED' | 'BOOKING_TOO_FAR_AHEAD' | 'START_NOT_IN_FUTURE';
  message: string;
}

export function validateOfficeInterval(
  startIso: string,
  endIso: string,
  timezone: string,
  now: DateTime = DateTime.now(),
): IntervalValidationError | null {
  const start = DateTime.fromISO(startIso).setZone(timezone);
  const end = DateTime.fromISO(endIso).setZone(timezone);

  const isAligned = (d: DateTime) => d.minute % STEP_MINUTES === 0 && d.second === 0;
  if (!isAligned(start) || !isAligned(end)) {
    return { code: 'TIME_NOT_ALIGNED', message: 'Время должно быть кратно 15 минутам' };
  }

  if (start.toMillis() <= now.toMillis()) {
    return { code: 'START_NOT_IN_FUTURE', message: 'Выберите время в будущем' };
  }

  if (start.diff(now, 'days').days > MAX_ADVANCE_DAYS) {
    return {
      code: 'BOOKING_TOO_FAR_AHEAD',
      message: `Бронирование доступно не более чем на ${MAX_ADVANCE_DAYS} дней вперёд`,
    };
  }

  const startMinutes = start.hour * 60 + start.minute;
  const endMinutes = end.hour * 60 + end.minute;
  const sameDay = start.toISODate() === end.toISODate();
  if (!sameDay || startMinutes < WORKDAY_START_HOUR * 60 || endMinutes > WORKDAY_END_HOUR * 60) {
    return {
      code: 'OUTSIDE_WORKING_HOURS',
      message: `Рабочие часы офиса: с ${WORKDAY_START_HOUR}:00 до ${WORKDAY_END_HOUR}:00`,
    };
  }

  return null;
}

export const INTERVAL_STEP_MINUTES = STEP_MINUTES;
export const WORKDAY_START = WORKDAY_START_HOUR;
export const WORKDAY_END = WORKDAY_END_HOUR;
export const MAX_ADVANCE_DAYS = 30;
