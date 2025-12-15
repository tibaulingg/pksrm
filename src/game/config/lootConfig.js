/**
 * Loot Configuration System
 * Handles loot table selection and item generation
 * Item definitions are in itemConfig.js
 */

import { POKEMON_CONFIG } from "../config/pokemonConfig.js";

/**
 * Get loot table for an enemy type
 * @param {string} enemyType - Enemy type key
 * @returns {Array} Loot table for the enemy [{itemType, chance}, ...]
 */
export function getLootTable(enemyType) {
  const config = POKEMON_CONFIG[enemyType];
  return config?.enemy?.lootTable || [];
}

/**
 * Randomly select an item from a loot table based on chances
 * @param {Array} lootTable - Array of {itemType, chance} objects
 * @returns {string|null} Selected item type or null if nothing drops
 */
export function selectLootItem(lootTable) {
  if (!lootTable || lootTable.length === 0) return null;

  // Calculate total weight
  const totalWeight = lootTable.reduce((sum, item) => sum + item.chance, 0);
  if (totalWeight === 0) return null;

  // Generate random number
  let random = Math.random() * totalWeight;

  // Find selected item
  for (const item of lootTable) {
    random -= item.chance;
    if (random <= 0) {
      return item.itemType;
    }
  }

  return null;
}
