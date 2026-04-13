/**
 * Input Handler
 * 
 * Handles keyboard and touch input for the snake game.
 * Translates raw input events into direction commands.
 */

// Keyboard to direction mapping
const KEY_MAP = {
  ArrowUp:    'UP',
  ArrowDown:  'DOWN',
  ArrowLeft:  'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',    W: 'UP',
  s: 'DOWN',  S: 'DOWN',
  a: 'LEFT',  A: 'LEFT',
  d: 'RIGHT', D: 'RIGHT',
};

export class InputHandler {
  /**
   * @param {object} options
   * @param {function} options.onDirection - Callback when direction input is detected
   * @param {function} options.onPause - Callback for pause toggle (Space/Escape)
   * @param {HTMLElement} options.touchTarget - Element for touch input (default: document)
   */
  constructor(options = {}) {
    this.onDirection = options.onDirection || (() => {});
    this.onPause = options.onPause || (() => {});
    this.touchTarget = options.touchTarget || document;
    this.enabled = true;

    // Touch state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.minSwipeDistance = 30;

    // Bind handlers (for cleanup)
    this._handleKeydown = this._handleKeydown.bind(this);
    this._handleTouchStart = this._handleTouchStart.bind(this);
    this._handleTouchEnd = this._handleTouchEnd.bind(this);

    this._attach();
  }

  /**
   * Enable input handling
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable input handling
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Clean up event listeners
   */
  destroy() {
    document.removeEventListener('keydown', this._handleKeydown);
    this.touchTarget.removeEventListener('touchstart', this._handleTouchStart);
    this.touchTarget.removeEventListener('touchend', this._handleTouchEnd);
  }

  // ── Private ─────────────────────────────────────────────────

  _attach() {
    document.addEventListener('keydown', this._handleKeydown);
    this.touchTarget.addEventListener('touchstart', this._handleTouchStart, { passive: false });
    this.touchTarget.addEventListener('touchend', this._handleTouchEnd, { passive: false });
  }

  _handleKeydown(e) {
    if (!this.enabled) return;

    // Direction input
    const direction = KEY_MAP[e.key];
    if (direction) {
      e.preventDefault();
      this.onDirection(direction);
      return;
    }

    // Pause toggle
    if (e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      this.onPause();
    }
  }

  _handleTouchStart(e) {
    if (!this.enabled) return;
    const touch = e.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  }

  _handleTouchEnd(e) {
    if (!this.enabled) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.touchStartX;
    const dy = touch.clientY - this.touchStartY;

    // Minimum swipe distance
    if (Math.abs(dx) < this.minSwipeDistance && Math.abs(dy) < this.minSwipeDistance) {
      return;
    }

    // Determine dominant direction
    let direction;
    if (Math.abs(dx) > Math.abs(dy)) {
      direction = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      direction = dy > 0 ? 'DOWN' : 'UP';
    }

    this.onDirection(direction);
  }
}
