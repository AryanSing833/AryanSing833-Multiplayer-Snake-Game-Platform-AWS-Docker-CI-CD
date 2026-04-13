/**
 * GameCanvas Component
 * 
 * Wraps the HTML5 Canvas element for the snake game.
 * Handles initialization and responsive sizing.
 */

import { useRef, useEffect, useState } from 'react';

export default function GameCanvas({ onInit, className = '' }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const size = Math.floor(Math.min(window.innerWidth, window.innerHeight) * 0.9);
      setSize({
        width: size,
        height: size,
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
