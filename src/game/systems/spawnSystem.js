import { randomSpawnOnEdge, randomInt } from '../../utils/math.js';
import { createEnemy } from '../entities/enemy.js';
import { getRandomEnemyType } from '../entities/enemyConfig.js';

/**
 * Spawn system for managing enemy waves
 * Handles periodic enemy spawning with increasing difficulty
 */
export class SpawnSystem {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    
    // Spawn configuration
    this.spawnInterval = 2.0; // seconds between spawns
    this.spawnTimer = 0;
    this.spawnMargin = 80; // pixels outside screen
    
    // Wave configuration
    this.baseEnemiesPerSpawn = 2;
    this.enemiesPerSpawn = this.baseEnemiesPerSpawn;
    
    // Difficulty scaling
    this.difficultyTimer = 0;
    this.difficultyIncreaseInterval = 30; // seconds
    this.maxEnemiesPerSpawn = 15;
    
    // Stats
    this.totalSpawned = 0;
    this.waveNumber = 1;
  }

  /**
   * Update spawn system
   * @param {number} dt - Delta time in seconds
   * @param {Array} enemies - Enemy array to spawn into
   * @param {Object} player - Player reference for spawn positioning
   * @param {Object} mapSystem - Map system reference for boundary checking
   */
  update(dt, enemies, player, mapSystem = null) {
    // Update timers
    this.spawnTimer += dt;
    this.difficultyTimer += dt;
    
    // Increase difficulty over time
    if (this.difficultyTimer >= this.difficultyIncreaseInterval) {
      this.difficultyTimer = 0;
      this.waveNumber++;
      this.increaseDifficulty();
    }
    
    // Spawn enemies
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnTimer = 0;
      this.spawnWave(enemies, player, mapSystem);
    }
  }

  /**
   * Spawn a wave of enemies
   * @param {Array} enemies - Enemy array to spawn into
   * @param {Object} player - Player reference for spawn positioning
   * @param {Object} mapSystem - Map system reference for boundary checking
   */
  spawnWave(enemies, player, mapSystem = null) {
    const enemiesToSpawn = this.enemiesPerSpawn;
    
    for (let i = 0; i < enemiesToSpawn; i++) {
      // Random spawn position on screen edge
      const spawnPos = randomSpawnOnEdge(
        this.screenWidth,
        this.screenHeight,
        this.spawnMargin
      );
      
      // Offset spawn position relative to player (world coordinates)
      let worldX = player.x + (spawnPos.x - this.screenWidth / 2);
      let worldY = player.y + (spawnPos.y - this.screenHeight / 2);
      
      // Clamp to map boundaries if map system is provided
      if (mapSystem) {
        const clamped = mapSystem.clampToBounds(worldX, worldY, 20); // 20 = enemy radius
        worldX = clamped.x;
        worldY = clamped.y;
      }
      
      // Get random enemy type based on difficulty
      const enemyType = getRandomEnemyType();
      
      // Create and add enemy
      const enemy = createEnemy(worldX, worldY, enemyType);
      enemies.push(enemy);
      
      this.totalSpawned++;
    }
  }

  /**
   * Increase difficulty
   * TODO: Add more difficulty scaling parameters (enemy speed, health, etc.)
   */
  increaseDifficulty() {
    // Increase enemies per spawn
    if (this.enemiesPerSpawn < this.maxEnemiesPerSpawn) {
      this.enemiesPerSpawn = Math.min(
        this.maxEnemiesPerSpawn,
        this.enemiesPerSpawn + 1
      );
    }
    
    // Decrease spawn interval (faster spawns)
    if (this.spawnInterval > 0.5) {
      this.spawnInterval = Math.max(0.5, this.spawnInterval - 0.1);
    }
  }

  /**
   * Update screen dimensions (for window resize)
   * @param {number} width - New screen width
   * @param {number} height - New screen height
   */
  updateScreenSize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  /**
   * Reset spawn system
   */
  reset() {
    this.spawnTimer = 0;
    this.difficultyTimer = 0;
    this.enemiesPerSpawn = this.baseEnemiesPerSpawn;
    this.spawnInterval = 2.0;
    this.totalSpawned = 0;
    this.waveNumber = 1;
  }

  /**
   * Get current difficulty stats
   * @returns {Object} Difficulty information
   */
  getDifficultyInfo() {
    return {
      wave: this.waveNumber,
      enemiesPerSpawn: this.enemiesPerSpawn,
      spawnInterval: this.spawnInterval.toFixed(1),
      totalSpawned: this.totalSpawned,
    };
  }
}
