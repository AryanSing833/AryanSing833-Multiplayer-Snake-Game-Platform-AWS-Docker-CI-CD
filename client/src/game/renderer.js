/**
 * Game Renderer
 * 
 * Handles all Canvas 2D rendering for the snake game.
 * Completely decoupled from game logic — receives state and renders it.
 */

export class GameRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - The canvas element to render on
   * @param {object} options
   * @param {number} options.gridSize - Size of the grid
   * @param {string} options.playerColor - Primary snake color
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.gridSize = options.gridSize || 20;
    this.playerColor = options.playerColor || '#00ff88';
    this.cellSize = 0;
    this.animationFrame = null;
    this.pulsePhase = 0;
    this.particles = [];
    this.lastFoodIds = new Set();

    // Start pulse animation
    this._startPulseAnimation();
  }

  /**
   * Resize canvas to fit the container while keeping cells square
   * @param {HTMLElement} container - Container element to fit within
   */
  resize(container) {
    if (!container) return;

    const padding = 6; // border padding
    const availW = container.clientWidth - padding;
    const availH = container.clientHeight - padding;
    const size = Math.floor(Math.min(availW, availH) / this.gridSize) * this.gridSize;

    this.canvas.width = size;
    this.canvas.height = size;
    this.cellSize = size / this.gridSize;
  }

  /**
   * Update grid size (e.g., when switching modes)
   * @param {number} gridSize
   */
  setGridSize(gridSize) {
    this.gridSize = gridSize;
  }

  /**
   * Render a complete frame from game state
   * @param {object} state - Game state from SnakeEngine.getState()
   */
  render(state) {
    if (!state) return;

    const { snake, food, direction, playerColor, gridSize, players, activePlayerId } = state;
    const W = this.canvas.width;
    const H = this.canvas.height;

    if (W === 0 || H === 0) return;

    this.gridSize = gridSize || this.gridSize;
    this.cellSize = W / this.gridSize;
    this.playerColor = playerColor || this.playerColor;

    // Clear
    this.ctx.clearRect(0, 0, W, H);

    // Background
    this._renderBackground(W, H);

    // Grid lines
    this._renderGrid(W, H);

    // Food
    food.forEach(f => this._renderFood(f.x, f.y));
    this._emitFoodParticles(food);
    this._renderParticles();

    if (players && Object.keys(players).length > 0) {
      Object.values(players).forEach((player) => {
        if (player.snake && player.snake.length > 0) {
          const originalColor = this.playerColor;
          this.playerColor = player.color || originalColor;
          this._renderSnake(player.snake, player.direction || 'RIGHT', player.id === activePlayerId);
          this.playerColor = originalColor;
        }
      });
      return;
    }

    // Single snake fallback
    if (snake && snake.length > 0) {
      this._renderSnake(snake, direction, true);
    }
  }

  /**
   * Render an empty grid (for waiting states, etc.)
   */
  renderEmpty() {
    const W = this.canvas.width;
    const H = this.canvas.height;
    if (W === 0 || H === 0) return;

    this.ctx.clearRect(0, 0, W, H);
    this._renderBackground(W, H);
    this._renderGrid(W, H);
  }

  /**
   * Clean up animation frame
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  // ── Private Rendering Methods ──────────────────────────────

  _startPulseAnimation() {
    const animate = () => {
      this.pulsePhase = (this.pulsePhase + 0.03) % (Math.PI * 2);
      this.animationFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  _renderBackground(W, H) {
    // Dark background with subtle gradient
    const grad = this.ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
    grad.addColorStop(0, '#0a1015');
    grad.addColorStop(1, '#050a0e');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, W, H);
  }

  _renderGrid(W, H) {
    this.ctx.strokeStyle = 'rgba(26, 48, 64, 0.4)';
    this.ctx.lineWidth = 0.5;

    for (let i = 0; i <= this.gridSize; i++) {
      const pos = i * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(pos, 0);
      this.ctx.lineTo(pos, H);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(0, pos);
      this.ctx.lineTo(W, pos);
      this.ctx.stroke();
    }
  }

  _renderFood(gx, gy) {
    const cs = this.cellSize;
    const cx = gx * cs + cs / 2;
    const cy = gy * cs + cs / 2;
    const r = cs * 0.3;

    // Pulse effect
    const pulse = 0.85 + 0.15 * Math.sin(this.pulsePhase * 2);
    const glowR = r * 2.5 * pulse;

    // Outer glow
    const grd = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    grd.addColorStop(0, 'rgba(255, 200, 0, 0.5)');
    grd.addColorStop(0.4, 'rgba(255, 140, 0, 0.2)');
    grd.addColorStop(1, 'transparent');
    this.ctx.fillStyle = grd;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, glowR, 0, Math.PI * 2);
    this.ctx.fill();

    // Core
    this.ctx.fillStyle = '#ffcc00';
    this.ctx.shadowColor = '#ffaa00';
    this.ctx.shadowBlur = 10 * pulse;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
  }

  _renderSnake(snake, direction, isActivePlayer = false) {
    const cs = this.cellSize;
    const color = this.playerColor;
    const len = snake.length;
    const dirKey = this._resolveDirectionKey(direction);

    snake.forEach((seg, idx) => {
      const px = seg.x * cs;
      const py = seg.y * cs;
      const pad = 1.5;
      const isHead = idx === 0;

      // Glow for head
      if (isHead) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = isActivePlayer ? 24 : 16;
      } else {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 4;
      }

      // Gradient fade from head to tail
      const tailFade = 0.4 + 0.6 * (1 - idx / len);
      this.ctx.globalAlpha = tailFade;
      this.ctx.fillStyle = color;

      if (isHead) {
        this.ctx.globalAlpha = 1;
        this._roundRect(px + pad, py + pad, cs - pad * 2, cs - pad * 2, 5);
        this.ctx.fill();

        // Eyes
        this._renderEyes(seg, dirKey, cs);
      } else {
        // Body segment with slight rounding
        this._roundRect(px + pad, py + pad, cs - pad * 2, cs - pad * 2, 2);
        this.ctx.fill();
      }

      this.ctx.shadowBlur = 0;
      this.ctx.globalAlpha = 1;
    });
  }

  _renderEyes(head, dir, cs) {
    const hx = head.x * cs;
    const hy = head.y * cs;
    const mid = cs / 2;
    const eyeR = cs * 0.1;
    const eyeOff = cs * 0.22;

    const positions = {
      UP:    [{ x: hx + mid - eyeOff, y: hy + eyeOff * 0.9 }, { x: hx + mid + eyeOff, y: hy + eyeOff * 0.9 }],
      DOWN:  [{ x: hx + mid - eyeOff, y: hy + cs - eyeOff * 0.9 }, { x: hx + mid + eyeOff, y: hy + cs - eyeOff * 0.9 }],
      LEFT:  [{ x: hx + eyeOff * 0.9, y: hy + mid - eyeOff }, { x: hx + eyeOff * 0.9, y: hy + mid + eyeOff }],
      RIGHT: [{ x: hx + cs - eyeOff * 0.9, y: hy + mid - eyeOff }, { x: hx + cs - eyeOff * 0.9, y: hy + mid + eyeOff }],
    };

    const eyes = positions[dir] || positions.RIGHT;

    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;

    eyes.forEach(e => {
      // White of eye
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, eyeR, 0, Math.PI * 2);
      this.ctx.fill();

      // Pupil
      this.ctx.fillStyle = '#000000';
      this.ctx.beginPath();
      this.ctx.arc(e.x, e.y, eyeR * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  _resolveDirectionKey(direction) {
    if (typeof direction === "string") return direction;
    if (!direction) return "RIGHT";
    if (direction.x === 1 && direction.y === 0) return "RIGHT";
    if (direction.x === -1 && direction.y === 0) return "LEFT";
    if (direction.x === 0 && direction.y === -1) return "UP";
    if (direction.x === 0 && direction.y === 1) return "DOWN";
    return "RIGHT";
  }

  _emitFoodParticles(food) {
    const currentIds = new Set(food.map((f) => f.id));
    this.lastFoodIds.forEach((id) => {
      if (!currentIds.has(id)) {
        const pos = this._lastFoodMap?.get(id);
        if (pos) {
          for (let i = 0; i < 10; i++) {
            this.particles.push({
              x: (pos.x + 0.5) * this.cellSize,
              y: (pos.y + 0.5) * this.cellSize,
              vx: (Math.random() - 0.5) * 2.6,
              vy: (Math.random() - 0.5) * 2.6,
              life: 18 + Math.floor(Math.random() * 10),
            });
          }
        }
      }
    });
    this._lastFoodMap = new Map(food.map((f) => [f.id, f]));
    this.lastFoodIds = currentIds;
  }

  _renderParticles() {
    const next = [];
    this.particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1;
      if (p.life > 0) {
        const alpha = p.life / 28;
        this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        next.push(p);
      }
    });
    this.particles = next;
  }

  _roundRect(x, y, w, h, r) {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }
}
