
import { circleCollision } from '../../utils/math.js';

/**
 * Collision system for handling all game collisions
 * Manages player-enemy, projectile-enemy, and other collision interactions
 */
export class CollisionSystem {
  constructor(soundManager) {
    // Collision stats
    this.playerHits = 0;
    this.projectileHits = 0;
    this.enemiesKilled = 0;
    this.soundManager = soundManager;
    
    // Knockback forces
    this.projectileKnockback = 100;
    this.enemyKnockback = 300; // Doubled to push enemies away more forcefully
  }

    /**
   * Check collision between player and boss (simple circle collision)
   * @param {Object} player - Player entity
   * @param {Object} boss - Boss entity
   * @returns {boolean} True if collision occurred
   */
  checkPlayerBossCollision(player, boss) {
    if (!boss || boss.dead) return false;
    return circleCollision(
      player.x,
      player.y,
      player.radius,
      boss.x,
      boss.y,
      boss.radius
    );
  }

  /**
   * Check and handle all collisions
   * @param {Object} player - Player entity
   * @param {Array} enemies - Array of enemy entities
   * @param {Array} projectiles - Array of projectile entities
   * @returns {Object} Collision results
   */
  checkCollisions(player, enemies, projectiles) {
    const results = {
      playerHit: false,
      enemiesHit: [],
      projectilesHit: [],
      enemiesKilled: [],
      projectileHits: [], // Positions where projectiles hit enemies
      enemyProjectilesHit: [], // Enemy projectiles that hit the player
    };

    // Check player vs enemies
    for (let i = 0; i < enemies.length; i++) {
      const enemy = enemies[i];
      if (enemy.dead) continue;

      if (this.checkPlayerEnemyCollision(player, enemy)) {
        results.playerHit = true;
      }
    }

    // Check projectiles vs enemies and vs player
    for (let i = 0; i < projectiles.length; i++) {
      const projectile = projectiles[i];
      if (!projectile.active) continue;
      
      // Check if enemy projectile hits player
      if (projectile.owner && projectile.owner.type) {
        if (this.checkProjectilePlayerCollision(projectile, player)) {
          results.enemyProjectilesHit.push(projectile);
          results.playerHit = true;
          continue;
        }
      }

      for (let j = 0; j < enemies.length; j++) {
        const enemy = enemies[j];
        if (enemy.dead) continue;
        
        // Skip collision if the enemy fired this projectile
        if (projectile.owner === enemy) continue;

        if (this.checkProjectileEnemyCollision(projectile, enemy, player)) {
          results.projectilesHit.push(projectile);
          results.enemiesHit.push(enemy);
          
          // Track projectile hit location for particles
          results.projectileHits.push({
            x: projectile.x,
            y: projectile.y,
            enemyColor: enemy.color,
          });

          // Check if enemy died
          if (enemy.dead) {
            results.enemiesKilled.push(enemy);
            this.enemiesKilled++;
            if(enemy.isBoss) {
              this.bossDefeated = true;
            }
          }

          // Break if projectile is no longer active
          if (!projectile.active) break;
        }
      }
    }

    return results;
  }

  /**
   * Check collision between player and enemy
   * @param {Object} player - Player entity
   * @param {Object} enemy - Enemy entity
   * @returns {boolean} True if collision occurred
   */
  checkPlayerEnemyCollision(player, enemy) {
    const collision = circleCollision(
      player.x,
      player.y,
      player.radius,
      enemy.x,
      enemy.y,
      enemy.radius
    );

    if (collision) {
      // Apply damage to player
      const damaged = player.takeDamage(enemy.damage);
      
      if (damaged) {
        this.playerHits++;
        
        // Apply knockback to player away from enemy
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        player.applyKnockback(dx, dy, this.enemyKnockback * 0.5);
        
        // Apply strong knockback to enemy away from player
        enemy.applyKnockback(-dx, -dy, this.enemyKnockback);
      }
      
      return damaged;
    }

    return false;
  }

  /**
   * Check collision between projectile and enemy
   * @param {Object} projectile - Projectile entity
   * @param {Object} enemy - Enemy entity
   * @param {Object} player - Player entity (for damage calculation)
   * @returns {boolean} True if collision occurred
   */
  checkProjectileEnemyCollision(projectile, enemy, player) {
    const collision = circleCollision(
      projectile.x,
      projectile.y,
      projectile.radius,
      enemy.x,
      enemy.y,
      enemy.radius
    );

    if (collision) {
      // Calculate total damage with critical hit chance
      let baseDamage = projectile.damage + (player ? player.damage : 0);
      let isCrit = false;
      let critDamage = 1.0;
      
      if (player) {
        isCrit = Math.random() < (player.critChance / 100); // Convert percentage to decimal
        critDamage = isCrit ? player.critDamage : 1.0;
      }
      
      const totalDamage = baseDamage * critDamage;
      
      // Apply damage to enemy
      const died = enemy.takeDamage(totalDamage);

      //PLay hit sound
      this.soundManager.playHitSound();
      
      // Apply knockback to enemy
      const dx = enemy.x - projectile.x;
      const dy = enemy.y - projectile.y;
      enemy.applyKnockback(dx, dy, this.projectileKnockback);
      
      // Mark projectile as hit
      projectile.onHit();
      
      this.projectileHits++;
      
      // Store critical hit information for damage display
      projectile.lastHitCrit = isCrit;
      projectile.lastHitCritMultiplier = critDamage;
      
      return true;
    }

    return false;
  }

  /**
   * Check collision between enemy projectile and player
   * @param {Object} projectile - Enemy projectile entity
   * @param {Object} player - Player entity
   * @returns {boolean} True if collision occurred
   */
  checkProjectilePlayerCollision(projectile, player) {
    const collision = circleCollision(
      projectile.x,
      projectile.y,
      projectile.radius,
      player.x,
      player.y,
      player.radius
    );

    if (collision) {
      // Apply damage to player
      const damaged = player.takeDamage(projectile.damage);
      
      if (damaged) {
        this.playerHits++;
        
        // Apply knockback to player away from projectile
        const dx = player.x - projectile.x;
        const dy = player.y - projectile.y;
        player.applyKnockback(dx, dy, this.projectileKnockback * 0.7);
      }
      
      // Deactivate projectile
      projectile.active = false;
      
      return true;
    }

    return false;
  }

  /**
   * Clean up dead enemies from array
   * @param {Array} enemies - Array of enemy entities
   * @returns {number} Number of enemies removed
   */
  cleanupDeadEnemies(enemies) {
    const initialLength = enemies.length;
    
    // Remove dead enemies after a short delay (for visual feedback)
    for (let i = enemies.length - 1; i >= 0; i--) {
      if (enemies[i].dead) {
        enemies.splice(i, 1);
      }
    }
    
    return initialLength - enemies.length;
  }

  /**
   * Clean up inactive projectiles from array
   * @param {Array} projectiles - Array of projectile entities
   * @returns {number} Number of projectiles removed
   */
  cleanupInactiveProjectiles(projectiles) {
    const initialLength = projectiles.length;
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
      if (!projectiles[i].active) {
        projectiles.splice(i, 1);
      }
    }
    
    return initialLength - projectiles.length;
  }

  /**
   * Reset collision stats
   */
  reset() {
    this.playerHits = 0;
    this.projectileHits = 0;
    this.enemiesKilled = 0;
  }

  /**
   * Get collision stats
   * @returns {Object} Collision statistics
   */
  getStats() {
    return {
      playerHits: this.playerHits,
      projectileHits: this.projectileHits,
      enemiesKilled: this.enemiesKilled,
    };
  }
}
