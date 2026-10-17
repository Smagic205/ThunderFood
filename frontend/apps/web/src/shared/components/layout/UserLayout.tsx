import { useEffect } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';
import { FloatingChat } from '@/shared/components/ui/FloatingChat';
import { ScrollToTop } from './ScrollToTop';

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
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
      <BottomNav />
    </>
  );
};
