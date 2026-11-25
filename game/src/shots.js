// The three screenshot scenes behind ?shot=start|play|end. Each one stages
// the real world state by hand — orders on the board, a dish mid-assembly,
// the timer running, a plate ready at the pass — and the game draws it
// exactly as it draws live play, so every screenshot is a true render of
// the game's own code. The seed only feeds the particle rng, so a scene is
// the same frame every time it is staged.
import { createWorld } from './kitchen.js';

function addOrder(world, recipeId, left, patience = 75) {
  world.orders.push({ id: world.orders.length + 1, recipeId, patience, left, state: 'waiting' });
}

function addSteam(world, x, y, count) {
  for (let i = 0; i < count; i += 1) {
    world.particles.push({
      x: x + (world.rng() - 0.5) * 40,
      y: y - world.rng() * 14,
      vx: (world.rng() - 0.5) * 8,
      vy: -26 - world.rng() * 18,
      life: 0.7 + world.rng() * 0.3,
      maxLife: 1,
      color: '#ffffff',
      size: 5 + world.rng() * 6,
      kind: 'steam',
    });
  }
}

/**
 * Stage the named scene and return the world to render. Any other name is
 * the start scene.
 */
export function stageShot(name, seed) {
  const world = createWorld(seed);
  world.paused = false;
  if (name === 'play') {
    world.phase = 'playing';
    world.time = 43;
    world.shiftLeft = 107;
    world.coins = 86;
    world.score = 1240;
    world.served = 5;
    world.failed = 1;
    world.combo = 2;
    world.bestCombo = 3;
    world.hearts = 3;
    addOrder(world, 'tomato-egg', 62);
    addOrder(world, 'kung-pao', 48);
    addOrder(world, 'dandan-noodles', 71);
    // Chef at the chopping board, egg in hand, tomato mid-chop.
    world.chef.x = 166;
    world.chef.y = 528;
    world.chef.tx = 166;
    world.chef.ty = 528;
    world.chef.dir = 1;
    world.chef.carrying = [{ id: 'egg', chopped: false }];
    world.board.item = { id: 'tomato', chopped: false };
    world.board.progress = 0.6;
    world.board.chopping = true;
    // Wok mid-cook: 青椒肉丝 at 70% with flame and steam.
    world.wok.recipeId = 'pepper-pork';
    world.wok.progress = 0.7;
    world.wok.cooking = true;
    addSteam(world, 490, 360, 8);
    addSteam(world, 814, 340, 4);
    // One finished plate waiting at the pass.
    world.ready = [{ recipeId: 'yangzhou-rice' }];
    world.hint = '';
    world.hintUntil = 0;
    return world;
  }
  if (name === 'end') {
    world.phase = 'over';
    world.time = 150;
    world.shiftLeft = 0;
    world.coins = 214;
    world.score = 2860;
    world.served = 11;
    world.failed = 2;
    world.combo = 0;
    world.bestCombo = 5;
    world.hearts = 2;
    world.stars = 2;
    addOrder(world, 'tomato-egg', 40);
    world.chef.x = 240;
    world.chef.y = 640;
    world.chef.tx = 240;
    world.chef.ty = 640;
    world.ready = [{ recipeId: 'kung-pao' }];
    world.hint = '';
    world.hintUntil = 0;
    return world;
  }
  // Start: title screen over a calm kitchen with two orders waiting.
  world.phase = 'title';
  world.time = 8;
  world.shiftLeft = 150;
  addOrder(world, 'tomato-egg', 70);
  addOrder(world, 'pepper-pork', 64);
  world.chef.x = 240;
  world.chef.y = 640;
  world.chef.tx = 240;
  world.chef.ty = 640;
  world.hint = '';
  world.hintUntil = 0;
  return world;
}
