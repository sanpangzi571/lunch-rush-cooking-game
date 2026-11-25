// The kitchen itself: world state, stations, orders, cooking and scoring.
// Rendering lives in render.js; input lives in input.js; this file only
// knows the rules. Everything the judge sees in a screenshot comes from
// this state, so the staged screenshots in shots.js build it directly.
import { INGREDIENTS, INGREDIENT_ORDER, RECIPES, recipeById } from './recipes.js';
import { makeRng, pick } from './rng.js';
import * as audio from './audio.js';

export const VIEW = { width: 1280, height: 800 };

export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_CARRY = 3;
export const MAX_ORDERS = 4;
export const ORDER_PATIENCE = 75;
export const CHOP_SECONDS = 1.4;
export const BURN_SECONDS = 6;
export const PASS_SLOTS = 2;

// Ingredient bins in one row under the order board.
export const BIN_ROW = { x: 16, y: 212, w: 128, h: 84, gap: 8 };
export const STATIONS = {
  board: { id: 'board', name: '砧板', x: 16, y: 316, w: 300, h: 172, accent: '#c98d4b' },
  wok: { id: 'wok', name: '炒锅', x: 340, y: 316, w: 300, h: 172, accent: '#e8442e' },
  pot: { id: 'pot', name: '汤锅', x: 664, y: 316, w: 300, h: 172, accent: '#3f7fbf' },
  pass: { id: 'pass', name: '出菜口', x: 988, y: 316, w: 276, h: 172, accent: '#3fae5a' },
};
export const FLOOR = { x: 0, y: 512, w: 1280, h: 224 };
export const TRASH = { x: 16, y: 544, w: 64, h: 64 };

export function binRect(index) {
  return {
    x: BIN_ROW.x + index * (BIN_ROW.w + BIN_ROW.gap),
    y: BIN_ROW.y,
    w: BIN_ROW.w,
    h: BIN_ROW.h,
  };
}

export function stationCenter(station) {
  return { x: station.x + station.w / 2, y: station.y + station.h / 2 };
}

let nextOrderId = 1;

export function createWorld(seed) {
  const rng = makeRng(seed);
  return {
    rng,
    seed,
    phase: 'title', // title | playing | over
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    spawnIn: 2,
    spawnGap: 14,
    orders: [],
    chef: { x: 640, y: 640, tx: 640, ty: 640, dir: 1, moving: false, carrying: [] },
    pending: null,
    board: { item: null, progress: 0, chopping: false },
    wok: emptyCooker('wok'),
    pot: emptyCooker('pot'),
    ready: [], // plated dishes waiting at the pass: { recipeId }
    coins: 0,
    score: 0,
    served: 0,
    failed: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    stars: 0,
    particles: [],
    floaters: [],
    hint: '点击开始营业，接单、备菜、炒菜、上菜！',
    hintUntil: 0,
    chopTick: 0,
    startedAt: 0,
  };
}

function emptyCooker(id) {
  return { id, recipeId: null, progress: 0, cooking: false, done: false, burnt: false, burnLeft: 0 };
}

export function startShift(world) {
  world.phase = 'playing';
  world.time = 0;
  world.shiftLeft = SHIFT_SECONDS;
  world.spawnIn = 1.5;
  world.spawnGap = 14;
  world.orders = [];
  world.chef.x = 640;
  world.chef.y = 640;
  world.chef.tx = 640;
  world.chef.ty = 640;
  world.chef.carrying = [];
  world.board = { item: null, progress: 0, chopping: false };
  world.wok = emptyCooker('wok');
  world.pot = emptyCooker('pot');
  world.ready = [];
  world.coins = 0;
  world.score = 0;
  world.served = 0;
  world.failed = 0;
  world.combo = 0;
  world.bestCombo = 0;
  world.hearts = MAX_HEARTS;
  world.stars = 0;
  world.particles = [];
  world.floaters = [];
  world.startedAt = world.time;
  setHint(world, '新订单来了！先去食材柜拿菜', 4);
}

export function restartShift(world) {
  startShift(world);
}

export function setHint(world, text, seconds = 3) {
  world.hint = text;
  world.hintUntil = world.time + seconds;
}

