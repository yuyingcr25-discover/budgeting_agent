import { Link, useLocation } from 'react-router-dom';
import { FileText, Home, Settings } from 'lucide-react';

export function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <FileText size={24} />
          <span>Project Setup Workbook</span>
        </Link>

        <nav className="nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin"
            className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Admin</span>
          </Link>
        </nav>

        <div className="user-info">
          <span>John Smith</span>
          <div className="avatar">JS</div>
        </div>
      </div>
    </header>
  );
}
