/**
 * Playable Characters Configuration
 * All stats are defined as ratios that can be adjusted globally
 * Base values serve as reference points (1.0 = base value)
 */

const BASE_VALUES = {
  health: 100,
  speed: 350,
  damage: 15,
  radius: 30,
  attackSpeed: 1.0,
};

/**
 * Playable character configuration
 * spriteName: nom de la spritesheet à utiliser (doit correspondre à spriteConfig.js)
 * stats: all values are multipliers of BASE_VALUES
 * dominantColor: couleur dominante du personnage
 * projectileColor: couleur des projectiles du personnage
 */
export const PLAYER_CONFIG = {
  piplup: {
    name: "Piplup",
    spriteName: "piplup",
    scale: 2,
    stats: {
      health: 1.2,
      speed: 0.9,
      damage: 1.1,
      radius: 1.0,
      attackSpeed: 1.0,
    },
    range: 250, // portée de base pour Piplup
    dominantColor: "#4FC3F7",
    projectileColor: "#0288D1",
    projectileSize: 20,
    projectileSpeed: 500,
  },
  turtwig: {
    name: "Turtwig",
    spriteName: "turtwig",
    scale: 2,
    stats: {
      health: 1.6,
      speed: 0.5,
      damage: 1.1,
      radius: 1.2,
      attackSpeed: 0.8,
    },
    range: 300, // portée de base pour Turtwig
    dominantColor: "#4E944F",
    projectileColor: "#2E7D32",
    projectileSize: 14,
    projectileSpeed: 420,
  },
  chimchar: {
    name: "Chimchar",
    spriteName: "chimchar",
    scale: 2,
    stats: {
      health: 0.7,
      speed: 1.3,
      damage: 1.2,
      radius: 0.9,
      attackSpeed: 1.3,
    },
    range: 220, // portée de base pour Chimchar
    dominantColor: "#F57C00",
    projectileColor: "#E64A19",
    projectileSize: 10,
    projectileSpeed: 500,
  },
};

/**
 * Get computed stats for a player character
 * @param {string} type - Player character type key
 * @returns {Object} Computed stats with actual values
 */
export function getPlayerStats(type) {
  const config = PLAYER_CONFIG[type];
  if (!config) {
    console.warn(`Unknown player type: ${type}, using piplup`);
    return getPlayerStats("piplup");
  }

  const stats = config.stats;
  return {
    maxHealth: Math.round(BASE_VALUES.health * stats.health),
    speed: BASE_VALUES.speed * stats.speed,
    damage: BASE_VALUES.damage * stats.damage,
    radius: BASE_VALUES.radius * stats.radius,
    attackSpeed: BASE_VALUES.attackSpeed * stats.attackSpeed,
    dominantColor: config.dominantColor,
    projectileColor: config.projectileColor,
    projectileSize: config.projectileSize || 10,
    projectileSpeed: config.projectileSpeed || 500,
    range: config.range || 120, // valeur par défaut si non définie
  };
}

/**
 * Get player configuration by type
 * @param {string} type - Player character type
 * @returns {Object} Player configuration
 */
export function getPlayerConfig(type) {
  return PLAYER_CONFIG[type] || PLAYER_CONFIG.piplup;
}
