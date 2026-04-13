/**
 * Snake Game Engine
 * 
 * Core game logic, completely decoupled from React and the DOM.
 * Manages snake movement, collision detection, food spawning, and scoring.
 * Communicates state changes via callbacks.
 */

import { getModeConfig, GAME_MODES } from './modes';

// Direction vectors
const DIRECTIONS = {
  UP:    { x: 0,  y: -1 },
  DOWN:  { x: 0,  y: 1  },
  LEFT:  { x: -1, y: 0  },
  RIGHT: { x: 1,  y: 0  },
};

// Opposite direction map — prevents 180° reversal
const OPPOSITES = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

/**
 * Game status constants
 */
export const GAME_STATUS = {
  IDLE: 'idle',
  WAITING: 'waiting',
  PLAYING: 'playing',
  PAUSED: 'paused',
  GAME_OVER: 'game_over',
};

export class SnakeEngine {
  /**
   * @param {object} options
   * @param {string} options.mode - Game mode key from GAME_MODES
   * @param {string} options.playerName - Player display name
   * @param {string} options.playerColor - Snake color
   * @param {function} options.onStateChange - Callback when state updates
   * @param {function} options.onGameOver - Callback when game ends
   * @param {function} options.onScoreChange - Callback when score changes
   */
  constructor(options = {}) {
    const {
      mode = GAME_MODES.CLASSIC,
      playerName = 'Player',
      playerColor = '#00ff88',
      onStateChange = () => {},
      onGameOver = () => {},
      onScoreChange = () => {},
    } = options;

    this.mode = mode;
    this.config = getModeConfig(mode);
    this.playerName = playerName;
    this.playerColor = playerColor;

    // Callbacks
    this.onStateChange = onStateChange;
    this.onGameOver = onGameOver;
    this.onScoreChange = onScoreChange;

    // Internal state
    this.snake = [];
    this.food = [];
    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem(`snake_highscore_${mode}`) || '0', 10);
    this.status = GAME_STATUS.IDLE;
    this.tickInterval = null;
    this.currentSpeed = this.config.initialSpeed;
    this.tickCount = 0;

