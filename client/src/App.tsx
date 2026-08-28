import { useRealtimeSync } from './hooks/useRealtimeSync';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { GlobalErrorListener } from './components/GlobalErrorListener';

export function App() {
  useRealtimeSync();
  return (
    <>
      <GlobalErrorListener />
      <RouterProvider router={router} />
    </>
  );
}
