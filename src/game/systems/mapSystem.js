/**
 * Map System
 * Handles map boundaries with fixed tile-based size
 */

export class MapSystem {
  constructor(tilesWidth = 64, tilesHeight = 64, tileSize = 32) {
    // Map size in tiles
    this.tilesWidth = tilesWidth;
    this.tilesHeight = tilesHeight;
    this.tileSize = tileSize; // Size of each tile in world units

    // Actual map dimensions in world units
    this.width = tilesWidth * tileSize;
    this.height = tilesHeight * tileSize;

    // Map padding/margin - area where entities can still be active
    this.padding = 200;

    // Generated features (for future expansion)
    this.features = [];

    // Boundary properties
    this.borderColor = "rgba(100, 100, 150, 0.5)";
    this.borderWidth = 3;
  }

  /**
   * Initialize the map (nothing random now, just fixed size)
   */
  initialize() {
    // Generate map features (placeholder for future)
    this.generateFeatures();
  }

  /**
   * Generate random map features (for future expansion)
   * Could include obstacles, terrain, etc.
   */
  generateFeatures() {
    this.features = [];
    // TODO: Add obstacles, terrain features, safe zones, etc.
  }

  /**
   * Check if a position is within map boundaries
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {boolean} True if within boundaries
   */
  isWithinBounds(x, y) {
    return x >= 0 && x <= this.width && y >= 0 && y <= this.height;
  }

  /**
   * Check if a position with radius is within playable area
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Entity radius
   * @returns {boolean} True if entirely within boundaries
   */
  isWithinBoundsWithRadius(x, y, radius) {
    return (
      x - radius >= 0 &&
      x + radius <= this.width &&
      y - radius >= 0 &&
      y + radius <= this.height
    );
  }

  /**
   * Clamp a position to stay within bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} radius - Entity radius
   * @returns {Object} Clamped {x, y} position
   */
  clampToBounds(x, y, radius = 0) {
    const clampedX = Math.max(radius, Math.min(x, this.width * 2 - radius));
    const clampedY = Math.max(radius, Math.min(y, this.height * 2 - radius));
    return { x: clampedX, y: clampedY };
  }

  /**
   * Get a random position within the map
   * @param {number} padding - Padding from edges
   * @returns {Object} Random {x, y} position
   */
  getRandomPosition(padding = this.padding) {
    const x = padding + Math.random() * (this.width - padding * 2);
    const y = padding + Math.random() * (this.height - padding * 2);
    return { x, y };
  }

  /**
   * Get map center
   * @returns {Object} Center {x, y} position
   */
  getCenter() {
    return {
      x: this.width,
      y: this.height,
    };
  }

  /**
   * Render map boundaries and border
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} cameraX - Camera X offset
   * @param {number} cameraY - Camera Y offset
   */
  render(ctx, cameraX, cameraY) {
    // Draw border outline
    ctx.strokeStyle = "rgba(235, 115, 115, 0.5)";
    ctx.lineWidth = this.borderWidth;
    ctx.setLineDash([10, 5]); // Dashed line

    const x = -cameraX;
    const y = -cameraY;

    ctx.strokeRect(x, y, this.width * 2, this.height * 2);

    ctx.setLineDash([]); // Reset line dash
  }

  /**
   * Get map info
   * @returns {Object} Map information
   */
  getInfo() {
    return {
      width: this.width,
      height: this.height,
      tilesWidth: this.tilesWidth,
      tilesHeight: this.tilesHeight,
      area: this.width * this.height,
      center: this.getCenter(),
    };
  }

  /**
   * Reset map system
   */
  reset() {
    this.features = [];
    this.initialize();
  }
}
