/**
 * Sprite configuration for enemies and players
 * Defines spritesheet properties and animation settings for each character type
 */

// Import sprite images
import ratataSpriteSheet from "../../sprites/ratata/sprite.png";
import caterpieSpriteSheet from "../../sprites/caterpie/sprite.png";
import piplupSpriteSheet from "../../sprites/piplup/sprite.png";
import turtwigSpriteSheet from "../../sprites/turtwig/sprite.png";
import chimcharSpriteSheet from "../../sprites/chimchar/sprite.png";
import quagsireSpriteSheet from "../../sprites/quagsire/sprite.png";
import hurtquagSireSpriteSheet from "../../sprites/quagsire/hurt.png";
import hurtPiplupSpriteSheet from "../../sprites/piplup/hurt.png";
import hurtTurwig from "../../sprites/turtwig/hurt.png";
import hurtChimchar from "../../sprites/chimchar/hurt.png";
import moltresspriteSheet from "../../sprites/moltres/sprite.png";
import magmarSpriteSheet from "../../sprites/magmar/sprite.png";

export function createSpriteConfig({
  spriteSheet,
  profileImage,
  spriteWidth,
  spriteHeight,
  framesPerRow,
  framesPerColumn = 8,
  animationFrames = { idle: [0], walk: [0, 1, 2, 3] },
  animationSpeed = 0.15,
  scale = 1,
  dominantColor,
  hurtAnim = null
}) {
  const config = {
    spriteSheet,
    profileImage,
    spriteWidth,
    spriteHeight,
    framesPerRow,
    framesPerColumn,
    animationFrames,
    animationSpeed,
    scale,
    dominantColor,
  };

  if (hurtAnim) {
    config.hurtAnim = createSpriteConfig(hurtAnim);
  }

  return config;
}

function processConfig(config) {
  const processed = { ...config };
  
  if (config.spriteWidth && config.framesPerRow) {
    processed.frameWidth = config.spriteWidth / config.framesPerRow;
  }
  
  if (config.spriteHeight && config.framesPerColumn) {
    processed.frameHeight = config.spriteHeight / config.framesPerColumn;
  }
  
  if (config.hurtAnim) {
    processed.hurtAnim = processConfig(config.hurtAnim);
  }
  
  return processed;
}

