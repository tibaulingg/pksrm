import { ITEM_TYPES } from "./itemConfig.js";

const ENEMY_STATS = {
    weak: { health: 1, speed: 1, damage: 1, radius: 1, xp: 1 },
    medium: { health: 2, speed: 1, damage: 1.1, radius: 1.2, xp: 1.5 },
    strong: { health: 3, speed: 0.8, damage: 1.5, radius: 1.5, xp: 3 },
};

function createEnemy(type = "melee", strength = "weak", overrides = {}) {
    return {
        type,
        stats: { ...ENEMY_STATS[strength], ...(overrides.stats || {}) },
        lootTable: overrides.lootTable || [],
        ...overrides,
    };
}

const STARTER_STATS = {
    weak: { health: 1, speed: 1, damage: 1, radius: 1, attackSpeed: 1 },
    medium: { health: 2, speed: 1, damage: 1.1, radius: 1.2, attackSpeed: 1 },
    strong: { health: 3, speed: 1.2, damage: 1.3, radius: 1.5, attackSpeed: 1.5 },
};

function createStarter(name, spriteName, scale = 2, dominantColor, projectileColor, strength = "medium", overrides = {}) {
    return {
        name,
        spriteName,
        scale,
        playable: 1,
        player: {
            stats: { ...STARTER_STATS[strength], ...(overrides.stats || {}) },
            range: overrides.range || 250,
            dominantColor,
            projectileColor,
            projectileSize: overrides.projectileSize || 15,
            projectileSpeed: overrides.projectileSpeed || 400,
            projectilePierce: overrides.projectilePierce || 0,
            aoeSize: overrides.aoeSize || 0,
        },
        enemy: createEnemy("melee", strength, overrides.enemy || {}),
        projectileType: overrides.projectileType || null,
    };
}

export const POKEMON_CONFIG = {
    piplup: createStarter("Piplup", "piplup", 2, "#4FC3F7", "#0288D1", "medium", {
        projectileType: "water",
        stats: { attackSpeed: 1.1, projectilePierce: 1 },
    }),
    turtwig: createStarter("Turtwig", "turtwig", 2, "#4E944F", "#2E7D32", "strong", {
        projectileType: "grass",
        stats: { attackSpeed: 1.1, projectilePierce: 0 },
    }),
    chimchar: createStarter("Chimchar", "chimchar", 2, "#F57C00", "#E64A19", "weak", {
        projectileType: "fire",
        stats: { attackSpeed: 1.1 },
        aoeSize: 50,
    }),
    quagsire: {
        name: "Quagsire",
        spriteName: "quagsire",
        scale: 2.5,
        playable: 1,
        player: {
            stats: { ...STARTER_STATS["weak"] },
            range: 250,
            dominantColor: "#5069daff",
            projectileColor: "#5069daff",
            projectileSize: 15,
            projectileSpeed: 400,
            projectilePierce: 0,
            aoeSize: 0,
        },
        enemy: createEnemy("melee", "strong", {
            lootTable: [{ itemType: ITEM_TYPES.QUAGSIRE_TAIL, chance: 0.2 }],
        }),
    },
    ratata: {
        name: "Ratata",
        spriteName: "ratata",
        scale: 1.2,
        enemy: createEnemy("melee", "medium", {
            lootTable: [{ itemType: ITEM_TYPES.RATATA_TAIL, chance: 0.1 }],
        }),
    },
    caterpie: {
        name: "Caterpie",
        spriteName: "caterpie",
        scale: 1.5,
        enemy: createEnemy("ranged", "weak", {
            ranged: {
                projectileColor: "#afb5adff",
                shootCooldown: 1.1,
                shootRange: 200,
                projectileSpeed: 150,
                projectileDamage: 0.8,
            },
        }),
    },
    magmar: {
        name: "Magmar",
        spriteName: "magmar",
        scale: 2.5,
        enemy: createEnemy("ranged", "strong", {
            lootTable: [],
            ranged: {
                projectileColor: "#ff5722",
                shootCooldown: 2.0,
                shootRange: 400,
                projectileSpeed: 300,
                projectileDamage: 1.5,
            },
        }),
    },
    moltress: {
        name: "Moltress",
        spriteName: "moltress",
        scale: 3,
        enemy: createEnemy("ranged", "strong", {
            lootTable: [],
            ranged: {
                projectileColor: "#ff9800",
                shootCooldown: 0.1,
                shootRange: 500,
                projectileSpeed: 400,
                projectileDamage: 2.0,
            },
        }),
    },
};

export function getPokemonConfig(type) {
    const config = POKEMON_CONFIG[type];
    if (!config) {
        console.warn(`Unknown pokemon type: ${type}`);
        return null;
    }
    return config;
}

export function getPokemonPlayerConfig(type) {
    const config = getPokemonConfig(type);
    return config ? config.player : null;
}

export function getPokemonEnemyConfig(type) {
    const config = getPokemonConfig(type);
    return config ? config.enemy : null;
}
