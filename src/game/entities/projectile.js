/**
 * Projectile entity class
 * Handles projectile movement, collision, and rendering
 */
export class Projectile {
  constructor(
    x,
    y,
    angle,
    speed = 400,
    damage = 10,
    owner = null,
    color = "#FFC107",
    maxDistance = null // distance maximale parcourue
  ) {
    // Position
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;

    // Movement
    // cos and sin already return normalized values, just use them directly
    // Addition de la vitesse du joueur si le tireur est le joueur
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    if (owner && owner instanceof Object && owner.velocityX !== undefined && owner.velocityY !== undefined) {
      vx += owner.velocityX;
      vy += owner.velocityY;
    }
    this.velocityX = vx;
    this.velocityY = vy;
    this.angle = angle;

    // Appearance
    this.radius = 6;
    this.color = color;
    this.trailColor = this.adjustBrightness(color, 1.5); // Lighter version for trail
    this.hasAura = false; // Whether to draw an aura
    this.auraColor = color; // Color of the aura

    // Stats
    this.damage = damage;
    this.speed = speed;
    this.lifetime = 2.0; // seconds before despawn
    this.age = 0;

    // State
    this.active = true;
    this.piercing = 0; // How many enemies it can pierce (0 = none)
    this.hitCount = 0;
    this.owner = owner; // Who fired this projectile (player or enemy)
    this.maxDistance = maxDistance; // portée maximale (range)

    // Visual effects
    this.trail = []; // Trail positions for visual effect
    this.maxTrailLength = 5;
  }

  /**
   * Adjust brightness of a color
   * @param {string} color - Color in hex format (#RRGGBB)
   * @param {number} factor - Brightness factor (1.0 = original, 1.5 = 50% brighter)
   * @returns {string} Adjusted color in hex format
   */
  adjustBrightness(color, factor) {
    const hex = color.replace("#", "");
    const r = Math.min(
      255,
      Math.round(parseInt(hex.substring(0, 2), 16) * factor)
    );
    const g = Math.min(
      255,
      Math.round(parseInt(hex.substring(2, 4), 16) * factor)
    );
    const b = Math.min(
      255,
      Math.round(parseInt(hex.substring(4, 6), 16) * factor)
    );
    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  }

  /**
   * Update projectile state
   * @param {number} dt - Delta time in seconds
   * @param {Object} camera - Camera object with x, y position
   * @param {number} screenWidth - Canvas width
   * @param {number} screenHeight - Canvas height
   */
  update(dt, camera = null, screenWidth = null, screenHeight = null) {
    if (!this.active) return;

    // Update position
    const prevX = this.x;
    const prevY = this.y;

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    // Désactive si la distance parcourue dépasse la portée max
    if (this.maxDistance !== null) {
      const dx = this.x - this.startX;
      const dy = this.y - this.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist >= this.maxDistance) {
        // Ramène le projectile exactement sur le cercle de portée max
        const ratio = this.maxDistance / dist;
        this.x = this.startX + dx * ratio;
        this.y = this.startY + dy * ratio;
        this.active = false;
        return;
      }
    }

    // Add to trail
    this.trail.push({ x: prevX, y: prevY });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Update lifetime
    this.age += dt;
    if (this.age >= this.lifetime) {
      this.active = false;
      return;
    }

    // Deactivate if too far off-screen (only if we have camera info)
    if (camera && screenWidth && screenHeight) {
      const screenX = this.x - camera.x;
      const screenY = this.y - camera.y;
      const margin = 200; // Larger margin for small windows

      if (
        screenX < -margin ||
        screenX > screenWidth + margin ||
        screenY < -margin ||
        screenY > screenHeight + margin
      ) {
        this.active = false;
      }
    }
  }

  /**
   * Handle collision with enemy
   * @returns {boolean} True if projectile should be deactivated
   */
  onHit() {
    this.hitCount++;

    // Deactivate if not piercing or hit limit reached
    if (this.piercing === 0 || this.hitCount > this.piercing) {
      this.active = false;
      return true;
    }

    return false;
  }

  /**
   * Check if projectile is still active
   * @returns {boolean} True if active
   */
  isActive() {
    return this.active;
  }

  /**
   * Render the projectile
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cameraX - Camera offset X
   * @param {number} cameraY - Camera offset Y
   */
  render(ctx, cameraX = 0, cameraY = 0) {
    if (!this.active) return;

    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    // Draw aura if present
    if (this.hasAura) {
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.radius + 6, 0, Math.PI * 2);
      ctx.fillStyle = this.auraColor;
      ctx.globalAlpha = 0.2;
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    // Draw trail
    if (this.trail.length > 1) {
      ctx.beginPath();
      for (let i = 0; i < this.trail.length - 1; i++) {
        const point = this.trail[i];
        const nextPoint = this.trail[i + 1];
        const alpha = (i + 1) / this.trail.length;

        ctx.globalAlpha = alpha * 0.4;
        ctx.strokeStyle = this.trailColor;
        ctx.lineWidth = this.radius * (alpha * 0.8);

        ctx.beginPath();
        ctx.moveTo(point.x - cameraX, point.y - cameraY);
        ctx.lineTo(nextPoint.x - cameraX, nextPoint.y - cameraY);
        ctx.stroke();
      }
      ctx.globalAlpha = 1.0;
    }

    // Draw projectile
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
  }
}

/**
 * Factory function to create projectiles
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} targetX - Target X position
 * @param {number} targetY - Target Y position
 * @param {number} speed - Projectile speed
 * @param {number} damage - Projectile damage
 * @param {Object} owner - Who fired this projectile (player or enemy)
 * @returns {Projectile} New projectile instance
 */
export function createProjectileToTarget(
  x,
  y,
  targetX,
  targetY,
  speed = 400,
  damage = 10,
  owner = null,
  color = null,
  maxDistance = null
) {
  const angle = Math.atan2(targetY - y, targetX - x);
  const projectile = new Projectile(
    x,
    y,
    angle,
    speed,
    damage,
    owner,
    color || "#FFC107",
    maxDistance
  );

  // If owner is an enemy, style as enemy projectile with enemy color
  if (owner && owner.type) {
    const projectileColor = color || owner.projectileColor || "#FF3333";
    projectile.color = projectileColor;
    projectile.trailColor = projectile.adjustBrightness(projectileColor, 1.5);
    projectile.hasAura = true;
    projectile.auraColor = "#FF0000"; //if enemy the aura is always red;
  }

  return projectile;
}

/**
 * Factory function to create projectile at angle
 * @param {number} x - Starting X position
 * @param {number} y - Starting Y position
 * @param {number} angle - Angle in radians
 * @param {number} speed - Projectile speed
 * @param {number} damage - Projectile damage
 * @param {Object} owner - Who fired this projectile (player or enemy)
 * @returns {Projectile} New projectile instance
 */
export function createProjectileAtAngle(
  x,
  y,
  angle,
  speed = 400,
  damage = 10,
  owner = null
) {
  return new Projectile(x, y, angle, speed, damage, owner);
}
