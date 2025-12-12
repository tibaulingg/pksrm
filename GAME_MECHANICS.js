/**
 * GAME MECHANICS REFERENCE
 * ========================
 * Quick reference for all game mechanics, formulas, and tunable parameters
 */

// ========================================
// PLAYER MECHANICS
// ========================================

const PLAYER = {
  // Movement
  speed: 200,                    // pixels per second
  friction: 0.85,                // velocity damping (0-1)
  
  // Combat
  maxHealth: 100,
  damage: 10,
  attackCooldown: 0.4,           // seconds between auto-attacks
  
  // Invulnerability
  invulnerableDuration: 0.5,     // seconds of i-frames after hit
  flashRate: 20,                 // flashes per second during i-frames
  
  // Size
  radius: 16,                    // collision radius
  
  // Camera Shake
  shakeIntensity: 8,             // max shake pixels
  shakeDuration: 0.15,           // seconds
};

// ========================================
// ENEMY TYPES
// ========================================

const ENEMY_TYPES = {
  basic: {
    health: 20,
    speed: 80,
    damage: 10,
    radius: 12,
    xpValue: 1,
    spawnWeight: 0.7,            // 70% chance
  },
  
  fast: {
    health: 10,
    speed: 150,
    damage: 5,
    radius: 10,
    xpValue: 2,
    spawnWeight: 0.2,            // 20% chance
  },
  
  tank: {
    health: 50,
    speed: 50,
    damage: 20,
    radius: 18,
    xpValue: 5,
    spawnWeight: 0.1,            // 10% chance
  },
};

// ========================================
// PROJECTILE MECHANICS
// ========================================

const PROJECTILE = {
  speed: 400,                    // pixels per second
  lifetime: 2.0,                 // seconds before despawn
  radius: 6,                     // collision radius
  trailLength: 5,                // number of trail segments
  piercing: 0,                   // enemies it can pierce (0 = none)
};

// ========================================
// SPAWN SYSTEM
// ========================================

const SPAWN = {
  // Initial values
  baseSpawnInterval: 2.0,        // seconds between waves
  baseEnemiesPerSpawn: 2,        // enemies per wave
  
  // Scaling
  difficultyInterval: 30,        // seconds between difficulty increases
  maxEnemiesPerSpawn: 15,        // cap on enemies per wave
  minSpawnInterval: 0.5,         // fastest spawn rate
  
  // Positioning
  spawnMargin: 80,               // pixels outside screen edge
};

// ========================================
// COLLISION & PHYSICS
// ========================================

const PHYSICS = {
  projectileKnockback: 100,      // force applied to enemies
  enemyKnockback: 150,           // force applied to player on hit
  knockbackDecay: 0.9,           // per-frame (player)
  knockbackDecayEnemy: 0.85,     // per-frame (enemies)
};

// ========================================
// CAMERA SYSTEM
// ========================================

const CAMERA = {
  followSpeed: 0.1,              // lerp factor (0-1)
  shakeDecay: 0.8,               // shake reduction per frame
};

// ========================================
// SCREEN EFFECTS
// ========================================

const EFFECTS = {
  screenFlash: {
    intensity: 0.3,              // alpha value
    decay: 5.0,                  // decay rate
    color: 'rgba(255, 0, 0, 0.3)',
  },
  
  hitFlash: {
    duration: 0.1,               // seconds
    color: '#FFFFFF',
  },
};

// ========================================
// GAME FORMULAS
// ========================================

/**
 * Movement Formula:
 * velocity += input * speed * dt * 10
 * velocity *= friction
 * position += velocity * dt
 */

/**
 * Auto-Attack Target Selection:
 * 1. Find all alive enemies
 * 2. Calculate distance to each
 * 3. Select nearest enemy
 * 4. Fire projectile towards target
 */

/**
 * Difficulty Scaling:
 * Every 30 seconds:
 * - enemies per spawn += 1 (max 15)
 * - spawn interval -= 0.1s (min 0.5s)
 */

/**
 * Collision Detection:
 * Using circle-circle collision:
 * distance² < (radius1 + radius2)²
 * (Using squared distance for performance)
 */

/**
 * Camera Following:
 * targetX = player.x - screenWidth / 2
 * camera.x += (targetX - camera.x) * followSpeed
 */

/**
 * Knockback Application:
 * direction = normalize(target - source)
 * velocity = direction * knockbackForce
 * velocity *= decay (each frame)
 */

// ========================================
// TUNING GUIDELINES
// ========================================

/**
 * MAKING THE GAME EASIER:
 * - Increase player.maxHealth
 * - Increase player.damage
 * - Decrease player.attackCooldown
 * - Decrease enemy.damage
 * - Increase spawn.baseSpawnInterval
 * - Decrease spawn.baseEnemiesPerSpawn
 */

/**
 * MAKING THE GAME HARDER:
 * - Decrease player.maxHealth
 * - Decrease player.damage
 * - Increase player.attackCooldown
 * - Increase enemy.damage
 * - Increase enemy.speed
 * - Decrease spawn.baseSpawnInterval
 * - Increase spawn.baseEnemiesPerSpawn
 */

/**
 * IMPROVING GAMEFEEL:
 * - Increase camera shake intensity/duration
 * - Add more particle effects
 * - Increase knockback forces
 * - Add hit-stop (brief pause on impact)
 * - Add more visual feedback (flashes, colors)
 */

/**
 * PERFORMANCE OPTIMIZATION:
 * - Reduce spawn.maxEnemiesPerSpawn
 * - Reduce projectile.trailLength
 * - Implement object pooling
 * - Add render culling
 * - Use spatial partitioning
 */

// ========================================
// BALANCING METRICS
// ========================================

/**
 * Target Survival Times:
 * - Beginner: 2-3 minutes
 * - Average: 5-7 minutes
 * - Expert: 10+ minutes
 * 
 * DPS Requirements:
 * - Player DPS: ~25 (projectile every 0.4s @ 10 damage)
 * - Enemy spawn rate: ~1 enemy/second (ramps up)
 * - Enemy health scaling needed to maintain challenge
 */

/**
 * Difficulty Curve:
 * Time    | Enemies/Wave | Spawn Rate | Challenge Level
 * --------|--------------|------------|----------------
 * 0-30s   | 2            | 2.0s       | Tutorial
 * 30-60s  | 3-4          | 1.8s       | Easy
 * 1-2min  | 5-7          | 1.5s       | Normal
 * 2-5min  | 8-12         | 1.0s       | Hard
 * 5min+   | 13-15        | 0.5s       | Extreme
 */

export default {
  PLAYER,
  ENEMY_TYPES,
  PROJECTILE,
  SPAWN,
  PHYSICS,
  CAMERA,
  EFFECTS,
};
