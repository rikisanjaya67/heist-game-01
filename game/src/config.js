// Every tuning number and colour in one place. The playfield is a fixed 1280x720 logical
// area — one whole museum vault room in a single frame — and the renderer scales it to the
// window, so no rule below depends on the screen size.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** The thief: a quick shadow with a light step. */
export const THIEF = {
  radius: 13,
  speed: 205,
  /** Pixels per second the thief moves while crouched (Shift). Slower, and guards notice less. */
  sneakSpeed: 115,
  sneakNotice: 0.55,
};

/** A guard's walk, chase and eye. */
export const GUARD = {
  radius: 14,
  patrolSpeed: 92,
  chaseSpeed: 152,
  investigateSpeed: 122,
  /** How far a guard can see, in pixels. */
  sightRange: 235,
  /** Full field of view, in radians. */
  sightAngle: 1.22,
  /** Alarm points per second while this guard has the thief in its cone. */
  alarmRate: 26,
  /** A guard that bumps the thief catches them. */
  catchDistance: 30,
};

/** A wall camera: it never walks, but its cone sweeps and it never blinks. */
export const CAMERA = {
  sightRange: 265,
  sightAngle: 0.9,
  alarmRate: 34,
  /** Seconds a camera stays frozen after an EMP. */
  empFreeze: 6,
};

/** The alarm meter: 0 is calm, 100 seals the vault. */
export const ALARM = {
  max: 100,
  /** Points per second the meter falls while nobody sees the thief. */
  decay: 7,
  /** Above this, guards stop patrolling and hunt the last place they saw the thief. */
  huntThreshold: 55,
};

/** The two gadgets. Each use costs one charge; charges never refill. */
export const GADGETS = {
  coin: { start: 3, throwRange: 340, distractRadius: 270, distractSeconds: 4.5 },
  emp: { start: 2 },
};

/** Seconds of grace after a close call before the same guard can raise the alarm again. */
export const GRACE = 0.8;

export const PALETTE = {
  floor: '#241a12',
  floorPlank: '#2c2117',
  floorEdge: '#171008',
  rug: '#5d1a24',
  rugBorder: '#c9a24b',
  wall: '#101d24',
  wallTrim: '#c9a24b',
  panel: '#0d1418',
  text: '#f2e8d5',
  muted: '#9a8f7a',
  gold: '#f2c94c',
  goldGlow: '#ffd977',
  thief: '#e8e4da',
  thiefCloak: '#2b2f45',
  guard: '#3f5a52',
  guardUniform: '#476b5e',
  coneCalm: 'rgba(242, 201, 76, 0.16)',
  coneAlert: 'rgba(229, 83, 75, 0.30)',
  coneCamera: 'rgba(229, 83, 75, 0.20)',
  danger: '#e5534b',
  safe: '#7ecb7e',
  exit: '#58c98a',
};

export const FONT = 'Georgia, "Times New Roman", serif';
export const FONT_UI = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best haul is kept between visits (this browser only). */
export const BEST_KEY = 'halden-gallery.best';
