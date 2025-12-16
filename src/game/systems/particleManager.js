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
    // Génère une couleur aléatoire autour de la couleur de base
    this.color = Particle.randomizeColor(options.color || '#FFC107');
    this.size = options.size || 4;
    this.maxSize = this.size;

    // Lifetime
    this.lifetime = options.lifetime || 0.5;
    this.age = 0;
    this.active = true;
  }

  // Génère une couleur plus claire ou plus foncée autour d'une couleur de base
  static randomizeColor(baseColor) {
    // Supporte les couleurs hexadécimales #RRGGBB ou #RRGGBBAA
    let hex = baseColor.replace('#', '');
    if (hex.length === 8) hex = hex.slice(0, 6); // ignore alpha
    if (hex.length !== 6) return baseColor;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    // Variation de -40 à +40 sur chaque composant
    function clamp(val) { return Math.max(0, Math.min(255, val)); }
    const variation = () => Math.floor((Math.random() - 0.5) * 80); // [-40, +40]
    const nr = clamp(r + variation());
    const ng = clamp(g + variation());
    const nb = clamp(b + variation());
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
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
    // Dessiner un petit carré centré sur la position de la particule
    ctx.fillRect(screenX - this.size / 2, screenY - this.size / 2, this.size, this.size);
    
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
  spawnDeathExplosion(x, y, color = '#FF6B6B', count = 12, isBoss = false) {


    if (isBoss) {
      count *= 3; // Plus de particules pour les boss
    }

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const speed = 150 + Math.random() * 150;
      
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: isBoss ? 50 : 100,
        color: color,
        size: 5 + Math.random() * 4,
        lifetime: isBoss ? 5 + Math.random() * 0.3 : 0.6 + Math.random() * 0.3,
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

  spawnExplosion(x, y, radius = 60, color = '#FFA500') {
    const count = Math.max(16, Math.floor(radius / 3));
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 220 + Math.random() * 260;
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 140,
        color: color,
        size: 6 + Math.random() * 5,
        lifetime: 0.65 + Math.random() * 0.35,
      });
      this.particles.push(particle);
    }
    const ringCount = 10;
    for (let i = 0; i < ringCount; i++) {
      const angle = (Math.PI * 2 * i) / ringCount;
      const speed = radius * 8;
      const particle = new Particle(x, y, {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0,
        color: color,
        size: 9,
        lifetime: 0.22,
      });
      this.particles.push(particle);
    }
    const flash = new Particle(x, y, {
      vx: 0,
      vy: 0,
      gravity: 0,
      color: color,
      size: radius * 0.9,
      lifetime: 0.15,
    });
    this.particles.push(flash);
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
