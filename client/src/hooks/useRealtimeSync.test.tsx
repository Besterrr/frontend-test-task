/* eslint-disable @typescript-eslint/unbound-method */
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { handleRealtimeEvent, useRealtimeSync } from './useRealtimeSync';
import { realtimeClient, type ConnectionStatus } from '../lib/realtimeClient';
import { useConnectionStore } from '../store/connectionStore';

vi.mock('../lib/realtimeClient', () => ({
  realtimeClient: {
    connect: vi.fn(),
    onEvent: vi.fn(),
    onStatusChange: vi.fn(),
  },
}));

describe('handleRealtimeEvent', () => {
  it('инвалидирует bookings и rooms при booking.created', () => {
    const invalidate = vi.fn();
    handleRealtimeEvent(
      { type: 'booking.created', occurredAt: '', data: { booking: {} } },
      invalidate,
    );

    expect(invalidate).toHaveBeenCalledTimes(2);
    const firstPredicate = invalidate.mock.calls[0]?.[0] as (key: unknown[]) => boolean;
    const secondPredicate = invalidate.mock.calls[1]?.[0] as (key: unknown[]) => boolean;
    expect(firstPredicate(['bookings'])).toBe(true);
    expect(secondPredicate(['rooms'])).toBe(true);
  });

  it('инвалидирует bookings и rooms при booking.cancelled', () => {
    const invalidate = vi.fn();
    handleRealtimeEvent(
      { type: 'booking.cancelled', occurredAt: '', data: { booking: {} } },
      invalidate,
    );

    expect(invalidate).toHaveBeenCalledTimes(2);
  });

  it('инвалидирует весь префикс rooms при room.availability_changed', () => {
    const invalidate = vi.fn();
    handleRealtimeEvent(
      {
        type: 'room.availability_changed',
        occurredAt: '',
        data: { roomId: 'room-1', officeId: 'office-1', startsAt: '', endsAt: '', available: true },
      },
      invalidate,
    );

    expect(invalidate).toHaveBeenCalledTimes(1);
    const predicate = invalidate.mock.calls[0]?.[0] as (key: unknown[]) => boolean;
    expect(predicate(['rooms'])).toBe(true);
    expect(predicate(['rooms', { officeId: 'office-1' }])).toBe(true);
    expect(predicate(['bookings'])).toBe(false);
  });

  it('инвалидирует абсолютно всё при data.reset', () => {
    const invalidate = vi.fn();
    handleRealtimeEvent({ type: 'data.reset', occurredAt: '', data: {} }, invalidate);

    expect(invalidate).toHaveBeenCalledTimes(1);
    const predicate = invalidate.mock.calls[0]?.[0] as (key: unknown[]) => boolean;
    expect(predicate(['bookings'])).toBe(true);
    expect(predicate(['rooms'])).toBe(true);
    expect(predicate(['whatever'])).toBe(true);
  });
});

describe('useRealtimeSync', () => {
  beforeEach(() => {
    vi.mocked(realtimeClient.connect).mockReset();
    vi.mocked(realtimeClient.onEvent).mockReset().mockReturnValue(vi.fn());
    vi.mocked(realtimeClient.onStatusChange).mockReset().mockReturnValue(vi.fn());
    useConnectionStore.setState({ status: 'disconnected' });
  });

  function wrapper({ children }: { children: ReactNode }) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  it('подключается при монтировании', () => {
    renderHook(() => useRealtimeSync(), { wrapper });
    expect(realtimeClient.connect).toHaveBeenCalledTimes(1);
  });

  it('подписывается на события и статус соединения', () => {
    renderHook(() => useRealtimeSync(), { wrapper });
    expect(realtimeClient.onEvent).toHaveBeenCalledTimes(1);
    expect(realtimeClient.onStatusChange).toHaveBeenCalledTimes(1);
  });

  it('отписывается при размонтировании', () => {
    const unsubscribeEvent = vi.fn();
    const unsubscribeStatus = vi.fn();
    vi.mocked(realtimeClient.onEvent).mockReturnValue(unsubscribeEvent);
    vi.mocked(realtimeClient.onStatusChange).mockReturnValue(unsubscribeStatus);

    const { unmount } = renderHook(() => useRealtimeSync(), { wrapper });
    unmount();

    expect(unsubscribeEvent).toHaveBeenCalledTimes(1);
    expect(unsubscribeStatus).toHaveBeenCalledTimes(1);
  });

  it('обновляет connectionStore при изменении статуса', () => {
    let statusCallback: ((status: ConnectionStatus) => void) | undefined;
    vi.mocked(realtimeClient.onStatusChange).mockImplementation((cb) => {
      statusCallback = cb;
      return vi.fn();
    });

    renderHook(() => useRealtimeSync(), { wrapper });
    statusCallback?.('connected');

    expect(useConnectionStore.getState().status).toBe('connected');
  });
});