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

  it('отображает тему, время, офис и комнату', () => {
    render(<BookingListItem booking={makeBooking()} onCancel={vi.fn()} isCancelling={false} />);

    expect(screen.getByText('Обсуждение проекта')).toBeInTheDocument();
    expect(screen.getByText(/19\.08\.2026/)).toBeInTheDocument();
    expect(screen.getByText(/10:00–11:00/)).toBeInTheDocument();
    expect(screen.getByText(/Офис Москва · Эверест/)).toBeInTheDocument();
  });

  it('отображает комментарий, если он есть', () => {
    render(
      <BookingListItem
        booking={makeBooking({ comment: 'Сверяем план работ' })}
        onCancel={vi.fn()}
        isCancelling={false}
      />,
    );

    expect(screen.getByText('Сверяем план работ')).toBeInTheDocument();
  });

  it('не отображает блок комментария, если его нет', () => {
    render(
      <BookingListItem
        booking={makeBooking({ comment: null })}
        onCancel={vi.fn()}
        isCancelling={false}
      />,
    );

    expect(screen.queryByText('Сверяем план работ')).not.toBeInTheDocument();
  });

  it('показывает кнопку отмены для будущего бронирования', () => {
    render(<BookingListItem booking={makeBooking()} onCancel={vi.fn()} isCancelling={false} />);

    expect(screen.getByRole('button', { name: 'Отменить бронирование' })).toBeInTheDocument();
    expect(screen.queryByText('Завершено')).not.toBeInTheDocument();
  });

  it('показывает чип "Завершено" вместо кнопки для прошедшего бронирования', () => {
    render(
      <BookingListItem
        booking={makeBooking({
          startsAt: '2026-08-17T07:00:00.000Z',
          endsAt: '2026-08-17T08:00:00.000Z',
        })}
        onCancel={vi.fn()}
        isCancelling={false}
      />,
    );

    expect(screen.getByText('Завершено')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Отменить бронирование' })).not.toBeInTheDocument();
  });

  it('вызывает onCancel с id бронирования по клику', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancel = vi.fn().mockResolvedValue(undefined);

    render(<BookingListItem booking={makeBooking()} onCancel={onCancel} isCancelling={false} />);

    await user.click(screen.getByRole('button', { name: 'Отменить бронирование' }));

    expect(onCancel).toHaveBeenCalledWith('booking-1');
  });

  it('блокирует кнопку отмены, пока isCancelling: true', () => {
    render(<BookingListItem booking={makeBooking()} onCancel={vi.fn()} isCancelling={true} />);

    expect(screen.getByRole('button', { name: 'Отменить бронирование' })).toBeDisabled();
  });

  it('показывает локальное сообщение об ошибке, если onCancel отклонён', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancel = vi.fn().mockRejectedValue(new Error('Ошибка сети'));

    render(<BookingListItem booking={makeBooking()} onCancel={onCancel} isCancelling={false} />);

    await user.click(screen.getByRole('button', { name: 'Отменить бронирование' }));

    expect(await screen.findByText('Не удалось отменить бронирование')).toBeInTheDocument();
  });

  it('сбрасывает локальную ошибку при повторной попытке отмены', async () => {
    const user = userEvent.setup({ delay: null });
    const onCancel = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ошибка сети'))
      .mockResolvedValueOnce(undefined);

    render(<BookingListItem booking={makeBooking()} onCancel={onCancel} isCancelling={false} />);

    const button = screen.getByRole('button', { name: 'Отменить бронирование' });
    await user.click(button);
    expect(await screen.findByText('Не удалось отменить бронирование')).toBeInTheDocument();

    await user.click(button);
    expect(screen.queryByText('Не удалось отменить бронирование')).not.toBeInTheDocument();
  });

  it('показывает кнопку экспорта в календарь для бронирования в пределах окна', () => {
    render(<BookingListItem booking={makeBooking()} onCancel={vi.fn()} isCancelling={false} />);

    expect(screen.getByRole('button', { name: 'Добавить в календарь' })).toBeInTheDocument();
  });

  it('не показывает кнопку экспорта для бронирования дальше 30 дней вперёд', () => {
    render(
      <BookingListItem
        booking={makeBooking({
          startsAt: '2026-09-25T07:00:00.000Z',
          endsAt: '2026-09-25T08:00:00.000Z',
        })}
        onCancel={vi.fn()}
        isCancelling={false}
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
        onCancel={vi.fn()}
        isCancelling={false}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Добавить в календарь' })).not.toBeInTheDocument();
  });

});
