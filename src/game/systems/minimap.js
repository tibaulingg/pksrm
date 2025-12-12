/**
 * Minimap system
 * Displays a small overview of the game world
 */
export class Minimap {
  constructor(canvasWidth, canvasHeight, options = {}) {
    // Minimap size
    this.width = options.width || 180;
    this.height = options.height || 180;
    
    // Position (bottom-right)
    this.x = canvasWidth - this.width - 10;
    this.y = canvasHeight - this.height - 10;
    
    // World view
    this.viewDistance = options.viewDistance || 1000; // How far to see from player
    this.scale = this.width / (this.viewDistance * 2); // Scale from world to minimap
    
    // Colors
    this.backgroundColor = options.backgroundColor || 'rgba(0, 0, 0, 0.7)';
    this.borderColor = options.borderColor || '#00FF00';
    this.playerColor = options.playerColor || '#00FF00';
    this.enemyColor = options.enemyColor || '#FF3333';
    this.xpOrbColor = options.xpOrbColor || '#FFD700';
    
    // Border
    this.borderWidth = 2;
  }

  /**
   * Render minimap
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} player - Player entity
   * @param {Array} enemies - Array of enemies
   * @param {Array} xpOrbs - Array of XP orbs
   */
  render(ctx, player, enemies = [], xpOrbs = []) {
    if (!player) return;

    ctx.save();

    // Draw background
    ctx.fillStyle = this.backgroundColor;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Draw borders (yellow like HUD border)
    ctx.strokeStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.lineWidth = 2;
    
    // Left border
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x, this.y + this.height);
    ctx.stroke();
    
    // Bottom border
    ctx.beginPath();
    ctx.moveTo(this.x, this.y + this.height);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.stroke();
    
    // Top border (optional - full enclosure)
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x + this.width, this.y);
    ctx.stroke();
    
    // Right border (optional - full enclosure)
    ctx.beginPath();
    ctx.moveTo(this.x + this.width, this.y);
    ctx.lineTo(this.x + this.width, this.y + this.height);
    ctx.stroke();

    // Set clipping area
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.clip();

    // Center of minimap
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;

    // Draw XP orbs
    for (const orb of xpOrbs) {
      if (!orb || orb.dead) continue;
      
      const relX = orb.x - player.x;
      const relY = orb.y - player.y;
      
      const mapX = centerX + relX * this.scale;
      const mapY = centerY + relY * this.scale;
      
      ctx.fillStyle = this.xpOrbColor;
      ctx.beginPath();
      ctx.arc(mapX, mapY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw enemies
    for (const enemy of enemies) {
      if (!enemy || enemy.dead) continue;
      
      const relX = enemy.x - player.x;
      const relY = enemy.y - player.y;
      
      const mapX = centerX + relX * this.scale;
      const mapY = centerY + relY * this.scale;
      
      ctx.fillStyle = this.enemyColor;
      ctx.beginPath();
      ctx.arc(mapX, mapY, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw player (always at center)
    ctx.fillStyle = this.playerColor;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw player direction indicator
    const dirSize = 6;
    ctx.strokeStyle = this.playerColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - dirSize);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Set minimap visibility
   * @param {boolean} visible - Whether minimap should be visible
   */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
   * Toggle minimap visibility
   */
  toggle() {
    this.visible = !this.visible;
  }

  /**
   * Reposition minimap
   * @param {number} x - New X position
   * @param {number} y - New Y position
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Update view distance (zoom)
   * @param {number} distance - New view distance
   */
  setViewDistance(distance) {
    this.viewDistance = distance;
    this.scale = this.width / (this.viewDistance * 2);
  }

  /**
   * Get minimap bounds
   * @returns {Object} Bounds object with x, y, width, height
   */
  getBounds() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
