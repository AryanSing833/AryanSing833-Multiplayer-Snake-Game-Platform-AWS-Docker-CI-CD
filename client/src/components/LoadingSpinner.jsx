/**
 * LoadingSpinner Component
 * 
 * Animated neon spinner for loading states.
 */

export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center gap-4" id="loading-spinner">
      <div
        className={`${sizes[size]} rounded-full border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin`}
        style={{
          boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)',
        }}
      />
      {text && (
        <p
          className="font-mono text-sm tracking-[0.2em] text-[var(--color-text-dim)]"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {text}
        </p>
      )}
    </div>
  );
}
