/**
 * GameCanvas Component
 * 
 * Wraps the HTML5 Canvas element for the snake game.
 * Handles initialization and responsive sizing.
 */

import { useRef, useEffect } from 'react';

export default function GameCanvas({ onInit, className = '' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      onInit(canvasRef.current, containerRef.current);
    }
  }, [onInit]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center ${className}`}
      style={{ width: '100%', height: '100%' }}
      id="game-canvas-container"
    >
      <div className="canvas-gradient-border">
        <canvas
          ref={canvasRef}
          id="game-canvas"
          style={{
            display: 'block',
            background: 'var(--color-bg-primary)',
            imageRendering: 'pixelated',
          }}
        />
      </div>
    </div>
  );
}
