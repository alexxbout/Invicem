import gsap from "gsap";

/**
 * Two ways for a card to leave the table by coming apart. Both drive one mask on the card
 * (a front that sweeps across it) and throw a few hundred tiny particles from that front.
 * Only the mask and the particles move: no copies of the card, no filters.
 */

const SAND = ["#e3c27a", "#f3d27a", "#c0283c", "#6b2fa8", "#f4eadb", "#a77a22"];
const EMBERS = ["#ffcf6b", "#ff9a3d", "#ffe9a8", "#f36b2a"];

type Opts = { duration?: number; onDone?: () => void };

/** a particle flying off from (x, y) inside `host` */
function grain(host: HTMLElement, x: number, y: number, color: string, size: number, glow: boolean) {
  const d = document.createElement("span");
  Object.assign(d.style, {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: glow ? "50%" : "1px",
    background: color,
    boxShadow: glow ? `0 0 6px 2px ${color}` : "none",
    pointerEvents: "none",
  });
  host.appendChild(d);
  return d;
}

/**
 * A: sand blown by the wind. The card wears away from left to right; grains lift off the
 * front and drift back to the left and up, curling, then fade.
 */
export function blowAway(card: HTMLElement, host: HTMLElement, { duration = 1.6, onDone }: Opts = {}) {
  const box = card.getBoundingClientRect();
  const origin = host.getBoundingClientRect();
  const front = { p: -12 };
  const mask = () =>
    `linear-gradient(100deg, transparent ${front.p}%, rgba(0,0,0,.35) ${front.p + 4}%, #000 ${front.p + 12}%)`;
  const apply = () => {
    card.style.webkitMaskImage = mask();
    card.style.maskImage = mask();
  };
  apply();
  let last = front.p;
  return gsap.to(front, {
    p: 105,
    duration,
    ease: "power1.in",
    onUpdate: () => {
      apply();
      // grains come off the band the front just crossed
      const from = Math.max(0, last);
      const to = Math.max(0, front.p);
      last = front.p;
      const count = Math.round((to - from) * 4);
      for (let i = 0; i < count; i++) {
        const fx = (from + Math.random() * (to - from)) / 100;
        const fy = Math.random();
        // the front is slanted: lower rows are a little ahead
        const x = box.left - origin.left + box.width * (fx + (fy - 0.5) * 0.12);
        const y = box.top - origin.top + box.height * fy;
        const g = grain(host, x, y, SAND[(Math.random() * SAND.length) | 0], 1.5 + Math.random() * 2.5, Math.random() < 0.25);
        gsap.to(g, {
          // blown back over where the card has already gone, and up
          x: -50 - Math.random() * 150,
          y: -30 - Math.random() * 120,
          rotation: Math.random() * 360,
          opacity: 0,
          duration: 0.9 + Math.random() * 0.9,
          ease: "power1.out",
          onComplete: () => g.remove(),
        });
      }
    },
    onComplete: () => onDone?.(),
  });
}

/**
 * B: the card burns away. A glowing edge spreads from the bottom corner, the paper darkens
 * just ahead of it and is gone behind it; embers and ash rise from the edge.
 */
export function burnAway(card: HTMLElement, host: HTMLElement, { duration = 2, onDone }: Opts = {}) {
  const box = card.getBoundingClientRect();
  const origin = host.getBoundingClientRect();
  const cx = box.left - origin.left + box.width * 0.85;
  const cy = box.top - origin.top + box.height * 0.95;
  // reach: enough to swallow the far corner
  const reach = Math.hypot(box.width * 0.85, box.height * 0.95) * 1.08;
  const front = { r: 0 };
  // the char and glow ride on a sibling layer, clipped to the card by the same shape
  const edge = document.createElement("div");
  Object.assign(edge.style, {
    position: "absolute",
    left: `${box.left - origin.left}px`,
    top: `${box.top - origin.top}px`,
    width: `${box.width}px`,
    height: `${box.height}px`,
    borderRadius: "7% / 5%",
    pointerEvents: "none",
  });
  host.appendChild(edge);
  const at = `${box.width * 0.85}px ${box.height * 0.95}px`;
  const apply = () => {
    const r = front.r;
    const m = `radial-gradient(circle at ${at}, transparent ${r}px, #000 ${r + 3}px)`;
    card.style.webkitMaskImage = m;
    card.style.maskImage = m;
    // just ahead of the front: a brown scorch, then the bright line of fire
    edge.style.background = `radial-gradient(circle at ${at}, transparent ${Math.max(0, r - 2)}px, #ffcf6b ${r}px, #f36b2a ${r + 3}px, rgba(70,30,8,.85) ${r + 6}px, rgba(70,30,8,.35) ${r + 16}px, transparent ${r + 30}px)`;
  };
  apply();
  return gsap.to(front, {
    r: reach,
    duration,
    ease: "power1.inOut",
    onUpdate: () => {
      apply();
      // embers rise from random points of the burning edge that are still on the card
      for (let i = 0; i < 4; i++) {
        const a = Math.PI + Math.random() * (Math.PI / 2);
        const x = cx + Math.cos(a) * front.r;
        const y = cy + Math.sin(a) * front.r;
        if (x < box.left - origin.left || y < box.top - origin.top) continue;
        const ash = Math.random() < 0.3;
        const g = grain(host, x, y, ash ? "#3a2a24" : EMBERS[(Math.random() * EMBERS.length) | 0], ash ? 2 + Math.random() * 2 : 1.5 + Math.random() * 2, !ash);
        gsap.to(g, {
          x: (Math.random() - 0.5) * 50,
          y: -50 - Math.random() * 110,
          opacity: 0,
          duration: 0.8 + Math.random() * 0.8,
          ease: "power1.out",
          onComplete: () => g.remove(),
        });
      }
    },
    onComplete: () => {
      edge.remove();
      onDone?.();
    },
  });
}
