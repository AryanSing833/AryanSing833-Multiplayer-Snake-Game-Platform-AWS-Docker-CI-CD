/**
 * Login Page
 * 
 * Full-screen login page with SNAKE.IO branding and Google Sign-In.
 * Redirects to dashboard if already authenticated.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setError(null);
      await login();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError('Sign-in failed. Please try again.');
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-12 h-12 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin"
            style={{ boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="scanlines min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(0, 255, 136, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(0, 204, 255, 0.04) 0%, transparent 40%),
          var(--color-bg-primary)
        `,
      }}
      id="login-page"
    >
      {/* Background Grid */}
      <div
        className="absolute inset-0 bg-grid opacity-30"
        aria-hidden="true"
      />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              background: i % 2 === 0 ? 'var(--color-accent)' : 'var(--color-accent2)',
              left: `${10 + Math.random() * 80}%`,
              animation: `particle-float ${8 + Math.random() * 12}s linear ${Math.random() * 5}s infinite`,
              opacity: 0.4,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center gap-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center animate-slide-up">
          <h1
            className="text-5xl sm:text-6xl font-black tracking-[0.15em] animate-glitch relative"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-accent)',
              textShadow: `
                0 0 20px rgba(0, 255, 136, 0.8),
                0 0 60px rgba(0, 255, 136, 0.3),
                2px 0 0 rgba(255, 68, 102, 0.6),
                -2px 0 0 rgba(0, 204, 255, 0.6)
              `,
            }}
          >
            SNAKE.IO
          </h1>
          <p
            className="text-xs tracking-[0.35em] mt-3 opacity-60"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            MULTIPLAYER // GRID-BASED // REAL-TIME
          </p>
        </div>

        {/* Login Card */}
        <div
          className="glass-card w-full p-8 flex flex-col items-center gap-6 animate-slide-up stagger-2"
          style={{
            boxShadow: '0 0 60px rgba(0, 255, 136, 0.05), inset 0 0 30px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Connection Status */}
          <div className="flex items-center gap-3">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: 'var(--color-accent)',
                boxShadow: '0 0 8px var(--color-accent)',
                animation: 'pulse-dot 1.5s infinite',
              }}
            />
            <span
              className="text-xs tracking-[0.2em]"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              SYSTEM ONLINE
            </span>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 py-4 px-6 rounded-lg transition-all duration-300 cursor-pointer group"
            style={{
              background: isLoggingIn ? 'var(--color-bg-tertiary)' : 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-display)',
              fontSize: '0.85rem',
              letterSpacing: '0.12em',
            }}
            onMouseEnter={(e) => {
              if (!isLoggingIn) {
                e.currentTarget.style.borderColor = 'var(--color-accent)';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 255, 136, 0.15)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.transform = 'none';
            }}
            id="google-signin-btn"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            <span>{isLoggingIn ? 'SIGNING IN...' : 'SIGN IN WITH GOOGLE'}</span>
          </button>

          {/* Error Message */}
          {error && (
            <p
              className="text-xs text-center animate-fade-in"
              style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}
            >
              ⚠ {error}
            </p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
              v1.0.0
            </span>
            <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          </div>
        </div>

        {/* Footer Text */}
        <p
          className="text-xs text-center opacity-40 animate-slide-up stagger-3"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
        >
          CLASSIC • MULTIPLAYER • ANTIGRAVITY
        </p>
      </div>
    </div>
  );
}
