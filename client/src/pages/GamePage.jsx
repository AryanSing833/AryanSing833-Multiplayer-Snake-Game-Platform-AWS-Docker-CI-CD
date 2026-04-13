/**
 * Game Page
 * 
 * Main game screen with canvas, HUD, and overlays.
 * Supports both solo and multiplayer modes.
 */

import { useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../hooks/useGame';
import { GAME_STATUS } from '../game/engine';
import Navbar from '../components/Navbar';
import GameCanvas from '../components/GameCanvas';
import GameHUD from '../components/GameHUD';
import GameOverOverlay from '../components/GameOverOverlay';

export default function GamePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const mode = searchParams.get('mode') || 'classic';
  const roomCode = searchParams.get('room') || null;

  const {
    gameState,
    score,
    highScore,
    status,
    initGame,
    startGame,
    restartGame,
    isGameOver,
    isIdle,
    isPaused,
  } = useGame({
    mode,
    playerName: user?.name || 'Player',
    playerColor: '#00ff88',
  });

  // Auto-start when canvas is initialized
  const handleCanvasInit = useCallback((canvas, container) => {
    initGame(canvas, container);
  }, [initGame]);

  // Start game after init
  useEffect(() => {
    if (isIdle && gameState) {
      // Small delay to let the canvas render the initial state
      const timer = setTimeout(() => startGame(), 500);
      return () => clearTimeout(timer);
    }
  }, [isIdle, gameState, startGame]);

  const handleRestart = () => {
    restartGame();
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        background: `
          radial-gradient(ellipse at 50% 100%, rgba(0, 204, 255, 0.03) 0%, transparent 50%),
          var(--color-bg-primary)
        `,
      }}
      id="game-page"
    >
      <Navbar />

      {/* Game Layout */}
      <div className="flex-1 flex flex-col lg:flex-row items-stretch pt-14 pb-4 px-3 gap-3 overflow-hidden">
        {/* Left Sidebar - HUD (desktop) */}
        <aside className="hidden lg:flex w-[200px] min-w-[180px] flex-shrink-0 pt-2">
          <GameHUD
            score={score}
            highScore={highScore}
            status={status}
            mode={mode}
            playerName={user?.name?.split(' ')[0] || 'Player'}
            roomCode={roomCode}
            players={[]}
          />
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 flex items-center justify-center relative min-h-0">
          <GameCanvas
            onInit={handleCanvasInit}
            className="w-full h-full max-h-[calc(100vh-120px)]"
          />

          {/* Pause Overlay */}
          {isPaused && (
            <div
              className="absolute inset-0 flex items-center justify-center z-30 animate-fade-in"
              style={{ background: 'rgba(5, 10, 14, 0.75)', backdropFilter: 'blur(4px)' }}
            >
              <div className="text-center">
                <h2
                  className="text-4xl font-black tracking-[0.15em] mb-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: 'var(--color-warning)',
                    textShadow: '0 0 30px rgba(255, 183, 0, 0.5)',
                  }}
                >
                  PAUSED
                </h2>
                <p
                  className="text-xs tracking-[0.3em]"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  PRESS SPACE TO RESUME
                </p>
              </div>
            </div>
          )}

          {/* Start prompt */}
          {isIdle && !gameState && (
            <div
              className="absolute inset-0 flex items-center justify-center z-30"
              style={{ background: 'rgba(5, 10, 14, 0.75)' }}
            >
              <div className="text-center">
                <p
                  className="text-sm tracking-[0.2em] animate-pulse"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  INITIALIZING...
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Right Sidebar - Info (desktop) */}
        <aside className="hidden lg:flex w-[200px] min-w-[180px] flex-shrink-0 pt-2">
          <div className="flex flex-col gap-4 w-full">
            {/* Mode Info */}
            <div
              className="glass-card p-4 flex flex-col gap-2"
              style={{ borderRadius: '12px' }}
            >
              <h3
                className="text-xs font-bold tracking-[0.25em] pb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-accent2)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                GAME MODE
              </h3>
              <p
                className="text-sm font-bold"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
              >
                {mode.toUpperCase()}
              </p>
              <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                {mode === 'classic' && 'Walls kill. Speed increases with each food.'}
                {mode === 'multiplayer' && 'Real-time PvP. Last snake standing wins.'}
                {mode === 'antigravity' && 'Wrap-around walls. Gravity pulls you down.'}
              </p>
            </div>

            {/* Tips */}
            <div
              className="glass-card p-4 flex flex-col gap-2"
              style={{ borderRadius: '12px' }}
            >
              <h3
                className="text-xs font-bold tracking-[0.25em] pb-2"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--color-accent2)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                TIPS
              </h3>
              <ul className="flex flex-col gap-1.5">
                {[
                  'Use walls to trap yourself less',
                  'Plan 2-3 moves ahead',
                  'Speed increases each food',
                  'Coil efficiently to survive longer',
                ].map((tip, i) => (
                  <li
                    key={i}
                    className="text-xs flex items-start gap-2"
                    style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                  >
                    <span style={{ color: 'var(--color-accent)', flexShrink: 0 }}>›</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Mobile HUD (bottom) */}
        <div className="lg:hidden flex items-center justify-between gap-4 px-2 py-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>SCORE</span>
              <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}>{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>BEST</span>
              <span className="text-sm" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}>{highScore}</span>
            </div>
          </div>
          <span
            className="text-xs font-bold px-2 py-1 rounded"
            style={{
              fontFamily: 'var(--font-display)',
              color: status === GAME_STATUS.PLAYING ? 'var(--color-accent)' : 'var(--color-warning)',
              background: status === GAME_STATUS.PLAYING ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 183, 0, 0.1)',
              border: `1px solid ${status === GAME_STATUS.PLAYING ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 183, 0, 0.2)'}`,
            }}
          >
            {mode.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Game Over Overlay */}
      {isGameOver && (
        <GameOverOverlay
          score={score}
          highScore={highScore}
          isNewHighScore={score >= highScore && score > 0}
          onRestart={handleRestart}
          onBack={handleBack}
          mode={mode}
        />
      )}
    </div>
  );
}
