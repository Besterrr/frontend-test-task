import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingListItem } from './BookingListItem';
import type { BookingView } from '../../api/models';

const TEST_NOW = new Date('2026-08-18T09:00:00.000Z');
const TIMEZONE = 'Europe/Moscow';

function makeBooking(overrides: Partial<BookingView> = {}): BookingView {
  return {
    id: 'booking-1',
    roomId: 'room-everest',
    userId: 'user-konstantin',
    title: 'Обсуждение проекта',
    comment: null,
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
      timezone: TIMEZONE,
    },
    owner: {
      id: 'user-konstantin',
      login: 'kkuznetsov',
      displayName: 'Константин Кузнецов',
      email: 'kkuznetsov@example.test',
      avatarUrl: null,
      initials: 'КК',
    },
    ...overrides,
  };
}

describe('BookingListItem', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TEST_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('отображает тему, месяц, число, комнату, этаж и время', () => {
    render(<BookingListItem booking={makeBooking()} onCancelClick={vi.fn()} />);

    expect(screen.getByText('Обсуждение проекта')).toBeInTheDocument();
    expect(screen.getByText('19')).toBeInTheDocument();
    expect(screen.getByText('Эверест')).toBeInTheDocument();
    expect(screen.getByText(/4 этаж/)).toBeInTheDocument();
    expect(screen.getByText(/10:00 - 11:00 MSK/)).toBeInTheDocument();
  });

  it('показывает кнопку "Отменить" для будущего бронирования', () => {
    render(<BookingListItem booking={makeBooking()} onCancelClick={vi.fn()} />);
    expect(screen.getByText('Отменить')).toBeInTheDocument();
  });

  it('не показывает кнопку "Отменить" для прошедшего бронирования', () => {
    render(
      <BookingListItem
        booking={makeBooking({
          startsAt: '2026-08-17T07:00:00.000Z',
          endsAt: '2026-08-17T08:00:00.000Z',
        })}
        onCancelClick={vi.fn()}
      />,
    );

    expect(screen.queryByText('Отменить')).not.toBeInTheDocument();
  });

  it('вызывает onCancelClick с объектом бронирования по клику', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancelClick = vi.fn();
    const booking = makeBooking();

    render(<BookingListItem booking={booking} onCancelClick={onCancelClick} />);
    await user.click(screen.getByText('Отменить'));

    expect(onCancelClick).toHaveBeenCalledWith(booking);
  });

  it('показывает кнопку экспорта в календарь для бронирования в пределах окна', () => {
    render(<BookingListItem booking={makeBooking()} onCancelClick={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Добавить в календарь' })).toBeInTheDocument();
  });

  it('не показывает кнопку экспорта для бронирования дальше 30 дней вперёд', () => {
    render(
      <BookingListItem
        booking={makeBooking({
          startsAt: '2026-09-25T07:00:00.000Z',
          endsAt: '2026-09-25T08:00:00.000Z',
        })}
        onCancelClick={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Добавить в календарь' })).not.toBeInTheDocument();
  });

  it('не показывает кнопку экспорта для бронирования старше 14 дней', () => {
    render(
      <BookingListItem
        booking={makeBooking({
          startsAt: '2026-07-25T07:00:00.000Z',
          endsAt: '2026-07-25T08:00:00.000Z',
        })}
        onCancelClick={vi.fn()}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Добавить в календарь' })).not.toBeInTheDocument();
  });

  it('вызывает downloadBookingIcs по клику на кнопку экспорта', async () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'createObjectURL').mockImplementation(createObjectURL);
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(vi.fn());
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = originalCreateElement(tag);
      if (tag === 'a') el.click = vi.fn();
      return el;
    });

    const user = userEvent.setup({ delay: null });
    render(<BookingListItem booking={makeBooking()} onCancelClick={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Добавить в календарь' }));

    expect(createObjectURL).toHaveBeenCalled();
    vi.restoreAllMocks();
  });
});
