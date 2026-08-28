import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useCancelBooking } from './useCancelBooking';
import { cancelBooking } from '../api/bookings';

vi.mock('../api/bookings', () => ({
  cancelBooking: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { wrapper, invalidateSpy, queryClient };
}

describe('useCancelBooking', () => {
  beforeEach(() => {
    vi.mocked(cancelBooking).mockReset();
  });

  it('вызывает cancelBooking с id бронирования', async () => {
    vi.mocked(cancelBooking).mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCancelBooking(), { wrapper });

    result.current.mutate('booking-1');

    await waitFor(() => expect(cancelBooking).toHaveBeenCalled());
    expect(vi.mocked(cancelBooking).mock.calls[0]?.[0]).toBe('booking-1');
  });

  it('инвалидирует ключи bookings и rooms при успехе', async () => {
    vi.mocked(cancelBooking).mockResolvedValue(undefined);
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCancelBooking(), { wrapper });

    result.current.mutate('booking-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bookings'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['rooms'] });
  });

  it('инвалидирует ключи bookings и rooms при неудаче (onSettled)', async () => {
    vi.mocked(cancelBooking).mockRejectedValue(new Error('Ошибка сети'));
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCancelBooking(), { wrapper });

    result.current.mutate('booking-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['bookings'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['rooms'] });
  });

  it('оптимистично убирает бронирование из кэша до ответа сервера', async () => {
    const { wrapper, queryClient } = createWrapper();
    const queryKey = ['bookings', { scope: 'upcoming' }];
    queryClient.setQueryData(queryKey, [
      { id: 'booking-1', title: 'Встреча A' },
      { id: 'booking-2', title: 'Встреча B' },
    ]);

    let resolveCancel: () => void = () => {};
    vi.mocked(cancelBooking).mockReturnValue(
      new Promise((resolve) => {
        resolveCancel = () => resolve(undefined);
      }),
    );

    const { result } = renderHook(() => useCancelBooking(), { wrapper });
    result.current.mutate('booking-1');

    await waitFor(() => {
      expect(queryClient.getQueryData(queryKey)).toEqual([{ id: 'booking-2', title: 'Встреча B' }]);
    });

    resolveCancel();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('обновляет несколько кэшей bookings с разными параметрами одновременно', async () => {
    const { wrapper, queryClient } = createWrapper();
    const upcomingKey = ['bookings', { scope: 'upcoming' }];
    const allKey = ['bookings', { scope: 'all' }];
    queryClient.setQueryData(upcomingKey, [{ id: 'booking-1', title: 'Встреча A' }]);
    queryClient.setQueryData(allKey, [
      { id: 'booking-1', title: 'Встреча A' },
      { id: 'booking-2', title: 'Встреча B' },
    ]);

    let resolveCancel: () => void = () => {};
    vi.mocked(cancelBooking).mockReturnValue(
      new Promise((resolve) => {
        resolveCancel = () => resolve(undefined);
      }),
    );

    const { result } = renderHook(() => useCancelBooking(), { wrapper });
    result.current.mutate('booking-1');

    await waitFor(() => {
      expect(queryClient.getQueryData(upcomingKey)).toEqual([]);
      expect(queryClient.getQueryData(allKey)).toEqual([{ id: 'booking-2', title: 'Встреча B' }]);
    });

    resolveCancel();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('откатывает кэш при ошибке отмены', async () => {
    const { wrapper, queryClient } = createWrapper();
    const queryKey = ['bookings', { scope: 'upcoming' }];
    const original = [
      { id: 'booking-1', title: 'Встреча A' },
      { id: 'booking-2', title: 'Встреча B' },
    ];
    queryClient.setQueryData(queryKey, original);

    vi.mocked(cancelBooking).mockRejectedValue(new Error('Ошибка сети'));
    const { result } = renderHook(() => useCancelBooking(), { wrapper });

    result.current.mutate('booking-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(queryKey)).toEqual(original);
  });

  it('пробрасывает ошибку и всё равно инвалидирует кэш при неудаче', async () => {
    vi.mocked(cancelBooking).mockRejectedValue(new Error('Ошибка сети'));
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCancelBooking(), { wrapper });

    result.current.mutate('booking-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).toHaveBeenCalled();
  });

  it('не падает, если кэш bookings пуст при мутации', async () => {
    vi.mocked(cancelBooking).mockResolvedValue(undefined);
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCancelBooking(), { wrapper });

    result.current.mutate('booking-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
