
import { randomSpawnOnEdge, randomInt } from '../../utils/math.js';
import { createEnemy } from '../entities/enemy.js';
import { getRandomEnemyType } from '../entities/enemyConfig.js';
import { getEnabledEnemies } from '../config/levelConfig.js';

/**
 * Spawn system for managing enemy waves
 * Handles periodic enemy spawning with increasing difficulty
 */
export class SpawnSystem {
  constructor(screenWidth, screenHeight, levelConfig = null, songManager = null) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.levelConfig = levelConfig; // Level configuration
    this.songManager = songManager; // Reference to SongManager for boss music
    
    // Spawn configuration
    this.spawnInterval = 0.1; // seconds between spawns
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
    
    // Enemy spawn rates (accumulated per second)
    this.enemySpawnTimers = {}; // Track time for each enemy type

    // Boss spawn
    this.bossSpawned = false;
    this.bossTimer = 0;
    this.bossConfig = null;
  }


  /**
   * Get boss timer (seconds since start or reset)
   */
  getBossTimer() {
    return this.bossTimer;
  }

  /**
   * Get boss config (spawnTimer, etc.)
   */
  getBossConfig() {
    return this.bossConfig;
  }

  /**
   * Set level configuration for spawn rules
   * @param {Object} levelConfig - Level configuration from levelConfig.js
   */
  setLevelConfig(levelConfig) {
    this.levelConfig = levelConfig;
    // Initialize spawn timers for enabled enemies
    this.enemySpawnTimers = {};
    if (levelConfig && levelConfig.__levelKey) {
      const enabledEnemies = getEnabledEnemies(levelConfig.__levelKey);
      enabledEnemies.forEach(enemy => {
        this.enemySpawnTimers[enemy.type] = 0;
      });
    }

    // Boss config
    this.bossSpawned = false;
    this.bossTimer = 0;
    this.bossConfig = null;
    if (levelConfig && levelConfig.boss) {
      // Only support one boss per level for now
      const bossKeys = Object.keys(levelConfig.boss);
      if (bossKeys.length > 0) {
        const bossType = bossKeys[0];
        this.bossConfig = {
          type: bossType,
          ...levelConfig.boss[bossType],
        };
      }
    }
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
    

    // Boss spawn logic
    if (this.bossConfig && !this.bossSpawned) {
      this.bossTimer += dt;

        //Mettre la music de boss 3 swecondes avant le spawn
        if (this.songManager && this.bossTimer >= this.bossConfig.spawnTimer - 7.5 && !this.bossMusicPlayed) {
          console.log('Playing boss music');
          this.songManager.set_boss_song();
          this.bossMusicPlayed = true;
        }

      if (this.bossTimer >= this.bossConfig.spawnTimer) {
        // Spawn boss
        const spawnPos = randomSpawnOnEdge(
          this.screenWidth,
          this.screenHeight,
          this.spawnMargin
        );
        let worldX = player.x + (spawnPos.x - this.screenWidth / 2);
        let worldY = player.y + (spawnPos.y - this.screenHeight / 2);
        if (mapSystem) {
          const clamped = mapSystem.clampToBounds(worldX, worldY, 40); // Boss radius
          worldX = clamped.x;
          worldY = clamped.y;
        }
        const boss = createEnemy(worldX, worldY, this.bossConfig.type, {
          isBoss: true,
          hp: this.bossConfig.hp,
          attack: this.bossConfig.attack,
          defense: this.bossConfig.defense,
        });
        enemies.push(boss);
        this.bossSpawned = true;
        console.log(`Boss ${this.bossConfig.type} spawned!`);
    
      }
    }

    this.spawnWaveByLevel(dt, enemies, player, mapSystem);
  }

  /**
   * Spawn enemies based on level configuration
   * @param {number} dt - Delta time
   * @param {Array} enemies - Enemy array
   * @param {Object} player - Player reference
   * @param {Object} mapSystem - Map system reference
   */
  spawnWaveByLevel(dt, enemies, player, mapSystem = null) {
    if (!this.levelConfig) return;
    const levelKey = this.levelConfig.__levelKey;
    const enabledEnemies = getEnabledEnemies(levelKey);
    const spawnMultiplier = this.levelConfig.spawnMultiplier || 1.0;

    enabledEnemies.forEach(enemyConfig => {
      const adjustedSpawnRate = enemyConfig.spawnRate * spawnMultiplier * this.waveNumber * 0.5; // Scale with waves
      
      // Track accumulated time for this enemy type
      if (!this.enemySpawnTimers[enemyConfig.type]) {
        this.enemySpawnTimers[enemyConfig.type] = 0;
      }
      
      this.enemySpawnTimers[enemyConfig.type] += adjustedSpawnRate * dt;
      
      // Spawn enemy if accumulated time exceeds spawn interval
      while (this.enemySpawnTimers[enemyConfig.type] >= 1.0) {
        this.enemySpawnTimers[enemyConfig.type] -= 1.0;
        
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
          const clamped = mapSystem.clampToBounds(worldX, worldY, 20);
          worldX = clamped.x;
          worldY = clamped.y;
        }
        
        // Create and add enemy
        const enemy = createEnemy(worldX, worldY, enemyConfig.type);
        
        // Apply difficulty multiplier to enemy stats
        if (this.levelConfig.difficultyMultiplier) {
          const diffMult = this.levelConfig.difficultyMultiplier;
          enemy.damage *= diffMult;
          enemy.health *= diffMult;
          enemy.maxHealth *= diffMult;
        }
        
        enemies.push(enemy);
        this.totalSpawned++;
      }
    });
  }

  /**
   * Spawn a wave of enemies (legacy method, used when no level config is set)
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
    this.spawnInterval = 0.1;
    this.totalSpawned = 0;
    this.waveNumber = 1;
    
    // Reset enemy spawn timers
    this.enemySpawnTimers = {};
    if (this.levelConfig && this.levelConfig.__levelKey) {
      const enabledEnemies = getEnabledEnemies(this.levelConfig.__levelKey);
      enabledEnemies.forEach(enemy => {
        this.enemySpawnTimers[enemy.type] = 0;
      });
    }

    // Reset boss
    this.bossSpawned = false;
    this.bossTimer = 0;
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
