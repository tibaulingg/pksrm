/**
 * XP Orb entity class
 * Dropped by enemies, collected by player for experience
 */
export class XPOrb {
  constructor(x, y, value = 1) {
    // Position
    this.x = x;
    this.y = y;
    
    // Physics
    this.velocityX = 0;
    this.velocityY = 0;
    this.floating = true;
    this.floatHeight = 0;
    this.floatSpeed = 3; // pixels per second
    this.maxFloatHeight = 20;
    
    // Stats
    this.value = value; // XP value
    this.radius = 5; // Smaller radius
    this.color = '#00BFFF'; // Light blue
    this.glowColor = '#64a8d5ff'; // Blue glow
    
    // State
    this.active = true;
    this.collected = false; // Track if actually collected by player
    this.lifetime = 10; // seconds before despawn
    this.age = 0;
    this.targetX = null; // For magnetism when attracted to player
    this.targetY = null;
    this.attracted = false;
    this.attractSpeed = 500; // pixels per second when attracted - faster for smooth movement
    this.attractRange = 200; // pixels - larger range for earlier attraction
  }

  /**
   * Update XP orb state
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

      // Check if collected (smoother detection)
      if (dist < player.radius * 1.5) {
        this.collected = true;
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
   * Check if orb is still active
   * @returns {boolean} True if active
   */
  isActive() {
    return this.active;
  }

  /**
   * Collect the orb
   * @returns {number} XP value
   */
  collect() {
    this.active = false;
    return this.value;
  }

  /**
   * Draw a small blue orb
   */
  drawOrb(ctx, cx, cy, size, opacity = 1) {
    ctx.save();
    ctx.globalAlpha = opacity;

    // Draw solid circle
    ctx.fillStyle = '#00BFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, size, 0, Math.PI * 2);
    ctx.fill();

    // Draw subtle outline
    ctx.strokeStyle = '#0099FF';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Render the XP orb as a glowing star
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cameraX - Camera offset X
   * @param {number} cameraY - Camera offset Y
   */
  render(ctx, cameraX = 0, cameraY = 0) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY - this.floatHeight; // Apply floating

    // Pulsing glow effect (twinkle)
    const twinkle = Math.sin(this.age * 8) * 0.5 + 0.5; // 0 to 1
    const glowSize = 16 + twinkle * 6;
    const glowOpacity = 0.3 + twinkle * 0.2;

    // Draw outer glow
    const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, glowSize);
    gradient.addColorStop(0, `rgba(0, 191, 255, ${glowOpacity})`);
    gradient.addColorStop(0.5, `rgba(0, 153, 255, ${glowOpacity * 0.5})`);
    gradient.addColorStop(1, `rgba(0, 153, 255, 0)`);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(screenX, screenY, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw small orb
    this.drawOrb(ctx, screenX, screenY, 4, 1);

    // Draw bright inner glow
    this.drawOrb(ctx, screenX, screenY, 2, 0.7 + twinkle * 0.3);

    // Draw bright center point
    ctx.fillStyle = `rgba(100, 220, 255, ${0.8 + twinkle * 0.2})`;
    ctx.beginPath();
    ctx.arc(screenX, screenY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Factory function to create XP orb
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} value - XP value
 * @returns {XPOrb} New XP orb instance
 */
export function createXPOrb(x, y, value = 1) {
  return new XPOrb(x, y, value);
}
