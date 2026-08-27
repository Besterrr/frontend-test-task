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

  return { wrapper, invalidateSpy };
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

  it('пробрасывает ошибку и не инвалидирует кэш при неудаче', async () => {
    vi.mocked(cancelBooking).mockRejectedValue(new Error('Ошибка сети'));
    const { wrapper, invalidateSpy } = createWrapper();
    const { result } = renderHook(() => useCancelBooking(), { wrapper });

    result.current.mutate('booking-1');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});
