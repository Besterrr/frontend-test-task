import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { realtimeClient, type RealtimeEvent } from '../lib/realtimeClient';
import { useConnectionStore } from '../store/connectionStore';

function handleRealtimeEvent(
  event: RealtimeEvent,
  invalidate: (predicate: (key: unknown[]) => boolean) => void,
): void {
  switch (event.type) {
    case 'booking.created':
    case 'booking.cancelled': {
      invalidate((key) => key[0] === 'bookings');
      invalidate((key) => key[0] === 'rooms');
      break;
    }
    case 'room.availability_changed': {
      invalidate((key) => key[0] === 'rooms');
      break;
    }
    case 'data.reset': {
      invalidate(() => true);
      break;
    }
  }
}

export function useRealtimeSync(): void {
  const queryClient = useQueryClient();
  const setStatus = useConnectionStore((state) => state.setStatus);
  const wasInterruptedRef = useRef(false);

  useEffect(() => {
    realtimeClient.connect();

    const unsubscribeStatus = realtimeClient.onStatusChange((status) => {
      setStatus(status);

      if (status === 'reconnecting' || status === 'disconnected') {
        wasInterruptedRef.current = true;
        return;
      }

      if (status === 'connected' && wasInterruptedRef.current) {
        wasInterruptedRef.current = false;
        void queryClient.invalidateQueries();
      }
    });

    const unsubscribeEvent = realtimeClient.onEvent((event) => {
      handleRealtimeEvent(event, (predicate) => {
        void queryClient.invalidateQueries({
          predicate: (query) => predicate(query.queryKey as unknown[]),
        });
      });
    });

    return () => {
      unsubscribeStatus();
      unsubscribeEvent();
    };
  }, [queryClient, setStatus]);
}

export { handleRealtimeEvent };
