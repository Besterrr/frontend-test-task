import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CancelBookingDialog } from './CancelBookingDialog';
import type { BookingView } from '../../api/models';

function makeBooking(overrides: Partial<BookingView> = {}): BookingView {
  return {
    id: 'booking-1',
    roomId: 'room-everest',
    userId: 'user-konstantin',
    title: 'Daily Sync: Разработка & Продукт',
    comment: null,
    startsAt: '2026-10-24T12:00:00.000Z',
    endsAt: '2026-10-24T13:00:00.000Z',
    createdAt: '2026-10-20T09:00:00.000Z',
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

describe('CancelBookingDialog', () => {
  it('ничего не рендерит, если booking не передан', () => {
    render(
      <CancelBookingDialog
        booking={null}
        isCancelling={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.queryByText('Отменить бронирование?')).not.toBeInTheDocument();
  });

  it('показывает заголовок, тему, комнату и время бронирования', () => {
    render(
      <CancelBookingDialog
        booking={makeBooking()}
        isCancelling={false}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Отменить бронирование?')).toBeInTheDocument();
    expect(screen.getByText('Daily Sync: Разработка & Продукт')).toBeInTheDocument();
    expect(screen.getByText(/Комната «Эверест», 4 этаж/)).toBeInTheDocument();
  });

  it('вызывает onClose при клике "Нет, оставить"', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <CancelBookingDialog
        booking={makeBooking()}
        isCancelling={false}
        onConfirm={vi.fn()}
        onClose={onClose}
      />,
    );

    await user.click(screen.getByText('Нет, оставить'));
    expect(onClose).toHaveBeenCalled();
  });

  it('вызывает onConfirm при клике "Да, отменить"', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <CancelBookingDialog
        booking={makeBooking()}
        isCancelling={false}
        onConfirm={onConfirm}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByText('Да, отменить'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('блокирует обе кнопки, пока isCancelling: true', () => {
    render(
      <CancelBookingDialog
        booking={makeBooking()}
        isCancelling={true}
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('Нет, оставить').closest('button')).toBeDisabled();
    expect(screen.getByText('Да, отменить').closest('button')).toBeDisabled();
  });
});
