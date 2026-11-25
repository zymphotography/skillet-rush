// Keyboard and pointer input. Held keys give a steering direction; the pointer steers the
// chef toward where it rests. One-shot presses (act, pause) are queued as bit flags and taken
// once by the loop, so a press between two frames is never lost and never counted twice.

export const ACTION_ACT = 1;
export const ACTION_PAUSE = 2;

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const ACT = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);

export function createInput(target) {
  let left = false;
  let right = false;
  let actions = 0;
  /** The pointer's x in the playfield's own coordinates, or null when it never moved. */
  let pointerX = null;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (ACT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_ACT;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    left = false;
    right = false;
    pointerX = null;
  });
  target.addEventListener('pointermove', (event) => {
    const rect = target.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width) * 1280;
  });
  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    pointerX = ((event.clientX - rect.left) / rect.width) * 1280;
    actions |= ACTION_ACT;
  });

  return {
    /** -1 for left, 1 for right, 0 for neither or both (keys only). */
    keys() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    /** Where the pointer rests, in playfield coordinates, or null. */
    pointer() {
      return pointerX;
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
