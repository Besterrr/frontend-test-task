import { NavLink, Outlet } from 'react-router-dom';

export function Layout() {
  return (
    <div>
      <nav>
        <NavLink to="/rooms">Переговорные</NavLink>
        {' | '}
        <NavLink to="/bookings">Мои бронирования</NavLink>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
