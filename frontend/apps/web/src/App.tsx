import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { appQueryClient } from '@/shared/config/queryClient';
import { router } from './app/router';

function App() {
  return (
    <QueryClientProvider client={appQueryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
