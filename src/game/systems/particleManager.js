/**
 * Particle system for visual effects
 * Handles death explosions, impacts, and other visual feedback
 */
export class Particle {
  constructor(x, y, options = {}) {
    // Position
    this.x = x;
    this.y = y;
    
    // Movement
    this.vx = options.vx || 0;
    this.vy = options.vy || 0;
    this.gravity = options.gravity || 0;
    
    // Visual
    this.color = options.color || '#FFC107';
    this.size = options.size || 4;
    this.maxSize = this.size;
    
    // Lifetime
    this.lifetime = options.lifetime || 0.5;
    this.age = 0;
    this.active = true;
  }

  update(dt) {
    if (!this.active) return;

    this.age += dt;
    
    // Physics
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vy += this.gravity * dt;
    
    // Friction
    this.vx *= 0.95;
    this.vy *= 0.95;
    
    // Shrink over time
    const progress = this.age / this.lifetime;
    this.size = this.maxSize * (1 - progress);
    
    // Deactivate when done
    if (this.age >= this.lifetime) {
      this.active = false;
    }
  }

  render(ctx, cameraX, cameraY) {
    if (!this.active || this.size <= 0) return;

    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;
    
    // Fade out
    const alpha = 1 - (this.age / this.lifetime);
    ctx.globalAlpha = alpha;
    
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(screenX, screenY, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
  }
}

/**
 * Particle manager - handles all particles
 */
export class ParticleManager {
  constructor() {
    this.particles = [];
  }

  /**
   * Spawn death explosion particles
   */
  spawnDeathExplosion(x, y, color = '#FF6B6B', count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 150 + Math.random() * 150;
      
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 300,
        color: color,
        size: 5 + Math.random() * 4,
        lifetime: 0.6 + Math.random() * 0.3,
      });
      
      this.particles.push(particle);
    }
  }

  /**
   * Spawn hit impact particles
   */
  spawnHitImpact(x, y, color = '#FFD700', count = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 150,
        color: color,
        size: 3 + Math.random() * 3,
        lifetime: 0.4 + Math.random() * 0.2,
      });
      
      this.particles.push(particle);
    }
  }

  /**
   * Spawn projectile hit particles
   */
  spawnProjectileHit(x, y) {
    this.spawnHitImpact(x, y, '#FFA500', 8);
  }

  /**
   * Spawn XP collection particles
   */
  spawnXpParticles(x, y, count = 8) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 150;
      
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 100,
        color: '#53CEF7FF',
        size: 3 + Math.random() * 2,
        lifetime: 0.5 + Math.random() * 0.2,
      });
      
      this.particles.push(particle);
    }
  }

  /**
   * Update all particles
   */
  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update(dt);
      
      if (!this.particles[i].active) {
        this.particles.splice(i, 1);
      }
    }
  }

  /**
   * Render all particles
   */
  render(ctx, cameraX, cameraY) {
    for (const particle of this.particles) {
      particle.render(ctx, cameraX, cameraY);
    }
  }

  /**
   * Clear all particles
   */
  clear() {
    this.particles = [];
  }
}
