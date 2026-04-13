/**
 * GameOverOverlay Component
 * 
 * Displayed when the game ends — shows final score and action buttons.
 */

export default function GameOverOverlay({
  score = 0,
  highScore = 0,
  isNewHighScore = false,
  onRestart,
  onBack,
  mode = 'classic',
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(5, 10, 14, 0.88)', backdropFilter: 'blur(8px)' }}
      id="game-over-overlay"
    >
      <div
        className="glass-card flex flex-col items-center gap-6 px-10 py-8 animate-scale-in"
        style={{
          borderColor: 'var(--color-danger)',
          boxShadow: '0 0 60px rgba(255, 68, 102, 0.2)',
          maxWidth: '400px',
          width: '90%',
        }}
      >
        {/* Title */}
        <div className="text-center">
          <h2
            className="text-3xl font-black tracking-[0.1em] mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--color-danger)',
              textShadow: '0 0 20px rgba(255, 68, 102, 0.5)',
            }}
          >
            GAME OVER
          </h2>
          <p
            className="text-xs tracking-[0.3em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            {mode.toUpperCase()} MODE
          </p>
        </div>

        {/* Score Display */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div
            className="w-full py-4 text-center rounded-lg"
            style={{
              background: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p
              className="text-xs tracking-[0.2em] mb-1"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              FINAL SCORE
            </p>
            <p
              className="text-4xl font-black"
              style={{
                fontFamily: 'var(--font-display)',
                color: isNewHighScore ? 'var(--color-warning)' : 'var(--color-accent)',
                textShadow: isNewHighScore
                  ? '0 0 20px rgba(255, 183, 0, 0.5)'
                  : '0 0 20px rgba(0, 255, 136, 0.5)',
              }}
            >
              {score}
            </p>
          </div>

          {isNewHighScore && (
            <div
              className="flex items-center gap-2 py-1.5 px-4 rounded"
              style={{
                background: 'rgba(255, 183, 0, 0.1)',
                border: '1px solid rgba(255, 183, 0, 0.3)',
              }}
            >
              <span className="text-sm">🏆</span>
              <span
                className="text-xs font-bold tracking-[0.15em]"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-warning)' }}
              >
                NEW HIGH SCORE!
              </span>
            </div>
          )}

          <div className="flex justify-between w-full mt-1">
            <span className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
              BEST: {highScore}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full mt-2">
          <button
            onClick={onRestart}
            className="btn-filled w-full py-3 text-sm"
            id="restart-btn"
          >
            <span className="relative z-10">▶ PLAY AGAIN</span>
          </button>

          <button
            onClick={onBack}
            className="btn-neon w-full py-3 text-sm"
            id="back-to-dashboard-btn"
          >
            <span className="relative z-10">← DASHBOARD</span>
          </button>
        </div>
      </div>
    </div>
  );
}
