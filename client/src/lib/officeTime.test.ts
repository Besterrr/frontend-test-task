import { describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import {
  toOfficeIso,
  addMinutesIso,
  validateOfficeInterval,
  INTERVAL_STEP_MINUTES,
  WORKDAY_START,
  WORKDAY_END,
  MAX_ADVANCE_DAYS,
} from './officeTime';

const MOSCOW = 'Europe/Moscow';

describe('toOfficeIso', () => {
  it('переводит время офиса в корректный UTC ISO', () => {
    const iso = toOfficeIso('2026-08-19', '10:00', MOSCOW);
    expect(iso).not.toBeNull();
    expect(DateTime.fromISO(iso!).toUTC().toISO()).toBe('2026-08-19T07:00:00.000Z');
  });

  it('не путает время офиса с локальным временем браузера (регрессия таймзонового бага)', () => {
    const iso = toOfficeIso('2026-08-19', '10:00', MOSCOW);
    const parsed = DateTime.fromISO(iso!).toUTC();
    expect(parsed.hour).toBe(7);
    expect(parsed.minute).toBe(0);
  });

  it('возвращает null для некорректной даты', () => {
    expect(toOfficeIso('не-дата', '10:00', MOSCOW)).toBeNull();
  });

  it('корректно работает для другой таймзоны офиса', () => {
    const iso = toOfficeIso('2026-08-19', '10:00', 'Asia/Yekaterinburg'); // UTC+5
    const parsed = DateTime.fromISO(iso!).toUTC();
    expect(parsed.hour).toBe(5);
  });
});

describe('addMinutesIso', () => {
  it('прибавляет минуты к ISO-времени', () => {
    const start = '2026-08-19T07:00:00.000Z';
    const end = addMinutesIso(start, 90);
    expect(DateTime.fromISO(end).toUTC().toISO()).toBe('2026-08-19T08:30:00.000Z');
  });

  it('корректно переносит через полночь', () => {
    const start = '2026-08-19T23:30:00.000Z';
    const end = addMinutesIso(start, 60);
    expect(DateTime.fromISO(end).toUTC().toISODate()).toBe('2026-08-20');
  });
});

describe('validateOfficeInterval', () => {
  const now = DateTime.fromISO('2026-08-18T09:00:00', { zone: MOSCOW });

  function interval(startsAt: string, endsAt: string) {
    return validateOfficeInterval(startsAt, endsAt, MOSCOW, now);
  }

  it('не выдаёт ошибку для валидного интервала', () => {
    const start = toOfficeIso('2026-08-19', '10:00', MOSCOW)!;
    const end = addMinutesIso(start, 60);
    expect(interval(start, end)).toBeNull();
  });

  it('отклоняет время, не выровненное по шагу 15 минут', () => {
    const start = toOfficeIso('2026-08-19', '10:07', MOSCOW)!;
    const end = addMinutesIso(start, 60);
    expect(interval(start, end)?.code).toBe('TIME_NOT_ALIGNED');
  });

  it('отклоняет начало не в будущем', () => {
    const start = now.toUTC().toISO()!;
    const end = addMinutesIso(start, 60);
    expect(interval(start, end)?.code).toBe('START_NOT_IN_FUTURE');
  });

  it(`отклоняет бронирование более чем на ${MAX_ADVANCE_DAYS} дней вперёд`, () => {
    const start = toOfficeIso(
      now.plus({ days: MAX_ADVANCE_DAYS, minutes: 15 }).toISODate()!,
      '09:15',
      MOSCOW,
    )!;
    const end = addMinutesIso(start, 60);
    expect(interval(start, end)?.code).toBe('BOOKING_TOO_FAR_AHEAD');
  });

  it(`принимает интервал ровно в начале рабочего дня (${WORKDAY_START}:00)`, () => {
    const start = toOfficeIso('2026-08-19', `0${WORKDAY_START}:00`, MOSCOW)!;
    const end = addMinutesIso(start, INTERVAL_STEP_MINUTES);
    expect(interval(start, end)).toBeNull();
  });

  it(`отклоняет интервал, заканчивающийся позже ${WORKDAY_END}:00`, () => {
    const start = toOfficeIso('2026-08-19', `${WORKDAY_END - 1}:45`, MOSCOW)!;
    const end = addMinutesIso(start, 30);
    expect(interval(start, end)?.code).toBe('OUTSIDE_WORKING_HOURS');
  });
});
