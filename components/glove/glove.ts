import gsap from "gsap";
import { reduced } from "@/lib/feel";

/**
 * A white glove engraved with gold, the hand of the game: it takes a card off the deck,
 * holds it up to show, pinches a card out of the hand, flicks the joker, sets the last
 * words down. Drawn once as SVG (pointing up, fingertips pinching at the top centre) and
 * moved as a whole, so it costs one layer.
 */

let uid = 0;

/** the glove's markup; `mirror` gives the left hand */
export function gloveSvg(mirror = false) {
  const id = `glv${uid++}`;
  const gold = `url(#${id}g)`;
  return `
<svg viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;${mirror ? "transform:scaleX(-1);" : ""}overflow:visible">
  <defs>
    <linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="150">
      <stop offset="0" stop-color="#fff1c2"/><stop offset=".45" stop-color="#e0b54a"/><stop offset="1" stop-color="#a77a22"/>
    </linearGradient>
    <radialGradient id="${id}w" cx=".38" cy=".3" r=".9">
      <stop offset="0" stop-color="#ffffff"/><stop offset=".7" stop-color="#f4efe6"/><stop offset="1" stop-color="#dcd4c6"/>
    </radialGradient>
  </defs>
  <!-- a magician's glove: round, bold shapes and a thick outline, no fussy detail -->
  <g fill="url(#${id}w)" stroke="#4a3210" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
    <!-- four fingers side by side, fanning slightly, the middle one longest -->
    <rect x="27" y="22" width="13" height="50" rx="6.5" transform="rotate(-7 33 72)"/>
    <rect x="39.5" y="13" width="13" height="59" rx="6.5" transform="rotate(-2 46 72)"/>
    <rect x="52" y="17" width="13" height="55" rx="6.5" transform="rotate(4 58 72)"/>
    <rect x="63.5" y="29" width="11.5" height="43" rx="5.75" transform="rotate(10 69 72)"/>
    <!-- thumb, out to the left -->
    <path d="M32 98 C24 94 15 82 11 70 C8 61 17 56 21 63 C25 72 31 80 38 86 Z"/>
    <!-- palm and back of the hand, over the bases of the fingers -->
    <path d="M24 114 C20 94 21 76 26 66 C31 58 70 56 76 65 C80 74 80 94 76 114 Z"/>
  </g>
  <!-- three gold stitches on the back, the classic glove -->
  <g stroke="${gold}" stroke-width="2.8" stroke-linecap="round" fill="none">
    <path d="M40 98 L40 76"/>
    <path d="M51 100 L51 76"/>
    <path d="M62 98 L62 76"/>
  </g>
  <!-- a wide rolled cuff in gold -->
  <path d="M19 108 Q50 98 81 108 L83 140 Q50 150 17 140 Z" fill="${gold}" stroke="#4a3210" stroke-width="3.2" stroke-linejoin="round"/>
  <path d="M21 121 Q50 112 79 121" fill="none" stroke="#fff1c2" stroke-width="1.6" opacity=".7"/>
</svg>`;
}

type Box = { x: number; y: number };

/** a glove placed on the page, fixed, its fingertip pinch at (x, y) */
function place(width: number, mirror = false) {
  const el = document.createElement("div");
  el.innerHTML = gloveSvg(mirror);
  Object.assign(el.style, {
    position: "fixed",
    left: "0",
    top: "0",
    width: `${width}px`,
    pointerEvents: "none",
    zIndex: "45",
    // the grip point, at the fingertips (about 50%, 12% of the drawing)
    transformOrigin: "50% 12%",
    filter: "drop-shadow(0 10px 14px rgba(0,0,0,.45))",
    willChange: "transform",
  });
  document.body.appendChild(el);
  // offsets so that `x, y` lands on the pinch (mirrored: the pinch sits on the other side)
  const px = mirror ? 0.52 : 0.48;
  const at = (p: Box) => ({ x: p.x - width * px, y: p.y - width * 0.18 });
  return { el, at };
}

