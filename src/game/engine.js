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
import { PauseOverlay } from "./ui/PauseOverlay.js";
import { LevelUpOverlay } from "./ui/LevelUpOverlay.js";
import { GameOverOverlay } from "./ui/GameOverOverlay.js";
import { CharacterSelectOverlay } from "./ui/CharacterSelectOverlay.js";
import { LevelSelectOverlay } from "./ui/LevelSelectOverlay.js";
import { MainMenuOverlay } from "./ui/MainMenuOverlay.js";

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

        // Main menu state
        this.showMainMenu = true;
        
        // Character selection state
        this.showCharacterSelect = false;
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

        // Input state (must be initialized before overlays)
        this.input = {
            keys: {},
            mouse: { x: canvas.width / 2, y: canvas.height / 2 },
        };

        // Initialize UI overlays
        this.pauseOverlay = new PauseOverlay(
            this.canvas,
            () => this.togglePause(),
            () => {
                this.paused = false;
                this.restart();
            },
            () => {
                this.paused = false;
                this.returnToMainMenu();
            }
        );
        this.levelUpOverlay = new LevelUpOverlay(this.canvas);
        this.gameOverOverlay = new GameOverOverlay(this.canvas);
        this.characterSelectOverlay = new CharacterSelectOverlay(this.canvas, this.input);
        this.levelSelectOverlay = new LevelSelectOverlay(this.canvas, this.input);
        this.mainMenuOverlay = new MainMenuOverlay(
            this.canvas,
            () => {
                this.showMainMenu = false;
                this.showCharacterSelect = true;
            },
            () => {
                console.log("Collection clicked - not implemented yet");
            },
            () => {
                console.log("Options clicked - not implemented yet");
            },
            () => {
                console.log("Exit clicked");
            }
        );
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

            // Navigation avec ESC
            if (e.code === "Escape") {
                if (this.gameOver) {
                    this.returnToMainMenu();
                } else if (this.showLevelSelect && this.showBackToCharacter) {
                    this.showLevelSelect = false;
                    this.showCharacterSelect = true;
                    this.showBackToCharacter = false;
                } else if (this.showCharacterSelect && !this.levelUpPending) {
                    this.showCharacterSelect = false;
                    this.showMainMenu = true;
                } else if (!this.showMainMenu && !this.showCharacterSelect && !this.showLevelSelect) {
                    this.togglePause();
                }
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

            // Main menu hover
            if (this.showMainMenu) {
                this.mainMenuOverlay.update(this.input.mouse.x, this.input.mouse.y);
            }

            // Pause screen button hover
            if (this.paused) {
                this.pauseOverlay.update(this.input.mouse.x, this.input.mouse.y);
            }

            // Check hover on character selection
            if (this.showCharacterSelect) {
                this.characterSelectOverlay.update(this.input.mouse.x, this.input.mouse.y);
            }

            // Check hover on level selection
            if (this.showLevelSelect) {
                this.levelSelectOverlay.update(this.input.mouse.x, this.input.mouse.y);
            }

            // Check hover on upgrade cards
            if (this.levelUpPending) {
                this.hoveredUpgradeIndex = this.levelUpOverlay.update(this.input.mouse.x, this.input.mouse.y, this.levelUpUpgrades);
            }
        });

        // Mouse click for upgrade selection, character selection, level selection, or pause screen buttons
        this.canvas.addEventListener("click", (e) => {
            // Main menu buttons
            if (this.showMainMenu) {
                this.mainMenuOverlay.handleClick(this.input.mouse.x, this.input.mouse.y);
                return;
            }

            // Pause screen buttons
            if (this.paused && !this.levelUpPending && !this.showCharacterSelect && !this.showLevelSelect) {
                this.pauseOverlay.handleClick(this.input.mouse.x, this.input.mouse.y);
                return;
            }

            if (this.showCharacterSelect && !this.levelUpPending && !this.showLevelSelect) {
                const result = this.characterSelectOverlay.handleClick(this.input.mouse.x, this.input.mouse.y);
                if (result) {
                    if (result.type === "back") {
                        this.showCharacterSelect = false;
                        this.showMainMenu = true;
                    } else if (result.type === "select") {
                        this.selectCharacter(result.character);
                    }
                }
            } else if (this.showLevelSelect) {
                const result = this.levelSelectOverlay.handleClick(this.input.mouse.x, this.input.mouse.y);
                if (result) {
                    if (result.type === "back") {
                        this.showLevelSelect = false;
                        this.showCharacterSelect = true;
                    } else if (result.type === "select") {
                        this.selectLevel(result.level);
                    }
                }
            } else if (this.levelUpPending && this.hoveredUpgradeIndex >= 0) {
                this.selectUpgrade(this.hoveredUpgradeIndex);
            }
        });
    }

    /**
     * Load tileset image
     */
    loadTileset() {
        let imgSrc = tilesetImage;
        if (this.selectedLevel === "glacier" || this.selectedLevel === 2) {
            imgSrc = tilesetToundra;
        }
        if (this.selectedLevel === "volcano" || this.selectedLevel === 3) {
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
        const endTileX = startTileX + Math.ceil(this.canvas.width / displaySize) + 1;
        const endTileY = startTileY + Math.ceil(this.canvas.height / displaySize) + 1;

        for (let tileX = startTileX; tileX < endTileX; tileX++) {
            for (let tileY = startTileY; tileY < endTileY; tileY++) {
                // Screen position
                const screenX = tileX * displaySize - cameraX;
                const screenY = tileY * displaySize - cameraY;

                // World coordinates (in world units, not tiles)
                const worldX = tileX * this.tileSize;
                const worldY = tileY * this.tileSize;

                // Check if position is inside map
                if (worldX >= 0 && worldX < this.mapSystem.width && worldY >= 0 && worldY < this.mapSystem.height) {
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
        if (this.paused) {
            this.songManager.suspend();
        } else {
            this.songManager.resume();
        }
    }

    /**
     * Restart the game
     */
    restart() {
        const currentCharacter = this.selectedCharacter;
        const currentLevel = this.selectedLevel;
        this.init();
        this.showMainMenu = false;
        if (currentCharacter && currentLevel) {
            this.selectCharacter(currentCharacter);
            this.selectLevel(currentLevel);
        }
        this.songManager.restartSong();
    }

    /**
     * Return to main menu
     */
    returnToMainMenu() {
        this.songManager.stopSong();
        this.showMainMenu = true;
        this.showCharacterSelect = false;
        this.showLevelSelect = false;
        this.showBackToCharacter = false;
        this.gameOver = false;
        this.paused = false;
        this.levelUpPending = false;
        this.selectedCharacter = null;
        this.selectedLevel = null;
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
        if (!this.paused && !this.gameOver && !this.showCharacterSelect && !this.showMainMenu) {
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
        this.player.update(dt, this.input, this.camera, this.enemies, this.mapSystem);

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
            this.projectiles[i].update(dt, this.camera, this.canvas.width, this.canvas.height);
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
        const collisionResults = this.collisionSystem.checkCollisions(this.player, this.enemies, this.projectiles);

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
                this.particleManager.spawnDeathExplosion(enemy.x, enemy.y, particleColor, 12, enemy.isBoss);
            }

            if (collisionResults.enemiesKilled.filter((e) => e.isBoss).length > 0) {
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
                const damageNum = createDamageNumber(hit.x, hit.y, finalDamage, damageColor, isCrit, this.player.critDamage);
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

        // Handle enemies killed by status effects (not by projectiles)
        const enemiesKilledByEffects = this.enemies.filter(e => 
            e.dead && !collisionResults.enemiesKilled.includes(e)
        );
        if (enemiesKilledByEffects.length > 0) {
            this.score += enemiesKilledByEffects.length * 10;

            this.player.triggerKillPulse();

            for (const enemy of enemiesKilledByEffects) {
                const baseXpValue = enemy.xpValue || 1;
                const effectiveXpValue = getEffectiveXpValue(baseXpValue);
                const orb = createXPOrb(enemy.x, enemy.y, effectiveXpValue);
                this.xpOrbs.push(orb);

                const droppedLoot = enemy.generateLoot();
                for (const lootItem of droppedLoot) {
                    this.lootItems.push(lootItem);
                }

                const particleColor = enemy.particleColor || enemy.color;
                this.particleManager.spawnDeathExplosion(enemy.x, enemy.y, particleColor, 12, enemy.isBoss);
            }

            if (enemiesKilledByEffects.filter((e) => e.isBoss).length > 0) {
                this.bossDefeated = true;
                setTimeout(() => {
                    this.gameOver = true;
                }, 1000);
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

        this.levelUpOverlay.reset();
        this.hoveredUpgradeIndex = null;
        this.currentLevelUpIndex = 0;

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
        this.showBackToCharacter = true;
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
            const distToPlayer = Math.sqrt((this.player.x - enemy.x) ** 2 + (this.player.y - enemy.y) ** 2);
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

        // If showing main menu, only render that
        if (this.showMainMenu) {
            this.mainMenuOverlay.render(this.ctx);
            return;
        }

        // If showing character select, only render that
        if (this.showCharacterSelect) {
            this.characterSelectOverlay.render(this.ctx, PLAYER_CONFIG, this.characterProfileImages);
            return;
        }

        // If showing level select, only render that
        if (this.showLevelSelect) {
            this.levelSelectOverlay.showBackToCharacter = this.showBackToCharacter;
            this.levelSelectOverlay.render(this.ctx, getAllLevels(), getLevel, this.enemyProfileImages);
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
            this.inventorySystem.y = 75;
            this.inventorySystem.render(this.ctx);
        }
        // Render minimap
        this.minimap.render(this.ctx, this.player, this.enemies, this.xpOrbs);

        // Render pause/game over/level-up overlays
        if (this.levelUpPending) {
            this.levelUpOverlay.render(
                this.ctx,
                this.levelUpUpgrades,
                this.levelUpQueue[this.currentLevelUpIndex],
                this.totalLevelsGained,
                this.currentLevelUpIndex
            );
        } else if (this.paused) {
            this.pauseOverlay.render(this.ctx);
        } else if (this.gameOver) {
            this.gameOverOverlay.render(this.ctx, this.bossDefeated, this.score, this.elapsedTime);
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
        const vignette = this.ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7);
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
                ctx.fillStyle = "#222240";
                ctx.fillRect(barX, barY, barW, barH);
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = "#C93030";
                ctx.fillRect(barX, barY, barW * hpPercent, barH);
                if (hpPercent > truePercent) {
                    ctx.fillStyle = "rgba(255,255,255,0.18)";
                    ctx.fillRect(barX + barW * truePercent, barY, barW * (hpPercent - truePercent), barH);
                }
                ctx.strokeStyle = "#000000ff";
                ctx.lineWidth = 2;
                ctx.strokeRect(barX, barY, barW, barH);
                ctx.font = "bold 15px 'Pokemon Classic', Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#fff";
                const bossName = boss.type ? boss.type.toUpperCase() : "BOSS";
                const hpText = `${Math.max(0, Math.floor(boss.displayedHealth))} / ${boss.maxHealth}`;
                ctx.fillText(`${bossName}  ${hpText}`, barX + barW / 2, barY + barH / 2);
            } else {
                // Affiche le timer avant l'apparition du boss
                const bossTimer = this.spawnSystem.getBossTimer();
                const total = bossConfig.spawnTimer || 1;
                const progress = Math.min(bossTimer / total, 1);
                ctx.globalAlpha = 0.85;
                ctx.fillStyle = "#222240";
                ctx.fillRect(barX, barY, barW, barH);
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = progress < 1 ? "#000000ff" : "#C93030";
                ctx.fillRect(barX, barY, barW * progress, barH);
                ctx.strokeStyle = "#000000ff";
                ctx.lineWidth = 2;
                ctx.strokeRect(barX, barY, barW, barH);
                ctx.font = "bold 16px 'Pokemon Classic', Arial";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#fff";
                let label = progress < 1 ? `Boss dans ${(total - bossTimer).toFixed(1)}s` : "";
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
            ctx.drawImage(this.player.profileImage, iconX + 2, iconY + 2, iconSize - 4, iconSize - 4);
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
        ctx.fillRect(hpBarX + 1, hpBarY + 1, Math.max(0, hpFillWidth - 2), barHeight - 2);

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

    /**
     * Handle canvas resize
     * @param {number} width - New canvas width
     * @param {number} height - New canvas height
     */
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.spawnSystem.updateScreenSize(width, height);
        this.pauseOverlay.resize();
        this.mainMenuOverlay.resize();
    }

    /**
     * Cleanup and destroy game engine
     */
    destroy() {
        this.stop();
        // TODO: Remove event listeners
    }
}
