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
		},
		enemy: createEnemy("melee", strength, overrides.enemy || {}),
    projectileType: overrides.projectileType || null,
	};
}

export const POKEMON_CONFIG = {
	piplup: createStarter("Piplup", "piplup", 2, "#4FC3F7", "#0288D1", "medium", { projectileType: 'water', stats: { attackSpeed: 1.1 } }),
	turtwig: createStarter("Turtwig", "turtwig", 2, "#4E944F", "#2E7D32", "strong", { projectileType: 'grass', stats: { attackSpeed: 1.1 } }),
	chimchar: createStarter("Chimchar", "chimchar", 2, "#F57C00", "#E64A19", "weak", { projectileType: 'fire', stats: { attackSpeed: 1.1 } }),
	quagsire: createStarter("Quagsire", "quagsire", 2, "#5a8ecaff", "#3976d1ff", "strong", { projectileType: 'water', stats: { attackSpeed: 2 } }),
	ratata: {
		name: "Ratata",
		spriteName: "ratata",
		scale: 1.2,
		player: {
			stats: { health: 2, speed: 1, damage: 1.0, radius: 1.0, attackSpeed: 1.0 },
			range: 120,
			dominantColor: "#F44336",
			projectileColor: "#D32F2F",
			projectileSize: 10,
			projectileSpeed: 400,
		},
		enemy: createEnemy("melee", "medium", {
			lootTable: [{ itemType: ITEM_TYPES.RATATA_TAIL, chance: 0.1 }],
		}),
	},
	caterpie: {
		name: "Caterpie",
		spriteName: "caterpie",
		scale: 1.5,
		player: {
			stats: { health: 1, speed: 0.3, damage: 0.3, radius: 1.15, attackSpeed: 1.0 },
			range: 120,
			dominantColor: "#66BB6A",
			projectileColor: "#43A047",
			projectileSize: 10,
			projectileSpeed: 250,
		},
		enemy: createEnemy("ranged", "weak", {
			ranged: {
				projectileColor: "#afb5adff",
				shootCooldown: 1.5,
				shootRange: 300,
				projectileSpeed: 250,
				projectileDamage: 0.8,
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
