import { lerp, clamp, normalize } from "../../utils/math.js";
import { getPlayerStats, getPlayerConfig } from "./playerConfig.js";
import { spriteConfig, getDirectionRow } from "../sprites/spriteConfig.js";

// Import player sprites
import piplupSpriteSheet from "../../sprites/piplup/sprite.png";
import turtwigSpriteSheet from "../../sprites/turtwig/sprite.png";
import chimcharSpriteSheet from "../../sprites/chimchar/sprite.png";

// Import player profile icons
import piplupProfile from "../../sprites/piplup/profile.png";
import turtwigProfile from "../../sprites/turtwig/profile.png";
import chimcharProfile from "../../sprites/chimchar/profile.png";

const playerSpriteSheets = {
  piplup: piplupSpriteSheet,
  turtwig: turtwigSpriteSheet,
  chimchar: chimcharSpriteSheet,
};

const playerProfiles = {
  piplup: piplupProfile,
  turtwig: turtwigProfile,
  chimchar: chimcharProfile,
};

/**
 * Player entity class
 * Handles player movement, aiming, stats, and rendering
 */
export class Player {
  constructor(x, y, characterType = "piplup") {
    // Position
    this.x = x;
    this.y = y;

    // Character type
    this.characterType = characterType;
    const playerStats = getPlayerStats(characterType);
    const playerConfig = getPlayerConfig(characterType);

    // Movement
    this.velocityX = 0;
    this.velocityY = 0;
    this.speed = playerStats.speed; // pixels per second (from config)
    this.friction = 0.85; // damping factor

    // Aiming
    this.aimX = x + 1; // Default aim to the right
    this.aimY = y;
    this.aimAngle = 0;
    this.autoShoot = false; // Toggle between aim and autoshoot
    this.autoShootRange = 400; // Range to find closest enemy
    // Range personnalisée selon le starter
    this.range = playerStats.range || 120;
    this.projectileSize = playerStats.projectileSize || 10;
    this.projectileSpeed = playerStats.projectileSpeed || 400;
    this.name = playerConfig.name || "Player";

    // Appearance
    this.radius = playerStats.radius;
    this.color = playerStats.dominantColor;
    this.outlineColor = this.darkenColor(playerStats.dominantColor); // Darkened version of dominant color
    this.projectileColor = playerStats.projectileColor;
    this.spriteName = playerConfig.spriteName;
    this.scale = playerConfig.scale;

    // Sprite animation
    this.spriteLoaded = false;
    this.spriteImage = null;
    this.spritesheetConfig = spriteConfig[characterType] || spriteConfig.piplup;
    this.currentFrame = 0;
    this.animationTime = 0;
    this.currentRow = 0; // Down direction by default
    this.scaleX = 1; // For flipping sprite
    this.scaleY = 1;
    this.loadSprite();

    // Profile icon
    this.profileImageLoaded = false;
    this.profileImage = null;
    this.loadProfileImage();

    // Stats
    this.maxHealth = playerStats.maxHealth;
    this.health = playerStats.maxHealth;
    this.damage = playerStats.damage;
    this.invulnerable = false;
    this.invulnerableTime = 0;
    this.invulnerableDuration = 1.2; // seconds - longer window to escape

    // Auto-attack system
    this.baseAttackCooldown = 0.4; // base seconds between attacks
    this.attackCooldown = this.baseAttackCooldown / playerStats.attackSpeed; // adjusted by attack speed
    this.attackTimer = 0;

    // Level-up system (initialized by engine)
    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = 100;

    // Hit feedback
    this.hitShakeTime = 0;
    this.knockbackX = 0;
    this.knockbackY = 0;

    // Visual effects
    this.pulseScale = 1; // For kill pulse effect
    this.pulseTime = 0;
    this.pulseDuration = 0.2; // seconds
    this.auraOpacity = 0.5; // Glow aura opacity
  }

  /**
   * Darken a hex color
   * @param {string} color - Hex color (#RRGGBB or #RRGGBBAA)
   * @returns {string} Darkened hex color
   */
  darkenColor(color) {
    const hex = color.replace("#", "");
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    const a = hex.length === 8 ? hex.substring(6, 8) : "FF";

    r = Math.max(0, r - 50);
    g = Math.max(0, g - 50);
    b = Math.max(0, b - 50);

    return `#${r.toString(16).padStart(2, "0")}${g
      .toString(16)
      .padStart(2, "0")}${b.toString(16).padStart(2, "0")}${a}`;
  }

