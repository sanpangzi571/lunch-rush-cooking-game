// Boot the game: a live kitchen in the browser, or one staged screenshot
// scene when the page is opened with ?shot=start|play|end.
import { VIEW } from './kitchen.js';
import { createWorld, update } from './kitchen.js';
import { render } from './render.js';
import { attachInput } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

if (shot) {
  // Screenshot mode: stage the scene, draw one frame, stop. The game never
  // starts its loop, so the frame is exactly the staged state.
  const world = stageShot(shot, seed);
  render(ctx, world, false);
  window.__shotReady = true;
} else {
  const world = createWorld((Math.random() * 1e9) | 0);
  world.paused = false;
  window.__world = world;
  const keys = attachInput(canvas, world, {
    togglePause() {
      if (world.phase === 'playing') world.paused = !world.paused;
    },
  });
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!world.paused) update(world, dt, keys);
    render(ctx, world, world.paused);
    requestAnimationFrame(frame);
  }
  render(ctx, world, false);
  requestAnimationFrame(frame);
}
