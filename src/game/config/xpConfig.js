/**
 * XP and Level-up Configuration System
 * Centralized settings for XP curves, level scaling, and progression
 */

/**
 * Global XP Configuration
 */
export const XP_CONFIG = {
  // Initial XP required to level up
  initialXpToNextLevel: 100,

  // XP progression curve
  // "linear" - each level requires xpMultiplier more (100, 110, 121, etc.)
  // "quadratic" - each level requires more XP (100, 140, 196, etc.)
  // "exponential" - aggressive scaling (100, 150, 225, 337.5, etc.)
  progressionCurve: "quadratic",

  // Multiplier applied to XP requirements each level
  // linear: 1.1 means each level is 10% harder
  // quadratic: 1.4 means aggressive growth
  // exponential: 1.5 means very aggressive growth
  xpMultiplier: 1.1,

  // Enemy XP value multipliers
  // These are applied to BASE_VALUES.xp in enemyConfig.js
  enemyXpMultiplier: 1.0, // Global multiplier for all enemy XP values

  // Player XP gain multipliers (can be increased by upgrades)
  playerXpGainMultiplier: 10.0,
};

/**
 * Calculate XP required for next level
 * @param {number} currentLevel - Current player level (1-indexed)
 * @param {number} initialXp - Initial XP requirement (default: 100)
 * @returns {number} XP required to reach next level
 */
export function calculateXpForLevel(
  currentLevel,
  initialXp = XP_CONFIG.initialXpToNextLevel
) {
  const multiplier = XP_CONFIG.xpMultiplier;
  const curve = XP_CONFIG.progressionCurve;

  switch (curve) {
    case "linear":
      // Each level is X% harder than the previous
      // Level 1: 100, Level 2: 110, Level 3: 121, etc.
      return Math.floor(initialXp * Math.pow(multiplier, currentLevel - 1));

    case "quadratic":
      // More aggressive scaling
      // Uses multiplier squared for faster growth
      return Math.floor(
        initialXp * Math.pow(multiplier, (currentLevel - 1) * 1.5)
      );

    case "exponential":
      // Very aggressive scaling for late game
      // Each level doubles the base requirement
      return Math.floor(initialXp * Math.pow(multiplier, currentLevel));

    default:
      console.warn(`Unknown progression curve: ${curve}, using linear`);
      return calculateXpForLevel(currentLevel, initialXp);
  }
}

/**
 * Get effective XP value for an enemy considering all multipliers
 * @param {number} baseXp - Base XP value from enemy config
 * @returns {number} Effective XP after all multipliers
 */
export function getEffectiveXpValue(baseXp) {
  return Math.round(
    baseXp * XP_CONFIG.enemyXpMultiplier * XP_CONFIG.playerXpGainMultiplier
  );
}
