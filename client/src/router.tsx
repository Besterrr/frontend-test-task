import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RoomsPage } from './pages/RoomsPage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { BookingsPage } from './pages/BookingsPage/BookingsPage';
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage';

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/rooms" replace /> },
      { path: '/rooms', element: <RoomsPage /> },
      { path: '/rooms/:roomId', element: <RoomDetailsPage /> },
      { path: '/bookings', element: <BookingsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];

export const router = createBrowserRouter(routes);
