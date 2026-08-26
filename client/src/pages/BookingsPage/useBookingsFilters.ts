import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { BookingsScope } from '../../api/models';

export interface BookingsFilters {
  scope: BookingsScope;
  officeId: string | null;
}

const VALID_SCOPES: BookingsScope[] = ['upcoming', 'past', 'all'];

function parseScope(value: string | null): BookingsScope {
  if (value && VALID_SCOPES.includes(value as BookingsScope)) {
    return value as BookingsScope;
  }
  return 'upcoming';
}

export function useBookingsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<BookingsFilters>(
    () => ({
      scope: parseScope(searchParams.get('scope')),
      officeId: searchParams.get('officeId'),
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<BookingsFilters>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [key, value] of Object.entries(patch)) {
            if (value === null || value === undefined || value === '') {
              next.delete(key);
            } else {
              next.set(key, String(value));
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { filters, setFilters };
}
