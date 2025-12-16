/**
 * Enemy Configuration System
 * All stats are defined as ratios that can be adjusted globally
 * Base values serve as reference points (1.0 = base value)
 * 
 * Pokemon definitions are now centralized in pokemonConfig.js
 * This file provides enemy-specific utilities and base values
 */

import {
  POKEMON_CONFIG,
  getPokemonEnemyConfig,
} from "../config/pokemonConfig.js";

const BASE_VALUES = {
  health: 20,
  speed: 100,
  damage: 10,
  radius: 12,
  xp: 1,
};

/**
 * Build ENEMY_CONFIG from pokemon definitions
 * Only includes pokemon that are spawnable as enemies (ratio > 0)
 */
export const ENEMY_CONFIG = {};

Object.entries(POKEMON_CONFIG).forEach(([key, pokemonDef]) => {
  const enemyConfig = pokemonDef.enemy;
    ENEMY_CONFIG[key] = {
      name: pokemonDef.name,
      type: enemyConfig.type,
      spriteName: pokemonDef.spriteName,
      scale: pokemonDef.scale,
      stats: enemyConfig.stats,
      lootTable: enemyConfig.lootTable,
      ...(enemyConfig.ranged && { ranged: enemyConfig.ranged }),
    };
});

/**
 * Get computed stats for an enemy type
 * @param {string} type - Enemy type key
 * @returns {Object} Computed stats with actual values
 */
export function getEnemyStats(type) {
  const config = ENEMY_CONFIG[type];
  if (!config) {
    console.warn(`Unknown enemy type: ${type}, using ratata`);
    return getEnemyStats("ratata");
  }

  const stats = config.stats;
  return {
    maxHealth: Math.round(BASE_VALUES.health * stats.health),
    speed: BASE_VALUES.speed * stats.speed,
    damage: BASE_VALUES.damage * stats.damage,
    radius: BASE_VALUES.radius * stats.radius,
    xp: Math.round(BASE_VALUES.xp * stats.xp),
    color: getEnemyColor(type),
    outlineColor: getEnemyOutlineColor(type),
  };
}

/**
 * Get color for enemy type
 * @param {string} type - Enemy type
 * @returns {string} Hex color
 */
function getEnemyColor(type) {
  const colors = {
    ratata: "#F44336",
    fast: "#FF9800",
    tank: "#9C27B0",
    shooter: "#2196F3",
  };
  return colors[type] || "#F44336";
}

/**
 * Get outline color for enemy type
 * @param {string} type - Enemy type
 * @returns {string} Hex color
 */
function getEnemyOutlineColor(type) {
  const colors = {
    ratata: "#C62828",
    fast: "#E65100",
    tank: "#6A1B9A",
    shooter: "#1565C0",
  };
  return colors[type] || "#C62828";
}

/**
 * Get a random enemy type based on configured ratios
 * @returns {string} Enemy type key
 */
export function getRandomEnemyType() {
  const entries = Object.entries(ENEMY_CONFIG);
  const totalRatio = entries.reduce(
    (sum, [_, config]) => sum + config.ratio,
    0
  );

  let rand = Math.random() * totalRatio;

  for (const [type, config] of entries) {
    rand -= config.ratio;
    if (rand <= 0) {
      return type;
    }
  }

  return "ratata"; // Fallback
}

/**
 * Get sprite config for enemy type
 * @param {string} type - Enemy type
 * @returns {Object} Sprite configuration with scale
 */
export function getEnemySpriteConfig(type) {
  const config = ENEMY_CONFIG[type];
  if (!config) return null;

  return {
    spriteName: config.spriteName,
    scale: config.scale,
  };
}

/**
 * Get ranged config for enemy type (if applicable)
 * @param {string} type - Enemy type
 * @returns {Object|null} Ranged configuration or null if melee
 */
export function getEnemyRangedConfig(type) {
  const config = ENEMY_CONFIG[type];
  if (!config || config.type !== "ranged") return null;
  return config.ranged;
}

/**
 * Check if enemy type is ranged
 * @param {string} type - Enemy type
 * @returns {boolean} True if ranged
 */
export function isEnemyRanged(type) {
  const config = ENEMY_CONFIG[type];
  return config && config.type === "ranged";
}

/**
 * Get enemy name
 * @param {string} type - Enemy type
 * @returns {string} Enemy name
 */
export function getEnemyName(type) {
  const config = ENEMY_CONFIG[type];
  return config ? config.name : "Unknown";
}
