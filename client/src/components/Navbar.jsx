/**
 * Navbar Component
 * 
 * Top navigation bar with logo, user profile, and logout.
 */

import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3"
      style={{
        background: 'rgba(5, 10, 14, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
      id="main-navbar"
    >
      {/* Logo */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-3 group cursor-pointer bg-transparent border-none"
        id="nav-logo-btn"
      >
        <span
          className="text-xl font-black tracking-[0.1em] neon-text"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          SNAKE.IO
        </span>
        <span
          className="hidden sm:inline text-xs tracking-[0.3em] opacity-50"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
        >
          // PLATFORM
        </span>
      </button>

      {/* User Profile */}
      {user && (
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-[var(--color-border)]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  background: 'var(--color-bg-tertiary)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {user.name?.charAt(0) || '?'}
              </div>
            )}
            <span
              className="text-sm"
              style={{ color: 'var(--color-text)', fontFamily: 'var(--font-mono)' }}
            >
              {user.name}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs tracking-[0.15em] transition-all duration-300 cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)',
              background: 'transparent',
              color: 'var(--color-danger)',
              border: '1px solid rgba(255, 68, 102, 0.3)',
              borderRadius: '4px',
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = 'var(--color-danger)';
              e.target.style.boxShadow = '0 0 15px rgba(255, 68, 102, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = 'rgba(255, 68, 102, 0.3)';
              e.target.style.boxShadow = 'none';
            }}
            id="logout-btn"
          >
            LOGOUT
          </button>
        </div>
      )}
    </nav>
  );
}
