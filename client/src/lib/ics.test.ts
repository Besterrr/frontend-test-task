import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { DateTime } from 'luxon';
import { buildBookingIcs, downloadBookingIcs, isWithinIcsExportWindow } from './ics';
import type { BookingView } from '../api/models';

function makeBooking(overrides: Partial<BookingView> = {}): BookingView {
  return {
    id: 'booking-1',
    roomId: 'room-everest',
    userId: 'user-1',
    title: 'Обсуждение проекта',
    comment: 'Сверяем план работ',
    startsAt: '2026-08-19T07:00:00.000Z',
    endsAt: '2026-08-19T08:00:00.000Z',
    createdAt: '2026-08-17T09:00:00.000Z',
    room: {
      id: 'room-everest',
      officeId: 'office-moscow',
      name: 'Эверест',
      floor: 4,
      capacity: 12,
      features: [],
    },
    office: {
      id: 'office-moscow',
      name: 'Офис Москва',
      address: 'Москва, ул. Лесная, 7',
      timezone: 'Europe/Moscow',
    },
    owner: {
      id: 'user-1',
      login: 'npopekhin',
      displayName: 'Попехин Никита',
      email: 'n@example.test',
      avatarUrl: null,
      initials: 'ПН',
    },
    ...overrides,
  };
}

describe('buildBookingIcs', () => {
  it('содержит обязательные VCALENDAR/VEVENT блоки', () => {
    const ics = buildBookingIcs(makeBooking());

    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('форматирует даты начала и окончания в UTC формате ics', () => {
    const ics = buildBookingIcs(makeBooking());

    expect(ics).toContain('DTSTART:20260819T070000Z');
    expect(ics).toContain('DTEND:20260819T080000Z');
  });

  it('включает тему встречи в SUMMARY', () => {
    const ics = buildBookingIcs(makeBooking());
    expect(ics).toContain('SUMMARY:Обсуждение проекта');
  });

  it('включает офис и комнату в LOCATION', () => {
    const ics = buildBookingIcs(makeBooking());
    expect(ics).toContain('LOCATION:Офис Москва\\, Эверест');
  });

  it('включает комментарий и организатора в DESCRIPTION', () => {
    const ics = buildBookingIcs(makeBooking());
    expect(ics).toContain('DESCRIPTION:');
    expect(ics).toContain('Сверяем план работ');
    expect(ics).toContain('Организатор: Попехин Никита');
  });

  it('не добавляет DESCRIPTION, если нет комментария', () => {
    const ics = buildBookingIcs(makeBooking({ comment: null }));
    expect(ics).not.toContain('DESCRIPTION:Сверяем');
  });

  it('экранирует запятые и точки с запятой в тексте', () => {
    const ics = buildBookingIcs(makeBooking({ title: 'Встреча, важная; тема' }));
    expect(ics).toContain('SUMMARY:Встреча\\, важная\\; тема');
  });

  it('экранирует обратный слэш', () => {
    const ics = buildBookingIcs(makeBooking({ title: 'C:\\path' }));
    expect(ics).toContain('SUMMARY:C:\\\\path');
  });

  it('использует UID на основе id бронирования', () => {
    const ics = buildBookingIcs(makeBooking({ id: 'booking-xyz' }));
    expect(ics).toContain('UID:booking-xyz@bookroom');
  });

  it('использует CRLF как разделитель строк (требование RFC 5545)', () => {
    const ics = buildBookingIcs(makeBooking());
    expect(ics).toContain('\r\n');
  });
});

describe('downloadBookingIcs', () => {
  const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url');
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.spyOn(URL, 'createObjectURL').mockImplementation(mockCreateObjectURL);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(mockRevokeObjectURL);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockCreateObjectURL.mockClear();
    mockRevokeObjectURL.mockClear();
  });

  it('создаёт и кликает ссылку на скачивание, затем освобождает URL', () => {
    const clickSpy = vi.fn();
    const appendSpy = vi.spyOn(document.body, 'appendChild');
    const removeSpy = vi.spyOn(document.body, 'removeChild');
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = clickSpy;
      }
      return el;
    });

    downloadBookingIcs(makeBooking());

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(appendSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });

  it('использует id бронирования в имени файла', () => {
    let downloadAttr = '';
    const originalCreateElement = document.createElement.bind(document);

    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') {
        el.click = vi.fn();
        Object.defineProperty(el, 'download', {
          set: (value: string) => {
            downloadAttr = value;
          },
          get: () => downloadAttr,
        });
      }
      return el;
    });

    downloadBookingIcs(makeBooking({ id: 'booking-42' }));

    expect(downloadAttr).toBe('booking-booking-42.ics');
  });
});

describe('isWithinIcsExportWindow', () => {
  const now = DateTime.fromISO('2026-08-18T09:00:00.000Z');

  it('возвращает true для бронирования сегодня', () => {
    const booking = makeBooking({ startsAt: now.toISO()! });
    expect(isWithinIcsExportWindow(booking, now)).toBe(true);
  });

  it('возвращает true для бронирования 30 дней вперёд', () => {
    const booking = makeBooking({ startsAt: now.plus({ days: 30 }).toISO()! });
    expect(isWithinIcsExportWindow(booking, now)).toBe(true);
  });

  it('возвращает false для бронирования 31 день вперёд', () => {
    const booking = makeBooking({ startsAt: now.plus({ days: 31 }).toISO()! });
    expect(isWithinIcsExportWindow(booking, now)).toBe(false);
  });

  it('возвращает true для бронирования 14 дней назад', () => {
    const booking = makeBooking({ startsAt: now.minus({ days: 14 }).toISO()! });
    expect(isWithinIcsExportWindow(booking, now)).toBe(true);
  });

  it('возвращает false для бронирования 15 дней назад', () => {
    const booking = makeBooking({ startsAt: now.minus({ days: 15 }).toISO()! });
    expect(isWithinIcsExportWindow(booking, now)).toBe(false);
  });
});
