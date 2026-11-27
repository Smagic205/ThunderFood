import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from './app/router';
import { ForbiddenNotice } from './shared/components/ui/ForbiddenNotice';
import { useAuthStore } from './features/auth/store/authStore';
import { authApi } from './features/auth/api/auth';

const queryClient = new QueryClient();

let staffBootstrapPromise: Promise<void> | null = null;

function restoreStaffSession() {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated || state.token) {
    return Promise.resolve();
  }
  if (!staffBootstrapPromise) {
    state.setHydrating(true);
    staffBootstrapPromise = (async () => {
      try {
        const res = await authApi.refreshToken();
        const data = res.data;
        if (data.user?.role !== 'STAFF') {
          useAuthStore.getState().logout();
          return;
        }
        useAuthStore.getState().setAuth(data.user, data.token);
      } catch {
        useAuthStore.getState().logout();
      } finally {
        useAuthStore.getState().setHydrating(false);
        staffBootstrapPromise = null;
      }
    })();
  }
  return staffBootstrapPromise;
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const token = useAuthStore((s) => s.token);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const needsBootstrap = isAuthenticated && !token;

  useEffect(() => {
    if (needsBootstrap) {
      void restoreStaffSession();
    }
  }, [needsBootstrap]);

  return (
    <QueryClientProvider client={queryClient}>
      {needsBootstrap || isHydrating ? (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }} role="status">
          <span>Đang khôi phục phiên nhân viên...</span>
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
