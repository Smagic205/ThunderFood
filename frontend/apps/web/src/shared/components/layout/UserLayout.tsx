import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingChat } from '@/shared/components/ui/FloatingChat';

export const UserLayout = () => {
  return (
    <>
      <Header />
      <main id="view" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <FloatingChat />
    </>
  );
};
