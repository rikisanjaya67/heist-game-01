// Guards and cameras: patrol routes, vision cones, line of sight and what they notice.
// Nothing here touches the screen; it only answers what a guard or a camera can see and
// where each one walks next, so the simulation can run headless.
import { ALARM, CAMERA, FIELD, GADGETS, GUARD } from './config.js';

export const GUARD_PATROL = 'patrol';
export const GUARD_INVESTIGATE = 'investigate';
export const GUARD_CHASE = 'chase';

/** A guard's fixed patrol: a name, a loop of waypoints and a walking speed. */
export function createGuard(name, waypoints, phase) {
  return {
    kind: 'guard',
    name,
    waypoints,
    waypoint: phase % waypoints.length,
    x: waypoints[phase % waypoints.length][0],
    y: waypoints[phase % waypoints.length][1],
    angle: 0,
    mode: GUARD_PATROL,
    investigateX: 0,
    investigateY: 0,
    investigateLeft: 0,
    graceLeft: 0,
    /** Where this guard last saw the thief (for the hunt). */
    lastSeenX: 0,
    lastSeenY: 0,
    seesThief: false,
  };
}

/** A wall camera: fixed to its mount, its cone sweeps back and forth. */
export function createCamera(name, x, y, baseAngle, sweep, period, phase) {
  return {
    kind: 'camera',
    name,
    x,
    y,
    baseAngle,
    sweep,
    period,
    phase,
    angle: baseAngle,
    frozenLeft: 0,
    seesThief: false,
  };
}

/** True when the straight line from (x0, y0) to (x1, y1) crosses any wall rectangle. */
export function lineBlocked(x0, y0, x1, y1, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    if (segmentHitsRect(x0, y0, x1, y1, walls[i])) return true;
  }
  return false;
}

/** Segment-versus-rectangle test, by the slab method. */
export function segmentHitsRect(x0, y0, x1, y1, rect) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  let tMin = 0;
  let tMax = 1;
  if (dx === 0) {
    if (x0 < rect.x || x0 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x0) / dx;
    let t2 = (rect.x + rect.w - x0) / dx;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  if (dy === 0) {
    if (y0 < rect.y || y0 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y0) / dy;
    let t2 = (rect.y + rect.h - y0) / dy;
    if (t1 > t2) {
      const swap = t1;
      t1 = t2;
      t2 = swap;
    }
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return false;
  }
  return true;
}

/** Smallest absolute turn between two headings, in radians. */
export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/**
 * Can this watcher (a guard or a camera, with an eye at x, y, facing `angle`) see the thief?
 * The thief must be inside the cone's range and angle, and no wall may stand between them.
 * A sneaking thief is harder to notice at the cone's edge.
 */
export function canSee(watcher, range, halfAngle, thief, walls, sneakFactor) {
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const distance = Math.hypot(dx, dy);
  const effectiveRange = range * (thief.sneaking ? sneakFactor : 1);
  if (distance > effectiveRange) return false;
  if (distance > 4 && angleDifference(Math.atan2(dy, dx), watcher.angle) > halfAngle) return false;
  return !lineBlocked(watcher.x, watcher.y, thief.x, thief.y, walls);
}

/** Walk `mover` toward (tx, ty) at `speed` for `dt`, sliding around wall rectangles. */
export function walkToward(mover, tx, ty, speed, dt, walls) {
  const dx = tx - mover.x;
  const dy = ty - mover.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 1) return true;
  const step = Math.min(distance, speed * dt);
  const nx = mover.x + (dx / distance) * step;
  const ny = mover.y + (dy / distance) * step;
  mover.angle = Math.atan2(dy, dx);
  moveWithWalls(mover, nx, ny, walls);
  return distance - step < 2;
}

/** Move `mover` to (nx, ny), stopping at any wall it would overlap (axis by axis, so it slides). */
export function moveWithWalls(mover, nx, ny, walls) {
  const r = mover.radius ?? 13;
  if (!overlapsAny(nx, mover.y, r, walls)) mover.x = nx;
  if (!overlapsAny(mover.x, ny, r, walls)) mover.y = ny;
  mover.x = Math.max(24 + r, Math.min(FIELD.width - 24 - r, mover.x));
  mover.y = Math.max(24 + r, Math.min(FIELD.height - 24 - r, mover.y));
}

/** True when a circle of radius `r` at (x, y) overlaps any wall rectangle. */
export function overlapsAny(x, y, r, walls) {
  for (let i = 0; i < walls.length; i += 1) {
    const w = walls[i];
    const cx = Math.max(w.x, Math.min(x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(y, w.y + w.h));
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}

/**
 * Advance one guard by `dt`: patrol its loop, walk to a distraction, or chase the thief it
 * can see. Returns true while the guard has the thief in its cone. In attract mode (the
 * title screen) the guard only patrols and never notices anyone.
 */
export function stepGuard(guard, dt, thief, walls, alarm, attract = false) {
  guard.graceLeft = Math.max(0, guard.graceLeft - dt);
  const sees = attract ? false : canSee(guard, GUARD.sightRange, GUARD.sightAngle / 2, thief, walls, 0.7);
  guard.seesThief = sees;
  if (sees) {
    guard.lastSeenX = thief.x;
    guard.lastSeenY = thief.y;
  }

  if (guard.mode === GUARD_INVESTIGATE) {
    guard.investigateLeft -= dt;
    if (walkToward(guard, guard.investigateX, guard.investigateY, GUARD.investigateSpeed, dt, walls) || guard.investigateLeft <= 0) {
      guard.mode = GUARD_PATROL;
    }
    return sees;
  }

  if (sees || alarm >= ALARM.huntThreshold) {
    guard.mode = GUARD_CHASE;
    walkToward(guard, guard.lastSeenX, guard.lastSeenY, GUARD.chaseSpeed, dt, walls);
    if (!sees && Math.hypot(guard.lastSeenX - guard.x, guard.lastSeenY - guard.y) < 24) guard.mode = GUARD_PATROL;
    return sees;
  }

  guard.mode = GUARD_PATROL;
  const target = guard.waypoints[guard.waypoint];
  if (walkToward(guard, target[0], target[1], GUARD.patrolSpeed, dt, walls)) {
    guard.waypoint = (guard.waypoint + 1) % guard.waypoints.length;
  }
  return sees;
}

/** A guard hears a tossed coin land: turn and walk over to look. */
export function distractGuard(guard, x, y) {
  if (Math.hypot(x - guard.x, y - guard.y) > GADGETS.coin.distractRadius) return;
  guard.mode = GUARD_INVESTIGATE;
  guard.investigateX = x;
  guard.investigateY = y;
  guard.investigateLeft = GADGETS.coin.distractSeconds;
}

/** Advance one camera's sweep by `dt`; a frozen camera holds still and sees nothing. */
export function stepCamera(camera, time, dt) {
  if (camera.frozenLeft > 0) {
    camera.frozenLeft = Math.max(0, camera.frozenLeft - dt);
    return;
  }
  const t = (time + camera.phase) / camera.period;
  camera.angle = camera.baseAngle + camera.sweep * Math.sin(t * Math.PI * 2);
}

/** A camera watches the thief like a guard does, but it never walks. */
export function cameraSees(camera, thief, walls) {
  if (camera.frozenLeft > 0) return false;
  return canSee(camera, CAMERA.sightRange, CAMERA.sightAngle / 2, thief, walls, 0.8);
}