  /**
   * Load sprite sheet for player
   */
  loadSprite() {
    const spriteUrl = playerSpriteSheets[this.characterType];
    if (!spriteUrl) return;

    const img = new Image();
    img.onload = () => {
      this.spriteImage = img;
      this.spriteLoaded = true;
    };
    img.onerror = () => {
      console.warn(`Failed to load sprite for player: ${this.characterType}`);
    };
    img.src = spriteUrl;
  }

  /**
   * Load profile icon for player
   */
  loadProfileImage() {
    const profileUrl = playerProfiles[this.characterType];
    if (!profileUrl) return;

    const img = new Image();
    img.onload = () => {
      this.profileImage = img;
      this.profileImageLoaded = true;
    };
    img.onerror = () => {
      console.warn(
        `Failed to load profile image for player: ${this.characterType}`
      );
    };
    img.src = profileUrl;
  }

  /**
   * Update player state
   * @param {number} dt - Delta time in seconds
   * @param {Object} input - Input state {keys, mouse}
   * @param {Object} camera - Camera object for coordinate conversion
   * @param {Array} enemies - Array of enemies for autoshoot targeting
   */
  update(dt, input, camera = null, enemies = [], mapSystem = null) {
    // Handle mode switch (Space to toggle autoshoot)
    if (input.keys["Space"]) {
      this.autoShoot = !this.autoShoot;
      input.keys["Space"] = false; // Prevent toggle spam
    }

    // Handle movement input (WASD)
    let moveX = 0;
    let moveY = 0;

    if (input.keys["KeyW"] || input.keys["ArrowUp"]) moveY -= 1;
    if (input.keys["KeyS"] || input.keys["ArrowDown"]) moveY += 1;
    if (input.keys["KeyA"] || input.keys["ArrowLeft"]) moveX -= 1;
    if (input.keys["KeyD"] || input.keys["ArrowRight"]) moveX += 1;

    // Normalize diagonal movement
    if (moveX !== 0 || moveY !== 0) {
      const normalized = normalize(moveX, moveY);
      moveX = normalized.x;
      moveY = normalized.y;
    }

    // Apply movement to velocity
    this.velocityX += moveX * this.speed * dt * 10;
    this.velocityY += moveY * this.speed * dt * 10;

    // Apply friction
    this.velocityX *= this.friction;
    this.velocityY *= this.friction;

    // Apply knockback decay
    this.knockbackX *= 0.9;
    this.knockbackY *= 0.9;

    // Update position
    this.x += (this.velocityX + this.knockbackX) * dt;
    this.y += (this.velocityY + this.knockbackY) * dt;

    // Clamp to map boundaries if map system is provided
    if (mapSystem) {
      const clamped = mapSystem.clampToBounds(this.x, this.y, this.radius);
      this.x = clamped.x;
      this.y = clamped.y;
    }

    // Update aim position
    if (this.autoShoot) {
      // Find closest enemy within range
      let closestEnemy = null;
      let closestDistance = this.autoShootRange;

      for (const enemy of enemies) {
        // Skip dead enemies
        if (enemy.dead) {
          continue;
        }

        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }

      // Aim at closest enemy or keep last aim if none found
      if (closestEnemy) {
        this.aimX = closestEnemy.x;
        this.aimY = closestEnemy.y;
      }
    } else {
      // Manual aim with mouse
      let mouseWorldX = input.mouse.x;
      let mouseWorldY = input.mouse.y;

      if (camera) {
        // Add camera offset to convert screen coords to world coords
        mouseWorldX += camera.x + camera.shakeOffsetX;
        mouseWorldY += camera.y + camera.shakeOffsetY;
      }

      this.aimX = mouseWorldX;
      this.aimY = mouseWorldY;
    }

    // Calculate aim angle
    this.aimAngle = Math.atan2(this.aimY - this.y, this.aimX - this.x);

    // Update sprite direction based on velocity
    const speed = Math.sqrt(
      this.velocityX * this.velocityX + this.velocityY * this.velocityY
    );
    if (speed > 5) {
      this.currentRow = getDirectionRow(this.velocityX, this.velocityY);

      // Update animation
      this.animationTime += dt;
      if (this.animationTime >= this.spritesheetConfig.animationSpeed) {
        this.animationTime = 0;
        const walkFrames = this.spritesheetConfig.animationFrames.walk;
        this.currentFrame = (this.currentFrame + 1) % walkFrames.length;
      }
    } else {
      // Idle frame when not moving
      this.currentFrame = 0;
      this.animationTime = 0;
    }

    // Update timers
    if (this.invulnerable) {
      this.invulnerableTime += dt;
      if (this.invulnerableTime >= this.invulnerableDuration) {
        this.invulnerable = false;
        this.invulnerableTime = 0;
      }
    }

    this.attackTimer += dt;

    if (this.hitShakeTime > 0) {
      this.hitShakeTime -= dt;
    }

    // Update pulse effect
    if (this.pulseTime > 0) {
      this.pulseTime -= dt;
      const progress = 1 - this.pulseTime / this.pulseDuration;
      this.pulseScale = 1 + progress * 0.15; // Pulse outward
    } else {
      this.pulseScale += (1 - this.pulseScale) * 0.1; // Return to normal
    }
  }