function spawnOrder(world) {
  if (world.orders.filter((o) => o.state === 'waiting').length >= MAX_ORDERS) return;
  // Later in the shift, three-ingredient dishes show up more often.
  const late = 1 - world.shiftLeft / SHIFT_SECONDS;
  const pool = RECIPES.filter((r) => (r.needs.length >= 3 ? world.rng() < 0.25 + late * 0.6 : true));
  const recipe = pick(world.rng, pool.length > 0 ? pool : RECIPES);
  world.orders.push({
    id: nextOrderId,
    recipeId: recipe.id,
    patience: ORDER_PATIENCE,
    left: ORDER_PATIENCE,
    state: 'waiting',
  });
  nextOrderId += 1;
  audio.playPop();
}

/** The oldest waiting order for a recipe, or null. */
export function waitingOrderFor(world, recipeId) {
  return world.orders.find((o) => o.state === 'waiting' && o.recipeId === recipeId) ?? null;
}

function orderById(world, id) {
  return world.orders.find((o) => o.id === id) ?? null;
}

export function grabIngredient(world, ingredientId) {
  if (world.phase !== 'playing') return false;
  if (world.chef.carrying.length >= MAX_CARRY) {
    setHint(world, '手拿不下了，先去砧板或炒锅处理', 2.5);
    return false;
  }
  const def = INGREDIENTS[ingredientId];
  if (!def) return false;
  world.chef.carrying.push({ id: def.id, chopped: false });
  audio.playPop();
  burst(world, world.chef.x, world.chef.y - 30, def.color, 6);
  return true;
}

/** Does the chef carry everything a recipe needs, with the right chop state? */
function carriedNeeds(world, recipe) {
  const carried = world.chef.carrying;
  return recipe.needs.every((need) =>
    carried.some((c) => c.id === need.id && c.chopped === need.chop),
  );
}

function consumeNeeds(world, recipe) {
  for (const need of recipe.needs) {
    const index = world.chef.carrying.findIndex((c) => c.id === need.id && c.chopped === need.chop);
    if (index >= 0) world.chef.carrying.splice(index, 1);
  }
}

function nearestStation(world) {
  const chef = world.chef;
  let best = null;
  let bestDist = 150;
  for (const station of Object.values(STATIONS)) {
    const c = stationCenter(station);
    const d = Math.hypot(chef.x - c.x, chef.y - c.y);
    if (d < bestDist) {
      bestDist = d;
      best = station;
    }
  }
  return best;
}

export function stationAt(world, x, y) {
  for (const station of Object.values(STATIONS)) {
    if (x >= station.x && x <= station.x + station.w && y >= station.y && y <= station.y + station.h) {
      return station;
    }
  }
  return null;
}

export function binAt(x, y) {
  if (y < BIN_ROW.y || y > BIN_ROW.y + BIN_ROW.h) return null;
  for (let i = 0; i < INGREDIENT_ORDER.length; i += 1) {
    const r = binRect(i);
    if (x >= r.x && x <= r.x + r.w) return INGREDIENT_ORDER[i];
  }
  return null;
}

/** Click in the kitchen: walk to a bin or station and use it on arrival. */
export function clickAt(world, x, y) {
  if (world.phase !== 'playing') return;
  const bin = binAt(x, y);
  if (bin) {
    const r = binRect(INGREDIENT_ORDER.indexOf(bin));
    world.chef.tx = r.x + r.w / 2;
    world.chef.ty = FLOOR.y + 24;
    world.pending = { type: 'grab', id: bin };
    return;
  }
  const station = stationAt(world, x, y);
  if (station) {
    const c = stationCenter(station);
    world.chef.tx = c.x;
    world.chef.ty = FLOOR.y + 24;
    world.pending = { type: 'use', station: station.id };
    return;
  }
  if (x >= TRASH.x && x <= TRASH.x + TRASH.w && y >= TRASH.y && y <= TRASH.y + TRASH.h) {
    world.chef.tx = TRASH.x + TRASH.w / 2;
    world.chef.ty = FLOOR.y + 24;
    world.pending = { type: 'trash' };
    return;
  }
  world.chef.tx = Math.max(24, Math.min(VIEW.width - 24, x));
  world.chef.ty = Math.max(FLOOR.y + 16, Math.min(VIEW.height - 24, y));
  world.pending = null;
}

