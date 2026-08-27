import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { createBookingFormSchema } from './bookingFormSchema';

const TIMEZONE = 'Europe/Moscow';
const NOW = DateTime.fromISO('2026-08-18T09:00:00', { zone: TIMEZONE });

function makeSchema(now: DateTime = NOW) {
  return createBookingFormSchema({ timezone: TIMEZONE, now });
}

function baseValues(overrides: {
  title?: string;
  date?: DateTime | null;
  startTime?: DateTime | null;
  durationMinutes?: number;
}) {
  return {
    roomId: 'room-everest',
    title: overrides.title ?? 'Обсуждение проекта',
    comment: null,
    date: overrides.date ?? null,
    startTime: overrides.startTime ?? null,
    durationMinutes: overrides.durationMinutes ?? 60,
  };
}

function timeAt(hour: number, minute = 0) {
  return DateTime.fromObject({ hour, minute });
}

function dayAt(daysFromNow: number) {
  return NOW.plus({ days: daysFromNow });
}

function firstIssuePath(result: ReturnType<ReturnType<typeof makeSchema>['safeParse']>) {
  if (result.success) return null;
  return result.error.issues[0]?.path.join('.') ?? null;
}

describe('createBookingFormSchema', () => {
  describe('обязательные поля', () => {
    it('требует непустую тему встречи', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ title: '   ', date: dayAt(1), startTime: timeAt(10) }),
      );
      expect(result.success).toBe(false);
    });

    it('требует выбранную дату', () => {
      const schema = makeSchema();
      const result = schema.safeParse(baseValues({ date: null, startTime: timeAt(10) }));
      expect(result.success).toBe(false);
    });

    it('требует выбранное время начала', () => {
      const schema = makeSchema();
      const result = schema.safeParse(baseValues({ date: dayAt(1), startTime: null }));
      expect(result.success).toBe(false);
    });
  });

  describe('выравнивание времени по 15 минутам', () => {
    it('отклоняет время начала, не кратное 15 минутам', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(10, 7), durationMinutes: 60 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('startTime');
    });

    it('принимает время начала, кратное 15 минутам', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(10, 15), durationMinutes: 60 }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe('время должно быть в будущем', () => {
    it('отклоняет время начала, равное текущему моменту', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: NOW, startTime: NOW, durationMinutes: 60 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('startTime');
    });

    it('принимает время начала на минуту позже текущего момента', () => {
      const schema = makeSchema();
      const future = NOW.plus({ minutes: 15 });
      const result = schema.safeParse(
        baseValues({ date: future, startTime: future, durationMinutes: 15 }),
      );

      expect(result.success).toBe(true);
    });
  });

  describe('горизонт бронирования — 30 дней', () => {
    it('принимает бронирование ровно через 30 дней', () => {
      const schema = makeSchema();
      const date = dayAt(30);
      const result = schema.safeParse(
        baseValues({ date, startTime: timeAt(9, 0), durationMinutes: 60 }),
      );

      expect(result.success).toBe(true);
    });

    it('отклоняет бронирование через 30 дней и минуту', () => {
      const schema = makeSchema();
      const date = dayAt(30).plus({ minutes: 1 });
      const result = schema.safeParse(
        baseValues({ date, startTime: timeAt(10), durationMinutes: 60 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('date');
    });
  });

  describe('рабочие часы офиса 09:00–20:00', () => {
    it('отклоняет начало встречи в 08:59', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(8, 45), durationMinutes: 15 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('durationMinutes');
    });

    it('принимает начало встречи ровно в 09:00', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(9, 0), durationMinutes: 15 }),
      );

      expect(result.success).toBe(true);
    });

    it('принимает встречу, заканчивающуюся ровно в 20:00', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(19, 0), durationMinutes: 60 }),
      );

      expect(result.success).toBe(true);
    });

    it('отклоняет встречу, заканчивающуюся позже рабочих часов', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(19, 15), durationMinutes: 60 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('durationMinutes');
    });

    it('отклоняет встречу, выходящую за пределы дня (не sameDay)', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(23, 45), durationMinutes: 30 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('durationMinutes');
    });
  });

  describe('минимальная продолжительность и шаг 15 минут', () => {
    it('отклоняет продолжительность меньше 15 минут', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(10), durationMinutes: 10 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('durationMinutes');
    });

    it('отклоняет продолжительность, не кратную 15 минутам', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(10), durationMinutes: 20 }),
      );

      expect(result.success).toBe(false);
      expect(firstIssuePath(result)).toBe('durationMinutes');
    });

    it('принимает продолжительность 15 минут', () => {
      const schema = makeSchema();
      const result = schema.safeParse(
        baseValues({ date: dayAt(1), startTime: timeAt(10), durationMinutes: 15 }),
      );

      expect(result.success).toBe(true);
    });
  });
});
