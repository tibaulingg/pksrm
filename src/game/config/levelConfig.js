/**
 * Level Configuration
 * Defines level structure with spawn rules, difficulty, and Pokémon spawning
 */

export const LEVEL_CONFIG = {
    forest: {
        name: "Verdant Forest",
        description: "A peaceful forest filled with grass-type Pokémon",
        difficulty: 1,
        difficultyMultiplier: 1,
        hpGrowthRate: 0.005,
        hpGrowthPower: 1.2,
        maxHpMultiplier: 4,
        spawnMultiplier: 1,
        backgroundColor: "#307230ff",
        map: {
            borderTiles: 7,
            blockedTiles: [{ x: 16, y: 12 }, { x: 15, y: 12 }, { x: 14, y: 12 }, { x: 13, y: 12 }, { x: 12, y: 12 }, { x: 11, y: 12 }, { x: 10, y: 12 }, { x: 9, y: 12 }, { x: 8, y: 12 }, { x: 7, y: 12 }, { x: 6, y: 12 }, { x: 5, y: 12 }, { x: 4, y: 12 }, { x: 3, y: 12 }, { x: 2, y: 12 }, { x: 1, y: 12 }, { x: 0, y: 12 }],
        },
        enemies: {
            ratata: {
                enabled: true,
                weight: 75,
                spawnRate: 0.3,
            },
            caterpie: {
                enabled: true,
                weight: 20,
                spawnRate: 0.2,
            },
            turtwig: {
                enabled: true,
                weight: 5,
                spawnRate: 0.1,
            },
        },
        boss: {
            quagsire: {
                spawnTimer: 60, // in seconds
                hp: 2000,
                attack: 100,
                defense: 100,
            },
        },
    },

    glacier: {
        name: "Frozen Glacier",
        description: "An icy tundra with water-type Pokémon",
        difficulty: 3,
        difficultyMultiplier: 1.5,
        hpGrowthRate: 0.005,
        hpGrowthPower: 1.2,
        maxHpMultiplier: 4,
        spawnMultiplier: 1,
        backgroundColor: "#1a5c7a",
        map: {
            borderTiles: 2,
            blockedTiles: [],
        },
        enemies: {
            piplup: {
                enabled: true,
                weight: 80,
                spawnRate: 0.4,
            },
            quagsire: {
                enabled: true,
                weight: 20,
                spawnRate: 0.05,
            },
        },
        boss: {
            quagsire: {
                spawnTimer: 60, // in seconds
                hp: 2000,
                attack: 100,
                defense: 100,
            },
        },
    },

    volcano: {
        name: "Crimson Volcano",
        description: "A hot volcanic area with fire-type Pokémon",
        difficulty: 5,
        difficultyMultiplier: 2,
        hpGrowthRate: 0.005,
        hpGrowthPower: 1.2,
        maxHpMultiplier: 4,
        spawnMultiplier: 1,
        backgroundColor: "#660000",
        map: {
            borderTiles: 2,
            blockedTiles: [{ x: 4, y: 4 }],
        },
        enemies: {
            magmar: {
                enabled: true,
                weight: 90,
                spawnRate: 0.4,
            },
            chimchar: {
                enabled: true,
                weight: 10,
                spawnRate: 0.25,
            },
        },
        boss: {
            moltres: {
                spawnTimer: 60, // in seconds
                hp: 2000,
                attack: 100,
                defense: 100,
            },
        },
    },
};

/**
 * Get level by key
 * @param {string} levelKey - Level identifier
 * @returns {Object} Level configuration
 */
export function getLevel(levelKey) {
    return LEVEL_CONFIG[levelKey] || LEVEL_CONFIG.forest;
}

/**
 * Get all available levels
 * @returns {Array} Array of level keys
 */
export function getAllLevels() {
    return Object.keys(LEVEL_CONFIG);
}

/**
 * Get enabled enemies for a level
 * @param {string} levelKey - Level identifier
 * @returns {Array} Array of enabled enemy types with their config
 */
export function getEnabledEnemies(levelKey) {
    const level = getLevel(levelKey);
    const enabled = [];

    for (const [enemyType, config] of Object.entries(level.enemies)) {
        if (config.enabled) {
            enabled.push({
                type: enemyType,
                ...config,
            });
        }
    }

    return enabled;
}
