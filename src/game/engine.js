import SongManager from "./songManager";
import SoundManager from "./systems/sondManager.js";
import { Player } from "./entities/player.js";
import { createProjectileToTarget } from "./entities/projectile.js";
import { getPokemonConfig } from "./config/pokemonConfig.js";
import { createXPOrb } from "./entities/xpOrb.js";
import { createDamageNumber } from "./entities/damageNumber.js";
import { SpawnSystem } from "./systems/spawnSystem.js";
import { CollisionSystem } from "./systems/collisionSystem.js";
import { ParticleManager } from "./systems/particleManager.js";
import { Minimap } from "./systems/minimap.js";
import { InventorySystem } from "./systems/inventorySystem.js";
import { MapSystem } from "./systems/mapSystem.js";
import { selectRandomUpgrades, applyUpgrade } from "./systems/upgradeSystem.js";
import { calculateXpForLevel, getEffectiveXpValue } from "./config/xpConfig.js";
import { PLAYER_CONFIG } from "./config/playerConfig.js";
import { LEVEL_CONFIG, getAllLevels, getLevel } from "./config/levelConfig.js";
import { random, clamp } from "../utils/math.js";

// Import tileset
import tilesetImage from "../sprites/tileset.png";
import tilesetToundra from "../sprites/tileset_toundra.png";
import tilesetVolcano from "../sprites/tileset_volcano.png";

// Import character profile images
import piplupProfile from "../sprites/piplup/profile.png";
import turtwigProfile from "../sprites/turtwig/profile.png";
import chimcharProfile from "../sprites/chimchar/profile.png";
import quagsireProfile from "../sprites/quagsire/profile.png";

// Import enemy profile images (for level display)
import ratataProfile from "../sprites/ratata/profile.png";
import caterpieProfile from "../sprites/caterpie/profile.png";

/**
 * Main game engine class
 * Handles game loop, state management, and coordination between systems
 */
