import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router';
import { ForbiddenNotice } from './shared/components/ui/ForbiddenNotice';
import { useAuthStore } from './app/store/authStore';
import { authApi } from './shared/api/authApi';

const queryClient = new QueryClient();

let adminBootstrapPromise: Promise<void> | null = null;

function restoreAdminSession() {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated || state.accessToken) {
    return Promise.resolve();
  }
  if (!adminBootstrapPromise) {
    state.setHydrating(true);
    adminBootstrapPromise = (async () => {
      try {
        const data = await authApi.refreshToken();
        if (data.user?.role !== 'ADMIN') {
          useAuthStore.getState().logout();
          return;
        }
        useAuthStore.getState().login(data.user, data.token);
      } catch {
        useAuthStore.getState().logout();
      } finally {
        useAuthStore.getState().setHydrating(false);
        adminBootstrapPromise = null;
      }
    })();
  }
  return adminBootstrapPromise;
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const needsBootstrap = isAuthenticated && !accessToken;

  useEffect(() => {
    if (needsBootstrap) {
      void restoreAdminSession();
    }
  }, [needsBootstrap]);

  return (
    <QueryClientProvider client={queryClient}>
      {needsBootstrap || isHydrating ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="status">
          <span>Đang khôi phục phiên quản trị...</span>
        </div>
      ) : (
        <>
          <RouterProvider router={router} />
          <ForbiddenNotice />
        </>
      )}
    </QueryClientProvider>
  );
}

export default App;
