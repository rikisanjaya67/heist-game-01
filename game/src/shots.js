// The screenshot scenes behind ?shot=start|play|end. Each one plays the real rules forward
// from a fresh night for a fixed number of steps, steered by a simple autopilot, so the frame
// is what a short game really looks like and the same seed always gives the same frame.
import { FIELD, GUARD, STEP, THIEF } from './config.js';
import { canSee, overlapsAny } from './guards.js';
import { EVENT_OVER, EXIT, resetWorld, stepWorld } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 6;
const END_LIMIT_SECONDS = 600;
/** How far ahead, in seconds, the autopilot tests each way it could move. */
const HORIZON = 0.25;
const DIRECTIONS = 16;

function dangerAt(state, x, y) {
  const fake = { x, y, sneaking: false };
  for (const guard of state.guards) {
    if (Math.hypot(guard.x - x, guard.y - y) < 55) return 1;
    if (canSee(guard, GUARD.sightRange, GUARD.sightAngle / 2, fake, state.walls, 1)) return 1;
  }
  for (const camera of state.cameras) {
    if (camera.frozenLeft > 0) continue;
    if (canSee(camera, 265, 0.45, fake, state.walls, 1)) return 1;
  }
  return 0;
}

/** The next thing to steal: the closest loot still on its wall, else the getaway door. */
function currentTarget(state) {
  let best = null;
  let bestDistance = Infinity;
  for (const item of state.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - state.thief.x, item.y - state.thief.y);
    if (d < bestDistance) {
      bestDistance = d;
      best = item;
    }
  }
  return best === null ? { x: EXIT.x, y: EXIT.y } : best;
}

/**
 * A greedy pilot: of 16 ways to move, take the one that gets closest to the target without
 * stepping into a cone. The careful pilot waits when every way is watched; the hurried one
 * walks straight through the red — and freezes the moment it is spotted, as a hurried
 * player does, which keeps it in the cone while the alarm climbs.
 */
export function createAutopilot(careful) {
  let stuckTime = 0;
  let lastDistance = Infinity;
  let detour = 0;
  let freezeLeft = 0;
  return function autopilot(state) {
    if (!careful && state.spotted && freezeLeft <= 0) freezeLeft = 2.5;
    if (freezeLeft > 0) {
      freezeLeft -= STEP;
      return { x: 0, y: 0 };
    }
    const target = currentTarget(state);
    const thief = state.thief;
    const distance = Math.hypot(target.x - thief.x, target.y - thief.y);
    if (distance < lastDistance - 2) {
      stuckTime = 0;
      lastDistance = distance;
    } else {
      stuckTime += STEP;
      if (stuckTime > 1.2) {
        detour += Math.PI / 2;
        stuckTime = 0;
        lastDistance = distance;
      }
    }
    if (distance < 30) return { x: 0, y: 0 };
    const baseAngle = Math.atan2(target.y - thief.y, target.x - thief.x) + detour;
    let best = { x: 0, y: 0 };
    let bestScore = -Infinity;
    for (let i = 0; i < DIRECTIONS; i += 1) {
      const angle = baseAngle + (i / DIRECTIONS) * Math.PI * 2;
      const nx = thief.x + Math.cos(angle) * THIEF.speed * HORIZON;
      const ny = thief.y + Math.sin(angle) * THIEF.speed * HORIZON;
      if (nx < 30 || nx > FIELD.width - 30 || ny < 30 || ny > FIELD.height - 30) continue;
      if (overlapsAny(nx, ny, THIEF.radius + 2, state.walls)) continue;
      const progress = distance - Math.hypot(target.x - nx, target.y - ny);
      let score = progress;
      if (careful) score -= dangerAt(state, nx, ny) * 400;
      if (i === 0) score += 2;
      if (score > bestScore) {
        bestScore = score;
        best = { x: Math.cos(angle), y: Math.sin(angle) };
      }
    }
    if (detour !== 0 && bestScore > -Infinity) detour *= 0.9;
    return best;
  };
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start) and return the
 * screen to draw over it and the best haul to show.
 */
export function stageShot(name, world) {
  resetWorld(world);
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      stepWorld(world, STEP, { x: 0, y: 0 }, false, null, 0, 0);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }
  const careful = name === 'play';
  const pilot = createAutopilot(careful);
  const limit = name === 'end' ? END_LIMIT_SECONDS : PLAY_SECONDS;
  let over = false;
  for (let index = 0; index < limit / STEP; index += 1) {
    const move = pilot(world.state);
    const events = stepWorld(world, STEP, move, false, null, 0, 0);
    if (events & EVENT_OVER) {
      over = true;
      break;
    }
  }
  const phase = world.state.phase;
  const screen = phase === 'escaped' ? SCREEN_WIN : over ? SCREEN_OVER : SCREEN_PLAY;
  return { screen, best: world.state.score };
}
