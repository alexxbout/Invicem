"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import { reduced } from "@/lib/feel";
import { motion } from "@/lib/motion";

/**
 * Light along the edges of the screen, hugging its rounded corners, like the edge lighting
 * of some phones. Only from the home screen (full screen, where the edges are the device's);
 * `?edge` forces it on elsewhere for testing. Two strokes, no filters: a wide faint one for
 * the halo and a thin bright one for the line, moved only by dash offset and opacity.
 */

type Api = {
  orbit: (speed: "slow" | "fast") => void;
  burst: (color?: string) => void;
  rise: () => void;
  jester: () => void;
  gold: () => void;
  stop: () => void;
};

let live: Api | null = null;

/** call from anywhere; does nothing when the layer is off */
export const edge: Api = {
  orbit: (s) => live?.orbit(s),
  burst: (c) => live?.burst(c),
  rise: () => live?.rise(),
  jester: () => live?.jester(),
  gold: () => live?.gold(),
  stop: () => live?.stop(),
};

const JESTER = ["#c0283c", "#6b2fa8", "#e0b54a", "#c0283c"];

function fullScreen() {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
  return standalone || new URLSearchParams(location.search).has("edge");
}

/** a rounded rectangle traced clockwise from the middle of the bottom edge */
function outline(w: number, h: number, r: number, i: number) {
  const x0 = i;
  const y0 = i;
  const x1 = w - i;
  const y1 = h - i;
  return [
    `M${w / 2} ${y1}`,
    `H${x0 + r}`,
    `A${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V${y0 + r}`,
    `A${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    `H${x1 - r}`,
    `A${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V${y1 - r}`,
    `A${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    "Z",
  ].join(" ");
}

export function EdgeLight() {
  const [on, setOn] = useState(false);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const svgRef = useRef<SVGSVGElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fullScreen()) return;
    const t = window.setTimeout(() => setOn(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  // window.innerHeight can be read before iOS settles the status bar, leaving the outline
  // short of the bottom. The frame is sized by CSS to the whole screen (100lvh) and the
  // outline follows whatever size it really ends up with.
  useEffect(() => {
    const frame = frameRef.current;
    if (!on || !frame) return;
    const size = () => {
      const r = frame.getBoundingClientRect();
      setBox((b) => (b.w === r.width && b.h === r.height ? b : { w: r.width, h: r.height }));
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(frame);
    window.addEventListener("pageshow", size);
    window.addEventListener("orientationchange", size);
    return () => {
      ro.disconnect();
      window.removeEventListener("pageshow", size);
      window.removeEventListener("orientationchange", size);
    };
  }, [on]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!on || !svg || !box.w) return;
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>("[data-edge]"));
    const halo = paths[0];
    const line = paths[1];
    const stops = Array.from(svg.querySelectorAll<SVGStopElement>("[data-stop]"));
    const fade = svg.querySelector<SVGLinearGradientElement>("#edgeFade")!;
    const len = line.getTotalLength();
    const calm = reduced();
    let loop: gsap.core.Tween | null = null;

    const paint = (colors: string[]) => stops.forEach((s, k) => s.setAttribute("stop-color", colors[k % colors.length]));
    const accent = () => getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#d9b779";
    const reset = () => {
      loop?.kill();
      loop = null;
      gsap.killTweensOf([...paths, fade]);
      // at rest the mask lets the whole outline through
      gsap.set(fade, { attr: { y1: -1, y2: -2 } });
    };

    /** a comet running round the screen */
    const comet = (seg: number, lap: number, colors: string[]) => {
      reset();
      paint(colors);
      gsap.set(paths, { attr: { "stroke-dasharray": `${seg} ${len - seg}`, "stroke-dashoffset": 0 } });
      gsap.to(paths, { opacity: 1, duration: 0.6 });
      if (calm) return;
      loop = gsap.to(paths, { attr: { "stroke-dashoffset": -len }, duration: lap, ease: "none", repeat: -1 });
    };

    live = {
      orbit(speed) {
        const t = motion.tempo();
        comet(speed === "fast" ? len * 0.32 : len * 0.18, (speed === "fast" ? 1.1 : 5.5) * t, [accent(), accent(), "#fff4d6", accent()]);
      },
      burst(color) {
        reset();
        paint([color ?? accent(), "#fff4d6", color ?? accent(), color ?? accent()]);
        gsap.set(paths, { attr: { "stroke-dasharray": "none" } });
        gsap.fromTo(paths, { opacity: 1 }, { opacity: 0, duration: 1.8 * motion.tempo(), ease: "power2.in", delay: 0.15 });
        gsap.fromTo(halo, { attr: { "stroke-width": 26 } }, { attr: { "stroke-width": 10 }, duration: 1.2, ease: "power2.out" });
      },
      rise() {
        reset();
        paint([accent(), accent(), "#fff4d6", accent()]);
        gsap.set(paths, { attr: { "stroke-dasharray": "none" }, opacity: 1 });
        // the light climbs the sides from the bottom, then lets go
        gsap
          .timeline()
          .fromTo(fade, { attr: { y1: 1.2, y2: 1 } }, { attr: { y1: 0.2, y2: -0.1 }, duration: 1.4 * motion.tempo(), ease: "power2.out" })
          .to(paths, { opacity: 0, duration: 0.9, ease: "power1.in" }, "-=0.3");
      },
      jester() {
        comet(len * 0.5, 0.9, JESTER);
        gsap.delayedCall(2.6, () => {
          loop?.kill();
          gsap.to(paths, { opacity: 0, duration: 0.6 });
        });
      },
      gold() {
        reset();
        paint(["#fff1c2", "#e0b54a", "#a77a22", "#f3d27a"]);
        // fine golden stitches all round, shimmering as they slide
        gsap.set(paths, { attr: { "stroke-dasharray": "2 9", "stroke-dashoffset": 0 } });
        gsap.fromTo(paths, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        if (!calm) loop = gsap.to(paths, { attr: { "stroke-dashoffset": -110 }, duration: 3, ease: "none", repeat: 1 });
        gsap.to(paths, { opacity: 0, duration: 1.2, delay: 5.2 });
      },
      stop() {
        loop?.kill();
        loop = null;
        gsap.to(paths, { opacity: 0, duration: 0.8 });
      },
    };
    return () => {
      reset();
      live = null;
    };
  }, [on, box]);

  if (!on) return null;
  // the screen's own corners: a little over a tenth of its width on recent iPhones
  const r = Math.min(56, box.w * 0.125);
  const d = outline(box.w, box.h, r, 1.5);
  return (
    <div ref={frameRef} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[60] h-lvh w-full">
    {box.w > 0 && (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      width={box.w}
      height={box.h}
      viewBox={`0 0 ${box.w} ${box.h}`}
      fill="none"
    >
      <defs>
        <linearGradient id="edgeColor" x1="0" y1="0" x2="1" y2="1">
          {[0, 0.35, 0.65, 1].map((o) => (
            <stop key={o} data-stop offset={o} stopColor="#d9b779" />
          ))}
        </linearGradient>
        {/* lets the light show only below a line that can climb the screen */}
        <linearGradient id="edgeFade" x1="0" y1="-1" x2="0" y2="-2">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.25" stopColor="#fff" />
          <stop offset="0.5" stopColor="#000" />
        </linearGradient>
        <mask id="edgeMask" maskUnits="userSpaceOnUse">
          <rect width={box.w} height={box.h} fill="url(#edgeFade)" />
        </mask>
      </defs>
      <g mask="url(#edgeMask)">
        <path data-edge d={d} stroke="url(#edgeColor)" strokeWidth={10} strokeLinecap="round" opacity={0} style={{ strokeOpacity: 0.28 }} />
        <path data-edge d={d} stroke="url(#edgeColor)" strokeWidth={2.2} strokeLinecap="round" opacity={0} />
      </g>
    </svg>
    )}
    </div>
  );
}
