import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';
import { isApiError } from '../api/errors';
import { notifyErrorGlobal } from './errorNotifications';

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.suppressGlobalError) return;
      notifyErrorGlobal(error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      if (mutation.meta?.suppressGlobalError) return;
      notifyErrorGlobal(error);
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (isApiError(error) && error.status < 500) return false;
        return failureCount < 1;
      },
    },
    mutations: {
      retry: 0,
    },
  },
});

export const queryKeys = {
  offices: () => ['offices'] as const,
  me: () => ['me'] as const,
  rooms: (params: { officeId: string; minCapacity?: number; from?: string; to?: string }) =>
    ['rooms', params] as const,
  room: (roomId: string) => ['rooms', roomId] as const,
  roomSchedule: (roomId: string, params: { from: string; to: string }) =>
    ['rooms', roomId, 'schedule', params] as const,
  myBookings: (params: { scope?: string; officeId?: string }) => ['bookings', params] as const,
} as const;
