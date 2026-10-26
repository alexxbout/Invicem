/**
 * How the table moves, shared by every animation: a tempo that follows the depth of the
 * evening, and small variations so no gesture is ever replayed exactly the same.
 */

const state = { depth: 2 };

export const motion = {
  /** the depth on the table, 1 (light) to 3 (deep); set by the game screen */
  setDepth(d: number) {
    state.depth = Math.max(1, Math.min(3, d));
  },

  /**
   * Duration multiplier: light questions move briskly, deep ones slowly and with weight.
   * 0.85 at depth 1, 1 at depth 2, 1.3 at depth 3.
   */
  tempo(depth = state.depth): number {
    const d = Math.max(1, Math.min(3, depth));
    return d <= 2 ? 0.85 + 0.15 * (d - 1) : 1 + 0.3 * (d - 2);
  },

  /** the landing of a card: a lively bounce when light, a soft settle when deep */
  settle(): string {
    const d = state.depth;
    return d < 1.7 ? "back.out(1.7)" : d < 2.5 ? "back.out(1.3)" : "power3.out";
  },

  /** v, nudged by up to ±share of itself, so repeated gestures never match exactly */
  vary(v: number, share = 0.08): number {
    return v * (1 + (Math.random() * 2 - 1) * share);
  },
};
