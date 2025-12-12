/**
 * Math utilities for game development
 * Includes common functions for interpolation, distance, angles, easing, etc.
 */

/**
 * Linear interpolation between two values
 * @param {number} start - Starting value
 * @param {number} end - Ending value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Calculate distance between two points
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Distance
 */
export function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate squared distance (faster, useful for comparisons)
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Squared distance
 */
export function distanceSquared(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

/**
 * Calculate angle between two points in radians
 * @param {number} x1 - First point X
 * @param {number} y1 - First point Y
 * @param {number} x2 - Second point X
 * @param {number} y2 - Second point Y
 * @returns {number} Angle in radians
 */
export function angleBetween(x1, y1, x2, y2) {
  return Math.atan2(y2 - y1, x2 - x1);
}

/**
 * Normalize angle to range [-PI, PI]
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
}

/**
 * Generate random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random value
 */
export function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get random spawn position around a radius
 * @param {number} centerX - Center X position
 * @param {number} centerY - Center Y position
 * @param {number} radius - Spawn radius
 * @returns {{x: number, y: number}} Random position
 */
export function randomSpawnAroundRadius(centerX, centerY, radius) {
  const angle = random(0, Math.PI * 2);
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

/**
 * Get random spawn position on screen edge
 * @param {number} width - Screen width
 * @param {number} height - Screen height
 * @param {number} margin - Margin outside screen
 * @returns {{x: number, y: number}} Random position
 */
export function randomSpawnOnEdge(width, height, margin = 50) {
  const side = randomInt(0, 3); // 0: top, 1: right, 2: bottom, 3: left
  
  switch (side) {
    case 0: // top
      return { x: random(-margin, width + margin), y: -margin };
    case 1: // right
      return { x: width + margin, y: random(-margin, height + margin) };
    case 2: // bottom
      return { x: random(-margin, width + margin), y: height + margin };
    case 3: // left
      return { x: -margin, y: random(-margin, height + margin) };
    default:
      return { x: 0, y: 0 };
  }
}

/**
 * Normalize a vector (make it unit length)
 * @param {number} x - Vector X
 * @param {number} y - Vector Y
 * @returns {{x: number, y: number}} Normalized vector
 */
export function normalize(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return { x: 0, y: 0 };
  return { x: x / len, y: y / len };
}

/**
 * Easing function: Ease out cubic
 * @param {number} t - Time (0-1)
 * @returns {number} Eased value
 */
export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Easing function: Ease in cubic
 * @param {number} t - Time (0-1)
 * @returns {number} Eased value
 */
export function easeInCubic(t) {
  return t * t * t;
}

/**
 * Easing function: Ease in-out cubic
 * @param {number} t - Time (0-1)
 * @returns {number} Eased value
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Easing function: Elastic ease out (bouncy)
 * @param {number} t - Time (0-1)
 * @returns {number} Eased value
 */
export function easeOutElastic(t) {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
}

/**
 * Check if two circles are colliding
 * @param {number} x1 - First circle X
 * @param {number} y1 - First circle Y
 * @param {number} r1 - First circle radius
 * @param {number} x2 - Second circle X
 * @param {number} y2 - Second circle Y
 * @param {number} r2 - Second circle radius
 * @returns {boolean} True if colliding
 */
export function circleCollision(x1, y1, r1, x2, y2, r2) {
  const dist = distanceSquared(x1, y1, x2, y2);
  const radiusSum = r1 + r2;
  return dist < radiusSum * radiusSum;
}

/**
 * Move a value towards a target at a given speed
 * @param {number} current - Current value
 * @param {number} target - Target value
 * @param {number} speed - Movement speed
 * @returns {number} New value
 */
export function moveTowards(current, target, speed) {
  if (Math.abs(target - current) <= speed) {
    return target;
  }
  return current + Math.sign(target - current) * speed;
}

/**
 * Rotate towards a target angle at a given speed
 * @param {number} current - Current angle in radians
 * @param {number} target - Target angle in radians
 * @param {number} speed - Rotation speed in radians
 * @returns {number} New angle
 */
export function rotateTowards(current, target, speed) {
  const diff = normalizeAngle(target - current);
  if (Math.abs(diff) <= speed) {
    return target;
  }
  return current + Math.sign(diff) * speed;
}
