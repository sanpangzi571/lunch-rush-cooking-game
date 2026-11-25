// Keyboard and mouse for the kitchen: WASD or arrows to walk, click a bin
// or a station to walk over and use it, E or Space to use whatever is
// nearest, 1-9 to grab an ingredient, M to mute, P to pause.
import { INGREDIENT_ORDER } from './recipes.js';
import { clickAt, interact, grabIngredient, startShift, restartShift } from './kitchen.js';
import { unlockAudio, setMuted, isMuted } from './audio.js';
import { HUD_BUTTONS } from './render.js';

export function attachInput(canvas, world, hooks) {
  const keys = { up: false, down: false, left: false, right: false };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  function inRect(pos, rect) {
    return pos.x >= rect.x && pos.x <= rect.x + rect.w && pos.y >= rect.y && pos.y <= rect.y + rect.h;
  }

  function startIfNeeded() {
    if (world.phase === 'title') {
      unlockAudio();
      startShift(world);
      return true;
    }
    return false;
  }

  canvas.addEventListener('click', (event) => {
    unlockAudio();
    const pos = canvasPos(event);
    if (inRect(pos, HUD_BUTTONS.mute)) {
      setMuted(!isMuted());
      return;
    }
    if (inRect(pos, HUD_BUTTONS.pause)) {
      hooks.togglePause();
      return;
    }
    if (startIfNeeded()) return;
    if (world.phase === 'over') {
      const btn = { x: 520, y: 516, w: 240, h: 52 };
      if (inRect(pos, btn)) restartShift(world);
      return;
    }
    if (world.phase !== 'playing' || world.paused) return;
    clickAt(world, pos.x, pos.y);
  });

  window.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
      event.preventDefault();
    }
    unlockAudio();
    if (key === 'enter') {
      if (startIfNeeded()) return;
    }
    if (key === 'r' && world.phase === 'over') {
      restartShift(world);
      return;
    }
    if (key === 'm') {
      setMuted(!isMuted());
      return;
    }
    if (key === 'p' && world.phase === 'playing') {
      hooks.togglePause();
      return;
    }
    if (world.phase !== 'playing' || world.paused) return;
    if (key === 'w' || key === 'arrowup') keys.up = true;
    if (key === 's' || key === 'arrowdown') keys.down = true;
    if (key === 'a' || key === 'arrowleft') keys.left = true;
    if (key === 'd' || key === 'arrowright') keys.right = true;
    if (key === 'e' || key === ' ') interact(world);
    const num = Number.parseInt(key, 10);
    if (num >= 1 && num <= INGREDIENT_ORDER.length) {
      grabIngredient(world, INGREDIENT_ORDER[num - 1]);
    }
  });

  window.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (key === 'w' || key === 'arrowup') keys.up = false;
    if (key === 's' || key === 'arrowdown') keys.down = false;
    if (key === 'a' || key === 'arrowleft') keys.left = false;
    if (key === 'd' || key === 'arrowright') keys.right = false;
  });

  return keys;
}
