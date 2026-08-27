import { z } from 'zod';
import { DateTime } from 'luxon';
import {
  INTERVAL_STEP_MINUTES,
  WORKDAY_START,
  WORKDAY_END,
  MAX_ADVANCE_DAYS,
} from '../../lib/officeTime';

export interface BookingFormContext {
  timezone: string;
  now: DateTime;
}

const MIN_DURATION_MINUTES = 15;

const dateTimeSchema = z.custom<DateTime>(
  (value): value is DateTime => value instanceof DateTime && value.isValid,
  { message: 'Некорректная дата' },
);

export function createBookingFormSchema(context: BookingFormContext) {
  return z
    .object({
      roomId: z.string().min(1),
      title: z.string().trim().min(1, 'Укажите тему встречи').max(200),
      comment: z.string().trim().max(2_000).nullable().default(null),
      date: dateTimeSchema.nullable().refine((d): d is DateTime => d !== null, 'Выберите дату'),
      startTime: dateTimeSchema
        .nullable()
        .refine((d): d is DateTime => d !== null, 'Выберите время начала'),
      durationMinutes: z
        .number()
        .int()
        .min(MIN_DURATION_MINUTES, `Минимальная продолжительность — ${MIN_DURATION_MINUTES} минут`)
        .refine(
          (v) => v % INTERVAL_STEP_MINUTES === 0,
          'Продолжительность должна быть кратна 15 минутам',
        ),
    })
    .superRefine((values, ctx) => {
      if (!values.date || !values.startTime) return;

      const start = DateTime.fromObject(
        {
          year: values.date.year,
          month: values.date.month,
          day: values.date.day,
          hour: values.startTime.hour,
          minute: values.startTime.minute,
        },
        { zone: context.timezone },
      );
      const end = start.plus({ minutes: values.durationMinutes });

      if (start.minute % INTERVAL_STEP_MINUTES !== 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: 'Время начала должно быть кратно 15 минутам',
        });
        return;
      }

      if (start <= context.now) {
        ctx.addIssue({
          code: 'custom',
          path: ['startTime'],
          message: 'Бронирование можно создать только на будущее время',
        });
        return;
      }

      const maxAdvanceMs = MAX_ADVANCE_DAYS * 24 * 60 * 60 * 1000;
      if (start.toMillis() - context.now.toMillis() > maxAdvanceMs) {
        ctx.addIssue({
          code: 'custom',
          path: ['date'],
          message: `Бронирование доступно не более чем на ${MAX_ADVANCE_DAYS} дней вперёд`,
        });
        return;
      }

      const startMinutes = start.hour * 60 + start.minute;
      const endMinutes = end.hour * 60 + end.minute;
      const sameDay = start.toISODate() === end.toISODate();
      if (!sameDay || startMinutes < WORKDAY_START * 60 || endMinutes > WORKDAY_END * 60) {
        ctx.addIssue({
          code: 'custom',
          path: ['durationMinutes'],
          message: `Встреча должна полностью укладываться в рабочие часы офиса: с ${WORKDAY_START}:00 до ${WORKDAY_END}:00`,
        });
      }
    });
}

export type BookingFormInput = z.input<ReturnType<typeof createBookingFormSchema>>;
export type BookingFormOutput = z.output<ReturnType<typeof createBookingFormSchema>>;

export function bookingFormValuesToInterval(
  values: BookingFormOutput,
  timezone: string,
): { startsAt: string; endsAt: string } | null {
  const start = DateTime.fromObject(
    {
      year: values.date.year,
      month: values.date.month,
      day: values.date.day,
      hour: values.startTime.hour,
      minute: values.startTime.minute,
    },
    { zone: timezone },
  );
  if (!start.isValid) return null;
  const end = start.plus({ minutes: values.durationMinutes });
  return { startsAt: start.toUTC().toISO() ?? '', endsAt: end.toUTC().toISO() ?? '' };
}
