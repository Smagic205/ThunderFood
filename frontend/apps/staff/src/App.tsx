import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router';
import { ForbiddenNotice } from './shared/components/ui/ForbiddenNotice';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <>
        <RouterProvider router={router} />
        <ForbiddenNotice />
      </>
    </QueryClientProvider>
  );
}

export default App;
