import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { appQueryClient } from '@/shared/config/queryClient';
import { router } from './app/router';
import { useAuthStore } from './app/store/authStore';
import { authApi } from './shared/api/authApi';
import { userApi } from './shared/api/userApi';
import { PageLoader } from './shared/components/ui/PageLoader';

let sessionBootstrapPromise: Promise<void> | null = null;

function restoreSessionFromCookie() {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated || state.accessToken) {
    return Promise.resolve();
  }
  if (!sessionBootstrapPromise) {
    state.setHydrating(true);
    sessionBootstrapPromise = (async () => {
      try {
        const data = await authApi.refreshToken(state.rememberSession);
        useAuthStore.getState().login(
          {
            id: data.user.id,
            email: data.user.email,
            name: data.user.fullName,
            fullName: data.user.fullName,
            phone: data.user.phone || '',
            role: data.user.role as 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'SHIPPER',
            avatarUrl: data.user.avatarUrl,
            authProvider: data.user.authProvider || 'LOCAL',
            status: data.user.status || 'ACTIVE',
          },
          data.token,
          state.rememberSession
        );
        userApi.getProfile().then((profile) => {
          useAuthStore.getState().updateUser({
            authProvider: profile.authProvider as 'LOCAL' | 'GOOGLE',
            status: profile.status as 'ACTIVE' | 'LOCKED',
            phone: profile.phone || '',
            createdAt: profile.createdAt || undefined,
            updatedAt: profile.updatedAt || undefined,
          });
        }).catch(() => {});
      } catch {
        useAuthStore.getState().logout();
      } finally {
        useAuthStore.getState().setHydrating(false);
        sessionBootstrapPromise = null;
      }
    })();
  }
  return sessionBootstrapPromise;
}

function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrating = useAuthStore((s) => s.isHydrating);
  const needsBootstrap = isAuthenticated && !accessToken;

  useEffect(() => {
    if (needsBootstrap) {
      void restoreSessionFromCookie();
    }
  }, [needsBootstrap]);

  return (
    <QueryClientProvider client={appQueryClient}>
      {needsBootstrap || isHydrating ? (
        <PageLoader message="Đang khôi phục phiên đăng nhập..." />
      ) : (
        <RouterProvider router={router} />
      )}
    </QueryClientProvider>
  );
}

export default App;
