// The game's rules and state, with no drawing and no browser in it: the chef, the ingredient
// bins, the plate, the order board, the shift timer, hearts, combo and score. step() advances
// one fixed step and returns what happened as bit flags, so the caller can react without the
// world knowing about screens or sound. Nothing here allocates after createWorld returns.

import {
  CARRY_MAX, CHEF, COUNTER, DISHES, FIELD, HEARTS, INGREDIENTS, LEVEL, ORDER,
  PLATE, PLATE_MAX, REFILL_SECONDS, SCORE, SERVE, SHIFT_SECONDS, TRASH,
} from './config.js';

export const EVENT_PICKUP = 1;
export const EVENT_PLACE = 2;
export const EVENT_SERVE = 4;
export const EVENT_EXPIRE = 8;
export const EVENT_TRASH = 16;
export const EVENT_OVER = 32;
export const EVENT_LEVEL = 64;

function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}

export function createWorld(random) {
  const chef = { x: (FIELD.width - CHEF.width) / 2, carrying: [] };
  const bins = INGREDIENTS.map((item) => ({ id: item.id, empty: 0 }));
  const plate = [];
  const orders = [];
  let nextOrderId = 1;
  const state = {
    chef, bins, plate, orders,
    score: 0, hearts: HEARTS, combo: 0, level: 1, served: 0,
    timeLeft: SHIFT_SECONDS, elapsed: 0, spawnTimer: 2,
    over: false, overReason: '',
  };

  function reset() {
    chef.x = (FIELD.width - CHEF.width) / 2;
    chef.carrying.length = 0;
    for (const bin of bins) bin.empty = 0;
    plate.length = 0;
    orders.length = 0;
    nextOrderId = 1;
    state.score = 0;
    state.hearts = HEARTS;
    state.combo = 0;
    state.level = 1;
    state.served = 0;
    state.timeLeft = SHIFT_SECONDS;
    state.elapsed = 0;
    state.spawnTimer = 2;
    state.over = false;
    state.overReason = '';
  }

  function orderTime() {
    return Math.max(ORDER.minTime, ORDER.time - (state.level - 1));
  }

  function orderInterval() {
    return Math.max(ORDER.minInterval, ORDER.interval - (state.level - 1));
  }

  function addOrder() {
    if (orders.length >= ORDER.maxActive) return;
    const dish = DISHES[Math.floor(random() * DISHES.length)];
    const time = orderTime();
    orders.push({ id: nextOrderId, dish, needs: dish.needs, timeLeft: time, maxTime: time });
    nextOrderId += 1;
  }

  /** Which counter zone the chef's centre stands in: trash, serve, plate, a bin id, or ''. */
  function zoneAt(x) {
    if (x < TRASH.width) return 'trash';
    if (x >= SERVE.x) return 'serve';
    if (x >= PLATE.x && x < PLATE.x + PLATE.width) return 'plate';
    for (const item of INGREDIENTS) {
      if (Math.abs(x - item.x) <= 55) return item.id;
    }
    return '';
  }

  function orderForPlate() {
    for (const order of orders) {
      if (sameItems(plate, order.needs)) return order;
    }
    return null;
  }

  function finish(reason) {
    state.over = true;
    state.overReason = reason;
  }

  /**
   * One fixed step. `direction` is -1, 0 or 1 (left, still, right); `act` is true on the frame
   * the player pressed the action key or clicked. With `harmless` set (the title screen's
   * backdrop) orders appear but never expire and nothing scores.
   */
  function step(dt, direction, act, harmless) {
    let events = 0;
    if (state.over) return events;
    state.elapsed += dt;

    chef.x = Math.min(
      FIELD.width - CHEF.width,
      Math.max(0, chef.x + direction * CHEF.speed * dt),
    );

    for (const bin of bins) {
      if (bin.empty > 0) bin.empty = Math.max(0, bin.empty - dt);
    }

    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      addOrder();
      state.spawnTimer += orderInterval();
    }

    if (!harmless) {
      state.timeLeft -= dt;
      if (state.timeLeft <= 0) {
        state.timeLeft = 0;
        finish('time');
        return events | EVENT_OVER;
      }
      for (let index = orders.length - 1; index >= 0; index -= 1) {
        const order = orders[index];
        order.timeLeft -= dt;
        if (order.timeLeft <= 0) {
          orders.splice(index, 1);
          state.hearts -= 1;
          state.combo = 0;
          events |= EVENT_EXPIRE;
          if (state.hearts <= 0) {
            state.hearts = 0;
            finish('hearts');
            return events | EVENT_OVER;
          }
        }
      }
    }

    if (act && !harmless) {
      const centre = chef.x + CHEF.width / 2;
      const zone = zoneAt(centre);
      if (zone === 'trash') {
        if (plate.length > 0) {
          plate.length = 0;
          state.combo = 0;
          events |= EVENT_TRASH;
        }
      } else if (zone === 'serve') {
        const order = orderForPlate();
        if (order !== null) {
          const tip = Math.round((order.timeLeft / order.maxTime) * SCORE.tip);
          state.score += SCORE.dish + tip + state.combo * SCORE.combo;
          state.combo += 1;
          state.served += 1;
          plate.length = 0;
          orders.splice(orders.indexOf(order), 1);
          events |= EVENT_SERVE;
          const level = Math.min(LEVEL.max, 1 + Math.floor(state.served / LEVEL.dishes));
          if (level > state.level) {
            state.level = level;
            events |= EVENT_LEVEL;
          }
        }
      } else if (zone === 'plate') {
        if (chef.carrying.length > 0 && plate.length < PLATE_MAX) {
          plate.push(chef.carrying.shift());
          events |= EVENT_PLACE;
        }
      } else if (zone !== '') {
        const bin = bins.find((item) => item.id === zone);
        if (bin !== undefined && bin.empty === 0 && chef.carrying.length < CARRY_MAX) {
          chef.carrying.push(bin.id);
          bin.empty = REFILL_SECONDS;
          events |= EVENT_PICKUP;
        }
      }
    }
    return events;
  }

  reset();
  return { state, reset, step, zoneAt, orderForPlate };
}
