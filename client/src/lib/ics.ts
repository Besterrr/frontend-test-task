import { DateTime } from 'luxon';
import type { BookingView } from '../api/models';

const ICS_DATE_FORMAT = "yyyyMMdd'T'HHmmss'Z'";

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatIcsDate(iso: string): string {
  return DateTime.fromISO(iso).toUTC().toFormat(ICS_DATE_FORMAT);
}

export function buildBookingIcs(booking: BookingView): string {
  const now = DateTime.now().toUTC().toFormat(ICS_DATE_FORMAT);
  const descriptionParts = [booking.comment, `Организатор: ${booking.owner.displayName}`].filter(
    (part): part is string => Boolean(part),
  );

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookRoom//RU',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${booking.id}@bookroom`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatIcsDate(booking.startsAt)}`,
    `DTEND:${formatIcsDate(booking.endsAt)}`,
    `SUMMARY:${escapeIcsText(booking.title)}`,
    `LOCATION:${escapeIcsText(`${booking.office.name}, ${booking.room.name}`)}`,
    ...(descriptionParts.length
      ? [`DESCRIPTION:${escapeIcsText(descriptionParts.join('\\n'))}`]
      : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

export function downloadBookingIcs(booking: BookingView): void {
  const content = buildBookingIcs(booking);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `booking-${booking.id}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const ICS_EXPORT_WINDOW_DAYS_PAST = 14;
const ICS_EXPORT_WINDOW_DAYS_FUTURE = 30;

export function isWithinIcsExportWindow(
  booking: BookingView,
  now: DateTime = DateTime.now(),
): boolean {
  const start = DateTime.fromISO(booking.startsAt);
  const earliestAllowed = now.minus({ days: ICS_EXPORT_WINDOW_DAYS_PAST });
  const latestAllowed = now.plus({ days: ICS_EXPORT_WINDOW_DAYS_FUTURE });
  return start >= earliestAllowed && start <= latestAllowed;
}
