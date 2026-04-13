/**
 * Room Page
 * 
 * Lobby for multiplayer games.
 * Host: Shows room code, waits for players, can start game.
 * Guest: Shows waiting state until game starts.
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { useSocket } from '../hooks/useSocket';

export default function RoomPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [copied, setCopied] = useState(false);
  const [players, setPlayers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [joined, setJoined] = useState(false);
  const { connected, socket } = useSocket({ autoConnect: true });

  const copyCode = async (roomCode) => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = roomCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  // Join room and sync full room user list from backend
  useEffect(() => {
    if (!connected || !code) return;

    socket.joinRoom(code);
    socket.onRoomUsers(({ users, hostId }) => {
      setJoined(true);
      setIsHost(socket.getId() === hostId);
      setPlayers(
        users.map((id, index) => ({
          id,
          name: id === socket.getId() ? (user?.name || 'You') : `Player ${id.slice(0, 4).toUpperCase()}`,
          avatar: id === socket.getId() ? user?.photoURL : null,
          isHost: id === hostId,
          isReady: true,
        }))
      );
    });
    socket.onGameStarted(() => {
      navigate(`/game?mode=multiplayer&room=${code}`);
    });
    socket.onRoomFull(() => {
      alert("Room is full");
      navigate("/dashboard");
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [connected, code, socket, user, navigate]);

  const handleCopyCode = async () => {
    await copyCode(code);
    alert("Copied!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartGame = () => {
    socket.startMultiplayerGame(code);
  };

  const handleJoinGame = () => {
    if (!joined) return;
    navigate(`/game?mode=multiplayer&room=${code}`);
  };

  const handleLeave = () => {
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `
          radial-gradient(ellipse at 50% 30%, rgba(0, 204, 255, 0.05) 0%, transparent 50%),
          var(--color-bg-primary)
        `,
      }}
      id="room-page"
    >
      <div className="absolute inset-0 bg-grid opacity-20" aria-hidden="true" />

      <Navbar />

      <main className="relative z-10 pt-20 pb-10 px-4 sm:px-6 max-w-lg mx-auto flex flex-col items-center gap-8">
        {/* Room Header */}
        <motion.div
          className="text-center animate-slide-up"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1
            className="text-2xl font-bold tracking-[0.1em] mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-bright)' }}
          >
            {isHost ? 'YOUR ROOM' : 'JOINING ROOM'}
          </h1>
          <p
            className="text-xs tracking-[0.2em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            {isHost ? 'SHARE THE CODE WITH FRIENDS' : 'WAITING FOR HOST TO START'}
          </p>
        </motion.div>

        {/* Room Code Display */}
        <div
          className="glass-card w-full p-6 flex flex-col items-center gap-4 animate-slide-up stagger-1"
          style={{
            borderColor: 'var(--color-accent2)',
            boxShadow: '0 0 40px rgba(0, 204, 255, 0.1)',
          }}
        >
          <p
            className="text-xs tracking-[0.2em]"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
          >
            ROOM CODE
          </p>

          {/* Code Display */}
          <div className="flex items-center gap-3">
            <div
              className="flex gap-1.5"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {code.split('').map((char, idx) => (
                <span
                  key={idx}
                  className="w-11 h-14 flex items-center justify-center text-2xl font-black rounded-lg"
                  style={{
                    background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-accent2)',
                    textShadow: '0 0 10px rgba(0, 204, 255, 0.5)',
                    animationDelay: `${idx * 0.05}s`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* Copy Button */}
          <motion.button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer"
            whileHover={{ scale: 1.05 }}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              letterSpacing: '0.15em',
              background: copied ? 'rgba(0, 255, 136, 0.1)' : 'var(--color-bg-secondary)',
              border: `1px solid ${copied ? 'var(--color-accent)' : 'var(--color-border)'}`,
              color: copied ? 'var(--color-accent)' : 'var(--color-text-dim)',
            }}
            id="copy-code-btn"
          >
            {copied ? '✓ COPIED!' : '📋 COPY CODE'}
          </motion.button>
        </div>

        {/* Players List */}
        <div
          className="glass-card w-full p-5 flex flex-col gap-3 animate-slide-up stagger-2"
        >
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <h3
              className="text-xs font-bold tracking-[0.25em]"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-accent2)' }}
            >
              PLAYERS
            </h3>
            <span
              className="text-xs"
              style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
            >
              {players.length}/4
            </span>
          </div>

          {/* Player Entries */}
          {players.map((player) => (
            <motion.div
              key={player.id}
              className="flex items-center gap-3 py-2 px-3 rounded-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ background: 'rgba(0, 204, 255, 0.03)' }}
            >
              {player.avatar ? (
                <img
                  src={player.avatar}
                  alt={player.name}
                  className="w-8 h-8 rounded-full border border-[var(--color-border)]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-accent)',
                    fontFamily: 'var(--font-display)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  {player.name.charAt(0)}
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                  {player.name}
                </p>
                <p className="text-xs" style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}>
                  {player.isHost ? '👑 HOST' : 'PLAYER'}
                </p>
              </div>
              <span
                className="text-xs px-2 py-1 rounded"
                style={{
                  fontFamily: 'var(--font-mono)',
                  background: player.isReady ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 183, 0, 0.1)',
                  color: player.isReady ? 'var(--color-accent)' : 'var(--color-warning)',
                  border: `1px solid ${player.isReady ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 183, 0, 0.2)'}`,
                }}
              >
                {player.isReady ? 'READY' : 'WAITING'}
              </span>
            </motion.div>
          ))}

          {/* Waiting indicator */}
          {players.length < 2 && (
            <div className="flex items-center justify-center gap-3 py-4">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: 'var(--color-accent2)', boxShadow: '0 0 8px var(--color-accent2)' }}
              />
              <span
                className="text-xs tracking-[0.2em]"
                style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-dim)' }}
              >
                WAITING FOR PLAYERS...
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full animate-slide-up stagger-3">
          {joined && (
            <motion.button
              onClick={handleJoinGame}
              className="btn-neon w-full py-3 text-sm"
              whileHover={{ scale: 1.05 }}
              id="join-game-btn"
            >
              <span className="relative z-10">JOIN GAME</span>
            </motion.button>
          )}
          {isHost && (
            <motion.button
              onClick={handleStartGame}
              className="btn-filled w-full py-3.5 text-sm"
              whileHover={{ scale: 1.05 }}
              id="start-game-btn"
            >
              ▶ START GAME
            </motion.button>
          )}
          <motion.button
            onClick={handleLeave}
            className="btn-neon w-full py-3 text-sm"
            whileHover={{ scale: 1.05 }}
            id="leave-room-btn"
          >
            <span className="relative z-10">← LEAVE ROOM</span>
          </motion.button>
        </div>
      </main>
    </div>
  );
}
