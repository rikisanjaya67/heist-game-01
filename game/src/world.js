// The night itself: one museum vault room, the thief crossing it, the loot, the alarm and
// the win and lose. Nothing here touches the screen or the keyboard; it only advances the
// simulation one fixed step at a time, so the same seed always plays the same night.
import { ALARM, CAMERA, FIELD, GADGETS, GUARD, STEP, THIEF } from './config.js';
import {
  cameraSees,
  createCamera,
  createGuard,
  distractGuard,
  moveWithWalls,
  stepCamera,
  stepGuard,
} from './guards.js';

export const EVENT_NONE = 0;
export const EVENT_LOOT = 1;
export const EVENT_SPOTTED = 2;
export const EVENT_CAUGHT = 4;
export const EVENT_ALARM = 8;
export const EVENT_WIN = 16;
export const EVENT_OVER = EVENT_CAUGHT | EVENT_ALARM | EVENT_WIN;

export const PHASE_PLAY = 'play';
export const PHASE_CAUGHT = 'caught';
export const PHASE_ALARM = 'alarm';
export const PHASE_ESCAPED = 'escaped';

/**
 * The room's cover: every rectangle the thief and the guards walk around and that blocks a
 * stare. Pedestals, vitrines, benches and the grand statue in the middle of the Halden Gallery.
 */
export const WALLS = [
  { x: 300, y: 96, w: 96, h: 52, kind: 'vitrine' },
  { x: 784, y: 96, w: 96, h: 52, kind: 'vitrine' },
  { x: 176, y: 288, w: 64, h: 64, kind: 'statue' },
  { x: 1040, y: 288, w: 64, h: 64, kind: 'statue' },
  { x: 408, y: 316, w: 148, h: 72, kind: 'case' },
  { x: 724, y: 316, w: 148, h: 72, kind: 'case' },
  { x: 592, y: 268, w: 96, h: 120, kind: 'statue' },
  { x: 296, y: 512, w: 128, h: 40, kind: 'bench' },
  { x: 856, y: 512, w: 128, h: 40, kind: 'bench' },
];

/** The night's loot: three paintings and the Halden Star diamond in its vault. */
export function createLoot() {
  return [
    { id: 'sunset', name: 'Sunset over Halden', kind: 'painting', x: 250, y: 52, value: 400, taken: false },
    { id: 'duchess', name: 'The Blue Duchess', kind: 'painting', x: 1030, y: 52, value: 500, taken: false },
    { id: 'harbor', name: 'Harbor at Dusk', kind: 'painting', x: 120, y: 620, value: 350, taken: false },
    { id: 'star', name: 'The Halden Star', kind: 'diamond', x: 640, y: 92, value: 1200, taken: false },
  ];
}

/** Where the thief slips in, and where the getaway door waits. */
export const ENTRANCE = { x: 96, y: 648 };
export const EXIT = { x: 1184, y: 648, w: 64, h: 48 };

/**
 * Build a fresh night from a seeded random. Guard routes and camera sweeps are fixed by the
 * room; the seed only shuffles which painting the night watch checks first, so every seed
 * plays fair and no two nights patrol quite alike.
 */
export function createWorld(random) {
  const jitter = random();
  const guards = [
    createGuard('Marlow', [[180, 150], [1100, 150], [1100, 210], [180, 210]], jitter < 0.5 ? 0 : 2),
    createGuard('Vera', [[300, 250], [300, 560], [520, 560], [520, 250]], 0),
    createGuard('Otto', [[760, 250], [980, 250], [980, 560], [760, 560]], 1),
    createGuard('Iris', [[220, 624], [1060, 624]], 1),
    createGuard('Kessler', [[540, 250], [740, 250], [740, 440], [540, 440]], 2),
  ];
  const cameras = [
    createCamera('North Eye', 640, 30, Math.PI / 2, 0.85, 7, 0),
    createCamera('West Eye', 30, 360, 0, 0.8, 9, 2.2),
    createCamera('East Eye', 1250, 360, Math.PI, 0.8, 9, 4.4),
  ];
  const state = {
    time: 0,
    thief: { x: ENTRANCE.x, y: ENTRANCE.y, radius: THIEF.radius, angle: -Math.PI / 2, sneaking: false, moving: false },
    guards,
    cameras,
    loot: createLoot(),
    walls: WALLS,
    alarm: 0,
    score: 0,
    lootTaken: 0,
    coins: GADGETS.coin.start,
    emps: GADGETS.emp.start,
    coin: null,
    phase: PHASE_PLAY,
    message: '',
    spotted: false,
  };
  return { state, random };
}

/** Put the night back at the start, keeping the same seed's patrols. */
export function resetWorld(world) {
  const fresh = createWorld(world.random);
  world.state = fresh.state;
}

/**
 * One fixed step of the night.
 * `move` is {x, y} from -1 to 1 (keyboard or mouse steering), `sneak` holds Shift,
 * `gadget` is 'coin' | 'emp' | null with `gadgetX`/`gadgetY` the toss target.
 * `attract` runs the room behind the title screen: guards walk and cameras sweep, but
 * nobody watches the thief, the alarm never moves and no loot is taken.
 * Returns a bitmask of EVENT_* flags.
 */
