/**
 * GAME DEVELOPMENT GUIDE
 * ======================
 * 
 * This document provides guidance on extending the Vampire Survivors-style game.
 * 
 * ARCHITECTURE OVERVIEW
 * ---------------------
 * 
 * 1. GAME LOOP (engine.js)
 *    - Runs at 60fps using requestAnimationFrame
 *    - Calculates delta time for frame-independent movement
 *    - Calls update() then render() each frame
 *    - Manages input, camera, and game state
 * 
 * 2. ENTITIES (entities/)
 *    - Player: Controlled character with health, movement, aim
 *    - Enemy: AI-controlled enemies that chase player
 *    - Projectile: Player's auto-attack projectiles
 * 
 * 3. SYSTEMS (systems/)
 *    - SpawnSystem: Spawns enemy waves, manages difficulty
 *    - CollisionSystem: Detects and resolves collisions
 * 
 * 4. UTILITIES (utils/math.js)
 *    - Math helpers for game development
 *    - Distance, angles, lerp, easing, etc.
 * 
 * 
 * EXTENDING THE GAME
 * ------------------
 * 
 * === ADDING NEW ENEMY TYPES ===
 * 
 * 1. Edit src/game/entities/enemy.js
 * 2. Add new case in setStatsFromType():
 * 
 *    case 'bomber':
 *      this.maxHealth = 15;
 *      this.speed = 60;
 *      this.damage = 30;
 *      this.radius = 14;
 *      this.color = '#FF5722';
 *      this.outlineColor = '#D84315';
 *      this.xpValue = 3;
 *      break;
 * 
 * 3. Update getRandomEnemyType() to include new type in spawn pool
 * 
 * 
 * === ADDING POWER-UPS ===
 * 
 * 1. Create src/game/entities/powerup.js:
 * 
 *    export class PowerUp {
 *      constructor(x, y, type) {
 *        this.x = x;
 *        this.y = y;
 *        this.type = type; // 'health', 'speed', 'damage', etc.
 *        this.radius = 10;
 *        this.active = true;
 *      }
 * 
 *      update(dt) {
 *        // Optional: rotation, floating animation
 *      }
 * 
 *      render(ctx, cameraX, cameraY) {
 *        // Draw power-up icon
 *      }
 *    }
 * 
 * 2. Add powerups array to engine.js:
 *    this.powerups = [];
 * 
 * 3. Add collision check in collisionSystem.js:
 *    checkPlayerPowerUpCollision(player, powerup)
 * 
 * 4. Apply power-up effect to player when collected
 * 
 * 
 * === ADDING EXPERIENCE SYSTEM ===
 * 
 * 1. Add XP tracking to Player:
 *    this.xp = 0;
 *    this.level = 1;
 *    this.xpToNextLevel = 100;
 * 
 * 2. Award XP when enemy dies:
 *    if (enemy.dead) {
 *      this.player.xp += enemy.xpValue;
 *      this.checkLevelUp();
 *    }
 * 
 * 3. Create level-up system:
 *    checkLevelUp() {
 *      if (this.player.xp >= this.player.xpToNextLevel) {
 *        this.player.level++;
 *        this.player.xp -= this.player.xpToNextLevel;
 *        this.player.xpToNextLevel *= 1.5; // Increase requirement
 *        this.showLevelUpScreen();
 *      }
 *    }
 * 
 * 
 * === ADDING NEW WEAPONS ===
 * 
 * 1. Create src/game/entities/weapon.js:
 * 
 *    export class Weapon {
 *      constructor(type) {
 *        this.type = type; // 'projectile', 'aura', 'beam', etc.
 *        this.level = 1;
 *        this.damage = 10;
 *        this.cooldown = 0.5;
 *        this.timer = 0;
 *      }
 * 
 *      update(dt, player, enemies, projectiles) {
 *        this.timer += dt;
 *        if (this.timer >= this.cooldown) {
 *          this.attack(player, enemies, projectiles);
 *          this.timer = 0;
 *        }
 *      }
 * 
 *      attack(player, enemies, projectiles) {
 *        // Weapon-specific attack logic
 *      }
 *    }
 * 
 * 2. Add weapons array to Player:
 *    this.weapons = [new Weapon('projectile')];
 * 
 * 3. Update weapons in engine.js update loop:
 *    for (const weapon of this.player.weapons) {
 *      weapon.update(dt, this.player, this.enemies, this.projectiles);
 *    }
 * 
 * 
 * === ADDING PARTICLE EFFECTS ===
 * 
 * 1. Create src/game/entities/particle.js:
 * 
 *    export class Particle {
 *      constructor(x, y, color, size, lifetime) {
 *        this.x = x;
 *        this.y = y;
 *        this.velocityX = random(-100, 100);
 *        this.velocityY = random(-100, 100);
 *        this.color = color;
 *        this.size = size;
 *        this.lifetime = lifetime;
 *        this.age = 0;
 *      }
 * 
 *      update(dt) {
 *        this.x += this.velocityX * dt;
 *        this.y += this.velocityY * dt;
 *        this.velocityX *= 0.95; // Friction
 *        this.velocityY *= 0.95;
 *        this.age += dt;
 *        return this.age < this.lifetime;
 *      }
 * 
 *      render(ctx, cameraX, cameraY) {
 *        const alpha = 1 - (this.age / this.lifetime);
 *        ctx.globalAlpha = alpha;
 *        ctx.fillStyle = this.color;
 *        ctx.fillRect(
 *          this.x - cameraX - this.size/2,
 *          this.y - cameraY - this.size/2,
 *          this.size,
 *          this.size
 *        );
 *        ctx.globalAlpha = 1.0;
 *      }
 *    }
 * 
 * 2. Add particles array to engine.js:
 *    this.particles = [];
 * 
 * 3. Spawn particles on events:
 *    if (enemy.dead) {
 *      for (let i = 0; i < 20; i++) {
 *        this.particles.push(
 *          new Particle(enemy.x, enemy.y, '#FF0000', 3, 0.5)
 *        );
 *      }
 *    }
 * 
 * 
 * === ADDING SOUND EFFECTS ===
 * 
 * 1. Create src/utils/audio.js:
 * 
 *    export class AudioManager {
 *      constructor() {
 *        this.sounds = {};
 *        this.enabled = true;
 *      }
 * 
 *      load(name, url) {
 *        const audio = new Audio(url);
 *        this.sounds[name] = audio;
 *      }
 * 
 *      play(name, volume = 1.0) {
 *        if (!this.enabled) return;
 *        const sound = this.sounds[name];
 *        if (sound) {
 *          sound.currentTime = 0;
 *          sound.volume = volume;
 *          sound.play();
 *        }
 *      }
 *    }
 * 
 * 2. Initialize in engine.js:
 *    this.audio = new AudioManager();
 *    this.audio.load('hit', '/sounds/hit.wav');
 *    this.audio.load('shoot', '/sounds/shoot.wav');
 *    this.audio.load('death', '/sounds/death.wav');
 * 
 * 3. Play sounds on events:
 *    if (collisionResults.playerHit) {
 *      this.audio.play('hit', 0.3);
 *    }
 * 
 * 
 * === SAVING/LOADING PROGRESS ===
 * 
 * 1. Create src/utils/saveManager.js:
 * 
 *    export class SaveManager {
 *      save(data) {
 *        localStorage.setItem('gameData', JSON.stringify(data));
 *      }
 * 
 *      load() {
 *        const data = localStorage.getItem('gameData');
 *        return data ? JSON.parse(data) : null;
 *      }
 * 
 *      clear() {
 *        localStorage.removeItem('gameData');
 *      }
 *    }
 * 
 * 2. Save high score on game over:
 *    if (this.gameOver) {
 *      const savedScore = this.saveManager.load()?.highScore || 0;
 *      if (this.score > savedScore) {
 *        this.saveManager.save({ highScore: this.score });
 *      }
 *    }
 * 
 * 
 * PERFORMANCE OPTIMIZATION
 * ------------------------
 * 
 * 1. Object Pooling:
 *    - Reuse projectiles/enemies instead of creating new ones
 *    - Mark as inactive instead of removing from array
 *    - Reset and reuse when needed
 * 
 * 2. Spatial Partitioning:
 *    - Only check collisions for nearby entities
 *    - Use grid-based spatial hash
 * 
 * 3. Render Culling:
 *    - Don't render entities outside camera view
 *    - Check if entity is in viewport before rendering
 * 
 * 4. Batch Rendering:
 *    - Group similar entities for rendering
 *    - Minimize canvas state changes
 * 
 * 
 * DEBUGGING TIPS
 * --------------
 * 
 * 1. Enable debug rendering:
 *    - Draw collision circles
 *    - Show velocity vectors
 *    - Display entity counts
 * 
 * 2. Add console logging:
 *    - Log important events (spawn, death, level up)
 *    - Monitor performance with console.time()
 * 
 * 3. Slow motion mode:
 *    - Multiply delta time by 0.1 to slow game
 *    - Useful for debugging collision/timing issues
 * 
 * 
 * GAMEFEEL IMPROVEMENTS
 * ---------------------
 * 
 * 1. More Camera Effects:
 *    - Zoom in/out on events
 *    - Rotation on critical hits
 *    - Slow-motion on level up
 * 
 * 2. Screen Effects:
 *    - Chromatic aberration
 *    - Vignette on low health
 *    - Color grading based on game state
 * 
 * 3. Hit Stop:
 *    - Brief pause on impact for emphasis
 *    - Makes hits feel more impactful
 * 
 * 4. Projectile Effects:
 *    - Muzzle flash on fire
 *    - Impact effects on hit
 *    - Tracer variations
 * 
 * 
 * NEXT STEPS
 * ----------
 * 
 * Start with small additions and test frequently:
 * 1. Add one new enemy type
 * 2. Implement XP drops
 * 3. Add level-up screen
 * 4. Create upgrade system
 * 5. Add more weapons
 * 6. Polish with effects and sound
 * 
 * Remember: Iterate quickly, test often, and focus on fun!
 */
