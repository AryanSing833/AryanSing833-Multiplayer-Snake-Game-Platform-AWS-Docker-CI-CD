/**
 * Game Page
 * 
 * Main game screen with canvas, HUD, and overlays.
 * Supports both solo and multiplayer modes.
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';
import { GameRenderer } from '../game/renderer';
import { InputHandler } from '../game/input';
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
  const isMultiplayer = mode === 'multiplayer';
  const { socket, connected } = useSocket({ autoConnect: isMultiplayer });
  const [multiplayerState, setMultiplayerState] = useState(null);
  const [previousMultiplayerState, setPreviousMultiplayerState] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [fps, setFps] = useState(0);
  const [ping, setPing] = useState(null);
  const [serverTickRate, setServerTickRate] = useState(null);
  const [gameOverResult, setGameOverResult] = useState(null);
  const rendererRef = useRef(null);
  const multiplayerStateRef = useRef(null);
  const inputRef = useRef(null);
  const rafRef = useRef(null);
  const lastFrameTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);
  const stateReceivedAtRef = useRef(performance.now());

  const {
    gameState,
    score,
    highScore,
    status,
    initGame,
    startGame,
    setDirection,
    restartGame,
    stopGame,
    isGameOver,
    isIdle,
    isPaused,
  } = useGame({
    mode,
    playerName: user?.name || 'Player',
    playerColor: '#00ff88',
  });

  const sendDirection = useCallback((dir) => {
    if (!isMultiplayer) {
      setDirection(dir);
      return;
    }
    const state = multiplayerStateRef.current;
    const myId = socket.getId();
    if (state?.players?.[myId]) {
      const optimistic = {
        ...state,
        players: {
          ...state.players,
          [myId]: {
            ...state.players[myId],
            direction: dir,
          },
        },
      };
      multiplayerStateRef.current = optimistic;
      setMultiplayerState(optimistic);
    }
    socket.sendMove(dir);
  }, [isMultiplayer, socket, setDirection]);

  // Auto-start when canvas is initialized
  const handleCanvasInit = useCallback((canvas, container) => {
    if (isMultiplayer) {
      const renderer = new GameRenderer(canvas, { gridSize: 20 });
      renderer.resize(container);
      rendererRef.current = renderer;
      return;
    }
    initGame(canvas, container);
  }, [initGame, isMultiplayer]);

  // Start game after init
  useEffect(() => {
    if (isMultiplayer) return;
    if (isIdle && gameState) {
      // Small delay to let the canvas render the initial state
      const timer = setTimeout(() => startGame(), 500);
      return () => clearTimeout(timer);
    }
  }, [isIdle, gameState, startGame, isMultiplayer]);

  useEffect(() => {
    if (!isMultiplayer || !connected || !roomCode) return;

    socket.joinRoom(roomCode);
    socket.onGameStarted(() => setGameStarted(true));
    socket.onMultiplayerGameState((state) => {
      setIsHost(socket.getId() === state.hostId);
      setGameStarted(Boolean(state.gameStarted));
      console.log("Host:", state.hostId, "Me:", socket.getId());
      setPreviousMultiplayerState(multiplayerStateRef.current);
      multiplayerStateRef.current = state;
      setMultiplayerState(state);
      stateReceivedAtRef.current = performance.now();
      setServerTickRate(state.tickRate || null);
    });
    socket.onPong(({ clientTs, tickRate }) => {
      setPing(Math.max(0, Math.round(performance.now() - clientTs)));
      if (tickRate) setServerTickRate(tickRate);
    });
    socket.onGameOver(({ winner }) => {
      setGameOverResult({
        winner,
        title: "Game Over",
      });
      setGameStarted(false);
    });

    // Create one InputHandler for the whole multiplayer session.
    // Start it INACTIVE — it is activated below when `gameStarted` becomes
    // true. This prevents arrow keys in the waiting lobby from being swallowed.
    const handler = new InputHandler({
      onDirection: sendDirection,
      onPause:     () => {},          // no local pause in multiplayer
      touchTarget: document.body,     // body covers the whole viewport
      active:      false,             // activated via setActive() below
    });
    inputRef.current = handler;

    const pingTimer = setInterval(() => {
      socket.sendPing(performance.now());
    }, 1500);

    return () => {
      inputRef.current?.destroy();
      inputRef.current = null;
      clearInterval(pingTimer);
    };
  }, [isMultiplayer, connected, roomCode, socket, sendDirection]);

  // Activate / deactivate the multiplayer InputHandler in sync with gameStarted.
  // When the game goes live: blur any focused input so the keyboard is free,
  // then enable input routing. When the game ends, disable it.
  useEffect(() => {
    if (!isMultiplayer || !inputRef.current) return;
    if (gameStarted) {
      // Blur any focused form element (e.g. room-code input) before enabling
      // input so the first arrow-key press is not swallowed by the browser.
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
      inputRef.current.setActive(true);
    } else {
      inputRef.current.setActive(false);
    }
  }, [isMultiplayer, gameStarted]);

  const interpolatePlayers = useCallback((prevState, currentState, alpha) => {
    if (!currentState?.players) return {};
    const next = {};
    const currentPlayers = currentState.players;
    Object.keys(currentPlayers).forEach((id) => {
      const currentPlayer = currentPlayers[id];
      const previousPlayer = prevState?.players?.[id];
      if (!previousPlayer) {
        next[id] = currentPlayer;
        return;
      }
      const snake = currentPlayer.snake.map((seg, idx) => {
        const prevSeg = previousPlayer.snake?.[idx] || seg;
        return {
          x: prevSeg.x + (seg.x - prevSeg.x) * alpha,
          y: prevSeg.y + (seg.y - prevSeg.y) * alpha,
        };
      });
      next[id] = { ...currentPlayer, snake };
    });
    return next;
  }, []);

  useEffect(() => {
    if (!isMultiplayer || !rendererRef.current) return;
    const animate = () => {
      const now = performance.now();
      frameCountRef.current += 1;
      if (now - lastFrameTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastFrameTimeRef.current = now;
      }
      if (rendererRef.current && multiplayerStateRef.current) {
        const tickMs = multiplayerStateRef.current.tickRate || 40;
        const alpha = Math.min(1, (now - stateReceivedAtRef.current) / tickMs);
        const interpolatedPlayers = interpolatePlayers(
          previousMultiplayerState,
          multiplayerStateRef.current,
          alpha
        );
        rendererRef.current.render({
          players: interpolatedPlayers,
          food: multiplayerStateRef.current.food,
          gridSize: multiplayerStateRef.current.gridSize || 20,
          activePlayerId: socket.getId(),
        });
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isMultiplayer, socket, previousMultiplayerState, interpolatePlayers]);

  const handleRestart = () => {
    if (isMultiplayer) return;
    restartGame();
  };

  const handleStop = () => {
    if (!isMultiplayer) {
      stopGame();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  };

  const multiplayerPlayers = multiplayerState
    ? Object.values(multiplayerState.players || {}).map((p) => ({
        ...p,
        isMe: p.id === socket.getId(),
      }))
    : [];

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleStartMultiplayer = () => {
    if (!roomCode) return;
    socket.startMultiplayerGame(roomCode);
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
            score={isMultiplayer ? (multiplayerPlayers.find((p) => p.id === socket.getId())?.score || 0) : score}
            highScore={highScore}
            status={isMultiplayer ? (gameStarted ? GAME_STATUS.PLAYING : GAME_STATUS.WAITING) : status}
            mode={mode}
            playerName={user?.name?.split(' ')[0] || 'Player'}
            roomCode={roomCode}
            players={isMultiplayer ? multiplayerPlayers : []}
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
          {!isMultiplayer && isIdle && !gameState && (
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
          {isMultiplayer && !gameStarted && (
            <div
              className="absolute inset-0 flex items-center justify-center z-30"
              style={{ background: 'rgba(5, 10, 14, 0.75)' }}
            >
              <div className="text-center">
                {isHost && (
                  <button onClick={handleStartMultiplayer} className="btn-filled mb-4 px-6 py-3 text-sm">
                    START GAME
                  </button>
                )}
                <p
                  className="text-sm tracking-[0.2em] animate-pulse"
                  style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
                >
                  {isHost ? "CLICK START TO BEGIN" : "WAITING FOR HOST..."}
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
              <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent)' }}>
                {isMultiplayer ? (multiplayerPlayers.find((p) => p.id === socket.getId())?.score || 0) : score}
              </span>
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
              color: (isMultiplayer ? gameStarted : status === GAME_STATUS.PLAYING) ? 'var(--color-accent)' : 'var(--color-warning)',
              background: (isMultiplayer ? gameStarted : status === GAME_STATUS.PLAYING) ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 183, 0, 0.1)',
              border: `1px solid ${(isMultiplayer ? gameStarted : status === GAME_STATUS.PLAYING) ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 183, 0, 0.2)'}`,
            }}
          >
            {mode.toUpperCase()}
          </span>
          {!isMultiplayer && (
            <button onClick={handleStop} className="btn-neon px-3 py-2 text-xs">
              <span className="relative z-10">STOP</span>
            </button>
          )}
        </div>

        <div className="lg:hidden fixed right-4 bottom-20 z-40" id="mobile-dpad">
          <div className="grid grid-cols-3 gap-2 w-36">
            <span />
            <button className="mobile-pad-btn" onTouchStart={() => sendDirection("UP")} onClick={() => sendDirection("UP")}>▲</button>
            <span />
            <button className="mobile-pad-btn" onTouchStart={() => sendDirection("LEFT")} onClick={() => sendDirection("LEFT")}>◀</button>
            <button className="mobile-pad-btn" onTouchStart={() => sendDirection("DOWN")} onClick={() => sendDirection("DOWN")}>▼</button>
            <button className="mobile-pad-btn" onTouchStart={() => sendDirection("RIGHT")} onClick={() => sendDirection("RIGHT")}>▶</button>
          </div>
        </div>
      </div>

      {import.meta.env.DEV && isMultiplayer && (
        <div className="fixed right-3 bottom-3 z-50 glass-card px-3 py-2 text-xs font-mono">
          <div>FPS: {fps}</div>
          <div>Ping: {ping ?? "-"} ms</div>
          <div>Tick: {serverTickRate ?? "-"} ms</div>
          <div>Players: {multiplayerPlayers.length}</div>
          <div>Room: {roomCode}</div>
        </div>
      )}

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

      {gameOverResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="glass-card p-6 text-center max-w-sm w-[92%]">
            <h2 className="text-2xl mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent2)' }}>
              {gameOverResult.title}
            </h2>
            <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {gameOverResult.winner === socket.getId() ? "You Win!" : "You Lost"}
            </p>
            <button className="btn-filled px-5 py-2 text-sm" onClick={() => setGameOverResult(null)}>
              CLOSE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
