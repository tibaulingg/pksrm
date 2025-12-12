/**
 * Item Configuration System
 * Defines all items that can be dropped by enemies
 */

/**
 * Item structure:
 * {
 *   name: string - Display name
 *   rarity: "common" | "uncommon" | "rare" | "epic" | "legendary"
 *   color: string - Color for rendering (fallback if no sprite)
 *   glowColor: string - Glow effect color
 *   description: string - Item description
 *   sprite: string - Path to sprite image (optional)
 *   scale: number - Sprite scale factor (default 1.0)
 *   effect: function - Applied when collected (optional)
 * }
 */

import ratata_tail from "../../sprites/items/ratata_tail.png";

export const ITEM_TYPES = {
  // Enemy-specific drops
  RATATA_TAIL: "ratataTail",
};

export const ITEM_CONFIG = {
  ratataTail: {
    name: "Ratata Tail",
    rarity: "uncommon",
    color: "#480c59ff",
    glowColor: "#8b5d85ff",
    description: "Dropped by Ratata",
    sprite: ratata_tail,  // Optional - uncomment and set path to use sprite
    scale: 2,                     // Optional - sprite scale (default 1.0)
  },
};

/**
 * Get item configuration
 * @param {string} itemType - Item type key
 * @returns {Object} Item configuration
 */
export function getItemInfo(itemType) {
  return ITEM_CONFIG[itemType] || ITEM_CONFIG.gold;
}

/**
 * Get color for an item type
 * @param {string} itemType - Item type key
 * @returns {string} Hex color
 */
export function getItemColor(itemType) {
  return getItemInfo(itemType).color;
}

/**
 * Get glow color for an item type
 * @param {string} itemType - Item type key
 * @returns {string} Hex color
 */
export function getItemGlowColor(itemType) {
  return getItemInfo(itemType).glowColor;
}
