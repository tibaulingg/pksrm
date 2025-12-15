// Projectile image loader utility
const projectileImages = {};

// Table de config par type
const PROJECTILE_IMAGE_CONFIG = {
  water: {
    src: require("../../sprites/water_projectile.png"),
    angleOffset: -Math.PI / 2, // image orientée vers le haut (tête du projectile part du Pokémon)
    scale: 0.1,
  },
  fire: {
    src: require("../../sprites/fireball.png"),
    angleOffset: -Math.PI / 2, // image orientée vers le haut (tête du projectile part du Pokémon)
    scale: 0.04,
  },
};

export function getProjectileImage(type) {
  if (!type) return null;
  if (projectileImages[type]) return projectileImages[type];
  const config = PROJECTILE_IMAGE_CONFIG[type];
  if (!config) return null;
  const img = new window.Image();
  img.src = config.src;
  const result = {
    image: img,
    angleOffset: config.angleOffset || 0,
    scale: config.scale || 1,
  };
  projectileImages[type] = result;
  return result;
}