export class GameEngine {
  constructor(canvas, playerType = "piplup") {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.playerType = playerType; // Store selected player type
    // SongManager: gestion musique dynamique
    this.songManager = new SongManager(this);
    this.soundManager = new SoundManager(this);

    // Character selection state
    this.showCharacterSelect = true;
    this.selectedCharacter = null;
    this.characterSelectBounds = {}; // Store bounds for click detection
    this.hoveredCharacter = null; // Track hovered character
    this.characterProfileImages = {
      piplup: new Image(),
      turtwig: new Image(),
      chimchar: new Image(),
      ratata: new Image(),
      caterpie: new Image(),
      quagsire: new Image(),
    };
    // Load character profile images
    this.characterProfileImages.piplup.src = piplupProfile;
    this.characterProfileImages.turtwig.src = turtwigProfile;
    this.characterProfileImages.chimchar.src = chimcharProfile;
    this.characterProfileImages.ratata.src = ratataProfile;
    this.characterProfileImages.caterpie.src = caterpieProfile;
    this.characterProfileImages.quagsire.src = quagsireProfile;

    // Enemy profile images (for level display)
    this.enemyProfileImages = {
      piplup: new Image(),
      turtwig: new Image(),
      chimchar: new Image(),
      ratata: new Image(),
      caterpie: new Image(),
      quagsire: new Image(),
      
    };
    // Load enemy profile images
    this.enemyProfileImages.piplup.src = piplupProfile;
    this.enemyProfileImages.turtwig.src = turtwigProfile;
    this.enemyProfileImages.chimchar.src = chimcharProfile;
    this.enemyProfileImages.ratata.src = ratataProfile;
    this.enemyProfileImages.caterpie.src = caterpieProfile;
    this.enemyProfileImages.quagsire.src = quagsireProfile;

    // Initialize pauseButtons to prevent undefined errors
    this.pauseButtons = { restart: {x:0,y:0,width:0,height:0}, menu: {x:0,y:0,width:0,height:0}, continue: {x:0,y:0,width:0,height:0} };
    // Level selection state
    this.showLevelSelect = false;
    this.selectedLevel = null;
    this.levelSelectBounds = {}; // Store bounds for click detection
    this.hoveredLevel = null; // Track hovered level

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
    this.sondManager = new SoundManager(this);
    this.spawnSystem = new SpawnSystem(canvas.width, canvas.height, null, this.songManager);
    this.collisionSystem = new CollisionSystem(this.sondManager);
    this.particleManager = new ParticleManager();
    this.minimap = new Minimap(canvas.width, canvas.height);
    this.inventorySystem = new InventorySystem(canvas.width, canvas.height);
    this.mapSystem = new MapSystem(12, 12, 32); // 64x64 tiles of 32 units each

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

    this.songManager.stopSong();

    // Create player at map center with selected type
    this.player = new Player(mapCenter.x, mapCenter.y, this.playerType);
    // Pour accès global à l'inventaire dans lootItem
    window.engine = this;

    // Initialize player XP stats
    this.player.xp = 0;
    this.player.level = 1;
    this.player.xpToNextLevel = calculateXpForLevel(1);

    // Reset arrays
    this.enemies = [];
    this.projectiles = [];
    this.xpOrbs = [];
    this.lootItems = [];
    if (this.inventorySystem) this.inventorySystem.items = [];

    // Reset systems
    this.spawnSystem.reset();
    
    // Set level configuration for spawn system
    if (this.selectedLevel) {
      const levelConfig = getLevel(this.selectedLevel);
      levelConfig.__levelKey = this.selectedLevel;
      this.spawnSystem.setLevelConfig(levelConfig);
    }
    
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

      // Back to character select from level select (ESC or Backspace)
      if ((e.code === "Escape" || e.code === "Backspace") && this.showLevelSelect && this.showBackToCharacter) {
        this.showLevelSelect = false;
        this.showCharacterSelect = true;
        this.showBackToCharacter = false;
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

      // Pause screen button hover (optional: can add hover effect)
      if (this.paused && this.pauseButtons) {
      
        const { restart, menu, continue: continueBtn } = this.pauseButtons;
        const mx = this.input.mouse.x;
        const my = this.input.mouse.y;
        if (
          mx >= continueBtn.x && mx <= continueBtn.x + continueBtn.width &&
          my >= continueBtn.y && my <= continueBtn.y + continueBtn.height
        ) {
          this.hoveredPauseButton = "continue";
        } else if (
          mx >= restart.x && mx <= restart.x + restart.width &&
          my >= restart.y && my <= restart.y + restart.height
        ) {
          this.hoveredPauseButton = "restart";
        } else if (
          mx >= menu.x && mx <= menu.x + menu.width &&
          my >= menu.y && my <= menu.y + menu.height
        ) { 
          this.hoveredPauseButton = "menu";
        } else {
          this.hoveredPauseButton = null;
        }


      }

      // Check hover on character selection
      if (this.showCharacterSelect && this.characterSelectBounds) {
        const characters = Object.keys(PLAYER_CONFIG);
        let foundHover = false;
        for (let i = 0; i < characters.length; i++) {
          const char = characters[i];
          const bounds = this.characterSelectBounds[char];
          if (
            bounds &&
            this.input.mouse.x >= bounds.x &&
            this.input.mouse.x <= bounds.x + bounds.width &&
            this.input.mouse.y >= bounds.y &&
            this.input.mouse.y <= bounds.y + bounds.height
          ) {
            this.hoveredCharacter = char;
            foundHover = true;
            break;
          }
        }
        if (!foundHover) {
          this.hoveredCharacter = null;
        }
      }


      // Check hover on level selection
      if (this.showLevelSelect && this.levelSelectBounds) {
        const levels = getAllLevels();
        let foundHover = false;
        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          const bounds = this.levelSelectBounds[level];
          if (
            bounds &&
            this.input.mouse.x >= bounds.x &&
            this.input.mouse.x <= bounds.x + bounds.width &&
            this.input.mouse.y >= bounds.y &&
            this.input.mouse.y <= bounds.y + bounds.height
          ) {
            this.hoveredLevel = level;
            foundHover = true;
            break;
          }
        }
        if (!foundHover) {
          this.hoveredLevel = null;
        }
      }

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

    // Mouse click for upgrade selection, character selection, level selection, or pause screen buttons
    this.canvas.addEventListener("click", (e) => {
      // Pause screen buttons
      if (this.paused && this.pauseButtons && !this.levelUpPending && !this.showCharacterSelect && !this.showLevelSelect) {
        const { restart, menu, continueBtn } = this.pauseButtons;
        const mx = this.input.mouse.x;
        const my = this.input.mouse.y;
        if (
          mx >= restart.x && mx <= restart.x + restart.width &&
          my >= restart.y && my <= restart.y + restart.height
        ) {
          this.paused = false;
          this.restart();
          return;
        }
        if (
          mx >= menu.x && mx <= menu.x + menu.width &&
          my >= menu.y && my <= menu.y + menu.height
        ) {
          this.paused = false;
          this.showCharacterSelect = true;
          this.showLevelSelect = false;
          this.showBackToCharacter = false;
          this.init();
          return;
        }
      }

      //Check for continue button click
      if (this.paused && this.pauseButtons && !this.levelUpPending && !this.showCharacterSelect && !this.showLevelSelect) {
        const { continue: continueBtn } = this.pauseButtons;
        const mx = this.input.mouse.x;
        const my = this.input.mouse.y;

        if (
          mx >= continueBtn.x && mx <= continueBtn.x + continueBtn.width &&
          my >= continueBtn.y && my <= continueBtn.y + continueBtn.height
        ) {
          this.paused = false;
          return;
        }
      }

      if (this.showCharacterSelect && this.characterSelectBounds && !this.levelUpPending && !this.showLevelSelect) {
        // Check for character selection click
        const characters = Object.keys(PLAYER_CONFIG);
        for (let i = 0; i < characters.length; i++) {
          const char = characters[i];
          const bounds = this.characterSelectBounds[char];
          if (
            bounds &&
            this.input.mouse.x >= bounds.x &&
            this.input.mouse.x <= bounds.x + bounds.width &&
            this.input.mouse.y >= bounds.y &&
            this.input.mouse.y <= bounds.y + bounds.height
          ) {
            this.selectCharacter(char);
            break;
          }
        }
      } else if (this.showLevelSelect && this.levelSelectBounds) {
        // Check for level selection click
        const levels = getAllLevels();
        let clickedLevel = false;
        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          const bounds = this.levelSelectBounds[level];
          if (
            bounds &&
            this.input.mouse.x >= bounds.x &&
            this.input.mouse.x <= bounds.x + bounds.width &&
            this.input.mouse.y >= bounds.y &&
            this.input.mouse.y <= bounds.y + bounds.height
          ) {
            this.selectLevel(level);
            clickedLevel = true;
            break;
          }
        }
      } else if (this.levelUpPending && this.hoveredUpgradeIndex >= 0) {
        this.selectUpgrade(this.hoveredUpgradeIndex);
      } else if (this.paused) {
        // Check Restart and Back to Menu button clicks
        const { restart, menu } = this.pauseButtons;
        if (
          this.input.mouse.x >= restart.x &&
          this.input.mouse.x <= restart.x + restart.width &&
          this.input.mouse.y >= restart.y &&
          this.input.mouse.y <= restart.y + restart.height
        ) {
          this.restart();
        } else if (
          this.input.mouse.x >= menu.x &&
          this.input.mouse.x <= menu.x + menu.width &&
          this.input.mouse.y >= menu.y &&
          this.input.mouse.y <= menu.y + menu.height
        ) {
          this.songManager.stopSong();
          this.showCharacterSelect = true;
          this.showLevelSelect = false;
          this.selectedLevel = null;
          this.player = null;
          this.enemies = [];
          this.projectiles = [];
          this.xpOrbs = [];
          this.lootItems = [];
          this.score = 0;
          this.elapsedTime = 0;
          this.gameOver = false;
          this.paused = false;
          this.levelUpPending = false;
          this.levelUpUpgrades = [];
          this.hoveredUpgradeIndex = -1;
          this.levelUpQueue = [];
          this.currentLevelUpIndex = 0;
          this.totalLevelsGained = 0;
          this.mapSystem.reset();
          this.spawnSystem.reset();
          this.collisionSystem.reset();
          this.particleManager.clear();
        }
      }
    });
  }

  /**
   * Load tileset image
   */
  loadTileset() {
    let imgSrc = tilesetImage;
    if (this.selectedLevel === 'glacier' || this.selectedLevel === 2) {
      imgSrc = tilesetToundra;
    }
    if (this.selectedLevel === 'volcano' || this.selectedLevel === 3) {
      imgSrc = tilesetVolcano;
    }
    const img = new Image();
    img.onload = () => {
      this.tilesetImage = img;
    };
    img.src = imgSrc;
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
    if(this.paused) {
      this.songManager.suspend();
    } else {
      this.songManager.resume();
    }
  }

  /**
   * Restart the game
   */
  restart() {
    this.init();
    this.songManager.restartSong();
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
    if (!this.paused && !this.gameOver && !this.showCharacterSelect) {
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

    // Mettre à jour la musique selon l'état du jeu
    if (this.songManager) this.songManager.update();

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
      this.songManager.stopSong();
      return;
    }

    // Check if boss is dead (victoire)
    if (this.spawnSystem && this.spawnSystem.getBossConfig()) {
      for (let i = 0; i < this.enemies.length; i++) {
        const e = this.enemies[i];
        if (e.isBoss && e.dead) {
          this.gameOver = true;
          this.bossDefeated = true;
          return;
        }
      }
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
          12,
          enemy.isBoss
        );
      }

      if(collisionResults.enemiesKilled.filter(e => e.isBoss).length > 0) {
        this.bossDefeated = true;
        setTimeout(() => {
          this.gameOver = true;
        }, 1000);
      }

    }

    // Spawn particles for projectile hits
    if (collisionResults.projectileHits.length > 0) {
      for (let i = 0; i < collisionResults.projectilesHit.length; i++) {
        const projectile = collisionResults.projectilesHit[i];
        const hit = collisionResults.projectileHits[i];

        const isCrit = projectile.lastHitCrit || false;
        const critMultiplier = projectile.lastHitCritMultiplier || 1.0;
        
        let baseDamage = projectile.damage + this.player.damage;
        let finalDamage = baseDamage * critMultiplier;
        
        const damageColor = isCrit ? "#FFD700" : "#FFFFFF"; // Yellow for crits, white for normal
        const damageNum = createDamageNumber(
          hit.x, 
          hit.y, 
          finalDamage, 
          damageColor, 
          isCrit, 
          this.player.critDamage
        );
        this.damageNumbers.push(damageNum);
        if (projectile.aoeRadius && projectile.aoeRadius > 0) {
          const color = hit.enemyColor || this.player.projectileColor || "#FFA500";
          this.particleManager.spawnExplosion(hit.x, hit.y, projectile.aoeRadius, color);
        } else {
          const color = hit.enemyColor || this.player.projectileColor || "#FFA500";
          this.particleManager.spawnHitImpact(hit.x, hit.y, color, 6);
        }
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

    this.songManager.suspend();

    if (this.currentLevelUpIndex >= this.levelUpQueue.length) {
      // All level-ups shown, resume game
      this.levelUpQueue = [];
      this.currentLevelUpIndex = 0;
      this.totalLevelsGained = 0;
      return;
    }

    // Select 3 random upgrades for this level
    this.levelUpUpgrades = selectRandomUpgrades(3, this.player);
    this.levelUpPending = true;
    this.paused = true;
    this.hoveredUpgradeIndex = -1;
  }

  /**
   * Handle character selection
   * @param {string} characterType - Selected character type
   */
  selectCharacter(characterType) {
    if (!PLAYER_CONFIG[characterType]) return;
    // Update player type
    this.playerType = characterType;
    this.showCharacterSelect = false;
    this.selectedCharacter = characterType;
    this.hoveredCharacter = null;

    // Show level selection
    this.showLevelSelect = true;
  }

  /**
   * Handle level selection
   * @param {string} levelKey - Selected level key
   */
  selectLevel(levelKey) {
    if (!LEVEL_CONFIG[levelKey]) return;
    // Update selected level AVANT d'appeler loadTileset/init
    this.selectedLevel = levelKey;
    this.loadTileset();
    this.songManager.startSong(this.selectedLevel);

    this.showLevelSelect = false;
    this.hoveredLevel = null;

    // Reinitialize the game with the selected character and level
    this.init();

    // Start the game
    if (!this.running) {
      this.start();
    }
  }

  /**
   * Handle upgrade selection
   * @param {number} upgradeIndex - Selected upgrade index (0-2)
   */
  selectUpgrade(upgradeIndex) {
    
    if (upgradeIndex < 0 || upgradeIndex >= this.levelUpUpgrades.length) return;

    const selectedUpgrade = this.levelUpUpgrades[upgradeIndex];
    this.songManager.resume();

    // Apply the upgrade to player
    applyUpgrade(selectedUpgrade.id, { player: this.player });

    this.player.upgrades.push(selectedUpgrade);

    // Move to next level-up or resume game
    this.currentLevelUpIndex++;
    this.hoveredUpgradeIndex = -1;

    if (this.currentLevelUpIndex < this.levelUpQueue.length) {
      this.levelUpUpgrades = selectRandomUpgrades(3, this.player);
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


    // Déterminer le type de projectile depuis la config du Pokémon
    let projectileType = null;
    const pokemonConfig = getPokemonConfig(this.player.type || this.player.characterType);
    if (pokemonConfig && pokemonConfig.projectileType) {
      projectileType = pokemonConfig.projectileType;
    }

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
      this.player.range,
      projectileType
    );
    if (projectile && this.player.projectileSize) {
      projectile.radius = this.player.projectileSize;
    }
    const pierceValue = clamp(this.player.projectilePierce || 0, 0, 10);
    projectile.piercing = pierceValue;
    if (this.player.aoeSize && this.player.aoeSize > 0) {
      projectile.aoeRadius = this.player.aoeSize;
      projectile.piercing = 0;
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
      this.player.range
    );
    if (projectile && this.player.projectileSize) {
      projectile.radius = this.player.projectileSize;
    }
    const pierceValue = clamp(this.player.projectilePierce || 0, 0, 10);
    projectile.piercing = pierceValue;
    if (this.player.aoeSize && this.player.aoeSize > 0) {
      projectile.aoeRadius = this.player.aoeSize;
      projectile.piercing = 0;
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

    // If showing character select, only render that
    if (this.showCharacterSelect) {
      this.renderCaracterSelectScreen();
      return;
    }

    // If showing level select, only render that
    if (this.showLevelSelect) {
      this.renderLevelSelectScreen();
      return;
    }

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


    // Render inventory (au-dessus de la minimap)
    if (this.inventorySystem) {
      const minimapBounds = this.minimap.getBounds();
      this.inventorySystem.x = minimapBounds.x;
      this.inventorySystem.y = 75
      this.inventorySystem.render(this.ctx);
    }
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

    // === BOSS TIMER OU BARRE DE VIE ===
    if (this.spawnSystem && this.spawnSystem.getBossConfig() && !this.bossDefeated) {
      let boss = null;
      for (let i = 0; i < this.enemies.length; i++) {
        if (this.enemies[i].isBoss && !this.enemies[i].dead) {
          boss = this.enemies[i];
          break;
        }
      }
      const bossConfig = this.spawnSystem.getBossConfig();
      const barW = this.canvas.width - 500;
      const barH = 18;
      const barX = (this.canvas.width - barW) / 2 + 80;
      const barY = 32;
      ctx.save();
      if (boss) {
        // Affiche la barre de vie du boss
        const hpPercent = boss.displayedHealth / boss.maxHealth;
        const truePercent = boss.health / boss.maxHealth;
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#222240';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#C93030';
        ctx.fillRect(barX, barY, barW * hpPercent, barH);
        if (hpPercent > truePercent) {
          ctx.fillStyle = 'rgba(255,255,255,0.18)';
          ctx.fillRect(barX + barW * truePercent, barY, barW * (hpPercent - truePercent), barH);
        }
        ctx.strokeStyle = '#000000ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.font = "bold 15px 'Pokemon Classic', Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        const bossName = boss.type ? boss.type.toUpperCase() : 'BOSS';
        const hpText = `${Math.max(0, Math.floor(boss.displayedHealth))} / ${boss.maxHealth}`;
        ctx.fillText(`${bossName}  ${hpText}`, barX + barW / 2, barY + barH / 2);
      } else {
        // Affiche le timer avant l'apparition du boss
        const bossTimer = this.spawnSystem.getBossTimer();
        const total = bossConfig.spawnTimer || 1;
        const progress = Math.min(bossTimer / total, 1);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#222240';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = progress < 1 ? '#000000ff' : '#C93030';
        ctx.fillRect(barX, barY, barW * progress, barH);
        ctx.strokeStyle = '#000000ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barW, barH);
        ctx.font = "bold 16px 'Pokemon Classic', Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        let label = progress < 1 ? `Boss dans ${(total - bossTimer).toFixed(1)}s` : '';
        ctx.fillText(label, barX + barW / 2, barY + barH / 2);
      }
      ctx.restore();
    }


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
    ctx.font = "bold 12px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.player.level, levelBadgeX, levelBadgeY);

    // HP BAR
    const hpBarX = levelBadgeX + 30 + elementGap;
    const hpBarWidth = 180;
    const hpBarY = row1Y - barHeight / 2;

    ctx.fillStyle = "#259346";
    ctx.font = "bold 9px 'Pokemon Classic', Arial";
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
    ctx.font = "bold 9px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 2;
    ctx.fillText(hpText, hpBarX + hpBarWidth / 2, hpBarY + barHeight / 2);
    ctx.shadowBlur = 0;

    // === XP BAR sous la barre d'HP ===
    const xpBarHeight = 4; // très fin
    const xpBarY = hpBarY + barHeight + 3; // juste sous la barre d'HP
    const xpPercentPlayer = this.player.xp / this.player.xpToNextLevel;
    // Fond
    ctx.fillStyle = "rgba(40, 24, 12, 0.7)";
    ctx.fillRect(hpBarX, xpBarY, hpBarWidth, xpBarHeight);
    // Remplissage
    ctx.fillStyle = "#53CEF7";
    ctx.fillRect(hpBarX + 1, xpBarY + 1, Math.max(0, (hpBarWidth - 2) * xpPercentPlayer, 0), xpBarHeight - 2);
    // Bordure
    ctx.strokeStyle = "rgba(0, 191, 255, 0.5)";
    ctx.lineWidth = 1;
    ctx.strokeRect(hpBarX, xpBarY, hpBarWidth, xpBarHeight);

    // FPS (debug - bottom left)
    ctx.fillStyle = "#555555";
    ctx.font = "11px 'Pokemon Classic', Arial";
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
    ctx.font = "bold 48px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.fillText("CHOOSE YOUR CHARACTER", centerX, 100);
    ctx.shadowBlur = 0;

    // Character cards - Modern design
    const cardWidth = 180;
    const cardHeight = 280;
    const cardGap = 32;
    const characters = Object.keys(PLAYER_CONFIG)

    

    const totalWidth = cardWidth * characters.length + cardGap * (characters.length - 1);
    const startX = centerX - totalWidth / 2;
    const cardY = centerY - cardHeight / 2 + 20;

    // Reset character select bounds
    this.characterSelectBounds = {};

    characters.forEach((characterType, index) => {
      const config = PLAYER_CONFIG[characterType];
      const cardX = startX + index * (cardWidth + cardGap);

      // Store bounds for click detection
      this.characterSelectBounds[characterType] = {
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
      };

      const isHovered = this.hoveredCharacter === characterType;

      // Card background
      const bgColor = isHovered
        ? `rgba(${this.hexToRgb(config.dominantColor).join(",")}, 0.2)` 
        : "rgba(24, 24, 48, 0.95)";
      ctx.fillStyle = bgColor;
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      // Card border
      const borderColor = isHovered
        ? config.dominantColor
        : `rgba(${this.hexToRgb(config.dominantColor).join(",")}, 0.5)`;
      const borderWidth = isHovered ? 4 : 3;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      // Glow effect when hovered
      if (isHovered) {
        ctx.shadowColor = config.dominantColor;
        ctx.shadowBlur = 20;
        ctx.strokeStyle = config.dominantColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        ctx.shadowBlur = 0;
      }

      // Profile image
      const imageSize = 100;
      const imageX = cardX + (cardWidth - imageSize) / 2;
      const imageY = cardY + 20;

      if (
        this.characterProfileImages[characterType] &&
        this.characterProfileImages[characterType].complete
      ) {
        ctx.fillStyle = `rgba(${this.hexToRgb(config.dominantColor).join(",")}, 0.15)`;
        ctx.fillRect(imageX, imageY, imageSize, imageSize);
        ctx.strokeStyle = config.dominantColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(imageX, imageY, imageSize, imageSize);
        ctx.drawImage(
          this.characterProfileImages[characterType],
          imageX,
          imageY,
          imageSize,
          imageSize
        );
      }

      // Character name
      ctx.fillStyle = config.dominantColor;
      ctx.font = "bold 18px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(
        config.name,
        cardX + cardWidth / 2,
        imageY + imageSize + 12
      );

      // Stats
      const statsStartY = imageY + imageSize + 50;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      const stats = [
        `❤ ${Math.round(100 * config.stats.health)}`,
        `⚡ ${Math.round(config.stats.speed * 100)}`,
        `⚔ ${Math.round(config.stats.damage * 100)}`,
      ];

      stats.forEach((stat, i) => {
        ctx.fillText(stat, cardX + cardWidth / 2, statsStartY + i * 16);
      });

      // Select button
      const buttonY = cardY + cardHeight - 28;
      ctx.fillStyle = isHovered
        ? config.dominantColor
        : `rgba(${this.hexToRgb(config.dominantColor).join(",")}, 0.3)`;
      ctx.fillRect(cardX + 10, buttonY, cardWidth - 20, 20);

      ctx.strokeStyle = config.dominantColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX + 10, buttonY, cardWidth - 20, 20);

      ctx.fillStyle = isHovered ? "#000000" : config.dominantColor;
      ctx.font = "bold 11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Select", cardX + cardWidth / 2, buttonY + 10);
    });
  }

  /**
   * Helper function to convert hex color to RGB
   * @param {string} hex - Hex color string like "#FFFFFF"
   * @returns {array} RGB array [r, g, b]
   */
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [255, 255, 255];
  }

  /**
   * Render level selection screen
   */
  renderLevelSelectScreen() {
    const ctx = this.ctx;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Semi-transparent background
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw back button (avant tout le reste pour qu'il soit au-dessus)
    if (this.showBackToCharacter) {
      const btn = { x: 16, y: 16, width: 160, height: 56 };
      ctx.save();
      ctx.globalAlpha = 1.0;
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#181830";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 18);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 28px 'Pokemon Classic', Arial";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText("← Retour", btn.x + 32, btn.y + btn.height / 2);
      // Hover effect
      if (
        this.input.mouse.x >= btn.x &&
        this.input.mouse.x <= btn.x + btn.width &&
        this.input.mouse.y >= btn.y &&
        this.input.mouse.y <= btn.y + btn.height
      ) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#FFD700";
        ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 18);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }
      ctx.restore();
    }

    // Title
    ctx.fillStyle = "#FFD700";
    ctx.font = "bold 48px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.fillText("SELECT YOUR LEVEL", centerX, 80);
    ctx.shadowBlur = 0;

    // Level cards layout
    const cardWidth = 220;
    const cardHeight = 160;
    const cardGap = 16;
    const levels = getAllLevels();
    
    // Create grid layout (3 columns, 2 rows)
    const columns = 3;
    const rows = Math.ceil(levels.length / columns);
    const totalWidth = cardWidth * columns + cardGap * (columns - 1);
    const totalHeight = cardHeight * rows + cardGap * (rows - 1);
    const startX = centerX - totalWidth / 2;
    const startY = centerY - totalHeight / 2 + 30;

    // Reset level select bounds
    this.levelSelectBounds = {};

    // Render each level card
    levels.forEach((levelKey, index) => {
      const level = getLevel(levelKey);
      const col = index % columns;
      const row = Math.floor(index / columns);
      const cardX = startX + col * (cardWidth + cardGap);
      const cardY = startY + row * (cardHeight + cardGap);
      const isHovered = this.hoveredLevel === levelKey;

      // Store bounds for click detection
      this.levelSelectBounds[levelKey] = {
        x: cardX,
        y: cardY,
        width: cardWidth,
        height: cardHeight,
      };

      // Card background with gradient
      const gradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
      gradient.addColorStop(0, "rgba(30, 30, 50, 0.9)");
      gradient.addColorStop(1, "rgba(20, 20, 35, 0.95)");
      ctx.fillStyle = gradient;
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      // Difficulty color bar
      const difficultyColors = ["#2ECC71", "#F39C12", "#E74C3C", "#C0392B", "#8B0000"];
      const diffColor = difficultyColors[Math.min(level.difficulty - 1, 4)];
      const barHeight = 4;
      ctx.fillStyle = diffColor;
      ctx.fillRect(cardX, cardY, cardWidth, barHeight);

      // Border
      const borderWidth = isHovered ? 3 : 2;
      ctx.strokeStyle = isHovered ? "#FFD700" : "rgba(255, 215, 0, 0.4)";
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);

      // Glow effect when hovered
      if (isHovered) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = 20;
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
        ctx.shadowBlur = 0;
      }

      // Level name
      ctx.fillStyle = "#FFD700";
      ctx.font = "bold 16px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(level.name, cardX + cardWidth / 2, cardY + 15);

      // Description
      ctx.fillStyle = "#CCCCCC";
      ctx.font = "11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.fillText(
        level.description,
        cardX + cardWidth / 2,
        cardY + 38,
        cardWidth - 10
      );

      // Enemy Pokemon icons - single line compact list
      const enabledEnemies = Object.entries(level.enemies)
        .filter(([_, config]) => config.enabled)
        .map(([type]) => type);
      
      const iconSize = 24;
      const iconGap = 2;
      const iconAreaStartY = cardY + 58;

      if (enabledEnemies.length > 0) {
        // Calculate total width needed
        const totalIconsWidth = enabledEnemies.length * iconSize + (enabledEnemies.length - 1) * iconGap;
        const startIconX = cardX + (cardWidth - totalIconsWidth) / 2;
        
        enabledEnemies.forEach((enemyType, idx) => {
          const iconX = startIconX + idx * (iconSize + iconGap);
          const iconY = iconAreaStartY;
          
          // Draw icon background
          ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
          ctx.fillRect(iconX, iconY, iconSize, iconSize);
          ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
          ctx.lineWidth = 1;
          ctx.strokeRect(iconX, iconY, iconSize, iconSize);
          
          // Draw enemy image if loaded
          if (
            this.enemyProfileImages[enemyType] &&
            this.enemyProfileImages[enemyType].complete
          ) {
            ctx.drawImage(
              this.enemyProfileImages[enemyType],
              iconX,
              iconY,
              iconSize,
              iconSize
            );
          }
        });
      }

      // Calculate position for difficulty info
      const difficultyStartY = iconAreaStartY + iconSize + 12;

      // Difficulty stars
      const diffStars = "★".repeat(level.difficulty);
      ctx.fillStyle = diffColor;
      ctx.font = "bold 11px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.fillText(diffStars, cardX + cardWidth / 2, difficultyStartY);

      // Difficulty text
      ctx.fillStyle = diffColor;
      ctx.font = "bold 10px 'Pokemon Classic', Arial";
      ctx.fillText(`Difficulty: ${level.difficulty}`, cardX + cardWidth / 2, difficultyStartY + 14);

      // Select button
      const buttonY = cardY + cardHeight - 24;
      ctx.fillStyle = isHovered
        ? "#FFD700"
        : "rgba(255, 215, 0, 0.2)";
      ctx.fillRect(cardX + 12, buttonY, cardWidth - 24, 22);

      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1;
      ctx.strokeRect(cardX + 12, buttonY, cardWidth - 24, 22);

      ctx.fillStyle = isHovered ? "#000000" : "#FFD700";
      ctx.font = "bold 12px 'Pokemon Classic', Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Select", cardX + cardWidth / 2, buttonY + 11);
    });
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
    ctx.font = "bold 48px 'Pokemon Classic', Arial";
    ctx.textAlign = "center";
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.fillText("LEVEL UP!", centerX, 100);
    ctx.shadowBlur = 0;

    // Current level being displayed
    const currentLevel = this.levelUpQueue[this.currentLevelUpIndex];

    // Subtitle with progress if multiple levels
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "24px 'Pokemon Classic', Arial";
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
      ctx.font = "18px 'Pokemon Classic', Arial";
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
      ctx.font = "bold 11px 'Pokemon Classic', Arial";
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
      this.canvas.height / 2 - 60
    );

    // Draw Restart and Back to Menu buttons
    const btnWidth = 220;
    const btnHeight = 48;
    const btnSpacing = 20;
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2 + 40;

    // Restart button
    const restartBtn = {
      x: centerX - btnWidth / 2,
      y: centerY,
      width: btnWidth,
      height: btnHeight,
    };
    // Back to Menu button
    const menuBtn = {
      x: centerX - btnWidth / 2,
      y: centerY + btnHeight + btnSpacing,
      width: btnWidth,
      height: btnHeight,
    };

    const continueBtn = {
      x: centerX - btnWidth / 2,
      y: centerY - btnHeight - btnSpacing,
      width: btnWidth,
      height: btnHeight,
    };

    // Store for click detection
    this.pauseButtons = { restart: restartBtn, menu: menuBtn, continue: continueBtn };

    // Draw Continue button
    if (this.hoveredPauseButton === 'continue') {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 4;
    } else {
      this.ctx.fillStyle = '#222';
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
    }
    this.ctx.fillRect(continueBtn.x, continueBtn.y, continueBtn.width, continueBtn.height);
    this.ctx.strokeRect(continueBtn.x, continueBtn.y, continueBtn.width, continueBtn.height);
    this.ctx.fillStyle = this.hoveredPauseButton === 'continue' ? '#222' : '#fff';
    this.ctx.font = this.hoveredPauseButton === 'continue' ? 'bold 24px Arial' : 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Resume', centerX, continueBtn.y + btnHeight / 2);

    // Draw Restart button
    if (this.hoveredPauseButton === 'restart') {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 4;
    } else {
      this.ctx.fillStyle = '#222';
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
    }
    this.ctx.fillRect(restartBtn.x, restartBtn.y, restartBtn.width, restartBtn.height);
    this.ctx.strokeRect(restartBtn.x, restartBtn.y, restartBtn.width, restartBtn.height);
    this.ctx.fillStyle = this.hoveredPauseButton === 'restart' ? '#222' : '#fff';
    this.ctx.font = this.hoveredPauseButton === 'restart' ? 'bold 24px Arial' : 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Restart', centerX, restartBtn.y + btnHeight / 2);

    // Draw Back to Menu button
    if (this.hoveredPauseButton === 'menu') {
      this.ctx.fillStyle = '#FFD700';
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.lineWidth = 4;
    } else {
      this.ctx.fillStyle = '#222';
      this.ctx.strokeStyle = '#fff';
      this.ctx.lineWidth = 2;
    }
    this.ctx.fillRect(menuBtn.x, menuBtn.y, menuBtn.width, menuBtn.height);
    this.ctx.strokeRect(menuBtn.x, menuBtn.y, menuBtn.width, menuBtn.height);
    this.ctx.fillStyle = this.hoveredPauseButton === 'menu' ? '#222' : '#fff';
    this.ctx.font = this.hoveredPauseButton === 'menu' ? 'bold 24px Arial' : 'bold 24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('Back to Menu', centerX, menuBtn.y + btnHeight / 2);



  }

  /**
   * Render game over overlay
   */
  renderGameOverOverlay() {
    // Semi-transparent background
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.bossDefeated) {
      // Victoire !
      this.ctx.fillStyle = "#FFD700";
      this.ctx.font = "bold 64px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "VICTOIRE !",
        this.canvas.width / 2,
        this.canvas.height / 2 - 50
      );
      this.ctx.fillStyle = "#FFFFFF";
      this.ctx.font = "32px Arial";
      this.ctx.fillText(
        `Score final : ${this.score}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 20
      );
      const minutes = Math.floor(this.elapsedTime / 60);
      const seconds = Math.floor(this.elapsedTime % 60);
      this.ctx.fillText(
        `Temps : ${minutes}:${seconds.toString().padStart(2, "0")}`,
        this.canvas.width / 2,
        this.canvas.height / 2 + 60
      );
      this.ctx.font = "24px Arial";
      this.ctx.fillText(
        "Appuie sur R pour rejouer",
        this.canvas.width / 2,
        this.canvas.height / 2 + 120
      );
    } else {
      // Game over classique
      this.ctx.fillStyle = "#FF0000";
      this.ctx.font = "bold 64px Arial";
      this.ctx.textAlign = "center";
      this.ctx.fillText(
        "GAME OVER",
        this.canvas.width / 2,
        this.canvas.height / 2 - 50
      );
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
      this.ctx.font = "24px Arial";
      this.ctx.fillText(
        "Press R to restart",
        this.canvas.width / 2,
        this.canvas.height / 2 + 120
      );
    }
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
