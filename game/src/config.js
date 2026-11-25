// Every tuning number and colour for Skillet Rush, in one place. The playfield is a fixed
// 1280x720 logical area; the renderer scales it to the window, so no rule below depends on
// the screen size. The chef walks the floor in front of one long counter: ingredient bins,
// a plate in the middle, a trash bin at the far left and the serving window at the far right.

export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

/** How long one shift lasts, in seconds; the game ends when it runs out or the hearts do. */
export const SHIFT_SECONDS = 120;

export const HEARTS = 3;

/** How many ingredients the chef can carry at once, and how many the plate holds. */
export const CARRY_MAX = 2;
export const PLATE_MAX = 4;

export const CHEF = {
  width: 64,
  height: 88,
  speed: 540,
  /** Floor line the chef's feet stand on. */
  floorY: 648,
};

/** An order's countdown, in seconds, and how often a new order arrives. */
export const ORDER = {
  time: 25,
  minTime: 18,
  interval: 9,
  minInterval: 5,
  maxActive: 3,
};

/** Seconds a bin stays empty after its ingredient is picked up. */
export const REFILL_SECONDS = 1.2;

/** Dishes per level; each level shortens the order interval and the order timer. */
export const LEVEL = { dishes: 3, max: 8 };

/** Points for a served dish, plus a tip for the time left on its order, plus a combo bonus. */
export const SCORE = { dish: 100, tip: 50, combo: 15 };

/** The six ingredients, left to right along the counter, with their bin centres. */
export const INGREDIENTS = [
  { id: 'bun', label: 'Bun', short: 'B', colour: '#e8b96a', dark: '#b98a3e', x: 205 },
  { id: 'patty', label: 'Patty', short: 'P', colour: '#8a5a33', dark: '#5f3c1e', x: 335 },
  { id: 'lettuce', label: 'Lettuce', short: 'L', colour: '#7bc96f', dark: '#4d8f43', x: 465 },
  { id: 'tomato', label: 'Tomato', short: 'T', colour: '#e5534b', dark: '#a82e28', x: 815 },
  { id: 'cheese', label: 'Cheese', short: 'C', colour: '#f2c94c', dark: '#b8932a', x: 945 },
  { id: 'onion', label: 'Onion', short: 'O', colour: '#b388d9', dark: '#7d55a3', x: 1075 },
];

/** The menu: each dish is a name and the ingredients it needs, in serving order. */
export const DISHES = [
  { name: 'Classic Burger', needs: ['bun', 'patty', 'lettuce'] },
  { name: 'Cheese Burger', needs: ['bun', 'patty', 'cheese'] },
  { name: 'Garden Salad', needs: ['lettuce', 'tomato', 'onion'] },
  { name: 'Veggie Melt', needs: ['bun', 'cheese', 'tomato'] },
  { name: 'Double Stack', needs: ['bun', 'patty', 'patty', 'cheese'] },
];

/** The plate sits in the middle of the counter; the trash and the window at the ends. */
export const PLATE = { x: 590, width: 100 };
export const TRASH = { x: 0, width: 110 };
export const SERVE = { x: 1170, width: 110 };
export const COUNTER = { top: 430, height: 96 };

export const PALETTE = {
  backdrop: '#241a12',
  wall: '#f3e2c7',
  wallTile: '#e8d3ac',
  floor: '#c98f5f',
  floorTile: '#b57a4b',
  counter: '#8a5a33',
  counterTop: '#a9743f',
  board: '#2e2620',
  boardEdge: '#4a3a2c',
  ticket: '#fff6e0',
  ticketUrgent: '#ffe1d6',
  plate: '#f4f1ea',
  plateEdge: '#c9c2b2',
  chefHat: '#ffffff',
  chefSkin: '#f2c29b',
  chefCoat: '#ffffff',
  chefApron: '#3f6fb5',
  chefPants: '#3a3f4a',
  text: '#2b2118',
  textLight: '#f7f1e3',
  muted: '#8b7d68',
  gold: '#f2c94c',
  red: '#e5534b',
  green: '#7bc96f',
  panel: '#2e2620',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best score is kept between visits (this browser only). */
export const BEST_KEY = 'skillet-rush.best';
