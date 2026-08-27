import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { routes } from './router';

vi.mock('./hooks/useOffices', () => ({
  useOffices: () => ({ data: [], isLoading: false, error: null }),
}));
vi.mock('./hooks/useRooms', () => ({
  useRooms: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('./hooks/useMyBookings', () => ({
  useMyBookings: () => ({ data: [], isLoading: false, error: null, refetch: vi.fn() }),
}));
vi.mock('./hooks/useCancelBooking', () => ({
  useCancelBooking: () => ({ mutateAsync: vi.fn(), variables: undefined }),
}));

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

describe('router', () => {
  it('перенаправляет с / на /rooms', async () => {
    renderAt('/');
    expect(await screen.findByRole('heading', { name: 'Выберите офис' })).toBeInTheDocument();
  });

  it('показывает страницу "Ничего не найдено" для неизвестного маршрута', () => {
    renderAt('/unknown-path');
    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument();
  });

  it('рендерит страницу списка комнат на /rooms', async () => {
    renderAt('/rooms');
    expect(await screen.findByRole('heading', { name: 'Выберите офис' })).toBeInTheDocument();
  });
});