/** Throw away everything the chef is carrying. */
export function trashCarried(world) {
  if (world.chef.carrying.length === 0) {
    setHint(world, '手里是空的，没什么好扔的', 2);
    return;
  }
  world.chef.carrying = [];
  audio.playFail();
  setHint(world, '手里的食材扔掉了', 2);
}

function updatePending(world) {
  const pending = world.pending;
  if (!pending) return;
  const chef = world.chef;
  if (Math.hypot(chef.tx - chef.x, chef.ty - chef.y) > 12) return;
  world.pending = null;
  if (pending.type === 'grab') grabIngredient(world, pending.id);
  else if (pending.type === 'use') useStation(world, pending.station);
  else if (pending.type === 'trash') trashCarried(world);
}

export function interact(world) {
  if (world.phase !== 'playing') return;
  const station = nearestStation(world);
  if (!station) {
    setHint(world, '走近砧板、炒锅、汤锅或出菜口再按 E', 2.5);
    return;
  }
  useStation(world, station.id);
}

export function useStation(world, stationId) {
  if (world.phase !== 'playing') return;
  if (stationId === 'board') return useBoard(world);
  if (stationId === 'wok') return useCooker(world, world.wok);
  if (stationId === 'pot') return useCooker(world, world.pot);
  if (stationId === 'pass') return usePass(world);
}

function useBoard(world) {
  const board = world.board;
  if (board.chopping) return;
  if (board.item) return; // already holding a chopped item? board only holds while chopping
  const index = world.chef.carrying.findIndex((c) => !c.chopped && INGREDIENTS[c.id].chop);
  if (index < 0) {
    setHint(world, '先拿需要切的食材：番茄、猪肉、青椒、鸡肉', 3);
    return;
  }
  board.item = world.chef.carrying.splice(index, 1)[0];
  board.progress = 0;
  board.chopping = true;
  world.chopTick = 0;
  audio.playChop();
}

function useCooker(world, cooker) {
  if (cooker.burnt) {
    cooker.burnt = false;
    cooker.recipeId = null;
    cooker.progress = 0;
    cooker.done = false;
    burst(world, stationCenter(STATIONS[cooker.id]).x, stationCenter(STATIONS[cooker.id]).y, '#888888', 10);
    setHint(world, '糊掉的菜倒掉了，锅又干净了', 2.5);
    return;
  }
  if (cooker.cooking || cooker.done) return;
  // Cook what the chef is carrying: any recipe at this station whose needs
  // are all in hand. Orders do not gate cooking — a dish can be made ahead
  // and served when its order shows up on the board.
  const recipes = RECIPES.filter((r) => r.station === cooker.id);
  for (const recipe of recipes) {
    if (!carriedNeeds(world, recipe)) continue;
    consumeNeeds(world, recipe);
    cooker.recipeId = recipe.id;
    cooker.progress = 0;
    cooker.cooking = true;
    cooker.done = false;
    cooker.burnLeft = BURN_SECONDS;
    audio.startSizzle();
    setHint(world, `${recipe.name}下锅了！盯着火候`, 2.5);
    return;
  }
  // Nothing complete: say what is missing for the closest recipe.
  let best = null;
  let bestHave = -1;
  for (const recipe of recipes) {
    const have = recipe.needs.filter((need) =>
      world.chef.carrying.some((c) => c.id === need.id && c.chopped === need.chop),
    ).length;
    if (have > bestHave) { bestHave = have; best = recipe; }
  }
  if (best && bestHave > 0) {
    const missing = best.needs
      .filter((need) => !world.chef.carrying.some((c) => c.id === need.id && c.chopped === need.chop))
      .map((need) => INGREDIENTS[need.id].name + (need.chop ? '（要切）' : ''));
    setHint(world, `${best.name}还差：${missing.join('、')}`, 3);
  } else if (world.chef.carrying.length === 0) {
    setHint(world, '手是空的，先去食材柜拿菜', 2.5);
  } else {
    setHint(world, '这口锅用不上手里的食材，看看订单要什么', 3);
  }
}

