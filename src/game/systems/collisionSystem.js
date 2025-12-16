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
    this.enemyKnockback = 300;

    // Boss defeated flag
    this.bossDefeated = false;
  }

  /**
   * Helper: check circle collision between two entities
   */
  isColliding(a, b) {
    return circleCollision(a.x, a.y, a.radius, b.x, b.y, b.radius);
  }

  /**
   * Helper: calculate critical hit multiplier
   */
  getCritMultiplier(player) {
    if (!player) return { isCrit: false, multiplier: 1 };
    const isCrit = Math.random() < player.critChance / 100;
    return { isCrit, multiplier: isCrit ? player.critDamage : 1 };
  }

  /**
   * Check collision between player and boss
   */
  checkPlayerBossCollision(player, boss) {
    if (!boss || boss.dead) return false;
    if (this.isColliding(player, boss)) {
      const damaged = player.takeDamage(boss.damage);
      if (damaged) {
        this.playerHits++;
        // Knockback
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        player.applyKnockback(dx, dy, this.enemyKnockback * 0.5);
        boss.applyKnockback(-dx, -dy, this.enemyKnockback);
      }
      return damaged;
    }
    return false;
  }

  /**
   * Check and handle all collisions
   */
  checkCollisions(player, enemies, projectiles, boss = null) {
    const results = {
      playerHit: false,
      enemiesHit: [],
      projectilesHit: [],
      enemiesKilled: [],
      projectileHits: [], // Positions where projectiles hit enemies
      enemyProjectilesHit: [],
    };

    // Player vs enemies
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      if (this.checkPlayerEnemyCollision(player, enemy)) results.playerHit = true;
    }

    // Player vs boss
    if (boss && this.checkPlayerBossCollision(player, boss)) results.playerHit = true;

    // Projectiles
    for (const projectile of projectiles) {
      if (!projectile.active) continue;

      // Enemy projectile hitting player
      if (projectile.owner?.type) {
        if (this.checkProjectilePlayerCollision(projectile, player)) {
          results.enemyProjectilesHit.push(projectile);
          results.playerHit = true;
          continue;
        }
      }

      // Projectile vs enemies
      for (const enemy of enemies) {
        if (enemy.dead) continue;
        if (projectile.owner === enemy) continue;

        if (projectile.aoeRadius > 0) {
          const collided = this.isColliding(projectile, enemy);
          if (collided) {
            const anyHit = this.applyAOEDamage(projectile, enemies, player, results);
            if (anyHit) {
              results.projectilesHit.push(projectile);
              results.projectileHits.push({ x: projectile.x, y: projectile.y, enemyColor: enemy.color });
            }
            break;
          }
        } else {
          if (this.checkProjectileEnemyCollision(projectile, enemy, player)) {
            results.projectilesHit.push(projectile);
            results.enemiesHit.push(enemy);
            results.projectileHits.push({ x: projectile.x, y: projectile.y, enemyColor: enemy.color });
            if (enemy.dead) results.enemiesKilled.push(enemy);
            if (!projectile.active) break;
          }
        }
      }
    }

    return results;
  }

  checkPlayerEnemyCollision(player, enemy) {
    if (!this.isColliding(player, enemy)) return false;

    const damaged = player.takeDamage(enemy.damage);
    if (!damaged) return false;

    this.playerHits++;

    // Knockback
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    player.applyKnockback(dx, dy, this.enemyKnockback * 0.5);
    enemy.applyKnockback(-dx, -dy, this.enemyKnockback);

    return true;
  }

  checkProjectileEnemyCollision(projectile, enemy, player) {
    if (!this.isColliding(projectile, enemy)) return false;
    if (projectile.hitTargets?.has(enemy)) return false;

    const { isCrit, multiplier } = this.getCritMultiplier(player);
    const totalDamage = (projectile.damage + (player?.damage || 0)) * multiplier;
    const died = enemy.takeDamage(totalDamage, projectile);

    // Play sound
    this.soundManager.playHitSound();

    // Lifesteal
    if (player?.lifeSteal) player.heal(totalDamage * player.lifeSteal);

    // Knockback
    const dx = enemy.x - projectile.x;
    const dy = enemy.y - projectile.y;
    enemy.applyKnockback(dx, dy, this.projectileKnockback);

    projectile.onHit();
    if (projectile.hitTargets) projectile.hitTargets.add(enemy);

    projectile.lastHitCrit = isCrit;
    projectile.lastHitCritMultiplier = multiplier;

    this.projectileHits++;
    if (died) {
      this.enemiesKilled++;
      if (enemy.isBoss) this.bossDefeated = true;
    }

    return true;
  }

  applyAOEDamage(projectile, enemies, player, results) {
    let anyHit = false;
    const { isCrit, multiplier } = this.getCritMultiplier(player);

    for (const enemy of enemies) {
      if (enemy.dead || projectile.owner === enemy) continue;

      const dx = enemy.x - projectile.x;
      const dy = enemy.y - projectile.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > projectile.aoeRadius + enemy.radius) continue;

      const totalDamage = (projectile.damage + (player?.damage || 0)) * multiplier;
      const died = enemy.takeDamage(totalDamage, projectile);

      this.soundManager.playHitSound();
      enemy.applyKnockback(dx, dy, this.projectileKnockback);

      if (projectile.hitTargets) projectile.hitTargets.add(enemy);

      projectile.lastHitCrit = isCrit;
      projectile.lastHitCritMultiplier = multiplier;

      results.enemiesHit.push(enemy);
      if (died) {
        results.enemiesKilled.push(enemy);
        this.enemiesKilled++;
        if (enemy.isBoss) this.bossDefeated = true;
      }

      anyHit = true;
    }

    projectile.active = false;
    return anyHit;
  }

  checkProjectilePlayerCollision(projectile, player) {
    if (!this.isColliding(projectile, player)) return false;

    const damaged = player.takeDamage(projectile.damage);
    if (damaged) {
      this.playerHits++;
      const dx = player.x - projectile.x;
      const dy = player.y - projectile.y;
      player.applyKnockback(dx, dy, this.projectileKnockback * 0.7);
    }

    projectile.active = false;
    return damaged;
  }

  cleanupDeadEnemies(enemies) {
    const initialLength = enemies.length;
    for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) enemies.splice(i, 1);
    return initialLength - enemies.length;
  }

  cleanupInactiveProjectiles(projectiles) {
    const initialLength = projectiles.length;
    for (let i = projectiles.length - 1; i >= 0; i--) if (!projectiles[i].active) projectiles.splice(i, 1);
    return initialLength - projectiles.length;
  }

  reset() {
    this.playerHits = 0;
    this.projectileHits = 0;
    this.enemiesKilled = 0;
    this.bossDefeated = false;
  }

  getStats() {
    return {
      playerHits: this.playerHits,
      projectileHits: this.projectileHits,
      enemiesKilled: this.enemiesKilled,
    };
  }
}
