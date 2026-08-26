import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { RoomsPage } from './pages/RoomsPage';
import { RoomDetailsPage } from './pages/RoomDetailsPage';
import { BookingsPage } from './pages/BookingsPage/BookingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
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
]);
