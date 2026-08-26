import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface RoomsFilters {
  officeId: string | null;
  minCapacity: number | null;
  from: string | null; // ISO с таймзоной, если выбран интервал
  to: string | null;
}

export function useRoomsFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<RoomsFilters>(() => {
    const minCapacityRaw = searchParams.get('minCapacity');
    return {
      officeId: searchParams.get('officeId'),
      minCapacity: minCapacityRaw ? Number(minCapacityRaw) : null,
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (patch: Partial<RoomsFilters>) => {
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
        { replace: true }, // не плодим записи в истории на каждый чих фильтра
      );
    },
    [setSearchParams],
  );

  return { filters, setFilters };
}
