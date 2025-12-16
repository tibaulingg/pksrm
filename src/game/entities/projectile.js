/**
 * Projectile entity class
 * Handles projectile movement, collision, and rendering
 */
import { getProjectileImage } from "./projectileImage.js";

export class Projectile {
  constructor(
    x,
    y,
    angle,
    speed = 400,
    damage = 10,
    owner = null,
    color = "#FFC107",
    maxDistance = null,
    projectileType = null
  ) {
    this.x = x;
    this.y = y;
    this.startX = x;
    this.startY = y;

    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed;
    if (owner && owner instanceof Object && owner.velocityX !== undefined && owner.velocityY !== undefined) {
      if ((vx > 0 && owner.velocityX > 0) || (vx < 0 && owner.velocityX < 0)) {
        vx += owner.velocityX;
      }
      
      if ((vy > 0 && owner.velocityY > 0) || (vy < 0 && owner.velocityY < 0)) {
        vy += owner.velocityY;
      }
      if (maxDistance !== null) {
        maxDistance += Math.abs(owner.velocityX / 2) * (this.lifetime || 2.0);
      }
    }
    this.velocityX = vx;
    this.velocityY = vy;
    this.angle = angle;

    this.radius = 6;
    this.color = color;
    this.trailColor = this.adjustBrightness(color, 1.5);
    this.hasAura = false;
    this.auraColor = color;

    this.damage = damage;
    this.speed = speed;
    this.lifetime = 2.0;
    this.age = 0;

    this.active = true;
    this.piercing = 0;
    this.hitCount = 0;
    this.owner = owner;
    this.maxDistance = maxDistance;
    this.aoeRadius = 0;

    this.baseDamage = damage;
    this.baseSpeed = speed;
    this.baseRadius = this.radius;
    this.hitTargets = new Set();

    this.trail = [];
    this.maxTrailLength = 5;

    this.projectileType = projectileType;
    this.imageInfo = projectileType ? getProjectileImage(projectileType) : null;
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

    console.log(this)

    if (this.piercing === 0 || this.hitCount > this.piercing) {
      this.active = false;
      return true;
    }

    const damageDecay = 0.8;
    const speedDecay = 0.9;
    const sizeDecay = 0.9;

    this.damage *= damageDecay;
    this.speed *= speedDecay;
    this.radius *= sizeDecay;

    this.velocityX = Math.cos(this.angle) * this.speed;
    this.velocityY = Math.sin(this.angle) * this.speed;

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

    // Draw projectile (image si dispo, sinon cercle)
    if (this.imageInfo && this.imageInfo.image) {
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.rotate(this.angle + (this.imageInfo.angleOffset || 0));
      const scale = this.imageInfo.scale || 1;
      const img = this.imageInfo.image;
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(
        img,
        -w / 2,
        -h / 2,
        w,
        h
      );
      ctx.restore();
    } else {
      ctx.beginPath();
      ctx.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
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
  maxDistance = null,
  projectileType = null
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
    maxDistance,
    projectileType
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
