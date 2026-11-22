// Everything the eye sees: the dark gallery, the warm loot, the red cones, the cover's
// shadows and the alarm meter. The renderer only paints a state; it never changes one.
import { ALARM, CAMERA, FIELD, FONT, FONT_UI, GUARD, PALETTE, THIEF } from './config.js';
import { EXIT } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

/** Draw a vision cone as a soft wedge from (x, y) facing `angle`. */
export function drawCone(ctx, x, y, angle, range, halfAngle, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A soft shadow under a piece of cover, so the room reads as deep, not flat. */
export function drawCoverShadow(ctx, rect) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.roundRect(rect.x + 6, rect.y + 8, rect.w, rect.h, 6);
  ctx.fill();
  ctx.restore();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function fit() {
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
  }

  function drawFloor() {
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Wooden planks, running across the room.
    ctx.fillStyle = PALETTE.floorPlank;
    for (let y = 64; y < FIELD.height; y += 48) ctx.fillRect(0, y, FIELD.width, 3);
    ctx.fillStyle = PALETTE.floorEdge;
    ctx.fillRect(0, 0, FIELD.width, 24);
    ctx.fillRect(0, FIELD.height - 24, FIELD.width, 24);
    ctx.fillRect(0, 0, 24, FIELD.height);
    ctx.fillRect(FIELD.width - 24, 0, 24, FIELD.height);
    // The great rug under the statue: deep red with a gold border.
    ctx.fillStyle = PALETTE.rug;
    ctx.beginPath();
    ctx.roundRect(420, 200, 440, 320, 10);
    ctx.fill();
    ctx.strokeStyle = PALETTE.rugBorder;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(436, 216, 408, 288, 8);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(201, 162, 75, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(452, 232, 376, 256, 6);
    ctx.stroke();
    // Wall trim: gold line where the walls meet the floor.
    ctx.strokeStyle = PALETTE.wallTrim;
    ctx.lineWidth = 3;
    ctx.strokeRect(24, 24, FIELD.width - 48, FIELD.height - 48);
  }

  function drawLoot(state) {
    for (const item of state.loot) {
      if (item.taken) continue;
      const pulse = 0.75 + 0.25 * Math.sin(state.time * 3 + item.x);
      // Warm glow: the loot is the brightest thing in the dark room.
      const glow = ctx.createRadialGradient(item.x, item.y, 4, item.x, item.y, 90);
      glow.addColorStop(0, `rgba(255, 217, 119, ${0.5 * pulse})`);
      glow.addColorStop(1, 'rgba(255, 217, 119, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 90, 0, Math.PI * 2);
      ctx.fill();
      if (item.kind === 'diamond') {
        drawDiamond(item.x, item.y, 22, pulse);
      } else {
        drawPainting(item);
      }
    }
  }

  function drawPainting(item) {
    ctx.save();
    ctx.translate(item.x, item.y);
    // Gilded frame.
    ctx.fillStyle = '#8a6d2b';
    ctx.fillRect(-34, -24, 68, 48);
    ctx.fillStyle = '#c9a24b';
    ctx.fillRect(-30, -20, 60, 40);
    // The canvas inside: a tiny dusk scene, different per painting.
    const sky = ctx.createLinearGradient(0, -20, 0, 20);
    if (item.id === 'sunset') {
      sky.addColorStop(0, '#e8833a');
      sky.addColorStop(1, '#5d1a24');
    } else if (item.id === 'duchess') {
      sky.addColorStop(0, '#2b4a7a');
      sky.addColorStop(1, '#101d24');
    } else {
      sky.addColorStop(0, '#7a6a9a');
      sky.addColorStop(1, '#2c2117');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(-28, -18, 56, 36);
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(item.id === 'duchess' ? -8 : 8, -6, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(16, 20, 24, 0.8)';
    ctx.fillRect(-28, 8, 56, 10);
    ctx.restore();
  }

  function drawDiamond(x, y, size, pulse) {
    ctx.save();
    ctx.translate(x, y);
    // Glass vault case.
    ctx.fillStyle = 'rgba(180, 220, 255, 0.12)';
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.55)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-size - 12, -size - 12, (size + 12) * 2, (size + 12) * 2, 8);
    ctx.fill();
    ctx.stroke();
    // The Halden Star: a faceted gem.
    const sparkle = 0.85 + 0.15 * pulse;
    ctx.fillStyle = `rgba(190, 235, 255, ${sparkle})`;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.8, -size * 0.2);
    ctx.lineTo(size * 0.5, size * 0.8);
    ctx.lineTo(-size * 0.5, size * 0.8);
    ctx.lineTo(-size * 0.8, -size * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.8, -size * 0.2);
    ctx.lineTo(size * 0.8, -size * 0.2);
    ctx.moveTo(0, -size);
    ctx.lineTo(0, size * 0.8);
    ctx.stroke();
    ctx.restore();
  }

  function drawCover(state) {
    for (const wall of state.walls) {
      drawCoverShadow(ctx, wall);
      if (wall.kind === 'vitrine') {
        ctx.fillStyle = '#3a2f22';
        ctx.beginPath();
        ctx.roundRect(wall.x, wall.y, wall.w, wall.h, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(180, 220, 255, 0.14)';
        ctx.beginPath();
        ctx.roundRect(wall.x + 6, wall.y + 6, wall.w - 12, wall.h - 12, 4);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 230, 255, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(wall.x + 6, wall.y + 6, wall.w - 12, wall.h - 12, 4);
        ctx.stroke();
      } else if (wall.kind === 'statue') {
        ctx.fillStyle = '#4a4036';
        ctx.beginPath();
        ctx.roundRect(wall.x, wall.y, wall.w, wall.h, 6);
        ctx.fill();
        ctx.fillStyle = '#6a5c48';
        ctx.beginPath();
        ctx.arc(wall.x + wall.w / 2, wall.y + wall.h / 2 - 8, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#8a7a62';
        ctx.beginPath();
        ctx.arc(wall.x + wall.w / 2, wall.y + wall.h / 2 - 14, 8, 0, Math.PI * 2);
        ctx.fill();
      } else if (wall.kind === 'case') {
        ctx.fillStyle = '#33291d';
        ctx.beginPath();
        ctx.roundRect(wall.x, wall.y, wall.w, wall.h, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(242, 201, 76, 0.10)';
        ctx.beginPath();
        ctx.roundRect(wall.x + 8, wall.y + 8, wall.w - 16, wall.h - 16, 4);
        ctx.fill();
        ctx.strokeStyle = '#c9a24b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(wall.x + 8, wall.y + 8, wall.w - 16, wall.h - 16, 4);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#3a2c1e';
        ctx.beginPath();
        ctx.roundRect(wall.x, wall.y, wall.w, wall.h, 6);
        ctx.fill();
        ctx.fillStyle = '#4d3d28';
        ctx.beginPath();
        ctx.roundRect(wall.x + 6, wall.y + 6, wall.w - 12, wall.h - 12, 4);
        ctx.fill();
      }
    }
  }

  function drawCones(state) {
    for (const camera of state.cameras) {
      if (camera.frozenLeft > 0) continue;
      drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA.sightRange, CAMERA.sightAngle / 2,
        camera.seesThief ? PALETTE.coneAlert : PALETTE.coneCamera);
    }
    for (const guard of state.guards) {
      const alert = guard.seesThief || state.alarm >= ALARM.huntThreshold;
      drawCone(ctx, guard.x, guard.y, guard.angle, GUARD.sightRange, GUARD.sightAngle / 2,
        alert ? PALETTE.coneAlert : PALETTE.coneCalm);
    }
  }

  function drawGuards(state) {
    for (const guard of state.guards) {
      ctx.save();
      ctx.translate(guard.x, guard.y);
      // Soft shadow.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(3, 5, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      // Uniform: green coat, brass buttons, a cap.
      ctx.fillStyle = PALETTE.guardUniform;
      ctx.beginPath();
      ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#c9a24b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, GUARD.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#2c2117';
      ctx.beginPath();
      ctx.arc(0, -4, 7, 0, Math.PI * 2);
      ctx.fill();
      // Facing: the torch in the guard's hand.
      ctx.rotate(guard.angle);
      ctx.fillStyle = guard.seesThief ? '#ff6b5e' : '#ffd977';
      ctx.beginPath();
      ctx.arc(GUARD.radius + 2, 0, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // Name, small and quiet.
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `11px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.fillText(guard.name, guard.x, guard.y - GUARD.radius - 6);
      if (guard.mode === 'investigate') {
        ctx.fillStyle = PALETTE.gold;
        ctx.font = `bold 13px ${FONT_UI}`;
        ctx.fillText('?', guard.x, guard.y - GUARD.radius - 20);
      } else if (guard.mode === 'chase') {
        ctx.fillStyle = PALETTE.danger;
        ctx.font = `bold 13px ${FONT_UI}`;
        ctx.fillText('!', guard.x, guard.y - GUARD.radius - 20);
      }
    }
  }

  function drawCameras(state) {
    for (const camera of state.cameras) {
      ctx.save();
      ctx.translate(camera.x, camera.y);
      ctx.fillStyle = camera.frozenLeft > 0 ? '#5a7a8a' : '#2c3a42';
      ctx.beginPath();
      ctx.roundRect(-10, -8, 20, 16, 4);
      ctx.fill();
      ctx.strokeStyle = camera.frozenLeft > 0 ? '#8ab4c4' : PALETTE.danger;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-10, -8, 20, 16, 4);
      ctx.stroke();
      ctx.rotate(camera.angle);
      ctx.fillStyle = camera.frozenLeft > 0 ? '#8ab4c4' : '#ff6b5e';
      ctx.beginPath();
      ctx.arc(12, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (camera.frozenLeft > 0) {
        ctx.fillStyle = '#8ab4c4';
        ctx.font = `bold 12px ${FONT_UI}`;
        ctx.textAlign = 'center';
        ctx.fillText(`FROZEN ${camera.frozenLeft.toFixed(0)}s`, camera.x, camera.y + 26);
      }
    }
  }

  function drawThief(state) {
    const t = state.thief;
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(3, 5, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // The thief: a hooded shadow in a dark cloak, a pale face in the dark.
    ctx.fillStyle = PALETTE.thiefCloak;
    ctx.beginPath();
    ctx.arc(0, 0, THIEF.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a708c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, THIEF.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.thief;
    ctx.beginPath();
    ctx.arc(0, -2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(t.angle);
    ctx.fillStyle = PALETTE.goldGlow;
    ctx.beginPath();
    ctx.arc(THIEF.radius - 2, 0, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    if (state.lootTaken > 0) {
      ctx.fillStyle = PALETTE.gold;
      ctx.font = `bold 12px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.fillText(`◆ ${state.lootTaken}/${state.loot.length}`, t.x, t.y - THIEF.radius - 8);
    }
  }

  function drawCoin(state) {
    if (!state.coin) return;
    ctx.save();
    ctx.translate(state.coin.x, state.coin.y);
    const ring = ctx.createRadialGradient(0, 0, 2, 0, 0, 26);
    ring.addColorStop(0, 'rgba(242, 201, 76, 0.5)');
    ring.addColorStop(1, 'rgba(242, 201, 76, 0)');
    ctx.fillStyle = ring;
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawExit(state) {
    const open = state.lootTaken === state.loot.length;
    const cx = EXIT.x;
    const cy = EXIT.y;
    ctx.save();
    if (open) {
      const glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 90);
      glow.addColorStop(0, 'rgba(88, 201, 138, 0.55)');
      glow.addColorStop(1, 'rgba(88, 201, 138, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 90, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = open ? '#1d4a30' : '#3a1d1d';
    ctx.beginPath();
    ctx.roundRect(cx - EXIT.w / 2, cy - EXIT.h / 2, EXIT.w, EXIT.h, 4);
    ctx.fill();
    ctx.strokeStyle = open ? PALETTE.exit : PALETTE.danger;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cx - EXIT.w / 2, cy - EXIT.h / 2, EXIT.w, EXIT.h, 4);
    ctx.stroke();
    ctx.fillStyle = open ? PALETTE.exit : PALETTE.muted;
    ctx.font = `bold 12px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT OPEN' : 'EXIT LOCKED', cx, cy + 4);
    ctx.restore();
  }

  function drawNight(state) {
    // A vignette of night over the room, lifted around the thief's lamp and the loot.
    const g = ctx.createRadialGradient(state.thief.x, state.thief.y, 60, state.thief.x, state.thief.y, 560);
    g.addColorStop(0, 'rgba(4, 8, 12, 0)');
    g.addColorStop(1, 'rgba(4, 8, 12, 0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawHud(state) {
    // Top bar.
    ctx.fillStyle = 'rgba(10, 14, 18, 0.85)';
    ctx.fillRect(0, 0, FIELD.width, 46);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 17px ${FONT}`;
    ctx.textAlign = 'left';
    ctx.fillText('MIDNIGHT AT THE HALDEN GALLERY', 18, 29);
    // Alarm meter.
    const bx = 470;
    const bw = 340;
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `bold 12px ${FONT_UI}`;
    ctx.textAlign = 'left';
    ctx.fillText('ALARM', bx, 18);
    ctx.fillStyle = '#2a1210';
    ctx.beginPath();
    ctx.roundRect(bx, 24, bw, 12, 6);
    ctx.fill();
    const fill = Math.max(0, Math.min(1, state.alarm / ALARM.max));
    ctx.fillStyle = fill > 0.66 ? PALETTE.danger : fill > 0.33 ? '#e8a33a' : PALETTE.gold;
    if (fill > 0) {
      ctx.beginPath();
      ctx.roundRect(bx, 24, bw * fill, 12, 6);
      ctx.fill();
    }
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 12px ${FONT_UI}`;
    ctx.fillText(`${Math.round(state.alarm)}%`, bx + bw + 10, 35);
    // Loot pips.
    let lx = 900;
    ctx.fillStyle = PALETTE.muted;
    ctx.fillText('LOOT', lx, 18);
    for (let i = 0; i < state.loot.length; i += 1) {
      const taken = state.loot[i].taken;
      ctx.fillStyle = taken ? PALETTE.gold : '#3a332a';
      ctx.beginPath();
      ctx.arc(lx + 62 + i * 26, 30, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(lx + 62 + i * 26, 30, 8, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Gadgets.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 13px ${FONT_UI}`;
    ctx.textAlign = 'right';
    ctx.fillText(`◉ Coin ×${state.coins}  (1)    ❄ EMP ×${state.emps}  (2)`, FIELD.width - 18, 29);
    // Score and time, bottom left.
    ctx.fillStyle = PALETTE.text;
    ctx.font = `13px ${FONT_UI}`;
    ctx.textAlign = 'left';
    ctx.fillText(`Haul $${state.score.toLocaleString('en-US')}    ${Math.floor(state.time / 60)}:${String(Math.floor(state.time % 60)).padStart(2, '0')}`, 18, FIELD.height - 14);
    if (state.spotted) {
      ctx.fillStyle = PALETTE.danger;
      ctx.font = `bold 15px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.fillText('SPOTTED — BREAK LINE OF SIGHT', FIELD.width / 2, FIELD.height - 14);
    } else if (state.lootTaken === state.loot.length && state.phase === 'play') {
      ctx.fillStyle = PALETTE.exit;
      ctx.font = `bold 15px ${FONT_UI}`;
      ctx.textAlign = 'center';
      ctx.fillText('ALL LOOT TAKEN — GET TO THE EXIT', FIELD.width / 2, FIELD.height - 14);
    }
  }

  function drawTitle(state, best) {
    ctx.fillStyle = 'rgba(6, 10, 14, 0.62)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `13px ${FONT_UI}`;
    ctx.textAlign = 'center';
    ctx.fillText('A TOP-DOWN STEALTH HEIST', FIELD.width / 2, 218);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 56px ${FONT}`;
    ctx.fillText('MIDNIGHT AT THE', FIELD.width / 2, 282);
    ctx.fillText('HALDEN GALLERY', FIELD.width / 2, 344);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT_UI}`;
    ctx.fillText('Lift the paintings and the Halden Star, then slip out the east door.', FIELD.width / 2, 386);
    ctx.fillText('Stay out of the red cones. A tossed coin pulls a guard away; an EMP freezes the eyes.', FIELD.width / 2, 412);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 17px ${FONT_UI}`;
    ctx.fillText('WASD / Arrows — move      Shift — sneak      Mouse — steer      1 — toss coin      2 — EMP      P — pause', FIELD.width / 2, 462);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 20px ${FONT_UI}`;
    ctx.fillText('Press SPACE or click to begin', FIELD.width / 2, 512);
    if (best > 0) {
      ctx.fillStyle = PALETTE.muted;
      ctx.font = `14px ${FONT_UI}`;
      ctx.fillText(`Best haul so far: $${best.toLocaleString('en-US')}`, FIELD.width / 2, 546);
    }
  }

  function drawPaused() {
    ctx.fillStyle = 'rgba(6, 10, 14, 0.6)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 44px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', FIELD.width / 2, FIELD.height / 2 - 10);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `16px ${FONT_UI}`;
    ctx.fillText('Press P or Space to keep moving', FIELD.width / 2, FIELD.height / 2 + 26);
  }

  function drawEnd(state, won) {
    ctx.fillStyle = 'rgba(6, 10, 14, 0.68)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.fillStyle = won ? PALETTE.exit : PALETTE.danger;
    ctx.font = `bold 52px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(won ? 'CLEAN GETAWAY' : 'CAUGHT', FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `18px ${FONT_UI}`;
    ctx.fillText(state.message, FIELD.width / 2, 344);
    ctx.fillStyle = PALETTE.gold;
    ctx.font = `bold 22px ${FONT_UI}`;
    ctx.fillText(`Haul: $${state.score.toLocaleString('en-US')}   •   Loot ${state.lootTaken}/${state.loot.length}   •   ${Math.floor(state.time)}s in the gallery`, FIELD.width / 2, 392);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `bold 17px ${FONT_UI}`;
    ctx.fillText('Press SPACE or click to try the night again', FIELD.width / 2, 452);
  }

  return {
    draw(state, screen, best) {
      fit();
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      drawFloor();
      drawLoot(state);
      drawCones(state);
      drawCover(state);
      drawCoin(state);
      drawExit(state);
      drawCameras(state);
      drawGuards(state);
      drawThief(state);
      drawNight(state);
      drawHud(state);
      if (screen === SCREEN_TITLE) {
        drawTitle(state, best);
        // The alarm meter, loot pips and gadgets stay crisp above the title: the cover
        // frame must show them alongside the room, the guards and the loot.
        drawHud(state);
      } else if (screen === SCREEN_PAUSED) drawPaused();
      else if (screen === SCREEN_OVER) drawEnd(state, false);
      else if (screen === SCREEN_WIN) drawEnd(state, true);
    },
  };
}
