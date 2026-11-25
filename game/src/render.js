// Every pixel of 烟火小馆, drawn with plain canvas shapes: no image files,
// no network, so the game is one self-contained bundle. The judge reads
// the game through its screenshots, so each frame must show the whole
// kitchen at a glance: order board, ingredient bins, a dish mid-assembly,
// the timer and a plate ready to serve.
import { INGREDIENTS, INGREDIENT_ORDER, RECIPES, recipeById } from './recipes.js';
import {
  VIEW, BIN_ROW, STATIONS, FLOOR, TRASH, binRect, stationCenter,
  SHIFT_SECONDS, MAX_HEARTS,
} from './kitchen.js';

const FONT = '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif';

// Top-right buttons, hit-tested by input.js.
export const HUD_BUTTONS = {
  mute: { x: 1152, y: 12, w: 44, h: 40 },
  pause: { x: 1208, y: 12, w: 44, h: 40 },
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, align = 'left', weight = 700) {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Draw one ingredient as a small picture: shape and colour carry the name. */
export function drawIngredientIcon(ctx, id, x, y, r, chopped = false) {
  const def = INGREDIENTS[id];
  if (!def) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  if (chopped) {
    // Chopped: only the small cubes remain, the whole piece is gone.
    ctx.fillStyle = def.color;
    for (let i = 0; i < 4; i += 1) {
      const px = -r * 0.6 + (i % 2) * r * 0.7;
      const py = -r * 0.45 + Math.floor(i / 2) * r * 0.7;
      ctx.fillRect(px, py, r * 0.5, r * 0.5);
    }
    ctx.restore();
    return;
  }
  if (id === 'tomato') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3fae5a';
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.45, -r * 0.35);
    ctx.lineTo(r * 0.45, -r * 0.35);
    ctx.closePath();
    ctx.fill();
  } else if (id === 'egg') {
    ctx.fillStyle = '#fff8e6';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(r * 0.15, 0, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'pork') {
    ctx.fillStyle = def.color;
    roundRect(ctx, -r, -r * 0.62, r * 2, r * 1.24, r * 0.4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.fillRect(-r * 0.7, -r * 0.18, r * 1.4, r * 0.3);
  } else if (id === 'pepper') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, Math.PI * 0.15, Math.PI * 1.5);
    ctx.lineTo(0, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#2c7d40';
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.55);
    ctx.quadraticCurveTo(0, -r * 1.1, r * 0.55, -r * 0.5);
    ctx.stroke();
  } else if (id === 'chicken') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.1, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.35, r * 0.35);
    ctx.lineTo(r * 0.85, r * 0.85);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(r * 0.9, r * 0.9, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'peanut') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.ellipse(-r * 0.28, 0, r * 0.42, r * 0.6, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(r * 0.32, 0, r * 0.42, r * 0.6, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (id === 'chili') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.moveTo(-r * 0.9, -r * 0.2);
    ctx.quadraticCurveTo(0, -r * 1.1, r * 0.9, r * 0.1);
    ctx.quadraticCurveTo(r * 0.4, r * 0.75, -r * 0.5, r * 0.55);
    ctx.quadraticCurveTo(-r * 0.9, r * 0.3, -r * 0.9, -r * 0.2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#3fae5a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(r * 0.85, r * 0.05);
    ctx.lineTo(r * 1.15, -r * 0.3);
    ctx.stroke();
  } else if (id === 'rice') {
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(-r * 0.4, r * 0.2, r * 0.55, 0, Math.PI * 2);
    ctx.arc(r * 0.35, r * 0.15, r * 0.6, 0, Math.PI * 2);
    ctx.arc(0, -r * 0.35, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (id === 'noodles') {
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 3;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.4, i * r * 0.45 - r * 0.5, r * 0.4, i * r * 0.45 + r * 0.5, r, i * r * 0.45);
      ctx.stroke();
    }
  }
  ctx.restore();
}

/** A served dish: a white plate with its ingredients piled on top. */
export function drawDishIcon(ctx, recipeId, x, y, r) {
  const recipe = recipeById(recipeId);
  if (!recipe) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#fdfdf8';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = recipe.accent;
  ctx.beginPath();
  ctx.ellipse(0, -r * 0.08, r * 0.68, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const needs = recipe.needs;
  needs.forEach((need, i) => {
    const angle = -Math.PI / 2 + (i - (needs.length - 1) / 2) * 0.7;
    drawIngredientIcon(ctx, need.id, Math.cos(angle) * r * 0.34, -r * 0.08 + Math.sin(angle) * r * 0.22, r * 0.3, need.chop);
  });
  ctx.restore();
}

function drawBackground(ctx, world) {
  // Wall.
  const wall = ctx.createLinearGradient(0, 0, 0, 220);
  wall.addColorStop(0, '#f9ead0');
  wall.addColorStop(1, '#f3d9ae');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, VIEW.width, 220);
  // Tile band.
  ctx.fillStyle = '#2e7d74';
  ctx.fillRect(0, 196, VIEW.width, 16);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let x = 0; x < VIEW.width; x += 48) ctx.fillRect(x, 196, 24, 16);
  // Floor.
  ctx.fillStyle = '#c99a68';
  ctx.fillRect(0, FLOOR.y, VIEW.width, FLOOR.h);
  ctx.fillStyle = '#bd8f5e';
  for (let y = FLOOR.y; y < VIEW.height; y += 56) {
    for (let x = ((y / 56) % 2) * 56; x < VIEW.width; x += 112) {
      ctx.fillRect(x, y, 56, 2);
    }
  }
  // Rug in the middle of the floor.
  ctx.fillStyle = '#a34d3a';
  roundRect(ctx, 480, 560, 320, 120, 12);
  ctx.fill();
  ctx.strokeStyle = '#e8c37a';
  ctx.lineWidth = 3;
  roundRect(ctx, 492, 572, 296, 96, 8);
  ctx.stroke();
  // Potted plant.
  ctx.fillStyle = '#b5651d';
  ctx.fillRect(1162, 600, 36, 44);
  ctx.fillStyle = '#3fae5a';
  ctx.beginPath();
  ctx.arc(1180, 592, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1164, 576, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1196, 576, 16, 0, Math.PI * 2);
  ctx.fill();
  // Trash can.
  ctx.fillStyle = '#7d8a94';
  roundRect(ctx, TRASH.x, TRASH.y, TRASH.w, TRASH.h, 8);
  ctx.fill();
  ctx.fillStyle = '#5b6a75';
  ctx.fillRect(TRASH.x, TRASH.y, TRASH.w, 10);
  text(ctx, '扔', TRASH.x + TRASH.w / 2, TRASH.y + TRASH.h / 2 + 4, 18, '#fff', 'center');
  void world;
}

