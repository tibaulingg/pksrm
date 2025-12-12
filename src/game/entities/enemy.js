import { normalize, distance } from "../../utils/math.js";
import { spriteConfig, getDirectionRow } from "../sprites/spriteConfig.js";
import { spriteManager } from "../sprites/spriteManager.js";
import {
  ENEMY_CONFIG,
  getEnemyStats,
  getEnemyRangedConfig,
  isEnemyRanged,
  getRandomEnemyType,
  getEnemySpriteConfig,
} from "./enemyConfig.js";
import { getLootTable, selectLootItem } from "../config/lootConfig.js";
import { createLootItem } from "./lootItem.js";

/**
 * Enemy entity class
 * Handles enemy movement, AI, and rendering
 */
export class Enemy {
  constructor(x, y, type = "ratata") {
    // Position
    this.x = x;
    this.y = y;

    // Type-based stats
    this.type = type;
    this.setStatsFromType(type);

    // Movement
    this.velocityX = 0;
    this.velocityY = 0;

    // State
    this.active = true;
    this.dead = false;

    // Hit feedback
    this.hitFlashTime = 0;
    this.hitFlashDuration = 0.15; // Flash effect duration in seconds (like player)
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.scaleX = 1;
    this.scaleY = 1;
    this.enemyScale = 1; // Scale spécifique à l'ennemi (pour la taille du sprite)

    // Sprite animation
    this.spriteLoaded = false;
    this.spriteImage = null;
    this.spritesheetConfig = null; // Cache the spritesheet config
    this.currentFrame = 0;
    this.animationTime = 0;
    this.currentRow = 0;
    this.lastDx = 0;
    this.lastDy = -1; // Default to down

    // Load sprite if available
    this.loadSprite();
  }

  /**
   * Load sprite for this enemy type
   */
  async loadSprite() {
    const enemySpriteConfig = ENEMY_CONFIG[this.type];
    if (!enemySpriteConfig) return;

    // Get the actual spritesheet config using the spriteName
    const spritesheetConfig = spriteConfig[enemySpriteConfig.spriteName];
    if (!spritesheetConfig) return;

    try {
      this.spriteImage = await spriteManager.loadSprite(spritesheetConfig.spriteSheet);
      this.spritesheetConfig = spritesheetConfig; // Cache for later use
      this.enemyScale = enemySpriteConfig.scale; // Store enemy scale
      this.spriteLoaded = true;
      
      // Adapt radius based on both spritesheet scale and enemy scale
      // Calculate effective sprite size when rendered
      const totalScale = spritesheetConfig.scale * enemySpriteConfig.scale;
      const effectiveWidth = spritesheetConfig.frameWidth * totalScale;
      const effectiveHeight = spritesheetConfig.frameHeight * totalScale;
      
      // Set radius to roughly half of the sprite's average dimension
      this.radius = Math.max(effectiveWidth, effectiveHeight) / 2.5;
    } catch (error) {
      console.warn(`Could not load sprite for enemy type: ${this.type}`);
      this.spriteLoaded = false;
    }
  }

  /**
   * Set enemy stats based on type
   * @param {string} type - Enemy type
   */
  setStatsFromType(type) {
    const stats = getEnemyStats(type);
    this.maxHealth = stats.maxHealth;
    this.health = stats.maxHealth;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.radius = stats.radius;
    this.color = stats.color;
    this.outlineColor = stats.outlineColor;
    this.xpValue = stats.xp;

    // Set particle color from sprite config if available
    const enemyConfig = ENEMY_CONFIG[type];
    if (enemyConfig?.spriteName) {
      const spritesheetConfig = spriteConfig[enemyConfig.spriteName];
      this.particleColor = spritesheetConfig?.dominantColor || stats.color;
    } else {
      this.particleColor = stats.color;
    }

    // Initialize ranged-specific properties if applicable
    if (isEnemyRanged(type)) {
      const rangedConfig = getEnemyRangedConfig(type);
      if (rangedConfig) {
        this.shootCooldown = rangedConfig.shootCooldown;
        this.shootTimer = 0;
        this.shootRange = rangedConfig.shootRange;
        this.projectileDamage = Math.round(stats.damage * rangedConfig.projectileDamage);
        this.projectileSpeed = rangedConfig.projectileSpeed;
        this.projectileColor = rangedConfig?.projectileColor || this.color;
      }
    }
  }

