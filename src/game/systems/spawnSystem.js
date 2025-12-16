import { randomSpawnOnEdge } from "../../utils/math.js";
import { createEnemy } from "../entities/enemy.js";
import { getEnabledEnemies } from "../config/levelConfig.js";

/**
 * Spawn system
 * - Wave-based spawning
 * - Difficulty scaling
 * - HP scaling over time (configurable power)
 * - Boss spawning with music anticipation
 */
export class SpawnSystem {
  constructor(
    screenWidth,
    screenHeight,
    levelConfig = null,
    songManager = null
  ) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
    this.levelConfig = levelConfig;
    this.songManager = songManager;

    /* ---------- Spawn config ---------- */
    this.spawnMargin = 80;

    /* ---------- Waves ---------- */
    this.waveTimer = 0;
    this.waveInterval = 5.0;
    this.baseEnemiesPerWave = 4;
    this.enemiesPerWave = this.baseEnemiesPerWave;
    this.maxEnemiesPerWave = 25;

    /* ---------- Difficulty ---------- */
    this.difficultyTimer = 0;
    this.difficultyIncreaseInterval = 25;

    /* ---------- Time scaling ---------- */
    this.elapsedTime = 0;

    /* ---------- Stats ---------- */
    this.totalSpawned = 0;
    this.waveNumber = 1;

    /* ---------- Boss ---------- */
    this.bossSpawned = false;
    this.bossTimer = 0;
    this.bossConfig = null;
    this.bossMusicPlayed = false;
  }

  /* ===============================
     CONFIG
  =============================== */

  setLevelConfig(levelConfig) {
    this.levelConfig = levelConfig;

    this.bossSpawned = false;
    this.bossTimer = 0;
    this.bossMusicPlayed = false;
    this.bossConfig = null;

    if (levelConfig?.boss) {
      const bossType = Object.keys(levelConfig.boss)[0];
      if (bossType) {
        this.bossConfig = {
          type: bossType,
          ...levelConfig.boss[bossType],
        };
      }
    }
  }

  /* ===============================
     UPDATE
  =============================== */

  update(dt, enemies, player, mapSystem = null) {
    this.waveTimer += dt;
    this.difficultyTimer += dt;
    this.elapsedTime += dt;

    // Increase difficulty over time
    if (this.difficultyTimer >= this.difficultyIncreaseInterval) {
      this.difficultyTimer = 0;
      this.increaseDifficulty();
    }

    // Boss
    this.updateBoss(dt, enemies, player, mapSystem);

    // Waves
    this.spawnWaveByLevel(enemies, player, mapSystem);
  }

  /* ===============================
     BOSS
  =============================== */

  updateBoss(dt, enemies, player, mapSystem) {
    if (!this.bossConfig || this.bossSpawned) return;

    this.bossTimer += dt;

    // Play boss music before spawn
    if (
      this.songManager &&
      !this.bossMusicPlayed &&
      this.bossTimer >= this.bossConfig.spawnTimer - 7.5
    ) {
      this.songManager.set_boss_song();
      this.bossMusicPlayed = true;
    }

    if (this.bossTimer >= this.bossConfig.spawnTimer) {
      const spawnPos = randomSpawnOnEdge(
        this.screenWidth,
        this.screenHeight,
        this.spawnMargin
      );

      let x = player.x + (spawnPos.x - this.screenWidth / 2);
      let y = player.y + (spawnPos.y - this.screenHeight / 2);

      if (mapSystem) {
        const clamped = mapSystem.clampToBounds(x, y, 40);
        x = clamped.x;
        y = clamped.y;
      }

      const boss = createEnemy(x, y, this.bossConfig.type, {
        isBoss: true,
        hp: this.bossConfig.hp,
        attack: this.bossConfig.attack,
        defense: this.bossConfig.defense,
      });

      enemies.push(boss);
      this.bossSpawned = true;
    }
  }

  /* ===============================
     WAVES
  =============================== */

  spawnWaveByLevel(enemies, player, mapSystem) {
    if (!this.levelConfig) return;
    if (this.waveTimer < this.waveInterval) return;

    this.waveTimer = 0;
    this.waveNumber++;

    const enabledEnemies = getEnabledEnemies(this.levelConfig.__levelKey);
    const enemyCount = Math.min(this.enemiesPerWave, this.maxEnemiesPerWave);

    const hpMultiplier = this.getHpTimeMultiplier();

    for (let i = 0; i < enemyCount; i++) {
      const enemyConfig = this.selectEnemyType(enabledEnemies);

      const spawnPos = randomSpawnOnEdge(
        this.screenWidth,
        this.screenHeight,
        this.spawnMargin
      );

      let x = player.x + (spawnPos.x - this.screenWidth / 2);
      let y = player.y + (spawnPos.y - this.screenHeight / 2);

      if (mapSystem) {
        const clamped = mapSystem.clampToBounds(x, y, 20);
        x = clamped.x;
        y = clamped.y;
      }

      const enemy = createEnemy(x, y, enemyConfig.type);

      // 🔥 HP scaling (time-based, powered)
      enemy.health *= hpMultiplier;
      enemy.maxHealth *= hpMultiplier;

      // Optional difficulty multiplier
      if (this.levelConfig.difficultyMultiplier) {
        const d = this.levelConfig.difficultyMultiplier;
        enemy.health *= d;
        enemy.maxHealth *= d;
        enemy.damage *= d;
      }

      enemies.push(enemy);
      this.totalSpawned++;
    }
  }

  /* ===============================
     SCALING
  =============================== */

  getHpTimeMultiplier() {
    const growthRate = this.levelConfig?.hpGrowthRate ?? 0.005;
    const power = this.levelConfig?.hpGrowthPower ?? 1.0;
    const maxMultiplier = this.levelConfig?.maxHpMultiplier ?? 4;

    const scaledTime = this.elapsedTime * growthRate;
    const multiplier = 1 + Math.pow(scaledTime, power);

    return Math.min(multiplier, maxMultiplier);
  }

  increaseDifficulty() {
    if (this.enemiesPerWave < this.maxEnemiesPerWave) {
      this.enemiesPerWave += 2;
    }

    if (this.waveInterval > 0.8) {
      this.waveInterval = Math.max(0.8, this.waveInterval - 0.2);
    }
  }

  /* ===============================
     UTILS
  =============================== */

  selectEnemyType(enabledEnemies) {
    const totalWeight = enabledEnemies.reduce((sum, e) => sum + e.spawnRate, 0);
    let r = Math.random() * totalWeight;

    for (const e of enabledEnemies) {
      r -= e.spawnRate;
      if (r <= 0) return e;
    }

    return enabledEnemies[0];
  }

  updateScreenSize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  reset() {
    this.waveTimer = 0;
    this.difficultyTimer = 0;
    this.elapsedTime = 0;

    this.enemiesPerWave = this.baseEnemiesPerWave;
    this.waveInterval = 2.0;

    this.totalSpawned = 0;
    this.waveNumber = 1;

    this.bossSpawned = false;
    this.bossTimer = 0;
    this.bossMusicPlayed = false;
  }

  /** * Get boss timer (seconds since start or reset) */ getBossTimer() {
    return this.bossTimer;
  }
  /** * Get boss config (spawnTimer, etc.) */ getBossConfig() {
    return this.bossConfig;
  }

  getDifficultyInfo() {
    return {
      wave: this.waveNumber,
      enemiesPerWave: this.enemiesPerWave,
      waveInterval: this.waveInterval.toFixed(1),
      totalSpawned: this.totalSpawned,
    };
  }
}
