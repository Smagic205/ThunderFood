import { Outlet, Navigate } from 'react-router-dom';
import { StaffSidebar } from './StaffSidebar';
import { StaffHeader } from './StaffHeader';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useEffect } from 'react';

export const StaffLayout = () => {
  const { user, token } = useAuthStore();

  // Basic mobile drawer toggle logic for side menu
  useEffect(() => {
    const handleSideOpen = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-act="side-open"]')) {
        document.body.classList.add('has-side');
      }
      if (target.closest('[data-act="side-close"]')) {
        document.body.classList.remove('has-side');
      }
    };
    document.addEventListener('click', handleSideOpen);
    return () => document.removeEventListener('click', handleSideOpen);
  }, []);

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'STAFF') {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <a className="skip" href="#view">Bỏ qua tới nội dung</a>
      <div className="adm">
        <StaffSidebar />
        <div className="adm-main">
          <StaffHeader />
          <main id="view" className="adm-body" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
      <div className="scrim" data-act="side-close"></div>
    </>
  );
};
