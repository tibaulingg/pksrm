/**
 * Floating damage number entity
 * Displayed when damage is dealt
 */
export class DamageNumber {
  constructor(x, y, damage, color = '#FFFFFF', isCrit = false) {
    this.x = x;
    this.y = y;
    this.damage = Math.round(damage);
    this.color = color; // Couleur du texte
    this.isCrit = isCrit;
    // Animation
    this.lifetime = 1.5; // seconds
    this.age = 0;
    this.velocityX = (Math.random() - 0.5) * 40; // Slight horizontal spread
    this.velocityY = -80; // Float upward
    // Appearance
    this.fontSize = isCrit ? 13 : 10;
    this.opacity = 1;
  }

  /**
   * Update damage number
   * @param {number} dt - Delta time in seconds
   * @returns {boolean} True if still active
   */
  update(dt) {
    this.age += dt;
    
    // Update position
    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;
    
    // Fade out
    const progress = this.age / this.lifetime;
    this.opacity = Math.max(0, 1 - progress);
    
    return this.age < this.lifetime;
  }

  /**
   * Render damage number
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cameraX - Camera offset X
   * @param {number} cameraY - Camera offset Y
   */
  render(ctx, cameraX = 0, cameraY = 0) {
    const screenX = this.x - cameraX;
    const screenY = this.y - cameraY;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.font = `${this.isCrit ? 'bold italic' : 'bold'} ${this.fontSize}px 'Pokemon Classic', Arial`;
    ctx.fillStyle = this.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';
    
    // Add shadow for better visibility
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(this.damage.toString(), screenX, screenY);
    ctx.restore();
  }
}

/**
 * Factory function
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} damage - Damage amount
 * @param {string} color - Text color (default white for enemy damage)
 * @returns {DamageNumber} New damage number
 */
export function createDamageNumber(x, y, damage, color = '#FFFFFF', isCrit = false) {
  return new DamageNumber(x, y, damage, color, isCrit);
}
