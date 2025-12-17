/**
 * Map System
 * Handles map boundaries with fixed tile-based size
 */

export class MapSystem {
  constructor(tilesWidth = 64, tilesHeight = 64, tileSize = 32, playableOffsetTiles = 0, blockedTiles = []) {
    this.tilesWidth = tilesWidth;
    this.tilesHeight = tilesHeight;
    this.tileSize = tileSize;

    this.width = tilesWidth * tileSize;
    this.height = tilesHeight * tileSize;

    this.playableOffsetTiles = playableOffsetTiles;
    this.blockedTiles = new Set();
    this.setBlockedTiles(blockedTiles);
    this.updatePlayableBounds();

    this.padding = 200;

    this.features = [];

    this.borderColor = "rgba(100, 100, 150, 0.5)";
    this.borderWidth = 3;
  }

  setBlockedTiles(blockedTiles) {
    this.blockedTiles.clear();
    blockedTiles.forEach(tile => {
      const key = `${tile.x},${tile.y}`;
      this.blockedTiles.add(key);
    });
  }

  isTileBlocked(tileX, tileY) {
    const key = `${tileX},${tileY}`;
    return this.blockedTiles.has(key);
  }

  worldToTile(worldX, worldY) {
    return {
      x: Math.floor(worldX / this.tileSize),
      y: Math.floor(worldY / this.tileSize),
    };
  }

  isPositionBlocked(worldX, worldY, radius = 0) {
    const tile = this.worldToTile(worldX, worldY);
    if (this.isTileBlocked(tile.x, tile.y)) {
      return true;
    }
    
    if (radius > 0) {
      const checkTiles = [
        { x: tile.x - 1, y: tile.y },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x, y: tile.y + 1 },
        { x: tile.x - 1, y: tile.y - 1 },
        { x: tile.x + 1, y: tile.y - 1 },
        { x: tile.x - 1, y: tile.y + 1 },
        { x: tile.x + 1, y: tile.y + 1 },
      ];
      
      for (const checkTile of checkTiles) {
        const tileWorldX = checkTile.x * this.tileSize + this.tileSize / 2;
        const tileWorldY = checkTile.y * this.tileSize + this.tileSize / 2;
        const distance = Math.sqrt(
          Math.pow(worldX - tileWorldX, 2) + Math.pow(worldY - tileWorldY, 2)
        );
        if (distance < radius && this.isTileBlocked(checkTile.x, checkTile.y)) {
          return true;
        }
      }
    }
    
    return false;
  }

  updatePlayableBounds() {
    const offset = this.playableOffsetTiles * this.tileSize;
    this.playableMinX = offset;
    this.playableMinY = offset;
    this.playableMaxX = this.width - offset;
    this.playableMaxY = this.height - offset;
    this.playableWidth = this.playableMaxX - this.playableMinX;
    this.playableHeight = this.playableMaxY - this.playableMinY;
  }

  setPlayableOffset(offsetTiles) {
    this.playableOffsetTiles = offsetTiles;
    this.updatePlayableBounds();
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

  isWithinBounds(x, y) {
    if (x < this.playableMinX || x > this.playableMaxX || y < this.playableMinY || y > this.playableMaxY) {
      return false;
    }
    return !this.isPositionBlocked(x, y);
  }

  isWithinBoundsWithRadius(x, y, radius) {
    if (
      x - radius < this.playableMinX ||
      x + radius > this.playableMaxX ||
      y - radius < this.playableMinY ||
      y + radius > this.playableMaxY
    ) {
      return false;
    }
    return !this.isPositionBlocked(x, y, radius);
  }

  clampToBounds(x, y, radius = 0) {
    let clampedX = Math.max(this.playableMinX + radius, Math.min(x, this.playableMaxX - radius));
    let clampedY = Math.max(this.playableMinY + radius, Math.min(y, this.playableMaxY - radius));
    
    if (this.isPositionBlocked(clampedX, clampedY, radius)) {
      const tile = this.worldToTile(clampedX, clampedY);
      if (this.isTileBlocked(tile.x, tile.y)) {
        const tileCenterX = tile.x * this.tileSize + this.tileSize / 2;
        const tileCenterY = tile.y * this.tileSize + this.tileSize / 2;
        const dx = clampedX - tileCenterX;
        const dy = clampedY - tileCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < radius + this.tileSize / 2) {
          const angle = Math.atan2(dy, dx);
          clampedX = tileCenterX + Math.cos(angle) * (radius + this.tileSize / 2 + 1);
          clampedY = tileCenterY + Math.sin(angle) * (radius + this.tileSize / 2 + 1);
        }
      }
    }
    
    return { x: clampedX, y: clampedY };
  }

  getRandomPosition(padding = this.padding) {
    const minX = Math.max(this.playableMinX + padding, this.playableMinX);
    const maxX = Math.min(this.playableMaxX - padding, this.playableMaxX);
    const minY = Math.max(this.playableMinY + padding, this.playableMinY);
    const maxY = Math.min(this.playableMaxY - padding, this.playableMaxY);
    const x = minX + Math.random() * (maxX - minX);
    const y = minY + Math.random() * (maxY - minY);
    return { x, y };
  }

  getCenter() {
    return {
      x: (this.playableMinX + this.playableMaxX) / 2,
      y: (this.playableMinY + this.playableMaxY) / 2,
    };
  }

  render(ctx, cameraX, cameraY) {
    ctx.strokeStyle = "rgba(235, 115, 115, 0.5)";
    ctx.lineWidth = this.borderWidth;
    ctx.setLineDash([10, 5]);

    const x = this.playableMinX - cameraX;
    const y = this.playableMinY - cameraY;

    ctx.strokeRect(x, y, this.playableWidth, this.playableHeight);

    ctx.setLineDash([]);
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

  updateDimensions(tilesWidth, tilesHeight, tileSize, playableOffsetTiles = null, blockedTiles = null) {
    this.tilesWidth = tilesWidth;
    this.tilesHeight = tilesHeight;
    this.tileSize = tileSize;
    this.width = tilesWidth * tileSize;
    this.height = tilesHeight * tileSize;
    if (playableOffsetTiles !== null) {
      this.playableOffsetTiles = playableOffsetTiles;
    }
    if (blockedTiles !== null) {
      this.setBlockedTiles(blockedTiles);
    }
    this.updatePlayableBounds();
  }
}
