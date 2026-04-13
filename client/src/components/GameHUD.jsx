/**
 * GameHUD Component
 * 
 * Heads-Up Display showing score, status, controls, and player info.
 * Adapts between solo and multiplayer modes.
 */

import { GAME_STATUS } from '../game/engine';

export default function GameHUD({
  score = 0,
  highScore = 0,
  status = GAME_STATUS.IDLE,
  mode = 'classic',
  playerName = 'Player',
  roomCode = null,
  players = [],
}) {
  const statusLabels = {
    [GAME_STATUS.IDLE]: { text: 'READY', color: 'var(--color-accent2)' },
    [GAME_STATUS.WAITING]: { text: 'WAITING', color: 'var(--color-warning)' },
    [GAME_STATUS.PLAYING]: { text: 'PLAYING', color: 'var(--color-accent)' },
    [GAME_STATUS.PAUSED]: { text: 'PAUSED', color: 'var(--color-warning)' },
    [GAME_STATUS.GAME_OVER]: { text: 'GAME OVER', color: 'var(--color-danger)' },
  };

  const currentStatus = statusLabels[status] || statusLabels[GAME_STATUS.IDLE];
  const isMultiplayer = mode === 'multiplayer';

  return (
    <div className="flex flex-col gap-4 w-full" id="game-hud">
      {/* Stats Panel */}
      <div
        className="glass-card p-4 flex flex-col gap-3"
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
          YOUR STATS
        </h3>

        {/* Player Name */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs tracking-[0.1em]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            PLAYER
          </span>
          <span className="text-sm font-bold neon-text" style={{ fontFamily: 'var(--font-display)' }}>
            {playerName}
          </span>
        </div>

        {/* Score */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs tracking-[0.1em]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            SCORE
          </span>
          <span
            className="text-lg font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}
          >
            {score}
          </span>
        </div>

        {/* High Score */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs tracking-[0.1em]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            BEST
          </span>
          <span
            className="text-sm"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}
          >
            {highScore}
          </span>
        </div>

        {/* Status */}
        <div className="flex justify-between items-baseline">
          <span className="text-xs tracking-[0.1em]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            STATUS
          </span>
          <span
            className="text-sm font-bold"
            style={{ fontFamily: 'var(--font-display)', color: currentStatus.color }}
          >
            {currentStatus.text}
          </span>
        </div>

        {/* Room Code (multiplayer only) */}
        {roomCode && (
          <div className="flex justify-between items-baseline pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
            <span className="text-xs tracking-[0.1em]" style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
              ROOM
            </span>
            <span
              className="text-sm font-bold"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent2)' }}
            >
              {roomCode}
            </span>
          </div>
        )}
      </div>

      {/* Controls Help */}
      <div
        className="glass-card p-4 flex flex-col gap-3"
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
          CONTROLS
        </h3>

        <div className="grid grid-cols-3 gap-1 w-fit mx-auto">
          <span></span>
          <kbd className="flex items-center justify-center px-2 py-1.5 text-xs rounded"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            ▲
          </kbd>
          <span></span>
          <kbd className="flex items-center justify-center px-2 py-1.5 text-xs rounded"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            ◄
          </kbd>
          <kbd className="flex items-center justify-center px-2 py-1.5 text-xs rounded"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            ▼
          </kbd>
          <kbd className="flex items-center justify-center px-2 py-1.5 text-xs rounded"
            style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)', color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}>
            ►
          </kbd>
        </div>

        <p
          className="text-center text-xs mt-1"
          style={{ color: 'var(--color-text-dim)', fontFamily: 'var(--font-mono)' }}
        >
          Arrow Keys / WASD
        </p>
        <p
          className="text-center text-xs"
          style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
        >
          Space to Pause
        </p>
      </div>

      {/* Multiplayer Player List */}
      {isMultiplayer && players.length > 0 && (
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
            PLAYERS
          </h3>
          {players.map((player, idx) => (
            <div
              key={player.id || idx}
              className="flex items-center gap-2 py-1"
              style={{ borderBottom: '1px solid rgba(26, 48, 64, 0.3)' }}
            >
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ background: player.color || 'var(--color-accent)' }}
              />
              <span
                className="flex-1 text-xs truncate"
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: player.isMe ? 'var(--color-accent)' : 'var(--color-text)',
                  fontWeight: player.isMe ? 'bold' : 'normal',
                }}
              >
                {player.isMe ? 'YOU' : player.name}
              </span>
              <span
                className="text-xs"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
              >
                {player.score || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
