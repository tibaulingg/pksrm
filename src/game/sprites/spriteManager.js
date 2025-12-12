/**
 * Sprite Manager for handling sprite loading and caching
 */

export class SpriteManager {
  constructor() {
    this.sprites = new Map(); // Cache for loaded sprites
    this.loadingPromises = new Map(); // Track loading promises
  }

  /**
   * Load a sprite image
   * @param {string|Image} pathOrImage - Path to the sprite image or Image object
   * @returns {Promise<Image>} Promise that resolves to the loaded image
   */
  loadSprite(pathOrImage) {
    // If already an Image object (imported), wrap it in resolved promise
    if (pathOrImage instanceof Image || (typeof pathOrImage === 'object' && pathOrImage.src)) {
      const cacheKey = pathOrImage.src || 'imported-image';
      if (this.sprites.has(cacheKey)) {
        return Promise.resolve(this.sprites.get(cacheKey));
      }
      this.sprites.set(cacheKey, pathOrImage);
      return Promise.resolve(pathOrImage);
    }

    const path = pathOrImage;
    
    // Return cached sprite if available
    if (this.sprites.has(path)) {
      return Promise.resolve(this.sprites.get(path));
    }

    // Return existing loading promise if in progress
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path);
    }

    // Create new loading promise
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.sprites.set(path, img);
        this.loadingPromises.delete(path);
        resolve(img);
      };
      img.onerror = () => {
        console.error(`Failed to load sprite: ${path}`);
        this.loadingPromises.delete(path);
        reject(new Error(`Failed to load sprite: ${path}`));
      };
      img.src = path;
    });

    this.loadingPromises.set(path, loadPromise);
    return loadPromise;
  }

  /**
   * Get a cached sprite
   * @param {string} path - Path to the sprite image
   * @returns {Image|null} The sprite image or null if not loaded
   */
  getSprite(path) {
    return this.sprites.get(path) || null;
  }

  /**
   * Clear the sprite cache
   */
  clear() {
    this.sprites.clear();
    this.loadingPromises.clear();
  }
}

// Global sprite manager instance
export const spriteManager = new SpriteManager();
