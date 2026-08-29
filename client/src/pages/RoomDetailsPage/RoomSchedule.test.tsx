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

  it('показывает тему встречи для собственного бронирования', () => {
    render(
      <RoomSchedule
        bookings={[makeBooking()]}
        timezone={TIMEZONE}
        currentUserId="user-konstantin"
      />,
    );

    expect(screen.getByText('Обсуждение проекта')).toBeInTheDocument();
  });

  it('скрывает тему чужого бронирования и показывает "Занято"', () => {
    render(
      <RoomSchedule
        bookings={[makeBooking({ userId: 'user-anna' })]}
        timezone={TIMEZONE}
        currentUserId="user-konstantin"
      />,
    );

    expect(screen.getByText('Занято')).toBeInTheDocument();
    expect(screen.queryByText('Обсуждение проекта')).not.toBeInTheDocument();
  });

  it('показывает "Занято", если currentUserId не передан', () => {
    render(<RoomSchedule bookings={[makeBooking()]} timezone={TIMEZONE} />);

    expect(screen.getByText('Занято')).toBeInTheDocument();
  });

  it('отображает часовую сетку с 09:00 до 20:00', () => {
    render(<RoomSchedule bookings={[makeBooking()]} timezone={TIMEZONE} />);

    expect(screen.getByText('09:00')).toBeInTheDocument();
    expect(screen.getByText('20:00')).toBeInTheDocument();
  });

  it('рендерит несколько бронирований одновременно', () => {
    const bookings = [
      makeBooking({ id: 'booking-1', userId: 'user-konstantin', title: 'Встреча 1' }),
      makeBooking({
        id: 'booking-2',
        userId: 'user-anna',
        startsAt: '2026-08-19T09:00:00.000Z',
        endsAt: '2026-08-19T09:30:00.000Z',
      }),
    ];

    render(
      <RoomSchedule bookings={bookings} timezone={TIMEZONE} currentUserId="user-konstantin" />,
    );

    expect(screen.getByText('Встреча 1')).toBeInTheDocument();
    expect(screen.getByText('Занято')).toBeInTheDocument();
  });
});
