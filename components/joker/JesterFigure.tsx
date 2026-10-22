"use client";

import gsap from "gsap";
import { useEffect, useId, useRef } from "react";

export type DanceMood = "idle" | "play";

const INK = "#1b1020";
const VIOLET = "#4b1f73";
const VIOLET_DARK = "#2e1048";
const RED = "#b3243a";
const RED_DARK = "#7a1426";
const GOLD = "#e0b54a";
const GOLD_DARK = "#a77a22";
const SKIN = "#f7efe2";

/** a limb drawn as an inked tube, with a gold pattern running along it */
function Limb({ d, color, w, trim }: { d: string; color: string; w: number; trim?: string }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 3} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      {/* shade along one side */}
      <path d={d} fill="none" stroke="rgba(0,0,0,.28)" strokeWidth={w * 0.35} strokeLinecap="round" strokeLinejoin="round" transform="translate(1.6 1.2)" />
      {trim && <path d={d} fill="none" stroke={trim} strokeWidth={2.6} strokeDasharray="0.1 6" strokeLinecap="round" strokeLinejoin="round" />}
    </>
  );
}

function Bell({ x, y, r = 3.2 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={GOLD} stroke={INK} strokeWidth="1.2" />
      <circle cx={x - r * 0.35} cy={y - r * 0.35} r={r * 0.28} fill="#fff6d8" />
      <path d={`M${x - r * 0.55} ${y + r * 0.25}h${r * 1.1}`} stroke={INK} strokeWidth=".9" />
    </g>
  );
}

