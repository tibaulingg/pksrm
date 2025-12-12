import { Player } from "./entities/player.js";
import { createProjectileToTarget } from "./entities/projectile.js";
import { createXPOrb } from "./entities/xpOrb.js";
import { createDamageNumber } from "./entities/damageNumber.js";
import { SpawnSystem } from "./systems/spawnSystem.js";
import { CollisionSystem } from "./systems/collisionSystem.js";
import { ParticleManager } from "./systems/particleManager.js";
import { Minimap } from "./systems/minimap.js";
import { MapSystem } from "./systems/mapSystem.js";
import { selectRandomUpgrades, applyUpgrade } from "./systems/upgradeSystem.js";
import { calculateXpForLevel, getEffectiveXpValue } from "./config/xpConfig.js";
import { random } from "../utils/math.js";

// Import tileset
import tilesetImage from "../sprites/tileset.png";

/**
 * Main game engine class
 * Handles game loop, state management, and coordination between systems
 */
export class GameEngine {
  constructor(canvas, playerType = "piplup") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.playerType = playerType; // Store selected player type

    // Game state
    this.running = false;
    this.paused = false;
    this.gameOver = false;

    // Timing
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 0;
    this.fpsTimer = 0;
    this.frameCount = 0;

    // Input state
    this.input = {
      keys: {},
      mouse: { x: canvas.width / 2, y: canvas.height / 2 },
    };

    // Camera (follows player)
    this.camera = {
      x: 0,
      y: 0,
      shake: 0,
      shakeOffsetX: 0,
      shakeOffsetY: 0,
    };

    // Screen flash effect
    this.screenFlash = 0;
    this.screenFlashColor = "rgba(255, 0, 0, 0.3)";

    // Game entities
    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.xpOrbs = [];
    this.damageNumbers = []; // Floating damage numbers
    this.lootItems = []; // Dropped loot items

    // Game systems
    this.spawnSystem = new SpawnSystem(canvas.width, canvas.height);
    this.collisionSystem = new CollisionSystem();
    this.particleManager = new ParticleManager();
    this.minimap = new Minimap(canvas.width, canvas.height);
    this.mapSystem = new MapSystem(32, 32, 32); // 64x64 tiles of 32 units each

    // Stats
    this.score = 0;
    this.elapsedTime = 0;

    // XP bar animation
    this.lastXpValue = 0;
    this.xpIncreaseAnimDuration = 0.4; // seconds
    this.xpIncreaseAnimTime = 0;

    // Level-up system
    this.levelUpPending = false;
    this.levelUpUpgrades = [];
    this.hoveredUpgradeIndex = -1; // Track which upgrade card is hovered
    this.levelUpQueue = []; // Queue of levels gained
    this.currentLevelUpIndex = 0; // Current level-up being displayed
    this.totalLevelsGained = 0; // Total levels gained in this session

    // Tileset
    this.tilesetImage = null;
    this.tileSize = 32; // Source tile size in the image (32x32)
    this.tileScale = 2; // Scale factor for rendering (2x larger on screen)
    this.tileGrassIndex = 0; // First tile (grass)
    this.tileOutOfMapIndex = 4; // Last tile (out of map)
    this.tileRotations = new Map(); // Store rotation for each tile position
    this.loadTileset();

    // Setup input listeners
    this.setupInputListeners();

