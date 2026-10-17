import { Menu } from 'lucide-react';

export const StaffHeader = () => {
  return (
    <header className="adm-header">
      <div className="row">
        <button className="ibtn hide-sm" data-act="side-open" aria-label="Mở menu">
          <Menu size={20} />
        </button>
        <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Workspace Nhân Viên</h2>
      </div>
    </header>
  );
};
