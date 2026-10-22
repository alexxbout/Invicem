"use client";

import { useEffect, useId, useRef, useState } from "react";
import { reduced } from "@/lib/feel";

/** a rounded rectangle as a path, starting at the top-left straight edge, clockwise */
function roundedRect(w: number, h: number, r: number, inset: number) {
  const x0 = inset;
  const y0 = inset;
  const x1 = w - inset;
  const y1 = h - inset;
  return [
    `M${x0 + r} ${y0}`,
    `H${x1 - r}`,
    `A${r} ${r} 0 0 1 ${x1} ${y0 + r}`,
    `V${y1 - r}`,
    `A${r} ${r} 0 0 1 ${x1 - r} ${y1}`,
    `H${x0 + r}`,
    `A${r} ${r} 0 0 1 ${x0} ${y1 - r}`,
    `V${y0 + r}`,
    `A${r} ${r} 0 0 1 ${x0 + r} ${y0}`,
    "Z",
  ].join(" ");
}

/** a spark with a fading tail, running along `path` once every `dur` seconds */
function Spark({ path, dur, offset, glow }: { path: string; dur: number; offset: number; glow: string }) {
  return (
    <g>
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} r={i === 0 ? 1.8 : 1.6 - i * 0.18} fill={i === 0 ? "#fff8e1" : "#f3d27a"} opacity={i === 0 ? 1 : 0.75 - i * 0.1}>
          {/* each trailing mote starts a hair later, so it follows the head */}
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} begin={`${-offset + i * 0.035}s`} />
        </circle>
      ))}
      <circle r="7" fill="#f3d27a" opacity=".35" filter={`url(#${glow})`}>
        <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={path} begin={`${-offset}s`} />
      </circle>
    </g>
  );
}

/**
 * Two tiny sparks running round the gilded frame, in opposite halves of the loop, each
 * trailing a few motes of light. The path follows the frame's real size.
 */
export function FrameSpark({ radius = 22 }: { radius?: number }) {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const glow = `spark${useId().replace(/:/g, "")}`;

  useEffect(() => {
    if (reduced()) return;
    const el = ref.current!;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const path = size ? roundedRect(size.w, size.h, radius, 1) : null;
  // a lap takes longer on a longer frame, so the spark keeps the same pace
  const dur = size ? (size.w + size.h) / 90 : 0;

  return (
    <svg ref={ref} className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
      <defs>
        <filter id={glow} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      {path && (
        <>
          <Spark path={path} dur={dur} offset={0} glow={glow} />
          <Spark path={path} dur={dur} offset={dur / 2} glow={glow} />
        </>
      )}
    </svg>
  );
}
