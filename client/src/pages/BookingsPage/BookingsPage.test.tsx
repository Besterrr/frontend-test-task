import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { BookingsPage } from './BookingsPage';
import type { BookingView, Office } from '../../api/models';

const enqueueSnackbarMock = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: enqueueSnackbarMock }),
}));

const useOfficesMock = vi.fn();
vi.mock('../../hooks/useOffices', () => ({
  useOffices: (): unknown => useOfficesMock(),
}));

const useMyBookingsMock = vi.fn();
vi.mock('../../hooks/useMyBookings', () => ({
  useMyBookings: (...args: unknown[]): unknown => useMyBookingsMock(...args),
}));

const mutateAsyncMock = vi.fn();
const useCancelBookingMock = vi.fn();
vi.mock('../../hooks/useCancelBooking', () => ({
  useCancelBooking: () : unknown => useCancelBookingMock(),
}));

const TEST_NOW = new Date('2026-08-18T09:00:00.000Z');

const moscowOffice: Office = {
  id: 'office-moscow',
  name: 'Офис Москва',
  address: 'Москва, ул. Лесная, 7',
  timezone: 'Europe/Moscow',
};

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
    office: moscowOffice,
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

function renderPage(initialEntry = '/bookings') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <BookingsPage />
    </MemoryRouter>,
  );
}

describe('BookingsPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(TEST_NOW);
    enqueueSnackbarMock.mockReset();
    mutateAsyncMock.mockReset();
    useOfficesMock.mockReset().mockReturnValue({
      data: [moscowOffice],
      isLoading: false,
      error: null,
    });
    useMyBookingsMock.mockReset().mockReturnValue({
      data: [makeBooking()],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    useCancelBookingMock.mockReset().mockReturnValue({
      mutateAsync: mutateAsyncMock,
      variables: undefined,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('показывает LoadingState, пока грузятся офисы', () => {
    useOfficesMock.mockReturnValue({ data: undefined, isLoading: true, error: null });
    renderPage();

    expect(screen.queryByText('Мои бронирования')).not.toBeInTheDocument();
  });

  it('показывает ErrorState при ошибке загрузки офисов', () => {
    useOfficesMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Сеть недоступна'),
    });
    renderPage();

    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument();
  });

  it('показывает заголовок страницы', () => {
    renderPage();
    expect(screen.getByText('Мои бронирования')).toBeInTheDocument();
  });

  it('показывает LoadingState, пока грузятся бронирования', () => {
    useMyBookingsMock.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();

    expect(screen.queryByText('Обсуждение проекта')).not.toBeInTheDocument();
  });

  it('показывает ErrorState с кнопкой повтора при ошибке загрузки бронирований', async () => {
    const refetch = vi.fn();
    useMyBookingsMock.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Сеть недоступна'),
      refetch,
    });
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Повторить' }));
    expect(refetch).toHaveBeenCalled();
  });

  it('показывает EmptyState, если бронирований нет', () => {
    useMyBookingsMock.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });
    renderPage();

    expect(screen.getByText('Бронирований не найдено')).toBeInTheDocument();
  });

  it('отображает список бронирований', () => {
    renderPage();
    expect(screen.getByText('Обсуждение проекта')).toBeInTheDocument();
  });

  it('передаёт scope и officeId из URL в useMyBookings', () => {
    renderPage('/bookings?scope=past&officeId=office-moscow');

    expect(useMyBookingsMock).toHaveBeenCalledWith({
      scope: 'past',
      officeId: 'office-moscow',
    });
  });

  it('не передаёт officeId в useMyBookings, если он не выбран', () => {
    renderPage('/bookings');

    expect(useMyBookingsMock).toHaveBeenCalledWith({ scope: 'upcoming' });
  });

  it('показывает уведомление об успехе при отмене бронирования', async () => {
    mutateAsyncMock.mockResolvedValue(undefined);
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Отменить бронирование' }));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith('booking-1');
    });
    await waitFor(() => {
      expect(enqueueSnackbarMock).toHaveBeenCalledWith('Бронирование отменено', {
        variant: 'success',
      });
    });
  });

  it('показывает уведомление об ошибке при неудачной отмене', async () => {
    mutateAsyncMock.mockRejectedValue(new Error('Сбой сети'));
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Отменить бронирование' }));

    await waitFor(() => {
      expect(enqueueSnackbarMock).toHaveBeenCalledWith('Не удалось отменить бронирование', {
        variant: 'error',
      });
    });
  });

  it('передаёт isCancelling: true для бронирования, чей id совпадает с variables мутации', () => {
    useCancelBookingMock.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      variables: 'booking-1',
    });
    renderPage();

    expect(screen.getByRole('button', { name: 'Отменить бронирование' })).toBeDisabled();
  });
});
