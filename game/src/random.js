// A small seeded random number generator (xorshift32 with a splitmix-style seed scramble):
// the same seed gives the same game, which is what makes the screenshot scenes repeatable.

export function createRandom(seed) {
  let state = (seed ^ 0x9e3779b9) >>> 0;
  if (state === 0) state = 0x2545f491;
  return function random() {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}