    // Initialize game
    this.init();
  }

  /**
   * Initialize game state
   */
  init() {
    // Initialize map with random dimensions
    this.mapSystem.initialize();
    const mapCenter = this.mapSystem.getCenter();

    // Create player at map center with selected type
    this.player = new Player(mapCenter.x, mapCenter.y, this.playerType);

    // Initialize player XP stats
    this.player.xp = 0;
    this.player.level = 1;
    this.player.xpToNextLevel = calculateXpForLevel(1);

    // Reset arrays
    this.enemies = [];
    this.projectiles = [];
    this.xpOrbs = [];
    this.lootItems = [];

    // Reset systems
    this.spawnSystem.reset();
    this.collisionSystem.reset();
    this.particleManager.clear();
    this.mapSystem.reset();

    // Reset stats
    this.score = 0;
    this.elapsedTime = 0;
    this.gameOver = false;
    this.paused = false;
    this.levelUpPending = false;

    // Center camera on player
    this.camera.x = this.player.x - this.canvas.width / 2;
    this.camera.y = this.player.y - this.canvas.height / 2;
  }

  /**
   * Setup input event listeners
   */
  setupInputListeners() {
    // Keyboard input
    window.addEventListener("keydown", (e) => {
      this.input.keys[e.code] = true;

      // Pause on ESC
      if (e.code === "Escape") {
        this.togglePause();
      }

      // Restart on R when game over
      if (e.code === "KeyR" && this.gameOver) {
        this.restart();
      }
    });

    window.addEventListener("keyup", (e) => {
      this.input.keys[e.code] = false;
    });

    // Mouse input - just store screen coordinates
    this.canvas.addEventListener("mousemove", (e) => {
      const rect = this.canvas.getBoundingClientRect();

      // Calculate scale ratio (canvas resolution vs displayed size)
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;

      // Convert mouse position to canvas resolution
      this.input.mouse.x = (e.clientX - rect.left) * scaleX;
      this.input.mouse.y = (e.clientY - rect.top) * scaleY;

      // Check hover on upgrade cards
      if (this.levelUpPending && this.upgradeCardBounds) {
        let foundHover = false;
        for (let i = 0; i < this.upgradeCardBounds.length; i++) {
          const bounds = this.upgradeCardBounds[i];
          if (
            this.input.mouse.x >= bounds.x &&
            this.input.mouse.x <= bounds.x + bounds.width &&
            this.input.mouse.y >= bounds.y &&
            this.input.mouse.y <= bounds.y + bounds.height
          ) {
            this.hoveredUpgradeIndex = i;
            foundHover = true;
            break;
          }
        }
        if (!foundHover) {
          this.hoveredUpgradeIndex = -1;
        }
      }
    });

    // Mouse click for upgrade selection
    this.canvas.addEventListener("click", (e) => {
      if (this.levelUpPending && this.hoveredUpgradeIndex >= 0) {
        this.selectUpgrade(this.hoveredUpgradeIndex);
      }
    });
  }

  /**
   * Load tileset image
   */
  loadTileset() {
    const img = new Image();
    img.onload = () => {
      this.tilesetImage = img;
    };
    img.src = tilesetImage;
  }

  /**
   * Render a tile at screen position with rotation
   * @param {number} tileIndex - Index of the tile (0-4)
   * @param {number} screenX - Screen X position
   * @param {number} screenY - Screen Y position
   * @param {number} rotation - Rotation angle in radians (0, π/2, π, 3π/2)
   */
  renderTile(tileIndex, screenX, screenY, rotation = 0) {
    if (!this.tilesetImage || !this.tilesetImage.complete) return;

    // Source rectangle in tileset (32x32 per tile, tileset is 160x32)
    const sourceX = tileIndex * this.tileSize;
    const sourceY = 0;

    // Render with scale
    const displaySize = this.tileSize * this.tileScale;

    // Save context state and disable smoothing for pixel-perfect rendering
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    // Apply rotation around tile center
    const centerX = screenX + displaySize / 2;
    const centerY = screenY + displaySize / 2;

    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(rotation);
    this.ctx.translate(-displaySize / 2, -displaySize / 2);

    // Render tile slightly larger to avoid gaps (0.5px overlap)
    const overlap = 1;
    this.ctx.drawImage(
      this.tilesetImage,
      sourceX,
      sourceY,
      this.tileSize,
      this.tileSize,
      -overlap / 2,
      -overlap / 2,
      displaySize + overlap,
      displaySize + overlap
    );

    // Restore context state
    this.ctx.restore();
  }

  /**
   * Get tile rotation based on position (deterministic)
   * @param {number} x - World X coordinate
   * @param {number} y - World Y coordinate
   * @returns {number} Rotation angle in radians (0, π/2, π, 3π/2)
   */
  getTileRotation(x, y) {
    const key = `${Math.floor(x)},${Math.floor(y)}`;

    if (this.tileRotations.has(key)) {
      return this.tileRotations.get(key);
    }

    // Generate deterministic random rotation based on coordinates
    const seed = (Math.floor(x) * 73856093) ^ (Math.floor(y) * 19349663);
    const random = Math.abs(Math.sin(seed) * 10000) % 1;
    const rotations = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    const rotation = rotations[Math.floor(random * 4)];

    this.tileRotations.set(key, rotation);
    return rotation;
  }

  /**
   * Render tiles for the world background
   * @param {number} cameraX - Camera X offset
   * @param {number} cameraY - Camera Y offset
   */
  renderTileBackground(cameraX, cameraY) {
    const displaySize = this.tileSize * this.tileScale;

    // Calculate which tiles are visible
    const startTileX = Math.floor(cameraX / displaySize);
    const startTileY = Math.floor(cameraY / displaySize);
    const endTileX =
      startTileX + Math.ceil(this.canvas.width / displaySize) + 1;
    const endTileY =
      startTileY + Math.ceil(this.canvas.height / displaySize) + 1;

    for (let tileX = startTileX; tileX < endTileX; tileX++) {
      for (let tileY = startTileY; tileY < endTileY; tileY++) {
        // Screen position
        const screenX = tileX * displaySize - cameraX;
        const screenY = tileY * displaySize - cameraY;

        // World coordinates (in world units, not tiles)
        const worldX = tileX * this.tileSize;
        const worldY = tileY * this.tileSize;

        // Check if position is inside map
        if (
          worldX >= 0 &&
          worldX < this.mapSystem.width &&
          worldY >= 0 &&
          worldY < this.mapSystem.height
        ) {
          // Draw grass tile with random rotation
          const rotation = this.getTileRotation(worldX, worldY);
          this.renderTile(this.tileGrassIndex, screenX, screenY, rotation);
        } else {
          this.renderTile(this.tileOutOfMapIndex, screenX, screenY, 0);
        }
      }
    }

    // Draw grid lines between tiles
    this.renderTileGrid(cameraX, cameraY);
  }

  /**
   * Render grid lines between tiles to prevent aliasing artifacts
   * @param {number} cameraX - Camera X offset
   * @param {number} cameraY - Camera Y offset
   */
  renderTileGrid(cameraX, cameraY) {
    const displaySize = this.tileSize * this.tileScale;

    // Draw grid lines
    const startX = Math.floor(cameraX / displaySize) * displaySize;
    const startY = Math.floor(cameraY / displaySize) * displaySize;
    const endX = startX + this.canvas.width + displaySize;
    const endY = startY + this.canvas.height + displaySize;

    this.ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
    this.ctx.lineWidth = 1;

    // Vertical lines
    for (let x = startX; x <= endX; x += displaySize) {
      const screenX = x - cameraX;
      this.ctx.beginPath();
      this.ctx.moveTo(screenX, 0);
      this.ctx.lineTo(screenX, this.canvas.height);
      this.ctx.stroke();
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += displaySize) {
      const screenY = y - cameraY;
      this.ctx.beginPath();
      this.ctx.moveTo(0, screenY);
      this.ctx.lineTo(this.canvas.width, screenY);
      this.ctx.stroke();
    }
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  /**
   * Stop the game loop
   */
  stop() {
    this.running = false;
  }

  /**
   * Toggle pause state
   */
  togglePause() {
    this.paused = !this.paused;
  }

  /**
   * Restart the game
   */
  restart() {
    this.init();
  }

  /**
   * Main game loop
   * @param {number} currentTime - Current timestamp
   */
  loop(currentTime) {
    if (!this.running) return;

    // Calculate delta time in seconds
    this.deltaTime = (currentTime - this.lastTime) / 1000;
    this.deltaTime = Math.min(this.deltaTime, 0.1); // Cap at 100ms to prevent spiral of death
    this.lastTime = currentTime;

    // Calculate FPS
    this.frameCount++;
    this.fpsTimer += this.deltaTime;
    if (this.fpsTimer >= 1.0) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.fpsTimer = 0;
    }

    // Update and render
    if (!this.paused && !this.gameOver) {
      this.update(this.deltaTime);
    }
    this.render();

    // Continue loop
    requestAnimationFrame((time) => this.loop(time));
  }

  /**
   * Update game state
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    // Update elapsed time
    this.elapsedTime += dt;

    // Update player (pass camera for aim coordinate conversion and enemies for autoshoot)
    this.player.update(
      dt,
      this.input,
      this.camera,
      this.enemies,
      this.mapSystem
    );

    // Check if player is dead
    if (!this.player.isAlive()) {
      this.gameOver = true;
      return;
    }

    // Update camera to follow player
    this.updateCamera(dt);

    // Auto-attack system: fire at mouse position continuously
    if (this.player.canAttack()) {
      this.fireProjectileAtMouse();
      this.player.resetAttack();
    }

    // Update spawn system
    this.spawnSystem.update(dt, this.enemies, this.player, this.mapSystem);

    // Update enemies
    for (let i = 0; i < this.enemies.length; i++) {
      const projectileData = this.enemies[i].update(dt, this.player);

      // If enemy fired a projectile, add it to the projectiles array
      if (projectileData) {
        const projectile = createProjectileToTarget(
          projectileData.x,
          projectileData.y,
          projectileData.targetX,
          projectileData.targetY,
          projectileData.speed,
          projectileData.damage,
          this.enemies[i], // Pass the enemy as the owner
          projectileData.color // Pass the projectile color
        );
        this.projectiles.push(projectile);
      }
    }

    // Update projectiles
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].update(
        dt,
        this.camera,
        this.canvas.width,
        this.canvas.height
      );
    }

    // Update XP orbs
    for (let i = 0; i < this.xpOrbs.length; i++) {
      this.xpOrbs[i].update(dt, this.player);
    }

    // Update loot items
    for (let i = 0; i < this.lootItems.length; i++) {
      this.lootItems[i].update(dt, this.player);
    }

    // Update damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      if (!this.damageNumbers[i].update(dt)) {
        this.damageNumbers.splice(i, 1);
      }
    }

    // Update particles
    this.particleManager.update(dt);

    // Check collisions
    const collisionResults = this.collisionSystem.checkCollisions(
      this.player,
      this.enemies,
      this.projectiles
    );

    // Handle collision results
    if (collisionResults.playerHit) {
      this.onPlayerHit();
    }

    // Handle enemy projectiles hitting player
    if (collisionResults.enemyProjectilesHit.length > 0) {
      for (const projectile of collisionResults.enemyProjectilesHit) {
        // Spawn impact particles at player position
        this.particleManager.spawnProjectileHit(
          this.player.x,
          this.player.y,
          projectile.color,
          8
        );
      }
    }

    if (collisionResults.enemiesKilled.length > 0) {
      this.score += collisionResults.enemiesKilled.length * 10;

      // Trigger player pulse effect on kill
      this.player.triggerKillPulse();

      // Drop XP orbs from killed enemies and spawn death particles
      for (const enemy of collisionResults.enemiesKilled) {
        const baseXpValue = enemy.xpValue || 1;
        const effectiveXpValue = getEffectiveXpValue(baseXpValue);
        const orb = createXPOrb(enemy.x, enemy.y, effectiveXpValue);
        this.xpOrbs.push(orb);

        // Generate loot from killed enemy
        const droppedLoot = enemy.generateLoot();
        for (const lootItem of droppedLoot) {
          this.lootItems.push(lootItem);
        }

        // Spawn death explosion particles using the enemy's particle color
        const particleColor = enemy.particleColor || enemy.color;
        this.particleManager.spawnDeathExplosion(
          enemy.x,
          enemy.y,
          particleColor,
          12
        );
      }
    }

    // Spawn particles for projectile hits
    if (collisionResults.projectileHits.length > 0) {
      for (const hit of collisionResults.projectileHits) {
        this.particleManager.spawnProjectileHit(
          hit.x,
          hit.y,
          hit.enemyColor,
          6
        );

        // Create floating damage number at hit location (white for enemy damage)
        const damage = this.player.damage; // Base damage for now
        const damageNum = createDamageNumber(hit.x, hit.y, damage, "#FFFFFF");
        this.damageNumbers.push(damageNum);
      }
    }

    // Collect XP orbs
    for (let i = this.xpOrbs.length - 1; i >= 0; i--) {
      const orb = this.xpOrbs[i];
      if (!orb.isActive()) {
        // Only gain XP if the orb was actually collected by the player
        if (orb.collected) {
          const xpGained = orb.collect();

          // Trigger XP bar increase animation
          if (xpGained > 0) {
            this.xpIncreaseAnimTime = this.xpIncreaseAnimDuration;
            // Spawn XP collection particles
            this.particleManager.spawnXpParticles(orb.x, orb.y, 6);
          }

          this.player.xp += xpGained;

          // Check for level up (can be multiple levels)
          this.checkLevelUp();
        }
        this.xpOrbs.splice(i, 1);
      }
    }

    // Collect loot items
    for (let i = this.lootItems.length - 1; i >= 0; i--) {
      const loot = this.lootItems[i];
      if (!loot.isActive()) {
        const collected = loot.collect();
        this.onLootCollected(collected);
        this.lootItems.splice(i, 1);
      }
    }

    // Cleanup dead entities
    this.collisionSystem.cleanupDeadEnemies(this.enemies);
    this.collisionSystem.cleanupInactiveProjectiles(this.projectiles);

    // Update screen effects
    if (this.screenFlash > 0) {
      this.screenFlash -= dt * 5;
      this.screenFlash = Math.max(0, this.screenFlash);
    }

    // Update XP bar animation
    if (this.xpIncreaseAnimTime > 0) {
      this.xpIncreaseAnimTime -= dt;
      this.xpIncreaseAnimTime = Math.max(0, this.xpIncreaseAnimTime);
    }
  }

  /**
   * Check for level ups (can be multiple)
   */
  checkLevelUp() {
    if (this.levelUpPending) return; // Already showing level-up screen

    const levelsGained = [];

    // Calculate how many levels were gained
    while (this.player.xp >= this.player.xpToNextLevel) {
      this.player.level++;
      this.player.xp -= this.player.xpToNextLevel;
      this.player.xpToNextLevel = calculateXpForLevel(this.player.level);
      levelsGained.push(this.player.level);
    }

    // If levels were gained, show the level-up screen
    if (levelsGained.length > 0) {
      this.levelUpQueue = levelsGained;
      this.currentLevelUpIndex = 0;
      this.totalLevelsGained = levelsGained.length;
      this.showNextLevelUp();
    }
  }

  /**
   * Show the next level-up in the queue
   */
  showNextLevelUp() {
    if (this.currentLevelUpIndex >= this.levelUpQueue.length) {
      // All level-ups shown, resume game
      this.levelUpQueue = [];
      this.currentLevelUpIndex = 0;
      this.totalLevelsGained = 0;
      return;
    }

    // Select 3 random upgrades for this level
    this.levelUpUpgrades = selectRandomUpgrades(3);
    this.levelUpPending = true;
    this.paused = true;
    this.hoveredUpgradeIndex = -1;

    console.log(
      `Level up ${this.currentLevelUpIndex + 1}/${
        this.totalLevelsGained
      }! Level:`,
      this.levelUpQueue[this.currentLevelUpIndex]
    );
  }

  /**
   * Handle upgrade selection
   * @param {number} upgradeIndex - Selected upgrade index (0-2)
   */
  selectUpgrade(upgradeIndex) {
    if (upgradeIndex < 0 || upgradeIndex >= this.levelUpUpgrades.length) return;

    const selectedUpgrade = this.levelUpUpgrades[upgradeIndex];
    console.log("Upgrade selected:", selectedUpgrade);

    // Apply the upgrade to player
    applyUpgrade(selectedUpgrade.id, { player: this.player });

    // Move to next level-up or resume game
    this.currentLevelUpIndex++;
    this.hoveredUpgradeIndex = -1;

    if (this.currentLevelUpIndex < this.levelUpQueue.length) {
      // More level-ups to show - stay on overlay, just change upgrades
      this.levelUpUpgrades = selectRandomUpgrades(3);
      console.log(
        `Level up ${this.currentLevelUpIndex + 1}/${
          this.totalLevelsGained
        }! Level:`,
        this.levelUpQueue[this.currentLevelUpIndex]
      );
    } else {
      // All done, close overlay and resume game
      this.levelUpPending = false;
      this.paused = false;
      this.levelUpUpgrades = [];
      this.levelUpQueue = [];
      this.currentLevelUpIndex = 0;
      this.totalLevelsGained = 0;
    }
  }

  /**
   * Update camera position
   * @param {number} dt - Delta time in seconds
   */
  updateCamera(dt) {
    // Smoothly follow player
    const targetX = this.player.x - this.canvas.width / 2;
    const targetY = this.player.y - this.canvas.height / 2;

    this.camera.x += (targetX - this.camera.x) * 0.1;
    this.camera.y += (targetY - this.camera.y) * 0.1;

    // Camera shake effect
    const shakeIntensity = this.player.getShakeIntensity();
    if (shakeIntensity > 0) {
      const shakeAmount = 8 * shakeIntensity;
      this.camera.shakeOffsetX = random(-shakeAmount, shakeAmount);
      this.camera.shakeOffsetY = random(-shakeAmount, shakeAmount);
    } else {
      // Smooth shake decay
      this.camera.shakeOffsetX *= 0.8;
      this.camera.shakeOffsetY *= 0.8;
    }
  }

  /**
   * Find nearest enemy to player
   * @returns {Object|null} Nearest enemy or null
   */
  findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;

    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];
      if (enemy.dead) continue;

      const dist = enemy.distanceTo(this.player.x, this.player.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }

  /**
   * Fire projectile at mouse position
   */
  fireProjectileAtMouse() {
    // Use player's aimAngle (which is set based on autoShoot or manual aim)
    const angle = this.player.aimAngle;


    // Create projectile with angle and world position
    const projectile = createProjectileToTarget(
      this.player.x,
      this.player.y,
      this.player.x + Math.cos(angle) * this.player.range,
      this.player.y + Math.sin(angle) * this.player.range,
      this.player.projectileSpeed || 400,
      this.player.damage,
      this.player,
      this.player.projectileColor,
      this.player.range // portée max
    );
    if (projectile && this.player.projectileSize) {
      projectile.radius = this.player.projectileSize;
    }

    this.projectiles.push(projectile);
  }

  /**
   * Fire projectile at target enemy (for future use)
   * @param {Object} target - Target enemy
   */
  fireProjectile(target) {
    const projectile = createProjectileToTarget(
      this.player.x,
      this.player.y,
      target.x,
      target.y,
      this.player.projectileSpeed || 400,
      this.player.damage,
      this.player,
      this.player.projectileColor,
      this.player.range // portée max
    );
    if (projectile && this.player.projectileSize) {
      projectile.radius = this.player.projectileSize;
    }

    this.projectiles.push(projectile);
  }

  /**
   * Handle player hit event
   */
  onPlayerHit() {
    // Trigger screen flash
    this.screenFlash = 1.0;

    // Create red damage number at player position
    // Find the damage value from the enemy that hit
    for (const enemy of this.enemies) {
      const distToPlayer = Math.sqrt(
        (this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2
      );
      // Check if this enemy is colliding with the player
      if (distToPlayer < this.player.radius + enemy.radius) {
        const damageNum = createDamageNumber(
          this.player.x,
          this.player.y,
          enemy.damage,
          "#FF4444" // Red color for player damage
        );
        this.damageNumbers.push(damageNum);
        break; // Only create one damage number per hit
      }
    }
  }

  /**
   * Handle loot item collection
   * @param {Object} collected - {type, amount}
   */
  onLootCollected(collected) {
    if (!collected) return;

    switch (collected.type) {
      case "ratataTail":
        this.score += collected.amount;
        console.log(`Collected Ratata Tail! Score +${collected.amount}`);
        break;
    }
  }

  /**
   * Render the game
   */
  render() {
    // Clear canvas
    this.ctx.fillStyle = "#000000";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Apply camera shake
    const cameraX = this.camera.x + this.camera.shakeOffsetX;
    const cameraY = this.camera.y + this.camera.shakeOffsetY;

    // Render tile background
    this.renderTileBackground(cameraX, cameraY);

    // Render map boundaries
    this.mapSystem.render(this.ctx, cameraX, cameraY);

    // Render projectiles
    for (let i = 0; i < this.projectiles.length; i++) {
      this.projectiles[i].render(this.ctx, cameraX, cameraY);
    }

    // Render XP orbs
    for (let i = 0; i < this.xpOrbs.length; i++) {
      this.xpOrbs[i].render(this.ctx, cameraX, cameraY);
    }

    // Render loot items
    for (let i = 0; i < this.lootItems.length; i++) {
      this.lootItems[i].render(this.ctx, cameraX, cameraY);
    }

    // Render enemies
    for (let i = 0; i < this.enemies.length; i++) {
      this.enemies[i].render(this.ctx, cameraX, cameraY);
    }

    // Render player
    if (this.player) {
      this.player.render(this.ctx, cameraX, cameraY);
    }

    // Render particles (on top of everything)
    this.particleManager.render(this.ctx, cameraX, cameraY);

    // Render damage numbers (on top of particles)
    for (let i = 0; i < this.damageNumbers.length; i++) {
      this.damageNumbers[i].render(this.ctx, cameraX, cameraY);
    }

    // Render screen flash
    if (this.screenFlash > 0) {
      this.ctx.fillStyle = `rgba(255, 0, 0, ${this.screenFlash * 0.3})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Render CRT effect
    //this.renderCRTEffect();

    // Render UI
    this.renderUI();

    // Render minimap
    this.minimap.render(this.ctx, this.player, this.enemies, this.xpOrbs);

    // Render pause/game over/level-up overlays
    if (this.levelUpPending) {
      this.renderLevelUpOverlay();
    } else if (this.paused) {
      this.renderPauseOverlay();
    } else if (this.gameOver) {
      this.renderGameOverOverlay();
    }
  }

  /**
   * Render CRT/Retro scanline effect
   */
  renderCRTEffect() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Get the current canvas data
    const imageData = this.ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Scanlines - horizontal lines
    const scanlineSpacing = 2; // Every 2 pixels
    const scanlineOpacity = 0.15; // How dark the scanlines are

    for (let y = 0; y < height; y += scanlineSpacing) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        // Darken every other scanline
        data[index] *= 1 - scanlineOpacity; // Red
        data[index + 1] *= 1 - scanlineOpacity; // Green
        data[index + 2] *= 1 - scanlineOpacity; // Blue
        // Keep alpha unchanged
      }
    }

    // Put the modified data back
    this.ctx.putImageData(imageData, 0, 0);

    // Add chromatic aberration effect (RGB separation) - subtle
    const aberrationAmount = 0.5;

    // Red channel shift right
    this.ctx.globalAlpha = 0.05;
    this.ctx.fillStyle = "#FF0000";
    this.ctx.fillRect(aberrationAmount, 0, width - aberrationAmount, height);

    // Blue channel shift left
    this.ctx.fillStyle = "#0000FF";
    this.ctx.fillRect(-aberrationAmount, 0, width + aberrationAmount, height);

    this.ctx.globalAlpha = 1.0;

    // Add subtle vignette (darker edges)
    const vignette = this.ctx.createRadialGradient(
      width / 2,
      height / 2,
      0,
      width / 2,
      height / 2,
      Math.max(width, height) * 0.7
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.3)");

    this.ctx.fillStyle = vignette;
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * Render UI elements - Clean HUD with HP bar, XP bar, stats, and level
   */
  renderUI() {
    const ctx = this.ctx;

    // ===== HUD LAYOUT =====
    const hudPadding = 16;
    const hudRowHeight = 32; // Height per row
    const hudRows = 1; // 2 rows: bars on top, stats below
    const hudHeight = hudRowHeight * hudRows + hudPadding * 2;
    const elementGap = 16;
    const barHeight = 20;
    const iconSize = 44;

    // Background panel with gradient and border
    const panelGradient = ctx.createLinearGradient(0, 0, 0, hudHeight);
    panelGradient.addColorStop(0, "rgba(20, 20, 35, 0.98)");
    panelGradient.addColorStop(1, "rgba(15, 15, 25, 0.95)");
    ctx.fillStyle = panelGradient;
    ctx.fillRect(0, 0, this.canvas.width, hudHeight);

    // Top border accent
    ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(this.canvas.width * 0.7, 0);
    ctx.stroke();

    // Bottom border
    ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
    ctx.lineWidth = 1;
    const borderEndX = this.canvas.width - 200;
    ctx.beginPath();
    ctx.moveTo(0, hudHeight);
    ctx.lineTo(borderEndX, hudHeight);
    ctx.stroke();

    // ===== ROW 1: ICON + BARS =====
    const row1Y = hudPadding + hudRowHeight / 2;

    // PLAYER ICON
    const iconX = hudPadding;
    const iconY = hudPadding + (hudRowHeight - iconSize) / 2;

    if (this.player.profileImageLoaded && this.player.profileImage) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.15)";
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
      ctx.strokeStyle = this.player.color;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(iconX, iconY, iconSize, iconSize);
      ctx.drawImage(
        this.player.profileImage,
        iconX + 2,
        iconY + 2,
        iconSize - 4,
        iconSize - 4
      );
    }

    // LEVEL BADGE (next to icon)
    const levelBadgeX = iconX + iconSize + 20;
    const levelBadgeY = iconY + iconSize / 2;

    ctx.fillStyle = "rgba(255, 215, 0, 0.2)";
    ctx.beginPath();
    ctx.arc(levelBadgeX, levelBadgeY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#FFD700";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.player.level, levelBadgeX, levelBadgeY);

    // HP BAR
    const hpBarX = levelBadgeX + 30 + elementGap;
    const hpBarWidth = 180;
    const hpBarY = row1Y - barHeight / 2;

    ctx.fillStyle = "#259346";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("HP", hpBarX, hpBarY - 4);

    ctx.fillStyle = "rgba(25, 15, 10, 0.9)";
    ctx.fillRect(hpBarX, hpBarY, hpBarWidth, barHeight);
    ctx.strokeStyle = "rgba(37, 147, 70, 0.6)";
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, hpBarY, hpBarWidth, barHeight);

    const hpPercent = this.player.health / this.player.maxHealth;
    const hpFillWidth = hpBarWidth * hpPercent;
    ctx.fillStyle = "#30C96E";
    ctx.fillRect(
      hpBarX + 1,
      hpBarY + 1,
      Math.max(0, hpFillWidth - 2),
      barHeight - 2
    );

    const hpText = `${Math.floor(this.player.health)}/${this.player.maxHealth}`;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 2;
    ctx.fillText(hpText, hpBarX + hpBarWidth / 2, hpBarY + barHeight / 2);
    ctx.shadowBlur = 0;

    // XP BAR
    const xpBarX = hpBarX + hpBarWidth + elementGap;
    const xpBarWidth = Math.max(
      150,
      this.canvas.width - xpBarX - elementGap - hudPadding
    );
    const xpBarY = row1Y - barHeight / 2;
    const xpPercent = this.player.xp / this.player.xpToNextLevel;

    const animProgress = this.xpIncreaseAnimTime / this.xpIncreaseAnimDuration;
    const animGlow = animProgress * 0.6;

    ctx.fillStyle = "#53cef7ff";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText("XP", xpBarX, xpBarY - 4);

    ctx.fillStyle = "rgba(40, 24, 12, 0.8)";
    ctx.fillRect(xpBarX, xpBarY, xpBarWidth, barHeight);
    ctx.strokeStyle = `rgba(0, 191, 255, ${0.5 + animGlow * 0.4})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(xpBarX, xpBarY, xpBarWidth, barHeight);

    const xpFillWidth = xpBarWidth * xpPercent;
    ctx.fillStyle = "#53CEF7FF";
    if (animProgress > 0) {
      ctx.shadowBlur = 10 * animProgress;
      ctx.shadowColor = "rgba(0, 191, 255, 0.6)";
    }
    ctx.fillRect(
      xpBarX + 1,
      xpBarY + 1,
      Math.max(0, xpFillWidth - 2),
      barHeight - 2
    );
    ctx.shadowBlur = 0;

    const xpText = `${Math.floor(this.player.xp)}/${this.player.xpToNextLevel}`;
    ctx.fillStyle = "#53CEF7FF";
    ctx.font = "bold 9px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 2;
    ctx.fillText(xpText, xpBarX + xpBarWidth / 2, xpBarY + barHeight / 2);
    ctx.shadowBlur = 0;

    // FPS (debug - bottom left)
    ctx.fillStyle = "#555555";
    ctx.font = "11px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.fillText(`FPS: ${this.fps}`, 10, this.canvas.height - 10);
  }

  renderCaracterSelectScreen() {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.fillText("SELECT YOUR CHARACTER", centerX, 100);
    ctx.shadowBlur = 0;
  }

  /**
   * Render level-up overlay with upgrade choices
   */
  renderLevelUpOverlay() {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.fillText("LEVEL UP!", centerX, 100);
    ctx.shadowBlur = 0;

    // Current level being displayed
    const currentLevel = this.levelUpQueue[this.currentLevelUpIndex];

    // Subtitle with progress if multiple levels
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "24px Arial";
    if (this.totalLevelsGained > 1) {
      ctx.fillText(
        `Level ${currentLevel} - Choose an upgrade (${
          this.currentLevelUpIndex + 1
        }/${this.totalLevelsGained})`,
        centerX,
        150
      );

      // Show total levels gained
      ctx.fillStyle = "#FFD700";
      ctx.font = "18px Arial";
      ctx.fillText(`+${this.totalLevelsGained} LEVELS!`, centerX, 180);
    } else {
      ctx.fillText(`Level ${currentLevel} - Choose an upgrade`, centerX, 150);
    }

    // Upgrade cards - Modern design
    const cardWidth = 300;
    const cardHeight = 220;
    const cardGap = 25;
    const totalWidth = cardWidth * 3 + cardGap * 2;
    const startX = centerX - totalWidth / 2;
    const cardY = centerY - cardHeight / 2 + 30;

    const rarityColors = {
      common: {
        bg1: "rgba(70, 70, 85, 0.95)",
        bg2: "rgba(50, 50, 65, 0.95)",
        border: "#9CA3AF",
        glow: "rgba(156, 163, 175, 0.4)",
        accent: "#D1D5DB",
      },
      rare: {
        bg1: "rgba(30, 70, 150, 0.95)",
        bg2: "rgba(20, 50, 110, 0.95)",
        border: "#60A5FA",
        glow: "rgba(96, 165, 250, 0.6)",
        accent: "#93C5FD",
      },
      epic: {
        bg1: "rgba(120, 40, 180, 0.95)",
        bg2: "rgba(90, 30, 140, 0.95)",
        border: "#C084FC",
        glow: "rgba(192, 132, 252, 0.6)",
        accent: "#E9D5FF",
      },
      legendary: {
        bg1: "rgba(220, 100, 20, 0.95)",
        bg2: "rgba(180, 70, 10, 0.95)",
        border: "#FBBF24",
        glow: "rgba(251, 191, 36, 0.7)",
        accent: "#FCD34D",
      },
    };

    for (let i = 0; i < this.levelUpUpgrades.length; i++) {
      const upgrade = this.levelUpUpgrades[i];
      const cardX = startX + i * (cardWidth + cardGap);
      const colors = rarityColors[upgrade.rarity] || rarityColors.common;
      const isHovered = this.hoveredUpgradeIndex === i;

      // Hover animation offset
      const hoverOffset = isHovered ? -8 : 0;
      const currentCardY = cardY + hoverOffset;

      // Card shadow
      if (isHovered) {
        ctx.shadowBlur = 30;
        ctx.shadowColor = colors.glow;
        ctx.shadowOffsetY = 10;
      } else {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
        ctx.shadowOffsetY = 5;
      }

      // Card background with gradient
      const cardGradient = ctx.createLinearGradient(
        cardX,
        currentCardY,
        cardX,
        currentCardY + cardHeight
      );
      cardGradient.addColorStop(0, colors.bg1);
      cardGradient.addColorStop(1, colors.bg2);
      ctx.fillStyle = cardGradient;
      ctx.fillRect(cardX, currentCardY, cardWidth, cardHeight);

      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Card border with glow
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = isHovered ? 3 : 2;
      ctx.strokeRect(cardX, currentCardY, cardWidth, cardHeight);

      // Inner glow effect
      if (isHovered) {
        ctx.strokeStyle = colors.glow;
        ctx.lineWidth = 1;
        ctx.strokeRect(
          cardX + 2,
          currentCardY + 2,
          cardWidth - 4,
          cardHeight - 4
        );
      }

      // Top accent bar
      const accentGradient = ctx.createLinearGradient(
        cardX,
        currentCardY,
        cardX + cardWidth,
        currentCardY
      );
      accentGradient.addColorStop(0, "rgba(0, 0, 0, 0)");
      accentGradient.addColorStop(0.5, colors.border);
      accentGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = accentGradient;
      ctx.fillRect(cardX, currentCardY, cardWidth, 3);

      // Rarity badge with modern style
      const badgeY = currentCardY + 20;
      const badgeHeight = 24;

      // Badge background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(cardX + 15, badgeY, cardWidth - 30, badgeHeight);

      // Badge accent line
      ctx.fillStyle = colors.border;
      ctx.fillRect(cardX + 15, badgeY, cardWidth - 30, 2);

      // Badge text
      ctx.fillStyle = colors.accent;
      ctx.font = "bold 11px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        upgrade.rarity.toUpperCase(),
        cardX + cardWidth / 2,
        badgeY + badgeHeight / 2 + 1
      );

      // Upgrade name with shadow
      ctx.fillStyle = colors.accent;
      ctx.font = "bold 22px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(upgrade.name, cardX + cardWidth / 2, currentCardY + 60);
      ctx.shadowBlur = 0;

      // Separator line
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(cardX + 30, currentCardY + 95);
      ctx.lineTo(cardX + cardWidth - 30, currentCardY + 95);
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Upgrade description (word wrap) with better spacing
      ctx.fillStyle = "#E5E7EB";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const words = upgrade.description.split(" ");
      let line = "";
      let y = currentCardY + 110;
      const maxWidth = cardWidth - 40;
      const lines = [];

      for (let word of words) {
        const testLine = line + word + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && line !== "") {
          lines.push(line.trim());
          line = word + " ";
        } else {
          line = testLine;
        }
      }
      if (line) lines.push(line.trim());

      // Center the description lines
      lines.forEach((textLine, index) => {
        ctx.fillText(textLine, cardX + cardWidth / 2, y + index * 20);
      });

      // Bottom action indicator
      const actionY = currentCardY + cardHeight - 30;
      if (isHovered) {
        // Pulsing effect for hovered card
        ctx.fillStyle = colors.border;
        ctx.fillRect(cardX + 30, actionY, cardWidth - 60, 2);

        ctx.fillStyle = colors.accent;
        ctx.font = "bold 13px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.shadowColor = colors.glow;
        ctx.shadowBlur = 8;
        ctx.fillText("▸ CLICK TO SELECT ◂", cardX + cardWidth / 2, actionY + 8);
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText("Click to select", cardX + cardWidth / 2, actionY + 10);
      }
    }

    // Store card positions for click detection
    this.upgradeCardBounds = [];
    for (let i = 0; i < this.levelUpUpgrades.length; i++) {
      const cardX = startX + i * (cardWidth + cardGap);
      this.upgradeCardBounds.push({
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
      });
    }
  }

  /**
   * Render pause overlay
   */
  renderPauseOverlay() {
    // Semi-transparent background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Paused text
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "bold 48px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "GAME PAUSED",
      this.canvas.width / 2,
      this.canvas.height / 2
    );

    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      "Press ESC to resume",
      this.canvas.width / 2,
      this.canvas.height / 2 + 50
    );
  }

  /**
   * Render game over overlay
   */
  renderGameOverOverlay() {
    // Semi-transparent background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Game over text
    this.ctx.fillStyle = "#FF0000";
    this.ctx.font = "bold 64px Arial";
    this.ctx.textAlign = "center";
    this.ctx.fillText(
      "GAME OVER",
      this.canvas.width / 2,
      this.canvas.height / 2 - 50
    );

    // Stats
    this.ctx.fillStyle = "#FFFFFF";
    this.ctx.font = "32px Arial";
    this.ctx.fillText(
      `Final Score: ${this.score}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 20
    );

    const minutes = Math.floor(this.elapsedTime / 60);
    const seconds = Math.floor(this.elapsedTime % 60);
    this.ctx.fillText(
      `Survived: ${minutes}:${seconds.toString().padStart(2, "0")}`,
      this.canvas.width / 2,
      this.canvas.height / 2 + 60
    );

    // Restart instruction
    this.ctx.font = "24px Arial";
    this.ctx.fillText(
      "Press R to restart",
      this.canvas.width / 2,
      this.canvas.height / 2 + 120
    );
  }

  /**
   * Handle canvas resize
   * @param {number} width - New canvas width
   * @param {number} height - New canvas height
   */
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.spawnSystem.updateScreenSize(width, height);
  }

  /**
   * Cleanup and destroy game engine
   */
  destroy() {
    this.stop();
    // TODO: Remove event listeners
  }
}
