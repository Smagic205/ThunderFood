import { useEffect, Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { ScrollToTop } from './ScrollToTop';
import { ToastContainer } from '@/shared/components/ui/ToastContainer';
import { PageLoader } from '@/shared/components/ui/PageLoader';
import { ErrorBoundary } from '@/shared/components/ui/ErrorBoundary';

export const UserLayout = () => {
  useEffect(() => {
    document.body.classList.add('has-bnav');
    return () => {
      document.body.classList.remove('has-bnav');
    };
  }, []);

  return (
    <>
      <ScrollToTop />
      <ScrollRestoration />
      <Header />
      <main id="view" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BottomNav />
      <ToastContainer />
    </>
  );
};