export function stepWorld(world, dt, move, sneak, gadget, gadgetX, gadgetY, attract = false) {
  const s = world.state;
  if (s.phase !== PHASE_PLAY) return EVENT_NONE;
  s.time += dt;
  let events = EVENT_NONE;

  // The thief walks, sliding around the room's cover.
  const speed = sneak ? THIEF.sneakSpeed : THIEF.speed;
  const length = Math.hypot(move.x, move.y);
  s.thief.sneaking = sneak;
  s.thief.moving = length > 0.05;
  if (length > 0.05) {
    const nx = s.thief.x + (move.x / Math.max(1, length)) * speed * dt;
    const ny = s.thief.y + (move.y / Math.max(1, length)) * speed * dt;
    s.thief.angle = Math.atan2(move.y, move.x);
    moveWithWalls(s.thief, nx, ny, s.walls);
  }

  // Cameras sweep; guards patrol, investigate or hunt.
  for (const camera of s.cameras) stepCamera(camera, s.time, dt);
  let seen = false;
  for (const guard of s.guards) {
    if (stepGuard(guard, dt, s.thief, s.walls, attract ? 0 : s.alarm, attract)) seen = true;
  }
  for (const camera of s.cameras) {
    camera.seesThief = attract ? false : cameraSees(camera, s.thief, s.walls);
    if (camera.seesThief) seen = true;
  }
  s.spotted = seen && !attract;
  if (attract) return EVENT_NONE;

  // Gadgets: a tossed coin rings on the marble and pulls guards over; an EMP freezes the eyes.
  if (gadget === 'coin' && s.coins > 0 && s.coin === null) {
    s.coins -= 1;
    const dx = gadgetX - s.thief.x;
    const dy = gadgetY - s.thief.y;
    const d = Math.hypot(dx, dy);
    const range = Math.min(d, GADGETS.coin.throwRange);
    const cx = s.thief.x + (d > 0 ? (dx / d) * range : 0);
    const cy = s.thief.y + (d > 0 ? (dy / d) * range : 0);
    s.coin = { x: cx, y: cy, left: GADGETS.coin.distractSeconds };
    for (const guard of s.guards) distractGuard(guard, cx, cy);
  } else if (gadget === 'emp' && s.emps > 0) {
    s.emps -= 1;
    for (const camera of s.cameras) camera.frozenLeft = CAMERA.empFreeze;
  }
  if (s.coin !== null) {
    s.coin.left -= dt;
    if (s.coin.left <= 0) s.coin = null;
  }

  // The alarm climbs while any eye is on the thief, and falls when the room is calm.
  if (seen) {
    let rate = 0;
    for (const guard of s.guards) if (guard.seesThief && guard.graceLeft <= 0) rate += GUARD.alarmRate;
    for (const camera of s.cameras) if (camera.seesThief) rate += CAMERA.alarmRate;
    s.alarm = Math.min(ALARM.max, s.alarm + rate * dt);
    if (rate > 0) events |= EVENT_SPOTTED;
  } else {
    s.alarm = Math.max(0, s.alarm - ALARM.decay * dt);
  }

  // A guard that reaches the thief catches them on the spot.
  for (const guard of s.guards) {
    if (Math.hypot(guard.x - s.thief.x, guard.y - s.thief.y) < GUARD.catchDistance) {
      s.phase = PHASE_CAUGHT;
      s.message = `${guard.name} caught the thief in the gallery.`;
      return events | EVENT_CAUGHT | EVENT_OVER;
    }
  }

  // The alarm seals the vault.
  if (s.alarm >= ALARM.max) {
    s.phase = PHASE_ALARM;
    s.message = 'The alarm hit 100% — the vault sealed shut.';
    return events | EVENT_ALARM | EVENT_OVER;
  }

  // Loot: step close to a painting or the diamond and it is yours.
  for (const item of s.loot) {
    if (!item.taken && Math.hypot(item.x - s.thief.x, item.y - s.thief.y) < 34) {
      item.taken = true;
      s.lootTaken += 1;
      s.score += item.value;
      events |= EVENT_LOOT;
    }
  }

  // With every piece taken, the getaway door opens; reach it and the night is yours.
  if (s.lootTaken === s.loot.length) {
    const t = s.thief;
    if (t.x > EXIT.x - EXIT.w / 2 && t.x < EXIT.x + EXIT.w / 2 && t.y > EXIT.y - EXIT.h / 2 - 10 && t.y < EXIT.y + EXIT.h / 2 + 10) {
      s.phase = PHASE_ESCAPED;
      s.message = 'Clean getaway — every piece out the door.';
      return events | EVENT_WIN | EVENT_OVER;
    }
  }

  return events;
}

/** How much of the haul is out: the score the title screen remembers. */
export function bestHaul(state) {
  return state.score;
}

export { STEP };
