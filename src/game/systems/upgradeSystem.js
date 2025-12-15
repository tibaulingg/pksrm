/**
 * Upgrade System
 * Manages all available upgrades, their rarities, and application
 */

import { XP_CONFIG } from '../config/xpConfig.js';

/**
 * Rarity distribution configuration
 * Percentage chance for each rarity tier
 */
export const RARITY_DISTRIBUTION = {
  common: 0.70,     
  rare: 0.20,       
  epic: 0.10,       
  legendary: 0.01,  
};

/**
 * Upgrade definitions
 * Format: { id, name, description, rarity, apply }
 */
export const UPGRADES = [
  // COMMON UPGRADES
  {
    id: "speed-boost-1",
    name: "Swift Feet",
    description: "+10% movement speed",
    rarity: "common",
    apply: (state) => {
      state.player.speed *= 1.1;
    },
  },
  {
    id: "health-boost-1",
    name: "Toughness",
    description: "+15 max health",
    rarity: "common",
    apply: (state) => {
      state.player.maxHealth += 15;
    },
  },
  {
    id: "damage-boost-1",
    name: "Sharpness",
    description: "+5 damage per hit",
    rarity: "common",
    apply: (state) => {
      state.player.damage += 5;
    },
  },
  {
    id: "attack-speed-1",
    name: "Faster Reflexes",
    description: "+25% attack speed",
    rarity: "common",
    apply: (state) => {
      state.player.attackCooldown *= 0.75;
    },
  },
  {
    id: "xp-gain-1",
    name: "Greedy",
    description: "+10% XP gain",
    rarity: "common",
    apply: (state) => {
      XP_CONFIG.playerXpGainMultiplier *= 1.1;
    },
  },

  {
    id: "projectile-size",
    name: "Big Shots",
    description: "+50% projectile damage",
    rarity: "rare",
    apply: (state) => {
      state.player.damage *= 1.5;
    },
  },
  {
    id: "projectile-count",
    name: "Double Fire",
    description: "+50% attack speed",
    rarity: "rare",
    apply: (state) => {
      state.player.attackCooldown *= 0.5;
    },
  },
  {
    id: "health-regen",
    name: "Regeneration",
    description: "Slowly regenerate health over time",
    rarity: "rare",
    apply: (state) => {
      state.playerRegenRate = 5;
    },
  },
  {
    id: "invulnerability-extend",
    name: "Barrier",
    description: "+100% invulnerability duration",
    rarity: "rare",
    apply: (state) => {
      state.player.invulnerableDuration *= 2;
    },
  },

  // EPIC UPGRADES
  {
    id: "damage-boost-2",
    name: "Power Surge",
    description: "+30% all damage",
    rarity: "epic",
    apply: (state) => {
      state.player.damage *= 1.3;
    },
  },
  {
    id: "critical-strike",
    name: "Critical Eye",
    description: "+50% damage on critical hits (20% chance)",
    rarity: "epic",
    apply: (state) => {
      state.criticalChance = 0.2;
      state.criticalMultiplier = 1.5;
    },
  },
  {
    id: "health-boost-2",
    name: "Iron Skin",
    description: "+50 max health",
    rarity: "epic",
    apply: (state) => {
      state.player.maxHealth += 50;
      //state.player.health = state.player.maxHealth;
    },
  },

  // LEGENDARY UPGRADES
  {
    id: "mega-damage",
    name: "Nuclear Bomb",
    description: "+100% damage (DOUBLE POWER)",
    rarity: "legendary",
    apply: (state) => {
      state.player.damage *= 2;
    },
  },
  {
    id: "mega-speed",
    name: "Time Warp",
    description: "+100% attack speed",
    rarity: "legendary",
    apply: (state) => {
      state.player.attackCooldown *= 0.5;
    },
  },
  {
    id: "mega-health",
    name: "Immortality",
    description: "+100 max health & regenerate 10/s",
    rarity: "legendary",
    apply: (state) => {
      state.player.maxHealth += 100;
      state.player.health = state.player.maxHealth;
      state.playerRegenRate = 10;
    },
  },
  {
    id: "weaponmaster",
    name: "Weapon Master",
    description: "+50% damage, +30% attack speed",
    rarity: "legendary",
    apply: (state) => {
      state.player.damage *= 1.5;
      state.player.attackCooldown *= 0.7;
    },
  },
];

/**
 * Rarity color map for UI
 */
export const RARITY_COLORS = {
  common: {
    bg: "#8B8B8B", // Gray
    border: "#FFFFFF",
    text: "#FFFFFF",
  },
  rare: {
    bg: "#4169E1", // Royal Blue
    border: "#87CEEB",
    text: "#FFFFFF",
  },
  epic: {
    bg: "#9932CC", // Dark Orchid
    border: "#DDA0DD",
    text: "#FFFFFF",
  },
  legendary: {
    bg: "#FFD700", // Gold
    border: "#FFA500",
    text: "#000000",
  },
};

/**
 * Select random upgrades based on rarity distribution
 * @param {number} count - Number of upgrades to select (default 3)
 * @returns {Array} Array of randomly selected upgrade objects
 */
export function selectRandomUpgrades(count = 3) {
  const selected = [];
  const available = [...UPGRADES];

  for (let i = 0; i < count && available.length > 0; i++) {
    // Select rarity first based on distribution
    const rarityRoll = Math.random();
    let selectedRarity = null;
    let cumulativeChance = 0;

    for (const [rarity, chance] of Object.entries(RARITY_DISTRIBUTION)) {
      cumulativeChance += chance;
      if (rarityRoll <= cumulativeChance) {
        selectedRarity = rarity;
        break;
      }
    }

    // Find available upgrades with this rarity
    const availableWithRarity = available.filter(u => u.rarity === selectedRarity);

    if (availableWithRarity.length > 0) {
      // Pick random upgrade from this rarity
      const selected_upgrade = availableWithRarity[Math.floor(Math.random() * availableWithRarity.length)];
      
      selected.push({
        id: selected_upgrade.id,
        name: selected_upgrade.name,
        description: selected_upgrade.description,
        rarity: selected_upgrade.rarity,
      });
      // Remove selected upgrade from pool to avoid duplicates
      available.splice(available.indexOf(selected_upgrade), 1);
    }
  }

  return selected;
}

/**
 * Get upgrade by ID
 * @param {string} upgradeId - Upgrade ID
 * @returns {Object|null} Upgrade object or null
 */
export function getUpgradeById(upgradeId) {
  return UPGRADES.find((u) => u.id === upgradeId) || null;
}

/**
 * Apply upgrade to game state
 * @param {string} upgradeId - Upgrade ID
 * @param {Object} state - Game state object
 */
export function applyUpgrade(upgradeId, state) {
  const upgrade = getUpgradeById(upgradeId);
  if (upgrade) {
    upgrade.apply(state);
  }
}
