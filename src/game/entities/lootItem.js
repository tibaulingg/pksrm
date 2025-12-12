import { getItemInfo } from "../config/itemConfig.js";

/**
 * Loot Item entity class
 * Dropped by enemies, can be collected by player for various effects
 */
export class LootItem {
  constructor(x, y, type = "gold") {
    // Position
    this.x = x;
    this.y = y;

    // Type
    this.type = type;
    const itemInfo = getItemInfo(type);
    this.name = itemInfo.name;
    this.color = itemInfo.color;
    this.glowColor = itemInfo.glowColor;
    
    // Sprite
    this.sprite = null;
    this.spriteImage = null;
    this.scale = itemInfo.scale || 1.0;
    
    // Load sprite if available
    if (itemInfo.sprite) {
      this.loadSprite(itemInfo.sprite);
    }

    // Physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.floating = true;
    this.floatHeight = 0;
    this.floatSpeed = 2; // pixels per second
    this.maxFloatHeight = 15;

    // Stats
    this.radius = 6;

    // State
    this.active = true;
    this.lifetime = 15; // seconds before despawn
    this.age = 0;
    this.attracted = false;
    this.attractSpeed = 400; // pixels per second when attracted
    this.attractRange = 150; // pixels - range before attraction starts
  }

  /**
   * Load sprite image for this item
   * @param {string} spritePath - Path to sprite image
   */
  async loadSprite(spritePath) {
    try {
      const img = new Image();
      img.src = spritePath;
      img.onload = () => {
        this.spriteImage = img;
      };
      img.onerror = () => {
        console.warn(`Could not load sprite for item: ${this.type}`);
      };
    } catch (error) {
      console.warn(`Error loading sprite for item ${this.type}:`, error);
    }
  }

  /**
   * Update loot item state
   * @param {number} dt - Delta time in seconds
   * @param {Object} player - Player reference for magnetism
   */
  update(dt, player) {
    if (!this.active) return;

    this.age += dt;

    // Check if attracted to player (within range)
    const distToPlayer = Math.sqrt(
      (player.x - this.x) ** 2 + (player.y - this.y) ** 2
    );

    if (distToPlayer < this.attractRange) {
      this.attracted = true;
    }

    // Move towards player if attracted
    if (this.attracted) {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 0) {
        const speed = this.attractSpeed;
        this.x += (dx / dist) * speed * dt;
        this.y += (dy / dist) * speed * dt;
      }

      // Check if collected
      if (dist < player.radius * 1.5) {
        this.active = false;
        return;
      }
    } else {
      // Floating animation when not attracted
      this.floatHeight += this.floatSpeed * dt;
      if (this.floatHeight > this.maxFloatHeight) {
        this.floatHeight = this.maxFloatHeight;
      }
    }

    // Despawn if lifetime exceeded
    if (this.age > this.lifetime) {
      this.active = false;
    }
  }

  /**
   * Check if item is still active
   * @returns {boolean} True if active
   */
  isActive() {
    return this.active;
  }

  /**
   * Collect the item
   * @returns {Object} {type, amount} - What was collected
   */
  collect() {
    this.active = false;
    return {
      type: this.type,
      amount: 1,
    };
  }

  /**
   * Render the loot item
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cameraX - Camera offset X
   * @param {number} cameraY - Camera offset Y
   */
  render(ctx, cameraX = 0, cameraY = 0) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY - this.floatHeight; // Apply floating

    // Pulsing glow effect
    const pulse = Math.sin(this.age * 6) * 0.5 + 0.5; // 0 to 1
    const glowSize = 14 + pulse * 8;
    const glowOpacity = 0.35 + pulse * 0.25;

    // Draw outer glow
    const gradient = ctx.createRadialGradient(
      screenX,
      screenY,
      0,
      screenX,
      screenY,
      glowSize
    );
    gradient.addColorStop(
      0,
      `rgba(${this.hexToRgb(this.glowColor).join(", ")}, ${glowOpacity})`
    );
    gradient.addColorStop(
      0.5,
      `rgba(${this.hexToRgb(this.glowColor).join(", ")}, ${glowOpacity * 0.4})`
    );
    gradient.addColorStop(
      1,
      `rgba(${this.hexToRgb(this.glowColor).join(", ")}, 0)`
    );
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw sprite if available, otherwise draw circle
    if (this.spriteImage) {
      const spriteWidth = this.spriteImage.width * this.scale;
      const spriteHeight = this.spriteImage.height * this.scale;
      ctx.save();
      ctx.globalAlpha = 0.8 + pulse * 0.2; // Pulsing opacity
      ctx.drawImage(
        this.spriteImage,
        screenX - spriteWidth / 2,
        screenY - spriteHeight / 2,
        spriteWidth,
        spriteHeight
      );
      ctx.restore();
    } else {
      // Draw main item circle
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = this.glowColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw sparkle/shine effect
      ctx.fillStyle = `rgba(255, 255, 255, ${0.6 + pulse * 0.4})`;
      ctx.beginPath();
      ctx.arc(
        screenX - this.radius / 3,
        screenY - this.radius / 3,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  /**
   * Helper: convert hex color to RGB array
   * @param {string} hex - Hex color like #FFD700
   * @returns {Array<number>} [r, g, b] values 0-255
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : [255, 255, 255];
  }
}

/**
 * Factory function to create loot items
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {string} type - Loot type
 * @returns {LootItem} New loot item
 */
export function createLootItem(x, y, type = "gold") {
  return new LootItem(x, y, type);
}