  /**
   * Update enemy state
   * @param {number} dt - Delta time in seconds
   * @param {Object} player - Player reference
   * @returns {Object|null} Projectile data to fire, or null if none
   */
  update(dt, player) {
    if (this.dead) return null;

    // Calculate direction to player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Always update direction for sprite rotation
    if (dist > 0) {
      this.lastDx = dx;
      this.lastDy = dy;
    }

    // Update shooter cooldown and behavior
    let projectileToFire = null;
    let isInRange = false;
    let isMoving = false;

    if (isEnemyRanged(this.type)) {
      this.shootTimer -= dt;
      isInRange = dist < this.shootRange && dist > 0;

      // Fire at player if in range and cooldown ready
      if (this.shootTimer <= 0 && isInRange) {
        projectileToFire = {
          x: this.x,
          y: this.y,
          targetX: player.x,
          targetY: player.y,
          damage: this.projectileDamage,
          speed: this.projectileSpeed,
          color: this.projectileColor,
        };
        this.shootTimer = this.shootCooldown;
      }
    }

    // Move towards player (but not if shooter is in range)
    if (dist > 0 && !isInRange) {
      const normalized = normalize(dx, dy);
      this.velocityX = normalized.x * this.speed;
      this.velocityY = normalized.y * this.speed;
      isMoving = true;
    } else if (isInRange) {
      // Stop movement when in range (for shooters)
      this.velocityX = 0;
      this.velocityY = 0;
    }

    // Update sprite animation
    if (this.spriteLoaded && this.spriteImage && this.spritesheetConfig) {
      const config = this.spritesheetConfig;
      this.currentRow = getDirectionRow(this.lastDx, this.lastDy);

      if (isMoving) {
        // Animate when moving
        this.animationTime += dt;
        const frameTime = config.animationSpeed;
        const frames = config.animationFrames.walk.length;

        if (this.animationTime >= frameTime) {
          this.currentFrame = (this.currentFrame + 1) % frames;
          this.animationTime = 0;
        }
      } else {
        // Reset to frame 0 when not moving
        this.currentFrame = 0;
        this.animationTime = 0;
      }
    }

    // Apply knockback decay
    this.knockbackX *= 0.85;
    this.knockbackY *= 0.85;

    // Update position with movement and knockback
    this.x += (this.velocityX + this.knockbackX) * dt;
    this.y += (this.velocityY + this.knockbackY) * dt;

    // Update timers
    if (this.hitFlashTime > 0) {
      this.hitFlashTime -= dt;
    }

    // Reset scale smoothly when not being hit
    if (this.hitFlashTime <= 0) {
      this.scaleX += (1 - this.scaleX) * 0.2;
      this.scaleY += (1 - this.scaleY) * 0.2;
    }

    return projectileToFire;
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   * @returns {boolean} True if enemy died
   */
  takeDamage(amount) {
    if (this.dead) return false;

    this.health -= amount;
    this.hitFlashTime = this.hitFlashDuration; // Reset flash timer

    if (this.health <= 0) {
      this.health = 0;
      this.dead = true;
      return true; // Died
    }

    return false; // Still alive
  }

  /**
   * Apply knockback force
   * @param {number} dirX - Direction X
   * @param {number} dirY - Direction Y
   * @param {number} force - Knockback force
   */
  applyKnockback(dirX, dirY, force) {
    const normalized = normalize(dirX, dirY);
    this.knockbackX = normalized.x * force;
    this.knockbackY = normalized.y * force;
  }

  /**
   * Get distance to a point
   * @param {number} x - Target X
   * @param {number} y - Target Y
   * @returns {number} Distance
   */
  distanceTo(x, y) {
    return distance(this.x, this.y, x, y);
  }

  /**
   * Draw shadow under the enemy
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   */
  drawShadow(ctx, screenX, screenY) {
    const shadowWidth = this.radius * 2 * 0.8;
    const shadowHeight = this.radius * 0.4;
    const shadowY = screenY + this.radius * 0.6;

    // Draw shadow ellipse
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    ctx.ellipse(screenX, shadowY, shadowWidth / 2, shadowHeight / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Render the enemy
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cameraX - Camera offset X
   * @param {number} cameraY - Camera offset Y
   */
  render(ctx, cameraX = 0, cameraY = 0) {
    if (this.dead) return;

    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    // Draw shadow under enemy
    this.drawShadow(ctx, screenX, screenY);

    // Draw sprite if available
    if (this.spriteLoaded && this.spriteImage && this.spritesheetConfig) {
      const config = this.spritesheetConfig;
      const frameIndex = config.animationFrames.walk[this.currentFrame];
      const totalScale = config.scale * this.enemyScale; // Combine spritesheet and enemy scale

      // Calculate source position in spritesheet
      const srcX = (frameIndex % config.framesPerRow) * config.frameWidth;
      const srcY = this.currentRow * config.frameHeight;

      // Draw sprite (with flashing effect when hit)
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.scale(this.scaleX, this.scaleY);

      // Make sprite blink when hit (like player invulnerability flash)
      if (this.hitFlashTime > 0 && Math.floor(this.hitFlashTime * 20) % 2 === 0) {
        ctx.globalAlpha = 0.5; // Make sprite semi-transparent during flash
      }

      ctx.drawImage(
        this.spriteImage,
        srcX,
        srcY,
        config.frameWidth,
        config.frameHeight,
        (-config.frameWidth * totalScale) / 2,
        (-config.frameHeight * totalScale) / 2,
        config.frameWidth * totalScale,
        config.frameHeight * totalScale
      );

      ctx.restore();
      ctx.globalAlpha = 1.0;
    } else {
      // Fallback to circle rendering if sprite not loaded
      // Save context for scaling
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.scale(this.scaleX, this.scaleY);

      // Make circle blink when hit
      if (this.hitFlashTime > 0 && Math.floor(this.hitFlashTime * 20) % 2 === 0) {
        ctx.globalAlpha = 0.5; // Make semi-transparent during flash
      }

      // Draw enemy circle
      ctx.beginPath();
      ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.restore();
      ctx.globalAlpha = 1.0;
    }

    // Draw health bar for damaged enemies
    if (this.health < this.maxHealth) {
      const barWidth = this.radius * 2.2; // Plus court
      const barHeight = 7; // Plus épais
      const barX = screenX - barWidth / 2;
      const barY = screenY - this.radius - 12;

      // Background avec border
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

      // Border
      ctx.strokeStyle = "rgba(100, 100, 100, 0.6)";
      ctx.lineWidth = 1;
      ctx.strokeRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);

      // Health fill color selon le pourcentage
      const healthPercent = this.health / this.maxHealth;
      let color;
      if (healthPercent <= 0.15) {
        color = '#FF2222'; // Rouge
      } else if (healthPercent <= 0.5) {
        color = '#FFD600'; // Orange/jaune
      } else {
        color = '#00CC00'; // Vert
      }
      ctx.fillStyle = color;
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }
  }

  /**
   * Generate loot for this enemy when it dies
   * @returns {Array<LootItem>} Array of dropped loot items
   */
  generateLoot() {
    const lootTable = getLootTable(this.type);
    const droppedLoots = [];

    // Check each item in the loot table for a drop based on individual chances
    for (const lootEntry of lootTable) {
      // Each item has a chance to drop independently
      if (Math.random() < lootEntry.chance) {
        const lootItem = createLootItem(this.x, this.y, lootEntry.itemType);
        droppedLoots.push(lootItem);
      }
    }

    // Scatter loot items around the enemy position slightly
    for (const loot of droppedLoots) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 10 + Math.random() * 15;
      loot.x += Math.cos(angle) * distance;
      loot.y += Math.sin(angle) * distance;
    }

    return droppedLoots;
  }
}

/**
 * Factory function to create enemies of different types
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} type - Enemy type
 * @returns {Enemy} New enemy instance
 */
export function createEnemy(x, y, type = "ratata") {
  return new Enemy(x, y, type);
}