/** the pinch point for an element: middle of its bottom edge, a little inside */
export function bottomGrip(target: Element): Box {
  const r = target.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.bottom - r.height * 0.06 };
}

export type Grip = {
  /** keep the glove on a point while something else moves (call every frame or on tween update) */
  follow: (p: Box) => void;
  /** a small snap of the wrist, as when tossing a card */
  flick: () => void;
  /** let go and slide back out of the screen */
  release: (delay?: number) => Promise<void>;
};

/** the grip point on an element's left edge, a little inside, just below the middle */
export function leftGrip(target: Element): Box {
  const r = target.getBoundingClientRect();
  return { x: r.left + r.width * 0.05, y: r.top + r.height * 0.55 };
}

/**
 * The glove reaches in to (x, y) and grips there. Resolves once it holds. `angle` is the way
 * the fingers point, in degrees (0 = up, coming from below; 90 = right, coming from the left
 * edge). `side` tilts it a little so it seems to come from that side of the table.
 */
export function reach(
  p: Box,
  { width = 110, side = 0, angle = 0, duration = 0.55, mirror = false, from = 0 } = {},
): Promise<Grip> {
  if (reduced()) return Promise.resolve({ follow: () => {}, flick: () => {}, release: () => Promise.resolve() });
  const g = place(width, mirror);
  const target = g.at(p);
  // it comes from behind the fingers' direction, from off screen
  const rad = (angle * Math.PI) / 180;
  const back = { x: -Math.sin(rad), y: Math.cos(rad) };
  // how far off it starts: `from` in px, or far enough to come from off screen
  const far = from || Math.max(window.innerWidth, window.innerHeight) * 0.7;
  const rest = angle + side * 4;
  gsap.set(g.el, { x: target.x + back.x * far + side * 60, y: target.y + back.y * far, rotation: angle + side * 14 });
  // a second release (a later one overtaking a delayed one) just hurries the first
  let leaving: gsap.core.Tween | null = null;
  const grip: Grip = {
    follow: (q) => {
      const t = g.at(q);
      gsap.set(g.el, { x: t.x, y: t.y });
    },
    flick: () => {
      if (leaving) return;
      gsap.fromTo(g.el, { rotation: rest - 9 }, { rotation: rest, duration: 0.22, ease: "back.out(3)", overwrite: "auto" });
    },
    release: (delay = 0) =>
      new Promise((done) => {
        if (leaving) {
          if (delay === 0) leaving.delay(0).restart(true);
          return void leaving.then(() => done());
        }
        leaving = gsap.to(g.el, {
          x: `+=${back.x * far + side * 50}`,
          y: `+=${back.y * far}`,
          rotation: angle + side * 12,
          duration: 0.5,
          delay,
          ease: "power2.in",
          onComplete: () => {
            g.el.remove();
            done();
          },
        });
      }),
  };
  return new Promise((resolve) => {
    gsap.to(g.el, { x: target.x, y: target.y, rotation: rest, duration, ease: "power3.out", onComplete: () => resolve(grip) });
  });
}

/** a quick flick under an element: the glove darts in, snaps, and leaves */
export function flick(target: Element, { width = 90 } = {}) {
  if (reduced()) return;
  const r = target.getBoundingClientRect();
  const g = place(width);
  const p = g.at({ x: r.left + r.width * 0.3, y: r.bottom - r.height * 0.1 });
  gsap.set(g.el, { x: p.x + 40, y: p.y + 120, rotation: 20, opacity: 0 });
  gsap
    .timeline({ onComplete: () => g.el.remove() })
    .to(g.el, { x: p.x, y: p.y, rotation: 6, opacity: 1, duration: 0.22, ease: "power2.out" })
    .to(g.el, { rotation: -22, x: "-=14", y: "-=10", duration: 0.12, ease: "power3.in" })
    .to(g.el, { y: "+=200", x: "+=30", rotation: 10, opacity: 0, duration: 0.45, ease: "power2.in" }, "+=0.05");
}