  /**
   * Trigger kill pulse effect
   */
  triggerKillPulse() {
    this.pulseTime = this.pulseDuration;
  }

  /**
   * Check if player can attack
   * @returns {boolean} True if attack is ready
   */
  canAttack() {
    return this.attackTimer >= this.attackCooldown;
  }

  /**
   * Reset attack timer after firing
   */
  resetAttack() {
    this.attackTimer = 0;
  }

  /**
   * Take damage
   * @param {number} amount - Damage amount
   * @returns {boolean} True if damage was taken
   */
  takeDamage(amount) {
    if (this.invulnerable) return false;

    this.health -= amount;
    this.health = Math.max(0, this.health);
    this.invulnerable = true;
    this.invulnerableTime = 0;
    this.hitShakeTime = 0.15; // Screen shake duration

    return true;
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
   * Check if player is alive
   * @returns {boolean} True if alive
   */
  isAlive() {
    return this.health > 0;
  }

  /**
   * Draw shadow under the player
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
    ctx.ellipse(
      screenX,
      shadowY,
      shadowWidth / 2,
      shadowHeight / 2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();
  }

  /**
   * Render the player
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cameraX - Camera offset X
   * @param {number} cameraY - Camera offset Y
   */
  render(ctx, cameraX = 0, cameraY = 0) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    // Draw shadow under player
    this.drawShadow(ctx, screenX, screenY);

    // --- Affichage de la range en cercle complet blanc semi-transparent ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.range, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    ctx.restore();

    // Flash effect when invulnerable
    if (this.invulnerable && Math.floor(this.invulnerableTime * 20) % 2 === 0) {
      ctx.globalAlpha = 0.5;
    }

    // Draw sprite if available
    if (this.spriteLoaded && this.spriteImage && this.spritesheetConfig) {
      const config = this.spritesheetConfig;
      const walkFrames = config.animationFrames.walk;
      const frameIndex = walkFrames[this.currentFrame];
      const totalScale = config.scale * this.scale; // Combine spritesheet and character scale

      // Calculate source position in spritesheet
      const srcX = (frameIndex % config.framesPerRow) * config.frameWidth;
      const srcY = this.currentRow * config.frameHeight;

      // Draw sprite
      ctx.save();
      ctx.translate(screenX, screenY);
      ctx.scale(this.scaleX, this.scaleY);

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
      // Draw player circle with pulse effect
      const pulseRadius = this.radius * this.pulseScale;
      ctx.beginPath();
      ctx.arc(screenX, screenY, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.strokeStyle = this.outlineColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw aim direction indicator
    const indicatorLength = this.radius + 10;
    const indicatorX = screenX + Math.cos(this.aimAngle) * indicatorLength;
    const indicatorY = screenY + Math.sin(this.aimAngle) * indicatorLength;

    if (this.autoShoot) {
      // Autoshoot mode: draw a red/orange targeting reticle
      ctx.strokeStyle = "#FF6B35";
      ctx.lineWidth = 2.5;

      // Crosshair
      ctx.beginPath();
      ctx.moveTo(indicatorX - 5, indicatorY);
      ctx.lineTo(indicatorX + 5, indicatorY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(indicatorX, indicatorY - 5);
      ctx.lineTo(indicatorX, indicatorY + 5);
      ctx.stroke();

      // Circle around indicator
      ctx.beginPath();
      ctx.arc(indicatorX, indicatorY, 6, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Manual aim mode: simple line indicator
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(indicatorX, indicatorY);
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;

    // Draw health bar
    const barWidth = 40;
    const barHeight = 4;
    const barX = screenX - barWidth / 2;
    const barY = screenY - this.radius - 10;

    // Background
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Health
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = "#00FF00";
    ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
  }

  /**
   * Get screen shake intensity based on hit timing
   * @returns {number} Shake intensity (0-1)
   */
  getShakeIntensity() {
    if (this.hitShakeTime <= 0) return 0;
    return this.hitShakeTime / 0.15; // Normalized shake
  }
}
