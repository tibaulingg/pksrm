/**
 * Playable Characters Configuration
 * All stats are defined as ratios that can be adjusted globally
 * Base values serve as reference points (1.0 = base value)
 * 
 * Pokemon definitions are now centralized in pokemonConfig.js
 * This file provides player-specific utilities and base values
 */

import {
  POKEMON_CONFIG,
  getPokemonPlayerConfig,
} from "../config/pokemonConfig.js";

const BASE_VALUES = {
  health: 50,
  speed: 350,
  radius: 15,
  damage: 10,
  attackSpeed: 0.3,
  critChance: 10, // % base chance
  critDamage: 2.0, // 2x damage on crit
};

/**
 * Build PLAYER_CONFIG from pokemon definitions
 * Only includes pokemon that are playable (player config exists)
 */
export const PLAYER_CONFIG = {};

Object.entries(POKEMON_CONFIG).forEach(([key, pokemonDef]) => {
  if (pokemonDef.player && pokemonDef.playable) {
    PLAYER_CONFIG[key] = {
      name: pokemonDef.name,
      spriteName: pokemonDef.spriteName,
      scale: pokemonDef.scale,
      stats: pokemonDef.player.stats,
      range: pokemonDef.player.range,
      dominantColor: pokemonDef.player.dominantColor,
      projectileColor: pokemonDef.player.projectileColor,
      projectileSize: pokemonDef.player.projectileSize,
      projectileSpeed: pokemonDef.player.projectileSpeed,
      projectilePierce: pokemonDef.player.projectilePierce || 0,
    };
  }
});

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
    critChance: BASE_VALUES.critChance * (stats.critChance || 1),
    critDamage: BASE_VALUES.critDamage * (stats.critDamage || 1),
    dominantColor: config.dominantColor,
    projectileColor: config.projectileColor,
    projectileSize: config.projectileSize || 10,
    projectileSpeed: config.projectileSpeed || 500,
    range: config.range || 120,
    projectilePierce: config.projectilePierce || 0,
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
