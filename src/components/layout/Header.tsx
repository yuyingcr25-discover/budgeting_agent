import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Moon, Sun, Sparkles, Layers, Zap } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import crLogoOrange from '../../assets/cr-logo-orange.png';
import crLogoWhite from '../../assets/cr-logo-white.png';

export function Header() {
  const location = useLocation();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img
            src={theme === 'light' ? crLogoOrange : crLogoWhite}
            alt="CohnReznick"
            className="logo-image"
          />
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
            to="/budgeting-agent"
            className={`nav-link ${location.pathname === '/budgeting-agent' ? 'active' : ''}`}
          >
            <Zap size={18} />
            <span>Budgeting Agent</span>
          </Link>
          <Link
            to="/budgeting-agent-chat"
            className={`nav-link ${location.pathname === '/budgeting-agent-chat' ? 'active' : ''}`}
          >
            <Sparkles size={18} />
            <span>AI Budget Agent</span>
          </Link>
          <Link
            to="/prototype"
            className={`nav-link ${location.pathname === '/prototype' ? 'active' : ''}`}
          >
            <Layers size={18} />
            <span>Prototype</span>
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
