import { Link, useLocation } from 'react-router-dom';
import { FileText, Home, Settings, Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';

export function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();

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

        <div className="header-right">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="user-info">
            <span>John Smith</span>
            <div className="avatar">JS</div>
          </div>
        </div>
      </div>
    </header>
  );
}
