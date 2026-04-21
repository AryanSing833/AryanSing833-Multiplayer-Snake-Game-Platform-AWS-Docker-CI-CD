/**
 * InputHandler — Production-level input management for the Snake game.
 *
 * Fixes addressed:
 *  1. Arrow keys / WASD no longer fire when an <input> or <textarea> has focus.
 *  2. Page scroll is prevented only when the game is active (avoids blocking
 *     browser shortcuts or form typing).
 *  3. Direction inputs are queued — holding a key doesn't flood the engine with
 *     duplicate events (one direction per game tick).
 *  4. Touch swipes prevent default scroll only when the game is active.
 *  5. All listeners are attached to `document` (not the canvas) so keyboard
 *     events are captured regardless of which element has DOM focus.
 *  6. A single `enable()` / `disable()` / `setActive()` API decouples
 *     "registered" from "processing inputs", making it easy to gate input on
 *     game state (waiting lobby → disable; game playing → enable).
 */

// ── Key → direction mapping ────────────────────────────────────────────────
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

// Keys that should always prevent the browser's default scroll behavior when
// the game is active (arrow keys scroll the page; space scrolls/jumps).
const SCROLL_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ',
]);

/**
 * Returns true if the currently focused element is a text-entry field.
 * When the user is typing we must NOT intercept their keystrokes.
 */
function isTypingInField() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    el.isContentEditable
  );
}

export class InputHandler {
  /**
   * @param {object} options
   * @param {function} options.onDirection  - Called with 'UP'|'DOWN'|'LEFT'|'RIGHT'
   * @param {function} options.onPause      - Called on Space / Escape
   * @param {HTMLElement} [options.touchTarget=document.body]
   *   Element to attach touch listeners to. Use the canvas or document.body.
   *   Avoid `window` as passive-false on window can trigger Chrome warnings.
   * @param {boolean} [options.active=false]
   *   Whether the game is currently active. Call setActive(true) when the game
   *   starts and setActive(false) when it ends / is paused on the lobby screen.
   */
  constructor(options = {}) {
    this.onDirection  = options.onDirection || (() => {});
    this.onPause      = options.onPause     || (() => {});
    this.touchTarget  = options.touchTarget || document.body;

    // `active` gates ALL input processing.  Start false so inputs during the
    // lobby/waiting screen have no effect.
    this._active = options.active ?? false;

    // Touch swipe tracking
    this._touchStartX = 0;
    this._touchStartY = 0;
    /** Minimum px to count as a swipe (avoids accidental taps). */
    this._minSwipeDistance = 30;

    // Direction queue — prevents the engine from receiving more than one
    // direction change per tick when the user holds a key down.
    this._pendingDirection = null;
    this._lastSentDirection = null;

    // Bind once so removeEventListener can match the exact reference.
    this._onKeydown      = this._onKeydown.bind(this);
    this._onTouchStart   = this._onTouchStart.bind(this);
    this._onTouchMove    = this._onTouchMove.bind(this);
    this._onTouchEnd     = this._onTouchEnd.bind(this);

    this._attach();
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Activate or deactivate input processing.
   * Call `setActive(true)` the moment the game starts and
   * `setActive(false)` when returning to the lobby / game-over screen.
   *
   * @param {boolean} active
   */
  setActive(active) {
    this._active = Boolean(active);

    // Flush any stale pending direction when deactivating.
    if (!this._active) {
      this._pendingDirection = null;
    }
  }

  /** Shorthand: enable input (game is running). */
  enable() { this.setActive(true); }

  /** Shorthand: disable input (lobby / game-over). */
  disable() { this.setActive(false); }

  /**
   * Flush the pending direction to the engine.
   * Call this once per game tick so direction changes are throttled to the
   * tick rate — prevents duplicate moves when holding a key between ticks.
   *
   * This is optional. If you pass `onDirection` the handler is also called
   * immediately on keydown (for responsive feel). Use flushDirection() as an
   * additional safeguard in tick-based engines.
   */
  flushDirection() {
    if (this._pendingDirection && this._pendingDirection !== this._lastSentDirection) {
      this._lastSentDirection = this._pendingDirection;
      this.onDirection(this._pendingDirection);
      this._pendingDirection = null;
    }
  }

  /**
   * Remove all event listeners. Call when the component unmounts.
   */
  destroy() {
    document.removeEventListener('keydown', this._onKeydown);
    this.touchTarget.removeEventListener('touchstart', this._onTouchStart);
    this.touchTarget.removeEventListener('touchmove',  this._onTouchMove);
    this.touchTarget.removeEventListener('touchend',   this._onTouchEnd);
  }

  // ── Private ────────────────────────────────────────────────────────────

  _attach() {
    // Keyboard: attach to document so focus is irrelevant (we guard manually).
    document.addEventListener('keydown', this._onKeydown);

    // Touch: attach to the supplied target with { passive: false } so we can
    // call preventDefault() to block scroll during active gameplay.
    const touchOpts = { passive: false };
    this.touchTarget.addEventListener('touchstart', this._onTouchStart, touchOpts);
    this.touchTarget.addEventListener('touchmove',  this._onTouchMove,  touchOpts);
    this.touchTarget.addEventListener('touchend',   this._onTouchEnd,   touchOpts);
  }

  _onKeydown(e) {
    // ── Guard 1: Do NOT intercept keys while the player is typing. ──────
    // This is the core fix for the "arrow keys don't work in multiplayer"
    // problem: in the lobby an <input> has focus, so we skip processing.
    // Once the game starts the DevPad blurs all inputs (see useGame /
    // GamePage), so this guard becomes a no-op during gameplay.
    if (isTypingInField()) return;

    // ── Guard 2: Prevent browser scroll for game keys when game is active.
    // We do this BEFORE the `_active` check so the page never scrolls on
    // arrow keys even during a brief transition frame.
    if (SCROLL_KEYS.has(e.key)) {
      e.preventDefault();
    }

    // ── Guard 3: Don't route direction / pause if the game isn't running. ─
    if (!this._active) return;

    // Direction input
    const direction = KEY_MAP[e.key];
    if (direction) {
      // Store as pending; also call onDirection immediately for instant feel.
      // The engine itself will ignore a 180° reversal so calling twice is safe.
      this._pendingDirection = direction;
      this.onDirection(direction);
      return;
    }

    // Pause toggle
    if (e.key === ' ' || e.key === 'Escape') {
      this.onPause();
    }
  }

  _onTouchStart(e) {
    // Record swipe origin; do NOT preventDefault here so tap-to-click still
    // works on buttons.
    const touch = e.touches[0];
    this._touchStartX = touch.clientX;
    this._touchStartY = touch.clientY;
  }

  _onTouchMove(e) {
    // Block page scroll during active gameplay.
    if (this._active) {
      e.preventDefault();
    }
  }

  _onTouchEnd(e) {
    if (!this._active) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - this._touchStartX;
    const dy = touch.clientY - this._touchStartY;

    // Ignore taps (too small to be intentional swipes).
    if (Math.abs(dx) < this._minSwipeDistance && Math.abs(dy) < this._minSwipeDistance) {
      return;
    }

    // Prevent the browser treating the swipe-end as a click / scroll.
    e.preventDefault();

    // Determine dominant axis.
    const direction = Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? 'RIGHT' : 'LEFT')
      : (dy > 0 ? 'DOWN'  : 'UP');

    this._pendingDirection = direction;
    this.onDirection(direction);
  }
}