/** a zigzag ruff around a point, used for the collar, cuffs and the marotte */
function ruff(cx: number, cy: number, r1: number, r2: number, n: number, start = 0, span = Math.PI * 2) {
  const pts: string[] = [];
  for (let i = 0; i <= n * 2; i++) {
    const a = start + (span * i) / (n * 2);
    const r = i % 2 ? r1 : r2;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return pts.join(" ");
}

/**
 * The classic joker in full figure, inked over flat colour with ornament everywhere:
 * slashed puffed sleeves, a two-tier ruff hung with bells, a harlequin doublet, gartered
 * hose, curled shoes, a marotte with its own little jester, a fan of cards.
 * Idle he sways to a slow beat; played he breaks into a jig.
 */
export function JesterFigure({ mood = "idle", ink = INK, className }: { mood?: DanceMood; ink?: string; className?: string }) {
  const root = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const harl = `harl${uid}`;
  const harl2 = `harlb${uid}`;
  const torsoClip = `torso${uid}`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      const fast = mood === "play";
      const beat = fast ? 0.22 : 1.1;
      const reps = fast ? 11 : -1;
      const ease = "sine.inOut";
      const swing = (sel: string, a: number, b: number, k = 1) =>
        gsap.fromTo(sel, { rotation: a }, { rotation: b, duration: beat * k, yoyo: true, repeat: reps, ease });
      gsap.fromTo("[data-body]", { y: 0 }, { y: fast ? -7 : -3, duration: beat, yoyo: true, repeat: reps, ease });
      gsap.fromTo("[data-floor]", { scaleX: 1, opacity: 0.3 }, { scaleX: fast ? 0.8 : 0.92, opacity: 0.2, duration: beat, yoyo: true, repeat: reps, ease });
      swing("[data-head]", -4, 5, 1.3);
      swing("[data-arm=l]", -6, fast ? 16 : 7);
      swing("[data-arm=r]", 4, fast ? -12 : -4, 1.2);
      swing("[data-leg=kick]", -4, fast ? 18 : 6);
      swing("[data-leg=stand]", 2, fast ? -6 : -2);
      swing("[data-mini]", -10, 10, 0.8);
      ["l", "c", "r"].forEach((k, i) => swing(`[data-tail=${k}]`, -4 + i, (fast ? 10 : 4) * (i === 1 ? -1 : 1), 1 + i * 0.2));
      gsap.fromTo("[data-tassel]", { rotation: -8 }, { rotation: 8, duration: beat * 0.7, yoyo: true, repeat: reps, ease, stagger: 0.1 });
    }, root);
    return () => ctx.revert();
  }, [mood]);

  const o = (x: number, y: number) => ({ transformOrigin: `${x}px ${y}px` });
  const s = { stroke: ink, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  return (
    <svg ref={root} viewBox="30 8 164 222" className={className} aria-hidden>
      <defs>
        <pattern id={harl} width="9" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
          <rect width="9" height="13" fill={VIOLET} />
          <path d="M4.5 0L9 6.5 4.5 13 0 6.5z" fill={RED} />
          <path d="M4.5 0L9 6.5 4.5 13 0 6.5z" fill="none" stroke={GOLD} strokeWidth=".5" />
        </pattern>
        <pattern id={harl2} width="7" height="10" patternUnits="userSpaceOnUse">
          <rect width="7" height="10" fill={RED} />
          <path d="M3.5 0L7 5 3.5 10 0 5z" fill={RED_DARK} />
        </pattern>
        <clipPath id={torsoClip}>
          <path d="M83 98Q92 103 100 103Q108 103 117 98L113 144Q100 149 87 144Z" />
        </clipPath>
      </defs>

      <ellipse data-floor cx="112" cy="224" rx="44" ry="4.5" fill={ink} opacity=".3" style={o(112, 224)} />

      <g data-body>
        {/* standing leg: red hose, gold garter, curled violet shoe */}
        <g data-leg="stand" style={o(95, 146)}>
          <Limb d="M95 146 L82 182 L90 214" color={RED} w={14} trim={GOLD} />
          <ellipse cx="82.5" cy="181" rx="9" ry="4.5" transform="rotate(-20 82.5 181)" fill={GOLD} {...s} strokeWidth="1.4" />
          <path d="M77 181l2 4M82 182l1 4.5M87 180l1 4" stroke={GOLD_DARK} strokeWidth=".8" />
          <Bell x={80} y={189} r={2.2} />
          <path d="M79 212c7 7 20 8 30 2 4-3 6-8 2-10-3-1-6 2-3 4" fill={VIOLET} {...s} strokeWidth="1.8" />
          <path d="M84 215c7 2 14 2 20-1" fill="none" stroke={GOLD} strokeWidth="1.2" />
          <Bell x={107} y={206} r={2.6} />
        </g>

        {/* kicking leg: violet hose, garter, curled red shoe */}
        <g data-leg="kick" style={o(106, 146)}>
          <Limb d="M106 146 L134 170 L163 158" color={VIOLET} w={14} trim={GOLD} />
          <ellipse cx="134" cy="169.5" rx="9" ry="4.5" transform="rotate(55 134 169.5)" fill={GOLD} {...s} strokeWidth="1.4" />
          <Bell x={140} y={177} r={2.2} />
          <path d="M159 151c9-3 18 0 22 7 1 4-3 7-7 4-2-2 0-5 3-3" fill={RED} {...s} strokeWidth="1.8" />
          <path d="M162 156c5-1 10 0 14 3" fill="none" stroke={GOLD} strokeWidth="1.2" />
          <Bell x={178} y={162} r={2.6} />
        </g>

        {/* doublet: harlequin diamonds, placket, shading, belt with buckle and bell tassels */}
        <path d="M83 98Q92 103 100 103Q108 103 117 98L113 144Q100 149 87 144Z" fill={`url(#${harl})`} {...s} strokeWidth="1.8" />
        <g clipPath={`url(#${torsoClip})`}>
          <path d="M104 100L120 100 116 150 104 150Z" fill="rgba(0,0,0,.22)" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${106 + (i % 2)} ${104 + i * 6}l7 -4`} stroke={ink} strokeWidth=".55" opacity=".55" />
          ))}
        </g>
        <path d="M97 103h6v41h-6z" fill={GOLD} {...s} strokeWidth="1.1" />
        {[109, 117, 125, 133].map((y) => (
          <g key={y}>
            <circle cx="100" cy={y} r="1.7" fill={RED} stroke={ink} strokeWidth=".8" />
          </g>
        ))}
        <path d="M86 140Q100 146 114 140L113.5 148Q100 153 86.5 148Z" fill={GOLD} {...s} strokeWidth="1.6" />
        <path d="M88 143.5Q100 148.5 112 143.5" fill="none" stroke={GOLD_DARK} strokeWidth=".9" />
        <rect x="95.5" y="142.5" width="9" height="7.5" rx="1" fill={RED} {...s} strokeWidth="1.2" />
        <rect x="97.6" y="144.4" width="4.8" height="3.7" rx=".6" fill="none" stroke={GOLD} strokeWidth="1" />
        {[
          [90, 149],
          [100, 152],
          [110, 149],
        ].map(([x, y], i) => (
          <g key={i} data-tassel style={o(x, y)}>
            <path d={`M${x} ${y}v7`} stroke={ink} strokeWidth="1" />
            <Bell x={x} y={y + 9} r={2.2} />
          </g>
        ))}

        {/* arm raising the marotte */}
        <g data-arm="l" style={o(86, 101)}>
          <g data-mini style={o(52, 160)}>
            <path d="M44 170L58 64" stroke={ink} strokeWidth="5.4" strokeLinecap="round" />
            <path d="M44 170L58 64" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
            <path d="M44 170L58 64" stroke={RED} strokeWidth="3" strokeDasharray="3 4" strokeLinecap="round" />
            <circle cx="43.6" cy="172" r="3" fill={GOLD} {...s} strokeWidth="1.2" />
            <polygon points={ruff(59, 64, 5, 9, 7, Math.PI * 0.05, Math.PI * 0.9)} fill={GOLD} {...s} strokeWidth="1" />
            <circle cx="59" cy="56" r="7" fill={SKIN} {...s} strokeWidth="1.5" />
            <path d="M51 53c-2-6 0-10 2-11 2 1 4 4 5 9M53 51c2-7 5-11 7-12 2 1 5 5 6 12M60 51c3-5 7-7 10-6 0 3-2 6-5 8" fill={RED} {...s} strokeWidth="1.2" />
            <Bell x={52} y={41} r={1.8} />
            <Bell x={61} y={38} r={1.8} />
            <Bell x={70} y={45} r={1.8} />
            <path d="M55.5 56.5q1-1 2 0M60.5 56.5q1-1 2 0M56 60q3 2.4 6 0" stroke={ink} strokeWidth="1" fill="none" strokeLinecap="round" />
            <circle cx="55" cy="59" r="1" fill={RED} opacity=".6" />
            <circle cx="63" cy="59" r="1" fill={RED} opacity=".6" />
          </g>
          <ellipse cx="85" cy="101" rx="8.5" ry="7" fill={VIOLET} {...s} strokeWidth="1.6" />
          <path d="M80 97l2 8M85 95v12M90 97l-2 8" stroke={RED} strokeWidth="1.6" />
          <Limb d="M84 103 L66 105 L57 89" color={VIOLET} w={10} />
          <polygon points={ruff(57.5, 90.5, 4, 7.5, 7)} fill={GOLD} {...s} strokeWidth="1" />
          <circle cx="56" cy="86" r="5" fill={SKIN} {...s} strokeWidth="1.5" />
          <path d="M53 83.5q2 1.5 4 0M54.5 88q1.5 1 3 0" stroke={ink} strokeWidth=".7" fill="none" />
        </g>

        {/* arm holding a fan of cards */}
        <g data-arm="r" style={o(114, 101)}>
          <g transform="translate(152 86)">
            {[-30, -12, 6].map((a, i) => (
              <g key={i} transform={`rotate(${a})`}>
                <rect x="-7" y="-23" width="15" height="21" rx="1.8" fill={SKIN} {...s} strokeWidth="1.2" />
                <rect x="-5.2" y="-21.2" width="11.4" height="17.4" rx="1" fill="none" stroke={i === 1 ? RED : ink} strokeWidth=".5" />
                {i === 2 ? (
                  <text x="0.5" y="-9" textAnchor="middle" fontSize="8" fontFamily="Georgia, serif" fill={RED}>
                    A
                  </text>
                ) : (
                  <path
                    d={i === 1 ? "M0.5-16l3 4.2-3 4.2-3-4.2z" : "M0.5-17c-3.6 2.4-3.6 6 0 8.4 3.6-2.4 3.6-6 0-8.4z"}
                    fill={i === 1 ? RED : ink}
                  />
                )}
              </g>
            ))}
          </g>
          <ellipse cx="115" cy="101" rx="8.5" ry="7" fill={RED} {...s} strokeWidth="1.6" />
          <path d="M110 97l2 8M115 95v12M120 97l-2 8" stroke={VIOLET} strokeWidth="1.6" />
          <Limb d="M116 103 L136 113 L148 96" color={RED} w={10} />
          <polygon points={ruff(147.5, 97.5, 4, 7.5, 7)} fill={GOLD} {...s} strokeWidth="1" />
          <circle cx="149" cy="93" r="5" fill={SKIN} {...s} strokeWidth="1.5" />
        </g>

        {/* two-tier ruff, bells on the points */}
        <polygon points={ruff(100, 94, 9, 19, 11, Math.PI * 0.02, Math.PI * 0.96)} fill={RED} {...s} strokeWidth="1.5" />
        <polygon points={ruff(100, 94, 7, 14, 9, Math.PI * 0.06, Math.PI * 0.88)} fill={GOLD} {...s} strokeWidth="1.4" />
        {[0.15, 0.32, 0.5, 0.68, 0.85].map((t) => {
          const a = Math.PI * (0.06 + 0.88 * t);
          return <Bell key={t} x={100 + Math.cos(a) * 15.5} y={94 + Math.sin(a) * 15.5} r={1.7} />;
        })}

        {/* head and cap */}
        <g data-head style={o(100, 88)}>
          <g data-tail="l" style={o(90, 58)}>
            <path d="M90 60C80 44 64 38 52 46c-4 3-5 9-3 15 3-7 8-9 14-8 10 2 16 6 22 10z" fill={RED} {...s} strokeWidth="1.8" />
            <path d="M86 57C77 47 66 43 56 48" fill="none" stroke={RED_DARK} strokeWidth="3" />
            <path d="M80 50l-3 6M72 46l-1 7M64 45l1 6" stroke={GOLD} strokeWidth="1.4" />
            <Bell x={48} y={63} />
          </g>
          <g data-tail="r" style={o(110, 58)}>
            <path d="M110 60c10-16 26-22 38-14 4 3 5 9 3 15-3-7-8-9-14-8-10 2-16 6-22 10z" fill={VIOLET} {...s} strokeWidth="1.8" />
            <path d="M114 57c9-10 20-14 30-9" fill="none" stroke={VIOLET_DARK} strokeWidth="3" />
            <path d="M120 50l3 6M128 46l1 7M136 45l-1 6" stroke={GOLD} strokeWidth="1.4" />
            <Bell x={152} y={63} />
          </g>
          <g data-tail="c" style={o(100, 56)}>
            <path d="M93 58c-2-18 4-32 18-38 6-2 12 1 13 6-6-3-11 0-14 5-4 8-5 17-5 27z" fill={GOLD} {...s} strokeWidth="1.8" />
            <path d="M97 54c0-14 4-24 12-29" fill="none" stroke={GOLD_DARK} strokeWidth="2.6" />
            <path d="M95 45l6 1M97 35l6 2M102 27l5 3" stroke={RED} strokeWidth="1.4" />
            <Bell x={125} y={27} />
          </g>
          <path d="M83 62Q100 53 117 62L115 70Q100 62 85 70Z" fill={RED} {...s} strokeWidth="1.6" />
          <path d="M86 64.5Q100 57 114 64.5" fill="none" stroke={GOLD} strokeWidth=".9" />
          {[89, 94.5, 100, 105.5, 111].map((x, i) => (
            <path key={x} d={`M${x} ${64.6 - (i === 2 ? 2 : i % 4 === 0 ? 0 : 1.2)}l1.8-1.8 1.8 1.8-1.8 1.8z`} fill={GOLD} stroke={ink} strokeWidth=".4" />
          ))}

          {/* face */}
          <path d="M86.5 68c-1 12 4 21 13.5 24 9.5-3 14.5-12 13.5-24-8.5-4-18.5-4-27 0z" fill={SKIN} {...s} strokeWidth="1.8" />
          <path d="M110 72c1 7-1 13-5 17" fill="none" stroke="rgba(120,80,40,.25)" strokeWidth="3" />
          <path d="M89.5 73.4q4.2-3.4 8.6-.4M101.9 73q4.4-3 8.6.4" fill="none" stroke={ink} strokeWidth="1.3" />
          <path d="M91 76.6q2.6-2 5.2 0q-2.6 1.4-5.2 0zM103.8 76.6q2.6-2 5.2 0q-2.6 1.4-5.2 0z" fill="#fff" stroke={ink} strokeWidth=".8" />
          <circle cx="93.6" cy="76.5" r="1.05" fill={ink} />
          <circle cx="106.4" cy="76.5" r="1.05" fill={ink} />
          <path d="M100 77.5l-1.6 5.4q1.6.8 3 0" fill="none" stroke={ink} strokeWidth="1" />
          <circle cx="91.5" cy="82" r="2.4" fill={RED} opacity=".35" />
          <circle cx="108.5" cy="82" r="2.4" fill={RED} opacity=".35" />
          <path d="M93.5 85.5q6.5 5 13 0q-6.5 1.6-13 0z" fill={RED} stroke={ink} strokeWidth="1" />
          <path d="M95.5 86.3q4.5 1.6 9 0" fill="none" stroke="#fff" strokeWidth=".6" opacity=".7" />
          <path d="M108.6 79.6l1.3-1.7 1.3 1.7-1.3 1.7z" fill={RED} stroke={ink} strokeWidth=".4" />
        </g>
      </g>
    </svg>
  );
}
