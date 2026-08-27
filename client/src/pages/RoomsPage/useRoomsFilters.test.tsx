import { describe, expect, it } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useRoomsFilters } from './useRoomsFilters';

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={['/rooms']}>{children}</MemoryRouter>;
}

describe('useRoomsFilters', () => {
  it('возвращает пустые фильтры по умолчанию', () => {
    const { result } = renderHook(() => useRoomsFilters(), { wrapper });

    expect(result.current.filters).toEqual({
      officeId: null,
      minCapacity: null,
      from: null,
      to: null,
    });
  });

  it('записывает officeId в query-параметры', () => {
    const { result } = renderHook(() => useRoomsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ officeId: 'office-moscow' });
    });

    expect(result.current.filters.officeId).toBe('office-moscow');
  });

  it('парсит minCapacity как число', () => {
    const { result } = renderHook(() => useRoomsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ minCapacity: 8 });
    });

    expect(result.current.filters.minCapacity).toBe(8);
  });

  it('удаляет параметр при передаче null', () => {
    const { result } = renderHook(() => useRoomsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({ officeId: 'office-moscow' });
    });
    expect(result.current.filters.officeId).toBe('office-moscow');

    act(() => {
      result.current.setFilters({ officeId: null });
    });
    expect(result.current.filters.officeId).toBeNull();
  });

  it('сбрасывает интервал при смене офиса', () => {
    const { result } = renderHook(() => useRoomsFilters(), { wrapper });

    act(() => {
      result.current.setFilters({
        officeId: 'office-moscow',
        from: '2026-08-19T10:00:00.000Z',
        to: '2026-08-19T11:00:00.000Z',
      });
    });
    expect(result.current.filters.from).not.toBeNull();

    act(() => {
      result.current.setFilters({ officeId: 'office-spb', from: null, to: null });
    });

    expect(result.current.filters.officeId).toBe('office-spb');
    expect(result.current.filters.from).toBeNull();
    expect(result.current.filters.to).toBeNull();
  });
});