    this._init();
  }

  /**
   * Initialize / reset the game to starting state
   */
  _init() {
    const { gridSize, initialLength } = this.config;
    const startX = Math.floor(gridSize / 2);
    const startY = Math.floor(gridSize / 2);

    // Create initial snake body
    this.snake = [];
    for (let i = 0; i < initialLength; i++) {
      this.snake.push({ x: startX - i, y: startY });
    }

    this.direction = 'RIGHT';
    this.nextDirection = 'RIGHT';
    this.score = 0;
    this.currentSpeed = this.config.initialSpeed;
    this.tickCount = 0;
    this.food = [];
    this.status = GAME_STATUS.IDLE;

    // Spawn initial food
    this._replenishFood();

    this._emitState();
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.status === GAME_STATUS.PLAYING) return;

    this.status = GAME_STATUS.PLAYING;
    this._startLoop();
    this._emitState();
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.status !== GAME_STATUS.PLAYING) return;

    this.status = GAME_STATUS.PAUSED;
    this._stopLoop();
    this._emitState();
  }

  /**
   * Resume from pause
   */
  resume() {
    if (this.status !== GAME_STATUS.PAUSED) return;

    this.status = GAME_STATUS.PLAYING;
    this._startLoop();
    this._emitState();
  }

  /**
   * Toggle pause/resume
   */
  togglePause() {
    if (this.status === GAME_STATUS.PLAYING) {
      this.pause();
    } else if (this.status === GAME_STATUS.PAUSED) {
      this.resume();
    }
  }

  /**
   * Reset and restart the game
   */
  reset() {
    this._stopLoop();
    this._init();
  }

  /**
   * Restart (reset + start)
   */
  restart() {
    this.reset();
    this.start();
  }

  /**
   * Set the direction for the next tick
   * @param {string} direction - 'UP', 'DOWN', 'LEFT', or 'RIGHT'
   */
  setDirection(direction) {
    if (!DIRECTIONS[direction]) return;
    if (this.status !== GAME_STATUS.PLAYING) return;

    // Prevent 180° reversal
    if (direction === OPPOSITES[this.direction]) return;

    this.nextDirection = direction;
  }

  /**
   * Get the current game state (serializable)
   */
  getState() {
    return {
      snake: [...this.snake],
      food: [...this.food],
      direction: this.direction,
      score: this.score,
      highScore: this.highScore,
      status: this.status,
      gridSize: this.config.gridSize,
      mode: this.mode,
      playerName: this.playerName,
      playerColor: this.playerColor,
      tickCount: this.tickCount,
    };
  }

  /**
   * Clean up timers on destroy
   */
  destroy() {
    this._stopLoop();
    this.onStateChange = () => {};
    this.onGameOver = () => {};
    this.onScoreChange = () => {};
  }

  // ── Private Methods ─────────────────────────────────────────

  /**
   * Single game tick — advance state by one step
   */
  _tick() {
    if (this.status !== GAME_STATUS.PLAYING) return;

    this.tickCount++;

    // Apply queued direction
    if (this.nextDirection !== OPPOSITES[this.direction]) {
      this.direction = this.nextDirection;
    }

    const delta = DIRECTIONS[this.direction];
    const head = this.snake[0];

    // Calculate new head position
    let newHead = {
      x: head.x + delta.x,
      y: head.y + delta.y,
    };

    // Wall handling
    if (this.config.walls) {
      // Solid walls — game over on collision
      if (
        newHead.x < 0 || newHead.x >= this.config.gridSize ||
        newHead.y < 0 || newHead.y >= this.config.gridSize
      ) {
        this._gameOver();
        return;
      }
    } else {
      // Wrap-around walls
      newHead.x = ((newHead.x % this.config.gridSize) + this.config.gridSize) % this.config.gridSize;
      newHead.y = ((newHead.y % this.config.gridSize) + this.config.gridSize) % this.config.gridSize;
    }

    // Self collision (exclude tail tip since it will move this tick)
    if (this.config.selfCollision) {
      const bodyToCheck = this.snake.slice(0, -1);
      const selfHit = bodyToCheck.some(seg => seg.x === newHead.x && seg.y === newHead.y);
      if (selfHit) {
        this._gameOver();
        return;
      }
    }

    // Move snake
    this.snake.unshift(newHead);

    // Food consumption
    const foodIdx = this.food.findIndex(f => f.x === newHead.x && f.y === newHead.y);
    if (foodIdx !== -1) {
      this.food.splice(foodIdx, 1);
      this.score += this.config.scorePerFood;

      // Update high score
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem(`snake_highscore_${this.mode}`, this.highScore.toString());
      }

      // Speed up
      if (this.currentSpeed > this.config.minSpeed) {
        this.currentSpeed = Math.max(
          this.config.minSpeed,
          this.currentSpeed - this.config.speedIncrement
        );
        this._restartLoop();
      }

      this._replenishFood();
      this.onScoreChange(this.score, this.highScore);
    } else {
      this.snake.pop(); // Normal move — no growth
    }

    this._emitState();
  }

  /**
   * Handle game over
   */
  _gameOver() {
    this.status = GAME_STATUS.GAME_OVER;
    this._stopLoop();
    this._emitState();
    this.onGameOver({
      score: this.score,
      highScore: this.highScore,
      mode: this.mode,
      tickCount: this.tickCount,
    });
  }

  /**
   * Spawn food up to the configured count
   */
  _replenishFood() {
    while (this.food.length < this.config.foodCount) {
      this._spawnFood();
    }
  }

  /**
   * Spawn a single food item at an unoccupied cell
   */
  _spawnFood() {
    const { gridSize } = this.config;
    let attempts = 0;

    while (attempts < 200) {
      const x = Math.floor(Math.random() * gridSize);
      const y = Math.floor(Math.random() * gridSize);

      // Check not on snake
      const onSnake = this.snake.some(seg => seg.x === x && seg.y === y);
      // Check not on existing food
      const onFood = this.food.some(f => f.x === x && f.y === y);

      if (!onSnake && !onFood) {
        this.food.push({ x, y, id: `${Date.now()}-${Math.random()}` });
        return;
      }
      attempts++;
    }
  }

  /**
   * Start the game loop interval
   */
  _startLoop() {
    this._stopLoop();
    this.tickInterval = setInterval(() => this._tick(), this.currentSpeed);
  }

  /**
   * Stop the game loop interval
   */
  _stopLoop() {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
  }

  /**
   * Restart loop with current speed (after speed change)
   */
  _restartLoop() {
    if (this.status === GAME_STATUS.PLAYING) {
      this._startLoop();
    }
  }

  /**
   * Emit current state via callback
   */
  _emitState() {
    this.onStateChange(this.getState());
  }
}