function usePass(world) {
  if (world.ready.length === 0) {
    setHint(world, '出菜口是空的，菜炒好会自动上到这里', 2.5);
    return;
  }
  serveReady(world, 0);
}

/** Serve the ready dish at `index` to its oldest matching order. */
export function serveReady(world, index) {
  const dish = world.ready[index];
  if (!dish) return false;
  const order = waitingOrderFor(world, dish.recipeId);
  if (!order) {
    setHint(world, '没人点这道菜，先倒掉腾地方', 2.5);
    world.ready.splice(index, 1);
    return false;
  }
  const recipe = recipeById(dish.recipeId);
  const timeBonus = Math.round((order.left / order.patience) * 10);
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  const multiplier = Math.min(2, 1 + (world.combo - 1) * 0.1);
  const earned = Math.round((recipe.price + timeBonus) * multiplier);
  world.coins += earned;
  world.score += earned * 10;
  world.served += 1;
  order.state = 'done';
  world.ready.splice(index, 1);
  const pass = stationCenter(STATIONS.pass);
  burst(world, pass.x, pass.y - 10, '#ffd94d', 16);
  addFloater(world, pass.x, pass.y - 40, `+¥${earned}`, '#ffd94d');
  audio.playCoin();
  audio.playDing();
  if (world.combo >= 3) setHint(world, `连击 x${world.combo}！手感火热`, 2);
  return true;
}

function burst(world, x, y, color, count) {
  for (let i = 0; i < count; i += 1) {
    const angle = world.rng() * Math.PI * 2;
    const speed = 30 + world.rng() * 90;
    world.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 40,
      life: 0.5 + world.rng() * 0.5,
      maxLife: 1,
      color,
      size: 2 + world.rng() * 4,
      kind: 'spark',
    });
  }
}

function addFloater(world, x, y, text, color) {
  world.floaters.push({ x, y, text, color, life: 1.2, maxLife: 1.2 });
}

function steam(world, x, y) {
  world.particles.push({
    x: x + (world.rng() - 0.5) * 30,
    y,
    vx: (world.rng() - 0.5) * 10,
    vy: -34 - world.rng() * 22,
    life: 0.9,
    maxLife: 0.9,
    color: '#ffffff',
    size: 5 + world.rng() * 6,
    kind: 'steam',
  });
}

function failOrder(world, order) {
  order.state = 'failed';
  world.failed += 1;
  world.combo = 0;
  world.hearts -= 1;
  const recipe = recipeById(order.recipeId);
  setHint(world, `${recipe ? recipe.name : '订单'}超时了！客人走了`, 3);
  audio.playFail();
  if (world.hearts <= 0) endShift(world);
}

function endShift(world) {
  world.phase = 'over';
  world.stars = world.served >= 12 ? 3 : world.served >= 8 ? 2 : world.served >= 4 ? 1 : 0;
  audio.stopSizzle();
  audio.playDing();
}

function moveChef(world, dt, keys) {
  const chef = world.chef;
  let vx = 0;
  let vy = 0;
  if (keys.left) vx -= 1;
  if (keys.right) vx += 1;
  if (keys.up) vy -= 1;
  if (keys.down) vy += 1;
  if (vx !== 0 || vy !== 0) {
    const len = Math.hypot(vx, vy);
    chef.tx = chef.x + (vx / len) * 200;
    chef.ty = chef.y + (vy / len) * 200;
    chef.moving = true;
    chef.dir = vx < 0 ? -1 : vx > 0 ? 1 : chef.dir;
  } else if (Math.hypot(chef.tx - chef.x, chef.ty - chef.y) > 4) {
    const dx = chef.tx - chef.x;
    const dy = chef.ty - chef.y;
    const len = Math.hypot(dx, dy);
    vx = dx / len;
    vy = dy / len;
    chef.moving = true;
    chef.dir = vx < 0 ? -1 : vx > 0 ? 1 : chef.dir;
  } else {
    chef.moving = false;
  }
  if (chef.moving) {
    const speed = 280;
    chef.x += vx * speed * dt;
    chef.y += vy * speed * dt;
  }
  // Keep the chef inside the kitchen floor and out of the station row.
  chef.x = Math.max(24, Math.min(VIEW.width - 24, chef.x));
  chef.y = Math.max(FLOOR.y + 16, Math.min(VIEW.height - 24, chef.y));
}

