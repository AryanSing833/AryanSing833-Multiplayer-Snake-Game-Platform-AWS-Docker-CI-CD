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

    const { snake, food, direction, playerColor, gridSize } = state;
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

    // Snake
    if (snake && snake.length > 0) {
      this._renderSnake(snake, direction);
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

  _renderSnake(snake, direction) {
    const cs = this.cellSize;
    const color = this.playerColor;
    const len = snake.length;

    snake.forEach((seg, idx) => {
      const px = seg.x * cs;
      const py = seg.y * cs;
      const pad = 1.5;
      const isHead = idx === 0;

      // Glow for head
      if (isHead) {
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 16;
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
        this._renderEyes(seg, direction, cs);
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
