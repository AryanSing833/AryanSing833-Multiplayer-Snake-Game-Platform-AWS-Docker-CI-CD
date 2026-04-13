/**
 * Game Mode Definitions
 * 
 * Each mode defines its configuration, rules, and metadata.
 * New modes (like Antigravity) can be added without modifying existing code.
 */

export const GAME_MODES = {
  CLASSIC: 'classic',
  MULTIPLAYER: 'multiplayer',
  ANTIGRAVITY: 'antigravity',
};

export const MODE_CONFIGS = {
  [GAME_MODES.CLASSIC]: {
    name: 'Classic',
    description: 'The original snake experience. Eat food, grow longer, don\'t hit walls.',
    gridSize: 20,
    tickRate: 130,       // ms per tick — lower = faster
    initialSpeed: 130,
    speedIncrement: 2,   // ms to subtract per food eaten
    minSpeed: 50,
    walls: true,         // death on wall collision
    selfCollision: true,
    foodCount: 1,
    initialLength: 3,
    scorePerFood: 10,
    icon: '🎮',
    color: '#00ff88',
  },

  [GAME_MODES.MULTIPLAYER]: {
    name: 'Multiplayer',
    description: 'Compete against other players in real-time. Last snake standing wins.',
    gridSize: 25,
    tickRate: 100,
    initialSpeed: 100,
    speedIncrement: 0,   // constant speed in multiplayer
    minSpeed: 100,
    walls: true,
    selfCollision: true,
    foodCount: 5,
    initialLength: 3,
    scorePerFood: 10,
    icon: '👥',
    color: '#00ccff',
  },

  [GAME_MODES.ANTIGRAVITY]: {
    name: 'Antigravity',
    description: 'Walls wrap around. Gravity pulls your snake down. Master the chaos.',
    gridSize: 20,
    tickRate: 110,
    initialSpeed: 110,
    speedIncrement: 1,
    minSpeed: 60,
    walls: false,        // walls wrap around
    selfCollision: true,
    foodCount: 3,
    initialLength: 3,
    scorePerFood: 15,
    gravity: true,       // future: downward pull mechanic
    icon: '🌀',
    color: '#cc44ff',
  },
};

/**
 * Get the configuration for a specific game mode
 * @param {string} mode - One of GAME_MODES values
 * @returns {object} Mode configuration
 */
export function getModeConfig(mode) {
  return MODE_CONFIGS[mode] || MODE_CONFIGS[GAME_MODES.CLASSIC];
}

/**
 * Get all available modes as an array for UI rendering
 * @returns {Array<{key: string, ...config}>}
 */
export function getAllModes() {
  return Object.entries(MODE_CONFIGS).map(([key, config]) => ({
    key,
    ...config,
  }));
}
