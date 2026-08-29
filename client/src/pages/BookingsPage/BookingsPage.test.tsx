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
  useCancelBooking: (): unknown => useCancelBookingMock(),
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

function mockBookingsByScope(map: Record<'upcoming' | 'past', BookingView[]>) {
  useMyBookingsMock.mockReset().mockImplementation((query: { scope: 'upcoming' | 'past' }) => ({
    data: map[query.scope],
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }));
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
    mockBookingsByScope({ upcoming: [makeBooking()], past: [] });
    useCancelBookingMock.mockReset().mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
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

  it('показывает таб "Предстоящие" с количеством по умолчанию', () => {
    renderPage();
    expect(screen.getByText('Предстоящие (1)')).toBeInTheDocument();
  });

  it('отображает список предстоящих бронирований на активной вкладке', () => {
    renderPage();
    expect(screen.getByText('Обсуждение проекта')).toBeInTheDocument();
  });

  it('показывает EmptyState, если бронирований на вкладке нет', () => {
    mockBookingsByScope({ upcoming: [], past: [] });
    renderPage();

    expect(screen.getByText('Бронирований не найдено')).toBeInTheDocument();
  });

  it('переключает вкладку на "Прошедшие" и показывает соответствующий список', async () => {
    mockBookingsByScope({
      upcoming: [makeBooking()],
      past: [makeBooking({ id: 'booking-past', title: 'Ретроспектива' })],
    });
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByText('Прошедшие'));

    expect(screen.getByText('Ретроспектива')).toBeInTheDocument();
    expect(screen.queryByText('Обсуждение проекта')).not.toBeInTheDocument();
  });

  it('открывает диалог подтверждения по клику на "Отменить"', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByText('Отменить'));

    expect(screen.getByText('Отменить бронирование?')).toBeInTheDocument();
  });

  it('вызывает мутацию отмены и показывает уведомление об успехе при подтверждении', async () => {
    mutateAsyncMock.mockResolvedValue(undefined);
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByText('Отменить'));
    await user.click(screen.getByText('Да, отменить'));

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledWith('booking-1');
    });
    await waitFor(() => {
      expect(enqueueSnackbarMock).toHaveBeenCalledWith('Бронирование отменено', {
        variant: 'success',
      });
    });
  });

  it('закрывает диалог после успешной отмены', async () => {
    mutateAsyncMock.mockResolvedValue(undefined);
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByText('Отменить'));
    await user.click(screen.getByText('Да, отменить'));

    await waitFor(() => {
      expect(screen.queryByText('Отменить бронирование?')).not.toBeInTheDocument();
    });
  });

  it('показывает уведомление об ошибке и не закрывает диалог при неудачной отмене', async () => {
    mutateAsyncMock.mockRejectedValue(new Error('Сбой сети'));
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByText('Отменить'));
    await user.click(screen.getByText('Да, отменить'));

    await waitFor(() => {
      expect(enqueueSnackbarMock).toHaveBeenCalledWith('Не удалось отменить бронирование', {
        variant: 'error',
      });
    });
    expect(screen.getByText('Отменить бронирование?')).toBeInTheDocument();
  });

  it('закрывает диалог по клику "Нет, оставить" без вызова мутации', async () => {
    const user = userEvent.setup({ delay: null });
    renderPage();

    await user.click(screen.getByText('Отменить'));
    await user.click(screen.getByText('Нет, оставить'));

    expect(screen.queryByText('Отменить бронирование?')).not.toBeInTheDocument();
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('передаёт officeId из фильтра в useMyBookings для обоих scope', () => {
    renderPage('/bookings?officeId=office-moscow');

    expect(useMyBookingsMock).toHaveBeenCalledWith({
      scope: 'upcoming',
      officeId: 'office-moscow',
    });
    expect(useMyBookingsMock).toHaveBeenCalledWith({
      scope: 'past',
      officeId: 'office-moscow',
    });
  });

  it('не передаёt officeId в useMyBookings, если он не выбран', () => {
    renderPage('/bookings');

    expect(useMyBookingsMock).toHaveBeenCalledWith({ scope: 'upcoming' });
    expect(useMyBookingsMock).toHaveBeenCalledWith({ scope: 'past' });
  });
});