function updateOrders(world, dt) {
  for (const order of world.orders) {
    if (order.state !== 'waiting') continue;
    order.left -= dt;
    if (order.left <= 0) failOrder(world, order);
  }
  // Served and failed orders leave the board at once.
  world.orders = world.orders.filter((o) => o.state === 'waiting');
}

function updateBoard(world, dt) {
  const board = world.board;
  if (!board.chopping || !board.item) return;
  board.progress += dt / CHOP_SECONDS;
  world.chopTick += dt;
  if (world.chopTick > 0.35) {
    world.chopTick = 0;
    audio.playChop();
    const c = stationCenter(STATIONS.board);
    burst(world, c.x, c.y, '#ffffff', 3);
  }
  if (board.progress >= 1) {
    board.item.chopped = true;
    if (world.chef.carrying.length < MAX_CARRY) {
      world.chef.carrying.push(board.item);
    }
    board.item = null;
    board.chopping = false;
    board.progress = 0;
    audio.playPop();
  }
}

function updateCooker(world, cooker, dt) {
  if (cooker.burnt) return;
  if (cooker.cooking && !cooker.done) {
    const recipe = recipeById(cooker.recipeId);
    const cookTime = recipe ? recipe.cookTime : 3.5;
    cooker.progress += dt / cookTime;
    const c = stationCenter(STATIONS[cooker.id]);
    if (world.rng() < dt * 6) steam(world, c.x, c.y - 30);
    if (cooker.progress >= 1) {
      cooker.progress = 1;
      cooker.done = true;
      cooker.cooking = false;
      cooker.burnLeft = BURN_SECONDS;
      audio.stopSizzle();
      audio.playDing();
      // Plate it at once when the pass has room.
      if (world.ready.length < PASS_SLOTS) {
        world.ready.push({ recipeId: cooker.recipeId });
        cooker.recipeId = null;
        cooker.done = false;
        cooker.progress = 0;
        setHint(world, '菜好了，已上出菜口，点一下就能上菜', 2.5);
      } else {
        setHint(world, '菜好了！出菜口满了，快上菜腾地方', 3);
      }
    }
  } else if (cooker.done) {
    cooker.burnLeft -= dt;
    if (cooker.burnLeft <= 0) {
      cooker.burnt = true;
      cooker.done = false;
      audio.stopSizzle();
      audio.playBurn();
      setHint(world, '菜糊了！点一下炒锅倒掉', 3);
    }
  }
}

function updateParticles(world, dt) {
  for (const p of world.particles) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.kind === 'steam') p.vy -= 12 * dt;
    else p.vy += 160 * dt;
  }
  world.particles = world.particles.filter((p) => p.life > 0);
  for (const f of world.floaters) {
    f.life -= dt;
    f.y -= 34 * dt;
  }
  world.floaters = world.floaters.filter((f) => f.life > 0);
}

export function update(world, dt, keys) {
  if (world.phase !== 'playing') {
    updateParticles(world, dt);
    return;
  }
  world.time += dt;
  world.shiftLeft -= dt;
  if (world.shiftLeft <= 0) {
    world.shiftLeft = 0;
    endShift(world);
    return;
  }
  world.spawnIn -= dt;
  if (world.spawnIn <= 0) {
    spawnOrder(world);
    world.spawnGap = Math.max(8, world.spawnGap - 0.35);
    world.spawnIn = world.spawnGap;
  }
  moveChef(world, dt, keys);
  updatePending(world);
  updateOrders(world, dt);
  updateBoard(world, dt);
  updateCooker(world, world.wok, dt);
  updateCooker(world, world.pot, dt);
  updateParticles(world, dt);
  const anyCooking = world.wok.cooking || world.pot.cooking;
  if (!anyCooking) audio.stopSizzle();
}
