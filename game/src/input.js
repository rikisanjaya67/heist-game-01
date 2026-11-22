// Keyboard and pointer input. Held keys give a steering direction; one-shot presses (start
// or restart, pause, gadgets) are queued as bit flags and taken once by the loop, so a press
// between two frames is never lost and never counted twice. A mouse click sets a point to
// steer toward, and a gadget key tosses toward the last pointer position.
import { FIELD } from './config.js';

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_COIN = 4;
export const ACTION_EMP = 8;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const COIN = new Set(['Digit1', 'Numpad1']);
const EMP = new Set(['Digit2', 'Numpad2']);

export function createInput(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let sneak = false;
  let actions = 0;
  /** The last pointer position, in field coordinates; gadgets toss toward it. */
  let pointer = { x: FIELD.width / 2, y: FIELD.height / 2 };
  /** A click-to-move target, or null. */
  let target = null;

  function toField(event) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / FIELD.width, rect.height / FIELD.height);
    const ox = (rect.width - FIELD.width * scale) / 2;
    const oy = (rect.height - FIELD.height * scale) / 2;
    return {
      x: (event.clientX - rect.left - ox) / scale,
      y: (event.clientY - rect.top - oy) / scale,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (COIN.has(event.code)) {
      if (!event.repeat) actions |= ACTION_COIN;
    } else if (EMP.has(event.code)) {
      if (!event.repeat) actions |= ACTION_EMP;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') sneak = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
    sneak = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    pointer = toField(event);
  });
  canvas.addEventListener('pointerdown', (event) => {
    pointer = toField(event);
    target = { ...pointer };
    actions |= ACTION_CONFIRM;
  });

  return {
    /** The steering direction this frame: keys first, else toward the click target. */
    direction(thief) {
      const kx = (right ? 1 : 0) - (left ? 1 : 0);
      const ky = (down ? 1 : 0) - (up ? 1 : 0);
      if (kx !== 0 || ky !== 0) {
        target = null;
        return { x: kx, y: ky };
      }
      if (target !== null) {
        const dx = target.x - thief.x;
        const dy = target.y - thief.y;
        if (Math.hypot(dx, dy) < 8) {
          target = null;
          return { x: 0, y: 0 };
        }
        return { x: dx, y: dy };
      }
      return { x: 0, y: 0 };
    },
    isSneaking() {
      return sneak;
    },
    pointerTarget() {
      return pointer;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
