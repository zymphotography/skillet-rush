// The screenshot scenes behind ?shot=start|play|serve|end. Each one plays the real rules
// forward from a fresh world for a fixed stretch, steered by a simple autopilot (fetch the
// oldest order's missing ingredients, drop them on the plate, ring the bell to serve), so the
// frame is what a short game really looks like and the same seed always gives the same frame.
import { CHEF, INGREDIENTS, PLATE, SERVE, STEP, TRASH } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 22;
const END_LIMIT_SECONDS = 600;
const SERVE_LIMIT_SECONDS = 600;

function ingredientX(id) {
  const item = INGREDIENTS.find((entry) => entry.id === id);
  return item === undefined ? FIELD_CENTRE : item.x;
}

const FIELD_CENTRE = 640;

/** What is still missing from the plate for `order`, counting what the chef already carries. */
function missingFor(state, order) {
  const needed = [...order.needs];
  for (const item of state.plate) {
    const index = needed.indexOf(item);
    if (index !== -1) needed.splice(index, 1);
  }
  return needed;
}

/**
 * Where the chef should stand next, and whether to press the action key there. The pilot
 * works the oldest order first: fetch what it still needs, drop it on the plate, then serve.
 */
function autopilot(world) {
  const state = world.state;
  const chefCentre = state.chef.x + CHEF.width / 2;
  const ready = world.orderForPlate();
  if (ready !== null) {
    const target = SERVE.x + 55;
    return { direction: steer(chefCentre, target), act: chefCentre >= SERVE.x };
  }
  const order = state.orders[0];
  if (order === undefined) return { direction: 0, act: false };
  const missing = missingFor(state, order);
  const carried = state.chef.carrying;
  const useful = carried.find((item) => missing.includes(item));
  if (useful !== undefined) {
    const target = PLATE.x + PLATE.width / 2;
    return { direction: steer(chefCentre, target), act: chefCentre >= PLATE.x && chefCentre < PLATE.x + PLATE.width };
  }
  if (carried.length > 0) {
    const target = TRASH.width / 2;
    return { direction: steer(chefCentre, target), act: chefCentre < TRASH.width };
  }
  const next = missing[0];
  if (next === undefined) return { direction: 0, act: false };
  const target = ingredientX(next);
  return { direction: steer(chefCentre, target), act: Math.abs(chefCentre - target) <= 55 };
}

function steer(from, to) {
  if (to > from + 6) return 1;
  if (to < from - 6) return -1;
  return 0;
}

/**
 * Set `world` to the named scene (start, play, serve or end; any other name is start) and
 * return the screen to draw over it, the best score to show and the hint line to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'serve' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) {
      world.step(STEP, 0, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0, hint: '' };
  }
  if (name === 'serve') {
    for (let index = 0; index < SERVE_LIMIT_SECONDS / STEP; index += 1) {
      const move = autopilot(world);
      world.step(STEP, move.direction, move.act, false);
      if (world.orderForPlate() !== null) break;
      if (world.state.over) break;
    }
    return {
      screen: world.state.over ? SCREEN_OVER : SCREEN_PLAY,
      best: world.state.score,
      hint: world.orderForPlate() !== null ? 'Dish complete — ring the bell to serve!' : '',
    };
  }
  if (name === 'end') {
    for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
      world.step(STEP, 0, false, false);
      if (world.state.over) break;
    }
    return { screen: SCREEN_OVER, best: world.state.score, hint: '' };
  }
  for (let index = 0; index < PLAY_SECONDS / STEP; index += 1) {
    const move = autopilot(world);
    world.step(STEP, move.direction, move.act, false);
    if (world.state.over) break;
  }
  const over = world.state.over;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.score, hint: '' };
}
