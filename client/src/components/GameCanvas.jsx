/**
 * GameCanvas Component
 * 
 * Wraps the HTML5 Canvas element for the snake game.
 * Handles initialization and responsive sizing.
 */

import { useRef, useEffect, useState } from 'react';

const GRID_SIZE = 20;

export default function GameCanvas({ onInit, className = '' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const cols = Math.max(20, Math.floor(window.innerWidth / GRID_SIZE));
      const rows = Math.max(20, Math.floor(window.innerHeight / GRID_SIZE));
      setSize({
        width: cols * GRID_SIZE,
        height: rows * GRID_SIZE,
      });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  useEffect(() => {
    if (canvasRef.current && containerRef.current) {
      canvasRef.current.width = size.width;
      canvasRef.current.height = size.height;
      onInit(canvasRef.current, containerRef.current);
    }
  }, [onInit, size.width, size.height]);

  return (
    <div
      ref={containerRef}
      className={`flex items-center justify-center ${className}`}
      style={{ width: `${size.width}px`, height: `${size.height}px`, maxWidth: "100%" }}
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
