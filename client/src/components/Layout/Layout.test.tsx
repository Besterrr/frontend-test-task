import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { Layout } from './Layout';

function renderLayoutAt(path: string) {
  const router = createMemoryRouter(
    [
      {
        element: <Layout />,
        children: [
          { path: '/rooms', element: <div>Страница переговорных</div> },
          { path: '/bookings', element: <div>Страница бронирований</div> },
        ],
      },
    ],
    { initialEntries: [path] },
  );
  return render(<RouterProvider router={router} />);
}

describe('Layout', () => {
  it('отображает название бренда', () => {
    renderLayoutAt('/rooms');
    expect(screen.getByText('BookRoom')).toBeInTheDocument();
  });

  it('отображает обе навигационные ссылки', () => {
    renderLayoutAt('/rooms');
    expect(screen.getByRole('link', { name: 'Переговорные' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Мои бронирования' })).toBeInTheDocument();
  });

  it('ссылка "Переговорные" ведёт на /rooms', () => {
    renderLayoutAt('/rooms');
    expect(screen.getByRole('link', { name: 'Переговорные' })).toHaveAttribute('href', '/rooms');
  });

  it('ссылка "Мои бронирования" ведёт на /bookings', () => {
    renderLayoutAt('/rooms');
    expect(screen.getByRole('link', { name: 'Мои бронирования' })).toHaveAttribute(
      'href',
      '/bookings',
    );
  });

  it('рендерит дочерний маршрут через Outlet', () => {
    renderLayoutAt('/rooms');
    expect(screen.getByText('Страница переговорных')).toBeInTheDocument();
  });

  it('рендерит другой дочерний маршрут при переходе', () => {
    renderLayoutAt('/bookings');
    expect(screen.getByText('Страница бронирований')).toBeInTheDocument();
  });

  it('отображает имя пользователя в профиле', () => {
    renderLayoutAt('/rooms');
    expect(screen.getByText('Попехин Н.')).toBeInTheDocument();
  });

  it('помечает активную ссылку класс "active" для текущего маршрута', () => {
    renderLayoutAt('/bookings');
    const bookingsLink = screen.getByRole('link', { name: 'Мои бронирования' });
    const roomsLink = screen.getByRole('link', { name: 'Переговорные' });

    expect(bookingsLink.className).toMatch(/active/);
    expect(roomsLink.className).not.toMatch(/active/);
  });
});
