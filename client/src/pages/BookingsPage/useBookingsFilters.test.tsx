import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useBookingsFilters } from './useBookingsFilters';

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/bookings']}>{children}</MemoryRouter>;
}

describe('useBookingsFilters', () => {
  it('возвращает scope "upcoming" и officeId null по умолчанию', () => {
    const { result } = renderHook(() => useBookingsFilters(), { wrapper });

    expect(result.current.filters).toEqual({
      scope: 'upcoming',
      officeId: null,
    });
  });

  it('записывает scope в query-параметры', () => {
    const { result } = renderHook(() => useBookingsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ scope: 'past' });
    });

    expect(result.current.filters.scope).toBe('past');
  });

  it('записывает officeId в query-параметры', () => {
    const { result } = renderHook(() => useBookingsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ officeId: 'office-moscow' });
    });

    expect(result.current.filters.officeId).toBe('office-moscow');
  });

  it('возвращает "upcoming" для некорректного значения scope в URL', () => {
    function invalidScopeWrapper({ children }: { children: ReactNode }) {
      return <MemoryRouter initialEntries={['/bookings?scope=whatever']}>{children}</MemoryRouter>;
    }

    const { result } = renderHook(() => useBookingsFilters(), { wrapper: invalidScopeWrapper });

    expect(result.current.filters.scope).toBe('upcoming');
  });

  it('принимает валидные значения scope из URL: past и all', () => {
    function pastWrapper({ children }: { children: ReactNode }) {
      return <MemoryRouter initialEntries={['/bookings?scope=past']}>{children}</MemoryRouter>;
    }
    function allWrapper({ children }: { children: ReactNode }) {
      return <MemoryRouter initialEntries={['/bookings?scope=all']}>{children}</MemoryRouter>;
    }

    const past = renderHook(() => useBookingsFilters(), { wrapper: pastWrapper });
    expect(past.result.current.filters.scope).toBe('past');

    const all = renderHook(() => useBookingsFilters(), { wrapper: allWrapper });
    expect(all.result.current.filters.scope).toBe('all');
  });

  it('удаляет officeId при передаче null', () => {
    const { result } = renderHook(() => useBookingsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ officeId: 'office-moscow' });
    });
    expect(result.current.filters.officeId).toBe('office-moscow');

    act(() => {
      result.current.setFilters({ officeId: null });
    });
    expect(result.current.filters.officeId).toBeNull();
  });

  it('сохраняет officeId при изменении scope', () => {
    const { result } = renderHook(() => useBookingsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ officeId: 'office-moscow' });
    });
    act(() => {
      result.current.setFilters({ scope: 'all' });
    });

    expect(result.current.filters).toEqual({
      scope: 'all',
      officeId: 'office-moscow',
    });
  });
});
