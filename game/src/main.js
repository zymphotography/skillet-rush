// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between four screens: title, play, paused and game over. The mouse steers the chef
// toward where it rests; the keys do the same.
//
// ?seed=N fixes the order pattern. ?shot=start|play|serve|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, CHEF, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_EXPIRE, EVENT_LEVEL, EVENT_OVER, EVENT_SERVE, EVENT_TRASH } from './world.js';
import { ACTION_ACT, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

/** The hint line for the zone the chef stands in, or '' when there is nothing to do there. */
function hintFor(state) {
  const centre = state.chef.x + CHEF.width / 2;
  const zone = world.zoneAt(centre);
  if (zone === 'trash') {
    return state.plate.length > 0 ? 'Space: throw the plate away' : '';
  }
  if (zone === 'serve') {
    return world.orderForPlate() !== null ? 'Space: serve this dish!' : 'Serve a finished dish here';
  }
  if (zone === 'plate') {
    if (state.chef.carrying.length > 0) return 'Space: put it on the plate';
    return 'Bring ingredients to the plate';
  }
  if (zone !== '') {
    const bin = state.bins.find((item) => item.id === zone);
    if (bin !== undefined && bin.empty > 0) return 'Refilling…';
    if (state.chef.carrying.length >= 2) return 'Hands full — drop it on the plate';
    return `Space: pick up ${zone}`;
  }
  return '';
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best, scene.hint);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and serves.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Playing. Serve the orders before they go cold.');
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Shift over. Score ${world.state.score}. Best ${best}.`);
  }

  /** Handle one-shot presses; returns true when an act press is left for the world step. */
  function handleActions(actions) {
    if (actions & ACTION_ACT && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) {
      startGame();
      return false;
    }
    if (actions & ACTION_PAUSE && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
      return false;
    }
    if (actions & (ACTION_PAUSE | ACTION_ACT) && screen === SCREEN_PAUSED) {
      screen = SCREEN_PLAY;
      announce('Playing.');
      return false;
    }
    return (actions & ACTION_ACT) !== 0;
  }

  /** Keyboard direction wins; otherwise the chef walks toward the pointer. */
  function steer() {
    const keys = input.keys();
    if (keys !== 0) return keys;
    const pointer = input.pointer();
    if (pointer === null) return 0;
    const centre = world.state.chef.x + CHEF.width / 2;
    if (pointer > centre + 8) return 1;
    if (pointer < centre - 8) return -1;
    return 0;
  }

  function step(act) {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, 0, false, true);
      return;
    }
    const events = world.step(STEP, steer(), act, false);
    if (events & EVENT_OVER) endGame();
    else if (events & EVENT_SERVE) announce(`Served! Score ${world.state.score}.`);
    else if (events & EVENT_EXPIRE) announce(world.state.hearts === 1 ? 'An order went cold. 1 heart left.' : `An order went cold. ${world.state.hearts} hearts left.`);
    else if (events & EVENT_TRASH) announce('Plate cleared.');
    else if (events & EVENT_LEVEL) announce(`Level ${world.state.level}. Orders come faster now.`);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const act = handleActions(input.takeActions());
    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      let acted = act;
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step(acted);
        acted = false;
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best, screen === SCREEN_PLAY ? hintFor(world.state) : '');
  }

  // Leaving the tab pauses a running game rather than letting orders go cold unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Skillet Rush. Press Space or click to start the shift.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
