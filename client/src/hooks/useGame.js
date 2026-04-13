/**
 * useGame Hook
 * 
 * Manages the game engine lifecycle within React.
 * Handles initialization, state syncing, and cleanup.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { SnakeEngine, GAME_STATUS } from '../game/engine';
import { GameRenderer } from '../game/renderer';
import { InputHandler } from '../game/input';
import { getModeConfig } from '../game/modes';

/**
 * @param {object} options
 * @param {string} options.mode - Game mode key
 * @param {string} options.playerName - Player name
 * @param {string} options.playerColor - Snake color
 * @returns {object} Game state and control functions
 */
export function useGame(options = {}) {
  const {
    mode = 'classic',
    playerName = 'Player',
    playerColor = '#00ff88',
  } = options;

  const [gameState, setGameState] = useState(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState(GAME_STATUS.IDLE);

  const engineRef = useRef(null);
  const rendererRef = useRef(null);
  const inputRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animFrameRef = useRef(null);

  /**
   * Initialize the game engine and renderer
   */
  const initGame = useCallback((canvas, container) => {
    if (!canvas || !container) return;

    canvasRef.current = canvas;
    containerRef.current = container;

    const config = getModeConfig(mode);

    // Create renderer
    const renderer = new GameRenderer(canvas, {
      gridSize: config.gridSize,
      playerColor,
    });
    renderer.resize(container);
    rendererRef.current = renderer;

    // Create engine
    const engine = new SnakeEngine({
      mode,
      playerName,
      playerColor,
      onStateChange: (state) => {
        setGameState(state);
        setStatus(state.status);
        renderer.render(state);
      },
      onGameOver: (result) => {
        setHighScore(result.highScore);
      },
      onScoreChange: (newScore, newHigh) => {
        setScore(newScore);
        setHighScore(newHigh);
      },
    });
    engineRef.current = engine;

    // Create input handler
    const input = new InputHandler({
      onDirection: (dir) => engine.setDirection(dir),
      onPause: () => engine.togglePause(),
      touchTarget: canvas,
    });
    inputRef.current = input;

    // Initial render
    const initialState = engine.getState();
    setGameState(initialState);
    setScore(initialState.score);
    setHighScore(initialState.highScore);
    setStatus(initialState.status);
    renderer.render(initialState);
  }, [mode, playerName, playerColor]);

  /**
   * Start the game
   */
  const startGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.start();
    }
  }, []);

  /**
   * Pause/resume the game
   */
  const togglePause = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.togglePause();
    }
  }, []);

  /**
   * Restart the game
   */
  const restartGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.restart();
    }
  }, []);

  /**
   * Reset to idle state
   */
  const resetGame = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.reset();
    }
  }, []);

  /**
   * Handle window resize
   */
  const handleResize = useCallback(() => {
    if (rendererRef.current && containerRef.current) {
      rendererRef.current.resize(containerRef.current);
      if (gameState) {
        rendererRef.current.render(gameState);
      }
    }
  }, [gameState]);

  // Resize listener
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
      if (inputRef.current) {
        inputRef.current.destroy();
        inputRef.current = null;
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return {
    gameState,
    score,
    highScore,
    status,
    initGame,
    startGame,
    togglePause,
    restartGame,
    resetGame,
    handleResize,
    isPlaying: status === GAME_STATUS.PLAYING,
    isPaused: status === GAME_STATUS.PAUSED,
    isGameOver: status === GAME_STATUS.GAME_OVER,
    isIdle: status === GAME_STATUS.IDLE,
  };
}
