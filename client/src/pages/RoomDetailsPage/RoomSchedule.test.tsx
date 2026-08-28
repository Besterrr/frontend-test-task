import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoomSchedule } from './RoomSchedule';
import type { BookingView } from '../../api/models';

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

describe('RoomSchedule', () => {
  it('показывает пустое состояние, если бронирований нет', () => {
    render(<RoomSchedule bookings={[]} timezone={TIMEZONE} />);

    expect(screen.getByText('На этот день нет бронирований')).toBeInTheDocument();
    expect(screen.getByText('Переговорная свободна весь день')).toBeInTheDocument();
  });

  it('не показывает пустое состояние при наличии бронирований', () => {
    render(<RoomSchedule bookings={[makeBooking()]} timezone={TIMEZONE} />);

    expect(screen.queryByText('На этот день нет бронирований')).not.toBeInTheDocument();
  });

  it('отображает тему встречи и время в таймзоне офиса', () => {
    render(<RoomSchedule bookings={[makeBooking()]} timezone={TIMEZONE} />);

    // 07:00 UTC -> 10:00 Europe/Moscow (UTC+3)
    expect(screen.getByText(/10:00–11:00 · Обсуждение проекта/)).toBeInTheDocument();
  });

  it('отображает имя владельца бронирования', () => {
    render(<RoomSchedule bookings={[makeBooking()]} timezone={TIMEZONE} />);

    expect(screen.getByText('Константин Кузнецов')).toBeInTheDocument();
  });

  it('рендерит несколько бронирований в списке', () => {
    const bookings = [
      makeBooking({ id: 'booking-1', title: 'Встреча 1' }),
      makeBooking({
        id: 'booking-2',
        title: 'Встреча 2',
        startsAt: '2026-08-19T09:00:00.000Z',
        endsAt: '2026-08-19T09:30:00.000Z',
      }),
    ];

    render(<RoomSchedule bookings={bookings} timezone={TIMEZONE} />);

    expect(screen.getByText(/Встреча 1/)).toBeInTheDocument();
    expect(screen.getByText(/Встреча 2/)).toBeInTheDocument();
  });

  it('корректно пересчитывает время для другой таймзоны офиса', () => {
    render(<RoomSchedule bookings={[makeBooking()]} timezone="Asia/Yekaterinburg" />);

    // 07:00 UTC -> 12:00 Asia/Yekaterinburg (UTC+5)
    expect(screen.getByText(/12:00–13:00 · Обсуждение проекта/)).toBeInTheDocument();
  });
});
