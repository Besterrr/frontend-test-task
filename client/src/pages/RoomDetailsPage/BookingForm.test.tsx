import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon';
import { DateTime } from 'luxon';
import type { ReactNode } from 'react';
import { BookingForm } from './BookingForm';
import { createBooking } from '../../api/bookings';
import { ApiError } from '../../api/errors';

vi.mock('../../api/bookings', () => ({
  createBooking: vi.fn(),
}));

const enqueueSnackbarMock = vi.fn();
vi.mock('notistack', () => ({
  useSnackbar: () => ({ enqueueSnackbar: enqueueSnackbarMock }),
}));

const TIMEZONE = 'Europe/Moscow';

function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterLuxon}>{children}</LocalizationProvider>
    </QueryClientProvider>
  );
}

function renderForm() {
  return render(
    <Providers>
      <BookingForm roomId="room-everest" timezone={TIMEZONE} />
    </Providers>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  const titleInput = screen.getByLabelText('Тема встречи');
  await user.clear(titleInput);
  await user.type(titleInput, 'Обсуждение проекта');

  const tomorrow = DateTime.now().setZone(TIMEZONE).plus({ days: 1 });
  const dateStr = tomorrow.toFormat('MM/dd/yyyy');
  const timeStr = '10:00 AM';

  const dateContainer = screen.getByRole('group', { name: /Дата/ });
  await user.click(dateContainer);
  await user.type(dateContainer, dateStr);
  await user.keyboard('{Enter}');

  const timeContainer = screen.getByRole('group', { name: /Время начала/ });
  await user.click(timeContainer);
  await user.type(timeContainer, timeStr);
  await user.keyboard('{Enter}');

  // Ждем, пока значения применятся
  await waitFor(() => {
    expect(dateContainer).toHaveTextContent(dateStr);
  });
}

describe('BookingForm', () => {
  beforeEach(() => {
    vi.mocked(createBooking).mockReset();
    enqueueSnackbarMock.mockReset();
  });

  it('показывает ошибки валидации при пустой форме', async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(await screen.findByText('Укажите тему встречи')).toBeInTheDocument();
    expect(createBooking).not.toHaveBeenCalled();
  });

  it('отправляет корректные данные и показывает уведомление об успехе', async () => {
    vi.mocked(createBooking).mockResolvedValue({
      id: 'booking-1',
      roomId: 'room-everest',
      userId: 'user-1',
      title: 'Обсуждение проекта',
      comment: null,
      startsAt: '2026-08-29T07:00:00.000Z',
      endsAt: '2026-08-29T08:00:00.000Z',
      createdAt: '2026-08-28T09:00:00.000Z',
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
        id: 'user-1',
        login: 'kkuznetsov',
        displayName: 'Константин Кузнецов',
        email: 'k@example.test',
        avatarUrl: null,
        initials: 'КК',
      },
    });

    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    expect(screen.getByLabelText('Тема встречи')).toHaveValue('Обсуждение проекта');

    const submitButton = screen.getByRole('button', { name: 'Забронировать' });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(createBooking).toHaveBeenCalled();
      },
      { timeout: 3000 },
    );

    const calls = vi.mocked(createBooking).mock.calls;
    expect(calls.length).toBeGreaterThan(0);

    const firstCall = calls[0];
    expect(firstCall).toBeDefined();

    const firstCallArgs = firstCall?.[0];
    expect(firstCallArgs).toBeDefined();

    expect(firstCallArgs).toEqual(
      expect.objectContaining({
        roomId: 'room-everest',
        title: 'Обсуждение проекта',
      }),
    );

    await waitFor(
      () => {
        expect(enqueueSnackbarMock).toHaveBeenCalledWith('Бронирование создано', {
          variant: 'success',
        });
      },
      { timeout: 3000 },
    );
  });

  it('подсвечивает поле времени начала при 409 BOOKING_CONFLICT', async () => {
    vi.mocked(createBooking).mockRejectedValue(
      new ApiError(409, {
        error: {
          code: 'BOOKING_CONFLICT',
          message: 'Переговорная уже забронирована на выбранное время',
        },
      }),
    );

    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    expect(
      await screen.findByText('Переговорная уже забронирована на выбранное время'),
    ).toBeInTheDocument();
    expect(enqueueSnackbarMock).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ variant: 'error' }),
    );
  });

  it('показывает уведомление об ошибке для прочих кодов API', async () => {
    vi.mocked(createBooking).mockRejectedValue(
      new ApiError(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Проверьте параметры запроса',
        },
      }),
    );

    const user = userEvent.setup();
    renderForm();
    await fillValidForm(user);

    await user.click(screen.getByRole('button', { name: 'Забронировать' }));

    await waitFor(() =>
      expect(enqueueSnackbarMock).toHaveBeenCalledWith('Проверьте параметры запроса', {
        variant: 'error',
      }),
    );
  });
});
