import { useRealtimeSync } from './hooks/useRealtimeSync';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';

export function App() {
  useRealtimeSync();
  return <RouterProvider router={router} />;
}
