// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Flat shapes and canvas text: a cream-tiled kitchen wall, a wooden counter with
// ingredient bins, a plate in the middle, a trash bin and a serving window at the ends, the
// chef on the floor, and the order board with its tickets across the top.

import {
  CHEF, COUNTER, FIELD, FONT, HEARTS, INGREDIENTS, ORDER, PALETTE, PLATE, SERVE, TRASH,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 140, line: 34, bottom: 76 };
const TICKET = { width: 208, height: 96, gap: 16 };
const BIN_SIZE = 64;

function ingredientById(id) {
  return INGREDIENTS.find((item) => item.id === id);
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const fonts = new Map();

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  function text(value, x, y, size, color, align, baseline) {
    if (!fonts.has(size)) fonts.set(size, `bold ${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = baseline ?? 'alphabetic';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, width, height, radius) {
    context.beginPath();
    context.moveTo(x + radius, y);
    context.lineTo(x + width - radius, y);
    context.arcTo(x + width, y, x + width, y + radius, radius);
    context.lineTo(x + width, y + height - radius);
    context.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    context.lineTo(x + radius, y + height);
    context.arcTo(x, y + height, x, y + height - radius, radius);
    context.lineTo(x, y + radius);
    context.arcTo(x, y, x + radius, y, radius);
    context.closePath();
  }

  /** One ingredient, drawn at (x, y) as its centre, about `size` wide. */
  function drawIngredient(id, x, y, size) {
    const item = ingredientById(id);
    if (item === undefined) return;
    const half = size / 2;
    context.fillStyle = item.colour;
    context.strokeStyle = item.dark;
    context.lineWidth = 2;
    if (id === 'bun') {
      context.beginPath();
      context.arc(x, y + half * 0.35, half * 0.95, Math.PI, 0);
      context.closePath();
      context.fill();
      context.stroke();
      context.fillRect(x - half * 0.95, y + half * 0.35, half * 1.9, half * 0.4);
    } else if (id === 'patty') {
      roundRect(x - half, y - half * 0.55, size, half * 1.1, 8);
      context.fill();
      context.stroke();
    } else if (id === 'lettuce') {
      for (const offset of [-0.45, 0, 0.45]) {
        context.beginPath();
        context.arc(x + offset * half, y, half * 0.6, 0, Math.PI * 2);
        context.fill();
      }
      context.stroke();
    } else if (id === 'tomato') {
      context.beginPath();
      context.arc(x, y, half * 0.9, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.strokeStyle = '#4d8f43';
      context.beginPath();
      context.moveTo(x, y - half * 0.8);
      context.lineTo(x, y - half * 1.2);
      context.stroke();
    } else if (id === 'cheese') {
      context.beginPath();
      context.moveTo(x - half, y + half * 0.7);
      context.lineTo(x + half, y + half * 0.7);
      context.lineTo(x, y - half * 0.8);
      context.closePath();
      context.fill();
      context.stroke();
    } else if (id === 'onion') {
      context.beginPath();
      context.arc(x, y, half * 0.9, 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.strokeStyle = '#efe6f7';
      context.beginPath();
      context.arc(x, y, half * 0.55, 0, Math.PI * 2);
      context.stroke();
    }
  }

  function drawHeart(x, y, size, filled) {
    context.fillStyle = filled ? PALETTE.red : '#5a4632';
    context.beginPath();
    context.moveTo(x, y + size * 0.35);
    context.bezierCurveTo(x - size * 0.55, y - size * 0.25, x - size * 0.25, y - size * 0.7, x, y - size * 0.25);
    context.bezierCurveTo(x + size * 0.25, y - size * 0.7, x + size * 0.55, y - size * 0.25, x, y + size * 0.35);
    context.closePath();
    context.fill();
  }

  function drawWall() {
    context.fillStyle = PALETTE.wall;
    context.fillRect(0, 0, FIELD.width, COUNTER.top);
    context.fillStyle = PALETTE.wallTile;
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        if ((row + col) % 2 === 0) context.fillRect(col * 80 + (row % 2) * 40, 128 + row * 76, 76, 72);
      }
    }
    context.fillStyle = PALETTE.floor;
    context.fillRect(0, COUNTER.top + COUNTER.height, FIELD.width, FIELD.height - COUNTER.top - COUNTER.height);
    context.fillStyle = PALETTE.floorTile;
    for (let col = 0; col < 8; col += 1) {
      context.fillRect(col * 160 + 80, COUNTER.top + COUNTER.height, 4, FIELD.height - COUNTER.top - COUNTER.height);
    }
  }

  function drawBoard(state) {
    context.fillStyle = PALETTE.boardEdge;
    roundRect(12, 8, FIELD.width - 24, 108, 12);
    context.fill();
    context.fillStyle = PALETTE.board;
    roundRect(18, 14, FIELD.width - 36, 96, 8);
    context.fill();
    text('ORDERS', 40, 62, 24, PALETTE.textLight, 'left', 'middle');
    const orders = state.orders;
    for (let index = 0; index < orders.length; index += 1) {
      const order = orders[index];
      const x = 170 + index * (TICKET.width + TICKET.gap);
      const urgent = order.timeLeft < 8;
      context.fillStyle = urgent ? PALETTE.ticketUrgent : PALETTE.ticket;
      roundRect(x, 22, TICKET.width, TICKET.height, 8);
      context.fill();
      text(order.dish.name, x + 12, 46, 19, PALETTE.text, 'left', 'middle');
      for (let need = 0; need < order.needs.length; need += 1) {
        drawIngredient(order.needs[need], x + 26 + need * 44, 82, 30);
      }
      const ratio = Math.max(0, order.timeLeft / order.maxTime);
      context.fillStyle = '#e0d5bd';
      context.fillRect(x + 12, 104, TICKET.width - 24, 7);
      context.fillStyle = urgent ? PALETTE.red : PALETTE.green;
      context.fillRect(x + 12, 104, (TICKET.width - 24) * ratio, 7);
    }
    if (orders.length === 0) {
      text('No orders yet — the lunch rush is coming.', 170, 70, 20, PALETTE.muted, 'left', 'middle');
    }
  }

  function drawCounter(state) {
    context.fillStyle = PALETTE.counter;
    context.fillRect(0, COUNTER.top, FIELD.width, COUNTER.height);
    context.fillStyle = PALETTE.counterTop;
    context.fillRect(0, COUNTER.top, FIELD.width, 14);
    // Trash bin at the far left, on the floor.
    context.fillStyle = '#6b7280';
    roundRect(18, 566, 76, 82, 8);
    context.fill();
    context.fillStyle = '#4b5563';
    context.fillRect(14, 556, 84, 14);
    text('TRASH', 56, 596, 15, '#e5e7eb', 'center', 'middle');
    // Serving window at the far right: a shelf, a bell and a heat lamp.
    context.fillStyle = '#3f3a33';
    context.fillRect(SERVE.x - 8, 356, SERVE.width + 16, 74);
    context.fillStyle = PALETTE.counterTop;
    context.fillRect(SERVE.x - 8, 424, SERVE.width + 16, 12);
    context.fillStyle = PALETTE.gold;
    context.beginPath();
    context.arc(SERVE.x + SERVE.width / 2, 402, 16, Math.PI, 0);
    context.closePath();
    context.fill();
    context.fillRect(SERVE.x + SERVE.width / 2 - 20, 402, 40, 5);
    text('SERVE', SERVE.x + SERVE.width / 2, 372, 16, PALETTE.textLight, 'center', 'middle');
    // Ingredient bins along the counter.
    for (let index = 0; index < INGREDIENTS.length; index += 1) {
      const item = INGREDIENTS[index];
      const bin = state.bins[index];
      const empty = bin.empty > 0;
      context.fillStyle = empty ? '#d8cbb2' : '#fbf3df';
      roundRect(item.x - 36, COUNTER.top - 52, 72, 52, 8);
      context.fill();
      context.strokeStyle = '#c9b48a';
      context.lineWidth = 2;
      context.stroke();
      if (!empty) drawIngredient(item.id, item.x, COUNTER.top - 26, 40);
      else {
        context.fillStyle = PALETTE.muted;
        context.beginPath();
        context.arc(item.x, COUNTER.top - 26, 12 * (1 - bin.empty / 1.2), 0, Math.PI * 2);
        context.fill();
      }
      text(item.label, item.x, COUNTER.top + 34, 16, '#f7ead0', 'center', 'middle');
    }
    // The plate, with the dish being assembled stacked on it.
    const plateX = PLATE.x + PLATE.width / 2;
    context.fillStyle = PALETTE.plateEdge;
    context.beginPath();
    context.ellipse(plateX, COUNTER.top - 2, 58, 12, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.plate;
    context.beginPath();
    context.ellipse(plateX, COUNTER.top - 5, 50, 10, 0, 0, Math.PI * 2);
    context.fill();
    for (let index = 0; index < state.plate.length; index += 1) {
      drawIngredient(state.plate[index], plateX, COUNTER.top - 22 - index * 20, 34);
    }
    if (state.plate.length === 0) {
      text('PLATE', plateX, COUNTER.top + 34, 16, '#f7ead0', 'center', 'middle');
    }
  }

  function drawChef(state, screen) {
    const chef = state.chef;
    const x = chef.x + CHEF.width / 2;
    const feet = CHEF.floorY;
    if (screen === SCREEN_TITLE) return;
    // Legs.
    context.fillStyle = PALETTE.chefPants;
    context.fillRect(x - 22, feet - 34, 18, 34);
    context.fillRect(x + 4, feet - 34, 18, 34);
    // Coat and apron.
    context.fillStyle = PALETTE.chefCoat;
    roundRect(x - 28, feet - 88, 56, 58, 10);
    context.fill();
    context.fillStyle = PALETTE.chefApron;
    roundRect(x - 18, feet - 82, 36, 48, 6);
    context.fill();
    // Arms.
    context.fillStyle = PALETTE.chefCoat;
    context.fillRect(x - 38, feet - 80, 12, 40);
    context.fillRect(x + 26, feet - 80, 12, 40);
    // Head and toque.
    context.fillStyle = PALETTE.chefSkin;
    context.beginPath();
    context.arc(x, feet - 102, 17, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = PALETTE.chefHat;
    roundRect(x - 22, feet - 132, 44, 22, 10);
    context.fill();
    context.beginPath();
    context.arc(x - 12, feet - 132, 11, 0, Math.PI * 2);
    context.arc(x + 12, feet - 132, 11, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#2b2118';
    context.beginPath();
    context.arc(x - 7, feet - 104, 2, 0, Math.PI * 2);
    context.arc(x + 7, feet - 104, 2, 0, Math.PI * 2);
    context.fill();
    // Carried ingredients, held up in both hands.
    for (let index = 0; index < chef.carrying.length; index += 1) {
      drawIngredient(chef.carrying[index], x - 30 + index * 60, feet - 62, 30);
    }
  }

  function drawHud(state) {
    text(`Score ${state.score}`, 24, 158, 28, PALETTE.textLight, 'left', 'middle');
    text(`Level ${state.level}`, 24, 190, 20, PALETTE.muted, 'left', 'middle');
    if (state.combo >= 2) {
      text(`Combo x${state.combo}`, 24, 220, 20, PALETTE.gold, 'left', 'middle');
    }
    for (let heart = 0; heart < HEARTS; heart += 1) {
      drawHeart(FIELD.width - 40 - heart * 36, 158, 26, heart < state.hearts);
    }
    const ratio = Math.max(0, state.timeLeft / 120);
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    text(`Shift ${minutes}:${String(seconds).padStart(2, '0')}`, FIELD.width / 2, 158, 24, PALETTE.textLight, 'center', 'middle');
    context.fillStyle = '#5a4632';
    context.fillRect(FIELD.width / 2 - 120, 172, 240, 8);
    context.fillStyle = ratio < 0.25 ? PALETTE.red : PALETTE.gold;
    context.fillRect(FIELD.width / 2 - 120, 172, 240 * ratio, 8);
  }

  function drawHint(hint) {
    if (hint === '') return;
    text(hint, FIELD.width / 2, 250, 22, PALETTE.gold, 'center', 'middle');
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(20, 12, 6, 0.55)';
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    context.fillStyle = PALETTE.panel;
    roundRect(x, y, PANEL.width, height, 14);
    context.fill();
    context.strokeStyle = PALETTE.boardEdge;
    context.lineWidth = 3;
    context.stroke();
    text(title, FIELD.width / 2, y + 72, 46, PALETTE.textLight, 'center', 'middle');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 21, '#cfc4ae', 'center', 'middle');
    }
    text(prompt, FIELD.width / 2, y + height - 38, 23, PALETTE.gold, 'center', 'middle');
  }

  /** Paint one frame: the kitchen, then the HUD or a panel for the screen the game is on. */
  function draw(state, screen, best, hint) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawWall();
    drawBoard(state);
    drawCounter(state);
    drawChef(state, screen);
    if (screen === SCREEN_TITLE) {
      const lines = [
        'Orders arrive on the board.',
        'Build each dish on the plate,',
        'then ring the bell to serve it in time.',
        'Move with ← → or A D, or steer with the mouse.',
        'Space or click: pick up, drop, serve, trash.',
        '',
        `Best score ${best}`,
      ];
      drawPanel('Skillet Rush', lines, 'Press Space or click to start the shift');
      return;
    }
    drawHud(state);
    drawHint(hint);
    if (screen === SCREEN_PAUSED) {
      drawPanel('Paused', ['The orders will wait for you.'], 'Press P to resume');
    } else if (screen === SCREEN_OVER) {
      const reason = state.overReason === 'hearts'
        ? 'Three orders went cold.'
        : 'The shift is over.';
      const lines = [
        reason,
        `Dishes served ${state.served}`,
        `Score ${state.score}`,
        `Best ${best}`,
        '',
      ];
      drawPanel('Shift over', lines, 'Press Space or click to play again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