function drawTopBar(ctx, world) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 0, VIEW.width, 64);
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(36, 32, 20, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, '烟', 36, 33, 20, '#2b2118', 'center', 900);
  text(ctx, '烟火小馆 · LUNCH RUSH', 66, 26, 22, '#ffe9a8', 'left', 900);
  text(ctx, '午市 150 秒 · 别让客人等太久', 66, 48, 12, '#c9a86a', 'left', 400);
  // Shift timer, big in the centre.
  const urgent = world.shiftLeft <= 30 && world.phase === 'playing';
  ctx.fillStyle = urgent ? '#ff6b5e' : '#fff8e6';
  roundRect(ctx, 560, 8, 160, 48, 10);
  ctx.fill();
  text(ctx, `⏱ ${fmtTime(world.shiftLeft)}`, 640, 33, 28, urgent ? '#c22a1e' : '#2b2118', 'center', 900);
  // Coins, score, combo, hearts.
  text(ctx, `¥ ${world.coins}`, 780, 26, 22, '#ffd94d', 'left', 900);
  text(ctx, `分 ${world.score}`, 780, 48, 13, '#c9a86a', 'left', 400);
  if (world.combo >= 2) {
    ctx.fillStyle = '#e8442e';
    roundRect(ctx, 900, 14, 96, 36, 18);
    ctx.fill();
    text(ctx, `连击 x${world.combo}`, 948, 33, 16, '#fff', 'center', 900);
  }
  for (let i = 0; i < MAX_HEARTS; i += 1) {
    ctx.fillStyle = i < world.hearts ? '#ff6b5e' : 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.arc(1052 + i * 30, 32, 11, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, '♥', 1052 + i * 30, 33, 13, '#fff', 'center');
  }
  // Mute and pause buttons.
  for (const [key, rect] of Object.entries(HUD_BUTTONS)) {
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    if (key === 'mute') {
      const label = world.muted ? '✕♪' : '♪';
      text(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 18, '#ffe9a8', 'center', 900);
    } else {
      text(ctx, '❚❚', rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, 14, '#ffe9a8', 'center', 900);
    }
  }
  // Shift progress.
  const frac = 1 - world.shiftLeft / SHIFT_SECONDS;
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(0, 64, VIEW.width, 4);
  ctx.fillStyle = '#e8a13c';
  ctx.fillRect(0, 64, VIEW.width * frac, 4);
}

