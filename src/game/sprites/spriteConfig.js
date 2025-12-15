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

export const spriteConfig = {
  piplup: {
    spriteSheet: piplupSpriteSheet,
    profileImage: "../../sprites/piplup/profile.png",
    spriteWidth: 96,
    spriteHeight: 256,
    framesPerRow: 4,
    framesPerColumn: 8,
    frameWidth: 24, // 96 / 4
    frameHeight: 32, // 256 / 8
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2, 3], // Left to right frames
    },
    animationSpeed: 0.15, // seconds per frame
    scale: 1,
    dominantColor: "#4FC3F7", // Dominant color from Piplup sprite for particles
    hurtAnim : {
      hurtSpriteSheet: hurtPiplupSpriteSheet,
      spriteWidth: 80,
      spriteHeight: 256,
      framesPerRow: 2,
      framesPerColumn: 8,
      frameWidth: 40,
      frameHeight: 32,
      animationFrames: {
        hurt: [0,1], // Left to right frames
      },
      animationSpeed: 0.2, // seconds per frame
      scale: 1,
    }
  },
  turtwig: {
    spriteSheet: turtwigSpriteSheet,
    profileImage: "../../sprites/turtwig/profile.png",
    spriteWidth: 96,
    spriteHeight: 256,
    framesPerRow: 4,
    framesPerColumn: 8,
    frameWidth: 24, // 96 / 4
    frameHeight: 32, // 256 / 8
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2, 3], // Left to right frames
    },
    animationSpeed: 0.15, // seconds per frame
    scale: 1,
    dominantColor: "#4E944F", // Dominant color from Turtwig sprite for particles
    hurtAnim : {
      hurtSpriteSheet: hurtTurwig,
      spriteWidth: 64,
      spriteHeight: 384,
      framesPerRow: 2,
      framesPerColumn: 8,
      frameWidth: 32,
      frameHeight: 48,
      animationFrames: {
        hurt: [0,1], // Left to right frames
      },
      animationSpeed: 0.2, // seconds per frame
      scale: 1,
    }
  },
  chimchar: {
    spriteSheet: chimcharSpriteSheet,
    profileImage: "../../sprites/chimchar/profile.png",
    spriteWidth: 224,
    spriteHeight: 384,
    framesPerRow: 7,
    framesPerColumn: 8,
    frameWidth: 32, // 224 / 7
    frameHeight: 48, // 384 / 8
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2, 3], // Left to right frames
    },
    animationSpeed: 0.1, // seconds per frame
    scale: 1,
    dominantColor: "#F57C00", // Dominant color from Chimchar sprite for particles
    hurtAnim : {
      hurtSpriteSheet: hurtChimchar,
      spriteWidth: 64,
      spriteHeight: 384,
      framesPerRow: 2,
      framesPerColumn: 8,
      frameWidth: 32,
      frameHeight: 48,
      animationFrames: {
        hurt: [0,1], // Left to right frames
      },
      animationSpeed: 0.2, // seconds per frame
      scale: 1,
    }
  },
  ratata: {
    spriteSheet: ratataSpriteSheet,
    profileImage: "../../sprites/ratata/profile.png",
    spriteWidth: 336,
    spriteHeight: 320,
    framesPerRow: 7,
    framesPerColumn: 8,
    frameWidth: 48, // 336 / 7
    frameHeight: 40, // 320 / 8
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2, 3, 4, 5, 6], // Left to right frames
    },
    animationSpeed: 0.15, // seconds per frame
    scale: 1,
    dominantColor: "#6f2691ff", // Dominant color from Ratata sprite for particles
  },
  caterpie: {
    spriteSheet: caterpieSpriteSheet,
    profileImage: "../../sprites/caterpie/profile.png",
    spriteWidth: 96,
    spriteHeight: 256,
    framesPerRow: 3,
    framesPerColumn: 8,
    frameWidth: 32, // 96 / 3
    frameHeight: 32, // 256 / 8
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2], // Left to right frames
    },
    animationSpeed: 0.2, // seconds per frame
    scale: 1,
    dominantColor: "#78c850ff", // Dominant color from Caterpie sprite for particles
  },
  quagsire: {
    spriteSheet: quagsireSpriteSheet,
    profileImage: "../../sprites/quagsire/profile.png",
    spriteWidth: 192,
    spriteHeight: 320,
    framesPerRow: 4,
    framesPerColumn: 8,
    frameWidth: 48, 
    frameHeight: 40, 
    animationFrames: {
      idle: [0],
      walk: [0, 1, 2, 3], // Left to right frames
    },
    animationSpeed: 0.15, // seconds per frame
    scale: 1,
    dominantColor: "#5069daff", // Dominant color from Quagsire sprite for particles
    hurtAnim : {
      hurtSpriteSheet: hurtquagSireSpriteSheet,
      spriteWidth: 96,
      spriteHeight: 446,
      framesPerRow: 2,
      framesPerColumn: 8,
      frameWidth: 48,
      frameHeight: 55.75,
      animationFrames: {
        hurt: [0,1], // Left to right frames
      },
      animationSpeed: 0.2, // seconds per frame
      scale: 1,
    }
  },
};

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
