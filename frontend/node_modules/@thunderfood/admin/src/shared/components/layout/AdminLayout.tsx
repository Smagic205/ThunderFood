import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AdminHeader } from './AdminHeader';

export const AdminLayout = () => {
  return (
    <>
      <a className="skip" href="#view">Bỏ qua tới nội dung</a>
      <div className="adm">
        <Sidebar />
        <div className="adm-main">
          <AdminHeader />
          <main id="view" className="adm-body" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
      <div className="scrim" data-act="side-close"></div>
    </>
  );
};