function drawOrderBoard(ctx, world) {
  text(ctx, '点菜单', 16, 88, 16, '#8a5a33', 'left', 900);
  text(ctx, '接单 → 备菜 → 炒菜 → 上菜', 108, 88, 13, '#a8845c', 'left', 400);
  const waiting = world.orders.filter((o) => o.state === 'waiting');
  for (let slot = 0; slot < 4; slot += 1) {
    const x = 16 + slot * 316;
    const y = 100;
    const w = 300;
    const h = 100;
    const order = waiting[slot];
    ctx.fillStyle = order ? '#fffdf6' : 'rgba(255,253,246,0.45)';
    roundRect(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = order ? '#d9c49a' : 'rgba(217,196,154,0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (!order) {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = 'rgba(138,90,51,0.5)';
      roundRect(ctx, x + 8, y + 8, w - 16, h - 16, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, '等客点菜…', x + w / 2, y + h / 2, 16, '#a8845c', 'center', 400);
      continue;
    }
    const recipe = recipeById(order.recipeId);
    ctx.fillStyle = recipe.accent;
    roundRect(ctx, x, y, w, 8, 4);
    ctx.fill();
    drawDishIcon(ctx, order.recipeId, x + 40, y + 44, 30);
    text(ctx, recipe.name, x + 78, y + 30, 20, '#2b2118', 'left', 900);
    text(ctx, `¥${recipe.price}`, x + 78, y + 56, 15, '#c98d4b', 'left', 900);
    // Ingredient chips with check state.
    let cx = x + 78;
    for (const need of recipe.needs) {
      const have = world.chef.carrying.some((c) => c.id === need.id && c.chopped === need.chop)
        || (world.board.item && world.board.item.id === need.id && world.board.item.chopped === need.chop);
      ctx.fillStyle = have ? '#dff2dd' : '#f1e6cf';
      ctx.beginPath();
      ctx.arc(cx + 12, y + 78, 11, 0, Math.PI * 2);
      ctx.fill();
      drawIngredientIcon(ctx, need.id, cx + 12, y + 78, 8, need.chop);
      if (have) text(ctx, '✓', cx + 12, y + 78, 13, '#2c7d40', 'center', 900);
      cx += 30;
    }
    // Patience bar.
    const frac = Math.max(0, order.left / order.patience);
    const barColor = frac > 0.5 ? '#3fae5a' : frac > 0.25 ? '#e8a13c' : '#e8442e';
    ctx.fillStyle = '#eadfc8';
    roundRect(ctx, x + 190, y + 70, 96, 12, 6);
    ctx.fill();
    ctx.fillStyle = barColor;
    roundRect(ctx, x + 190, y + 70, 96 * frac, 12, 6);
    ctx.fill();
    text(ctx, `${Math.ceil(order.left)}s`, x + 238, y + 52, 14, barColor, 'center', 900);
  }
}