const rawSpriteConfig = {
  piplup: createSpriteConfig({
    spriteSheet: '../../sprites/piplup/sprite.png',
    profileImage: "../../sprites/piplup/profile.png",
    spriteWidth: 96,
    spriteHeight: 256,
    framesPerRow: 4,
    dominantColor: "#4FC3F7",
    hurtAnim: {
      spriteSheet: hurtPiplupSpriteSheet,
      spriteWidth: 80,
      spriteHeight: 448,
      framesPerRow: 2,
      animationFrames: { hurt: [0, 1] },
      animationSpeed: 0.2,
    }
  }),
  turtwig: createSpriteConfig({
    spriteSheet: turtwigSpriteSheet,
    profileImage: "../../sprites/turtwig/profile.png",
    spriteWidth: 96,
    spriteHeight: 256,
    framesPerRow: 4,
    dominantColor: "#4E944F",
    hurtAnim: {
      spriteSheet: hurtTurwig,
      spriteWidth: 64,
      spriteHeight: 384,
      framesPerRow: 2,
      animationFrames: { hurt: [0, 1] },
      animationSpeed: 0.2,
    }
  }),
  chimchar: createSpriteConfig({
    spriteSheet: chimcharSpriteSheet,
    profileImage: "../../sprites/chimchar/profile.png",
    spriteWidth: 224,
    spriteHeight: 384,
    framesPerRow: 7,
    animationSpeed: 0.1,
    dominantColor: "#F57C00",
    hurtAnim: {
      spriteSheet: hurtChimchar,
      spriteWidth: 64,
      spriteHeight: 384,
      framesPerRow: 2,
      animationFrames: { hurt: [0, 1] },
      animationSpeed: 0.2,
    }
  }),
  ratata: createSpriteConfig({
    spriteSheet: ratataSpriteSheet,
    profileImage: "../../sprites/ratata/profile.png",
    spriteWidth: 336,
    spriteHeight: 320,
    framesPerRow: 7,
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2, 3, 4, 5, 6],
    },
    dominantColor: "#6f2691ff",
  }),
  caterpie: createSpriteConfig({
    spriteSheet: caterpieSpriteSheet,
    profileImage: "../../sprites/caterpie/profile.png",
    spriteWidth: 96,
    spriteHeight: 256,
    framesPerRow: 3,
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2],
    },
    animationSpeed: 0.2,
    dominantColor: "#78c850ff",
  }),
  quagsire: createSpriteConfig({
    spriteSheet: quagsireSpriteSheet,
    profileImage: "../../sprites/quagsire/profile.png",
    spriteWidth: 192,
    spriteHeight: 320,
    framesPerRow: 4,
    dominantColor: "#5069daff",
    hurtAnim: {
      spriteSheet: hurtquagSireSpriteSheet,
      spriteWidth: 96,
      spriteHeight: 446,
      framesPerRow: 2,
      animationFrames: { hurt: [0, 1] },
      animationSpeed: 0.2,
    }
  }),
  moltres: createSpriteConfig({
    spriteSheet: moltresspriteSheet,
    profileImage: "../../sprites/moltres/profile.png",
    spriteWidth: 320,
    spriteHeight: 768,
    framesPerRow: 4,
    dominantColor: "#ec5a31ff",
  }),
  magmar: createSpriteConfig({
    spriteSheet: magmarSpriteSheet,
    profileImage: "../../sprites/magmar/profile.png",
    spriteWidth: 128,
    spriteHeight: 384,
    framesPerRow: 4,
    dominantColor: "#ff5722ff",
  }),
};

export const spriteConfig = Object.fromEntries(
  Object.entries(rawSpriteConfig).map(([key, config]) => [key, processConfig(config)])
);

/**
 * Direction mappings for spritesheet rows
 * Maps movement direction to spritesheet row index
 */
export const directionToRow = {
  down: 0, // Moving down
  downRight: 1, // Moving down-right
  right: 2, // Moving right
  upRight: 3, // Moving up-right
  up: 4, // Moving up
  upLeft: 5, // Moving up-left
  left: 6, // Moving left
  downLeft: 7, // Moving down-left
};

/**
 * Get the row index based on movement direction
 * @param {number} dx - Delta X (to player)
 * @param {number} dy - Delta Y (to player)
 * @returns {number} Row index in the spritesheet
 */
export function getDirectionRow(dx, dy) {
  // Normalize the direction
  const angle = Math.atan2(dy, dx);
  const degrees = (angle * 180) / Math.PI;

  // Map angle to direction (8-directional)
  // 0° = right, 90° = down, 180° = left, -90° = up
  const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;

  if (normalizedDegrees >= 337.5 || normalizedDegrees < 22.5)
    return directionToRow.right;
  if (normalizedDegrees >= 22.5 && normalizedDegrees < 67.5)
    return directionToRow.downRight;
  if (normalizedDegrees >= 67.5 && normalizedDegrees < 112.5)
    return directionToRow.down;
  if (normalizedDegrees >= 112.5 && normalizedDegrees < 157.5)
    return directionToRow.downLeft;
  if (normalizedDegrees >= 157.5 && normalizedDegrees < 202.5)
    return directionToRow.left;
  if (normalizedDegrees >= 202.5 && normalizedDegrees < 247.5)
    return directionToRow.upLeft;
  if (normalizedDegrees >= 247.5 && normalizedDegrees < 292.5)
    return directionToRow.up;
  if (normalizedDegrees >= 292.5 && normalizedDegrees < 337.5)
    return directionToRow.upRight;

  return directionToRow.down; // Default
}
