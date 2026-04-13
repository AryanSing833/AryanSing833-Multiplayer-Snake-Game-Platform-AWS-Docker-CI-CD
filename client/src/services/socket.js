/**
 * Socket Service
 * 
 * Manages Socket.IO client connection for multiplayer gameplay.
 * This is a PREPARATION layer — placeholder events are defined
 * but no backend is required yet.
 * 
 * Usage:
 *   const socket = new SocketService();
 *   socket.connect('http://localhost:3000');
 *   socket.createRoom({ name: 'Player1', avatar: '...' });
 */

import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
  }

  /**
   * Connect to the game server
   * @param {string} serverUrl - Server URL (defaults to env variable)
   */
  connect(serverUrl) {
    this.socket = io(window.location.origin, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[Socket] Connected:', this.socket.id);
      this._emit('connectionChange', { connected: true, id: this.socket.id });
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('[Socket] Disconnected:', reason);
      this._emit('connectionChange', { connected: false, reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this._emit('error', { type: 'connection', message: error.message });
    });

    return this;
  }

  /**
   * Disconnect from the server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Get socket ID
   */
  getId() {
    return this.socket?.id || null;
  }

  // ── Room Events (Placeholder) ─────────────────────────────

  /**
   * Create a new game room
   * @param {object} playerData - { name, avatar, mode }
   */
  createRoom(playerData) {
    if (!this.socket) return;
    this.socket.emit('createRoom', playerData);
  }

  /**
   * Join an existing room
   * @param {string} roomCode - 6-character room code
   * @param {object} playerData - { name, avatar }
   */
  joinRoom(roomCode) {
    if (!this.socket) return;
    const emitJoinRoom = () => {
      console.log("Joining room:", roomCode);
      this.socket.emit("join-room", roomCode);
    };

    if (this.socket.connected) {
      emitJoinRoom();
      return;
    }

    this.socket.once("connect", () => {
      console.log("Connected:", this.socket.id);
      emitJoinRoom();
    });
  }

  startMultiplayerGame(roomCode) {
    if (!this.socket) return;
    this.socket.emit("start-game", roomCode);
  }

  /**
   * Leave the current room
   */
  leaveRoom() {
    if (!this.socket) return;
    this.socket.emit('leaveRoom');
  }

  /**
   * Send direction input to server
   * @param {string} direction - 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
   */
  sendMove(direction) {
    if (!this.socket) return;
    this.socket.emit('move', direction);
  }

  // ── Event Listeners ────────────────────────────────────────

  onMultiplayerGameState(callback) {
    this._on("game-state", callback);
  }

  onGameStarted(callback) {
    this._on("game-started", callback);
  }

  onPong(callback) {
    this._on("pong-check", callback);
  }

  sendPing(clientTs) {
    if (!this.socket) return;
    this.socket.emit("ping-check", clientTs);
  }

  /**
   * Listen for room creation confirmation
   * @param {function} callback - Called with { roomCode, players }
   */
  onRoomCreated(callback) {
    this._on('roomCreated', callback);
  }

  /**
   * Listen for full room user list updates
   * @param {function} callback - Called with string[] of socket IDs
   */
  onRoomUsers(callback) {
    this._on("room-users", callback);
  }

  onRoomFull(callback) {
    this._on("room-full", callback);
  }

  /**
   * Listen for errors
   * @param {function} callback - Called with { type, message }
   */
  onError(callback) {
    this._on('error', callback);
  }

  /**
   * Listen for connection status changes
   * @param {function} callback - Called with { connected, id }
   */
  onConnectionChange(callback) {
    this.listeners.set('connectionChange', callback);
  }

  // ── Internal Helpers ───────────────────────────────────────

  _on(event, callback) {
    if (!this.socket) {
      // Store for later attachment
      this.listeners.set(event, callback);
      return;
    }
    this.socket.on(event, callback);
    this.listeners.set(event, callback);
  }

  _emit(event, data) {
    const callback = this.listeners.get(event);
    if (callback) callback(data);
  }

  /**
   * Remove all listeners and clean up
   */
  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((_, event) => {
        this.socket.off(event);
      });
    }
    this.listeners.clear();
  }
}

// Singleton instance
const socketService = new SocketService();
export default socketService;