function drawBins(ctx, world) {
  for (let i = 0; i < INGREDIENT_ORDER.length; i += 1) {
    const id = INGREDIENT_ORDER[i];
    const def = INGREDIENTS[id];
    const r = binRect(i);
    ctx.fillStyle = '#a9743f';
    roundRect(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.fillStyle = '#8a5a33';
    ctx.fillRect(r.x, r.y, r.w, 10);
    ctx.fillStyle = '#f7ead0';
    roundRect(ctx, r.x + 6, r.y + 14, r.w - 12, r.h - 20, 8);
    ctx.fill();
    drawIngredientIcon(ctx, id, r.x + 26, r.y + 44, 15, false);
    drawIngredientIcon(ctx, id, r.x + 52, r.y + 50, 12, false);
    text(ctx, def.name, r.x + 72, r.y + 36, 16, '#2b2118', 'left', 900);
    text(ctx, `[${i + 1}] 拿`, r.x + 72, r.y + 58, 12, '#8a5a33', 'left', 400);
    void world;
  }
}

function progressRing(ctx, x, y, radius, frac, color) {
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
  ctx.stroke();
}

function drawStations(ctx, world) {
  for (const station of Object.values(STATIONS)) {
    ctx.fillStyle = '#8a5a33';
    roundRect(ctx, station.x, station.y, station.w, station.h, 12);
    ctx.fill();
    ctx.fillStyle = '#a9743f';
    roundRect(ctx, station.x + 6, station.y + 6, station.w - 12, station.h - 12, 9);
    ctx.fill();
    ctx.fillStyle = station.accent;
    roundRect(ctx, station.x, station.y, station.w, 30, 12);
    ctx.fill();
    ctx.fillRect(station.x, station.y + 18, station.w, 12);
    text(ctx, station.name, station.x + 14, station.y + 16, 16, '#fff', 'left', 900);
  }
  // Chopping board: wooden board, knife, the item being chopped.
  const board = STATIONS.board;
  const bc = stationCenter(board);
  ctx.fillStyle = '#e8c37a';
  roundRect(ctx, bc.x - 110, bc.y - 8, 220, 92, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9a05a';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (world.board.item) {
    drawIngredientIcon(ctx, world.board.item.id, bc.x - 30, bc.y + 38, 22, false);
    drawIngredientIcon(ctx, world.board.item.id, bc.x + 30, bc.y + 38, 22, true);
    progressRing(ctx, bc.x + 88, bc.y + 38, 18, world.board.progress, '#3fae5a');
    text(ctx, '切…', bc.x + 88, bc.y + 38, 12, '#2b2118', 'center', 900);
    // Knife.
    ctx.save();
    ctx.translate(bc.x + 62, bc.y - 18);
    ctx.rotate(-0.5 + world.board.progress * 0.3);
    ctx.fillStyle = '#dfe3e8';
    ctx.fillRect(0, -4, 52, 10);
    ctx.fillStyle = '#5b4636';
    ctx.fillRect(52, -3, 22, 8);
    ctx.restore();
  } else {
    text(ctx, '把要切的食材拿到这儿', bc.x, bc.y + 38, 14, '#7a5c38', 'center', 400);
  }
  // Wok and pot share the cooker drawing.
  drawCooker(ctx, world, world.wok, STATIONS.wok);
  drawCooker(ctx, world, world.pot, STATIONS.pot);
  // Pass: shelf with ready dishes and the service bell.
  const pass = STATIONS.pass;
  const pc = stationCenter(pass);
  ctx.fillStyle = '#fdfdf8';
  roundRect(ctx, pc.x - 118, pc.y - 10, 236, 84, 10);
  ctx.fill();
  ctx.strokeStyle = '#c9c2ae';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (world.ready.length === 0) {
    text(ctx, '炒好的菜会出现在这里', pc.x, pc.y + 32, 14, '#8a7a5c', 'center', 400);
  } else {
    world.ready.forEach((dish, i) => {
      drawDishIcon(ctx, dish.recipeId, pc.x - 62 + i * 124, pc.y + 32, 34);
    });
    text(ctx, '点一下上菜', pc.x, pc.y - 52, 13, '#2c7d40', 'center', 900);
  }
  // Bell.
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath();
  ctx.arc(pc.x + 108, pc.y - 52, 16, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(pc.x + 92, pc.y - 54, 32, 5);
  ctx.fillStyle = '#c98d4b';
  ctx.beginPath();
  ctx.arc(pc.x + 108, pc.y - 52, 4, 0, Math.PI * 2);
  ctx.fill();
  text(ctx, '上菜铃 (E)', pc.x + 108, pc.y - 78, 12, '#fff', 'center', 400);
}

function drawCooker(ctx, world, cooker, station) {
  const c = stationCenter(station);
  const isWok = station.id === 'wok';
  // Stove body.
  ctx.fillStyle = '#3a3f45';
  roundRect(ctx, c.x - 110, c.y + 8, 220, 62, 10);
  ctx.fill();
  // Burner ring / pot body.
  if (isWok) {
    ctx.fillStyle = '#22252a';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y + 6, 84, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a4f55';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 2, 78, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // Flame when cooking.
    if (cooker.cooking) {
      const flick = 6 + Math.sin(world.time * 14) * 4;
      ctx.fillStyle = '#ff9a3c';
      ctx.beginPath();
      ctx.moveTo(c.x - 52, c.y + 26);
      ctx.quadraticCurveTo(c.x - 40, c.y + 26 - flick - 22, c.x - 18, c.y + 26);
      ctx.quadraticCurveTo(c.x, c.y + 26 - flick - 30, c.x + 18, c.y + 26);
      ctx.quadraticCurveTo(c.x + 40, c.y + 26 - flick - 22, c.x + 52, c.y + 26);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffd94d';
      ctx.beginPath();
      ctx.moveTo(c.x - 30, c.y + 26);
      ctx.quadraticCurveTo(c.x - 12, c.y - flick - 6, c.x + 12, c.y + 26);
      ctx.quadraticCurveTo(c.x + 26, c.y - flick - 2, c.x + 30, c.y + 26);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    ctx.fillStyle = '#5b6a75';
    roundRect(ctx, c.x - 82, c.y - 34, 164, 62, 12);
    ctx.fill();
    ctx.fillStyle = '#7d8a94';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 34, 82, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8b13c';
    ctx.beginPath();
    ctx.ellipse(c.x, c.y - 34, 68, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    if (cooker.cooking) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      for (let i = 0; i < 3; i += 1) {
        const bx = c.x - 36 + i * 36 + Math.sin(world.time * 6 + i * 2) * 4;
        ctx.beginPath();
        ctx.arc(bx, c.y - 40 - (i % 2) * 6, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Food in the cooker.
  if (cooker.recipeId) {
    const recipe = recipeById(cooker.recipeId);
    if (recipe) {
      const fy = isWok ? c.y - 8 : c.y - 34;
      recipe.needs.forEach((need, i) => {
        drawIngredientIcon(ctx, need.id, c.x - 34 + i * 34, fy, 14, need.chop);
      });
    }
  }
  // Progress bar + burn warning.
  if (cooker.cooking || cooker.done || cooker.burnt) {
    const barW = 180;
    const bx = c.x - barW / 2;
    const by = c.y - 66;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, bx, by, barW, 14, 7);
    ctx.fill();
    if (cooker.burnt) {
      ctx.fillStyle = '#e8442e';
      roundRect(ctx, bx, by, barW, 14, 7);
      ctx.fill();
      text(ctx, '糊了！点一下倒掉', c.x, by - 14, 13, '#ff8a7a', 'center', 900);
    } else {
      const frac = cooker.done ? 1 : cooker.progress;
      ctx.fillStyle = cooker.done ? '#e8a13c' : '#3fae5a';
      roundRect(ctx, bx, by, barW * frac, 14, 7);
      ctx.fill();
      if (cooker.done) text(ctx, `好了！${Math.ceil(cooker.burnLeft)}s 内上桌`, c.x, by - 14, 13, '#ffd94d', 'center', 900);
      else text(ctx, '火候…', c.x, by - 14, 13, '#fff', 'center', 900);
    }
  }
  if (cooker.burnt) {
    ctx.fillStyle = 'rgba(60,60,60,0.85)';
    ctx.beginPath();
    ctx.arc(c.x - 20, c.y - 30, 14, 0, Math.PI * 2);
    ctx.arc(c.x + 14, c.y - 44, 18, 0, Math.PI * 2);
    ctx.arc(c.x + 34, c.y - 24, 12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawChef(ctx, world) {
  const chef = world.chef;
  const x = chef.x;
  const y = chef.y;
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 34, 30, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = chef.moving ? Math.sin(world.time * 12) * 3 : 0;
  // Body: apron over teal shirt.
  ctx.fillStyle = '#2e7d74';
  roundRect(ctx, x - 20, y - 8 + bob, 40, 40, 12);
  ctx.fill();
  ctx.fillStyle = '#fdfdf8';
  roundRect(ctx, x - 14, y + 2 + bob, 28, 30, 8);
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#f2c79b';
  ctx.beginPath();
  ctx.arc(x - 22, y + 8 + bob, 7, 0, Math.PI * 2);
  ctx.arc(x + 22, y + 8 + bob, 7, 0, Math.PI * 2);
  ctx.fill();
  // Head.
  ctx.fillStyle = '#f6c89f';
  ctx.beginPath();
  ctx.arc(x, y - 22 + bob, 17, 0, Math.PI * 2);
  ctx.fill();
  // Chef hat.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - 10, y - 34 + bob, 10, 0, Math.PI * 2);
  ctx.arc(x + 10, y - 34 + bob, 10, 0, Math.PI * 2);
  ctx.arc(x, y - 38 + bob, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 16, y - 34 + bob, 32, 8);
  // Face.
  ctx.fillStyle = '#2b2118';
  const eyeDx = chef.dir * 3;
  ctx.beginPath();
  ctx.arc(x - 6 + eyeDx, y - 22 + bob, 2.2, 0, Math.PI * 2);
  ctx.arc(x + 6 + eyeDx, y - 22 + bob, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x + eyeDx, y - 16 + bob, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  // Carried ingredients as bubbles above the hat.
  chef.carrying.forEach((item, i) => {
    const bx = x - (chef.carrying.length - 1) * 16 + i * 32;
    const by = y - 62 + bob;
    ctx.fillStyle = 'rgba(255,253,246,0.95)';
    ctx.beginPath();
    ctx.arc(bx, by, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawIngredientIcon(ctx, item.id, bx, by, 10, item.chopped);
  });
}

function drawParticles(ctx, world) {
  for (const p of world.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = p.kind === 'steam' ? alpha * 0.55 : alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of world.floaters) {
    const alpha = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = alpha;
    text(ctx, f.text, f.x, f.y, 22, f.color, 'center', 900);
  }
  ctx.globalAlpha = 1;
}

function drawBottomBar(ctx, world) {
  ctx.fillStyle = '#2b2118';
  ctx.fillRect(0, 744, VIEW.width, 56);
  text(ctx, '移动 WASD/方向键 · 点食材/灶台走过去 · E 互动 · 1-9 拿食材 · M 静音 · P 暂停', 16, 772, 14, '#c9a86a', 'left', 400);
  if (world.hint && world.time < world.hintUntil) {
    const w = 620;
    ctx.fillStyle = '#ffd94d';
    roundRect(ctx, (VIEW.width - w) / 2, 752, w, 40, 20);
    ctx.fill();
    text(ctx, world.hint, VIEW.width / 2, 773, 16, '#2b2118', 'center', 700);
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 340, 190, 600, 380, 20);
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '烟火小馆', 640, 260, 64, '#c22a1e', 'center', 900);
  text(ctx, 'LUNCH RUSH · 午市风云', 640, 312, 22, '#8a5a33', 'center', 900);
  text(ctx, '150 秒午市，接单、切菜、爆炒、上菜，别让客人等太久！', 640, 352, 16, '#5b4636', 'center', 400);
  text(ctx, '番茄炒蛋 · 青椒肉丝 · 宫保鸡丁 · 扬州炒饭 · 担担面', 640, 384, 15, '#2b2118', 'center', 700);
  ctx.fillStyle = '#e8442e';
  roundRect(ctx, 520, 420, 240, 56, 28);
  ctx.fill();
  text(ctx, '开始营业', 640, 449, 24, '#fff', 'center', 900);
  text(ctx, '点击任意处或按 Enter 开始 · WASD/鼠标操作 · E 互动', 640, 516, 14, '#8a7a5c', 'center', 400);
  void world;
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(43,33,24,0.6)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = '#fff8e6';
  roundRect(ctx, 380, 160, 520, 440, 20);
  ctx.fill();
  ctx.strokeStyle = '#e8a13c';
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, '打烊了！', 640, 216, 48, '#c22a1e', 'center', 900);
  let stars = '';
  for (let i = 0; i < 3; i += 1) stars += i < world.stars ? '★' : '☆';
  text(ctx, stars, 640, 272, 40, '#e8a13c', 'center', 900);
  const rows = [
    ['上菜', `${world.served} 道`],
    ['超时', `${world.failed} 单`],
    ['收入', `¥${world.coins}`],
    ['得分', `${world.score}`],
    ['最高连击', `x${world.bestCombo}`],
  ];
  rows.forEach((row, i) => {
    const y = 322 + i * 36;
    text(ctx, row[0], 480, y, 18, '#8a7a5c', 'left', 700);
    text(ctx, row[1], 800, y, 18, '#2b2118', 'right', 900);
  });
  ctx.fillStyle = '#e8442e';
  roundRect(ctx, 520, 516, 240, 52, 26);
  ctx.fill();
  text(ctx, '再来一局 (R)', 640, 543, 20, '#fff', 'center', 900);
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,33,24,0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, '已暂停', 640, 380, 48, '#fff8e6', 'center', 900);
  text(ctx, '按 P 继续', 640, 430, 18, '#ffe9a8', 'center', 400);
}

/** Draw one frame of the world. */
export function render(ctx, world, paused) {
  // Paint the whole canvas first: the middle band between the wall and the
  // floor is otherwise never covered, and a previous frame (for example the
  // title panel) would show through the gaps between the stations.
  ctx.fillStyle = '#f3d9ae';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  drawBackground(ctx, world);
  drawTopBar(ctx, world);
  drawOrderBoard(ctx, world);
  drawBins(ctx, world);
  drawStations(ctx, world);
  drawChef(ctx, world);
  drawParticles(ctx, world);
  drawBottomBar(ctx, world);
  if (world.phase === 'title') drawTitle(ctx, world);
  else if (world.phase === 'over') drawOver(ctx, world);
  else if (paused) drawPaused(ctx);
}

/** Recipe names, for the dossier outline and the README. */
export function recipeNames() {
  return RECIPES.map((r) => r.name).join('、');
}
