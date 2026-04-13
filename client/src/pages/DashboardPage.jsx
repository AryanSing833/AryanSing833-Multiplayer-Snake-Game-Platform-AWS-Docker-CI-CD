/**
 * Dashboard Page
 * 
 * Main hub after login — play solo, create/join rooms.
 * Clean card-based layout with smooth hover effects.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

/**
 * Generate a random 6-character room code
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude ambiguous chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const handlePlaySolo = () => {
    navigate('/game?mode=classic');
  };

  const handleCreateRoom = () => {
    const code = generateRoomCode();
    navigate(`/room/${code}?host=true`);
  };

  const handleJoinRoom = () => {
    const code = joinCode.trim().toUpperCase();
    if (!code) {
      setJoinError('Please enter a room code');
      return;
    }
    if (code.length !== 6 || !/^[A-Z0-9]+$/.test(code)) {
      setJoinError('Invalid code — must be 6 characters (A-Z, 0-9)');
      return;
    }
    setJoinError('');
    navigate(`/room/${code}`);
  };

  const handleJoinInputChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setJoinCode(val);
    if (joinError) setJoinError('');
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse at 30% 20%, rgba(0, 255, 136, 0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 80%, rgba(0, 204, 255, 0.03) 0%, transparent 50%),
          var(--color-bg-primary)
        `,
      }}
      id="dashboard-page"
    >
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid opacity-20" aria-hidden="true" />

      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 pt-20 pb-10 px-4 sm:px-6 max-w-5xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-12 animate-slide-up">
          <h1
            className="text-3xl sm:text-4xl font-black tracking-[0.08em] mb-3"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-text-bright)',
            }}
          >
            WELCOME BACK
            {user?.name && (
              <span className="neon-text">, {user.name.split(' ')[0].toUpperCase()}</span>
            )}
          </h1>
          <p
            className="text-sm tracking-[0.2em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            SELECT YOUR GAME MODE
          </p>
        </div>

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Play Solo Card */}
          <button
            onClick={handlePlaySolo}
            className="glass-card glass-card-hover p-6 flex flex-col items-center gap-4 text-left cursor-pointer animate-slide-up stagger-1 group"
            id="play-solo-card"
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
              style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid rgba(0, 255, 136, 0.2)',
              }}
            >
              🎮
            </div>
            <div className="text-center">
              <h2
                className="text-lg font-bold tracking-[0.1em] mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
              >
                PLAY SOLO
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                Classic snake game. Beat your high score.
              </p>
            </div>
            <div
              className="w-full py-2 text-center text-xs font-bold tracking-[0.15em] rounded transition-all duration-300"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'rgba(0, 255, 136, 0.05)',
                border: '1px solid rgba(0, 255, 136, 0.15)',
                color: 'var(--color-accent)',
              }}
            >
              START GAME →
            </div>
          </button>

          {/* Create Room Card */}
          <button
            onClick={handleCreateRoom}
            className="glass-card glass-card-hover p-6 flex flex-col items-center gap-4 text-left cursor-pointer animate-slide-up stagger-2 group"
            id="create-room-card"
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl transition-transform duration-300 group-hover:scale-110"
              style={{
                background: 'rgba(0, 204, 255, 0.1)',
                border: '1px solid rgba(0, 204, 255, 0.2)',
              }}
            >
              🏠
            </div>
            <div className="text-center">
              <h2
                className="text-lg font-bold tracking-[0.1em] mb-1"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent2)' }}
              >
                CREATE ROOM
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                Host a multiplayer room. Share the code.
              </p>
            </div>
            <div
              className="w-full py-2 text-center text-xs font-bold tracking-[0.15em] rounded transition-all duration-300"
              style={{
                fontFamily: 'var(--font-display)',
                background: 'rgba(0, 204, 255, 0.05)',
                border: '1px solid rgba(0, 204, 255, 0.15)',
                color: 'var(--color-accent2)',
              }}
            >
              CREATE →
            </div>
          </button>

          {/* Join Room Card */}
          <div
            className="glass-card p-6 flex flex-col items-center gap-4 animate-slide-up stagger-3"
            style={{ borderRadius: '16px' }}
            id="join-room-card"
          >
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl"
              style={{
                background: 'rgba(204, 68, 255, 0.1)',
                border: '1px solid rgba(204, 68, 255, 0.2)',
              }}
            >
              🔗
            </div>
            <div className="text-center">
              <h2
                className="text-lg font-bold tracking-[0.1em] mb-1"
                style={{ fontFamily: 'var(--font-display)', color: '#cc44ff' }}
              >
                JOIN ROOM
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                Enter a room code to join a friend.
              </p>
            </div>

            {/* Join Input */}
            <div className="w-full flex flex-col gap-2">
              <input
                type="text"
                value={joinCode}
                onChange={handleJoinInputChange}
                placeholder="ROOM CODE"
                maxLength={6}
                className="input-neon w-full text-center text-lg"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                id="join-code-input"
              />
              {joinError && (
                <p
                  className="text-xs text-center animate-fade-in"
                  style={{ color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}
                >
                  {joinError}
                </p>
              )}
              <button
                onClick={handleJoinRoom}
                className="w-full py-2 text-xs font-bold tracking-[0.15em] rounded cursor-pointer transition-all duration-300"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: 'rgba(204, 68, 255, 0.1)',
                  border: '1px solid rgba(204, 68, 255, 0.3)',
                  color: '#cc44ff',
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(204, 68, 255, 0.2)';
                  e.target.style.boxShadow = '0 0 15px rgba(204, 68, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(204, 68, 255, 0.1)';
                  e.target.style.boxShadow = 'none';
                }}
                id="join-room-btn"
              >
                JOIN →
              </button>
            </div>
          </div>
        </div>

        {/* Game Modes Info */}
        <div className="animate-slide-up stagger-4">
          <h3
            className="text-xs font-bold tracking-[0.3em] mb-4 text-center"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-dim)' }}
          >
            AVAILABLE MODES
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'CLASSIC', desc: 'Walls kill. Speed increases.', color: '#00ff88', icon: '🎮', ready: true },
              { name: 'MULTIPLAYER', desc: 'Real-time PvP battles.', color: '#00ccff', icon: '👥', ready: true },
              { name: 'ANTIGRAVITY', desc: 'Wrap-around chaos.', color: '#cc44ff', icon: '🌀', ready: false },
            ].map((mode) => (
              <div
                key={mode.name}
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)',
                  opacity: mode.ready ? 1 : 0.5,
                }}
              >
                <span className="text-lg">{mode.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold tracking-[0.1em]" style={{ fontFamily: 'var(--font-display)', color: mode.color }}>
                    {mode.name}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {mode.desc}
                  </p>
                </div>
                {!mode.ready && (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(255, 183, 0, 0.1)',
                      color: 'var(--color-warning)',
                      border: '1px solid rgba(255, 183, 0, 0.2)',
                    }}
                  >
                    SOON
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
