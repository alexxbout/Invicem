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
const SKIN = "#f5ecdf";

/** joints, in the drawing's own coordinates; every part turns around its own joint */
const JOINT = {
  head: "100 90",
  "tail-l": "88 60",
  "tail-c": "97 58",
  "tail-r": "112 60",
  "l-shoulder": "85 101",
  "l-elbow": "66 105",
  marotte: "56 88",
  "r-shoulder": "115 101",
  "r-elbow": "136 113",
  "stand-hip": "95 146",
  "stand-knee": "82 182",
  "kick-hip": "106 146",
  "kick-knee": "134 170",
  floor: "112 224",
} as const;

/**
 * One beat of the dance, as rotations (deg) per joint plus the body's rise and lean.
 * The idle sway plays a softened version of the same beat.
 */
const BEAT: Record<string, number> = {
  head: 7,
  "l-shoulder": -16,
  "l-elbow": 20,
  marotte: 18,
  "r-shoulder": 12,
  "r-elbow": -18,
  "stand-hip": 7,
  "stand-knee": -16,
  "kick-hip": -20,
  "kick-knee": 28,
  "tail-l": 10,
  "tail-c": -9,
  "tail-r": 11,
};

/** a limb segment drawn as an inked tube, with shade and an optional gold trim */
function Seg({ d, color, w, trim }: { d: string; color: string; w: number; trim?: boolean }) {
  return (
    <>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 3} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path d={d} fill="none" stroke="rgba(0,0,0,.28)" strokeWidth={w * 0.35} strokeLinecap="round" transform="translate(1.6 1.2)" />
      {trim && <path d={d} fill="none" stroke={GOLD} strokeWidth={2.4} strokeDasharray="0.1 6" strokeLinecap="round" />}
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
 * The classic joker in full figure, inked over flat colour, articulated at hips, knees,
 * shoulders, elbows and wrist so the dance bends rather than swings. A painted face with
 * a harlequin diamond over one eye, arched brows and a sly half smile.
 */
export function JesterFigure({ mood = "idle", className }: { mood?: DanceMood; className?: string }) {
  const root = useRef<SVGSVGElement>(null);
  const uid = useId().replace(/:/g, "");
  const harl = `harl${uid}`;
  const torsoClip = `torso${uid}`;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // pin every part to its joint in drawing coordinates, so limbs stay attached
      Object.entries(JOINT).forEach(([k, origin]) => gsap.set(`[data-j="${k}"]`, { svgOrigin: origin }));
      gsap.utils.toArray<SVGGElement>("[data-tassel]").forEach((el) => gsap.set(el, { svgOrigin: el.dataset.origin }));

      const play = mood === "play";
      const amp = play ? 1 : 0.35;
      const beat = play ? 0.26 : 1.3;
      const tl = gsap.timeline({ repeat: play ? 5 : -1, yoyo: true, defaults: { duration: beat, ease: "sine.inOut" } });
      tl.fromTo("[data-j=body]", { y: 0, rotation: -2 * amp }, { y: -7 * amp, rotation: 2 * amp, svgOrigin: "100 146" }, 0);
      tl.fromTo("[data-j=floor]", { scaleX: 1, opacity: 0.3 }, { scaleX: 1 - 0.2 * amp, opacity: 0.18 }, 0);
      Object.entries(BEAT).forEach(([k, deg]) => {
        // the head and the cap tails lag a little behind the body, which reads as weight
        const lag = k === "head" ? 0.08 : k.startsWith("tail") ? 0.14 : 0;
        tl.fromTo(`[data-j="${k}"]`, { rotation: -deg * amp * 0.35 }, { rotation: deg * amp }, lag * beat);
      });
      tl.fromTo("[data-tassel]", { rotation: -10 * amp }, { rotation: 10 * amp, stagger: 0.05 }, 0);
    }, root);
    return () => ctx.revert();
  }, [mood]);

  const s = { stroke: INK, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

  return (
    <svg ref={root} viewBox="30 8 164 222" className={className} aria-hidden>
      <defs>
        <pattern id={harl} width="9" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(-6)">
          <rect width="9" height="13" fill={VIOLET} />
          <path d="M4.5 0L9 6.5 4.5 13 0 6.5z" fill={RED} />
          <path d="M4.5 0L9 6.5 4.5 13 0 6.5z" fill="none" stroke={GOLD} strokeWidth=".5" />
        </pattern>
        <clipPath id={torsoClip}>
          <path d="M83 98Q92 103 100 103Q108 103 117 98L113 144Q100 149 87 144Z" />
        </clipPath>
      </defs>

      <ellipse data-j="floor" cx="112" cy="224" rx="44" ry="4.5" fill={INK} opacity=".3" />

      <g data-j="body">
        {/* standing leg */}
        <g data-j="stand-hip">
          <Seg d="M95 146L82 182" color={RED} w={14} trim />
          <g data-j="stand-knee">
            <Seg d="M82 182L90 214" color={RED} w={13} trim />
            <path d="M79 212c7 7 20 8 30 2 4-3 6-8 2-10-3-1-6 2-3 4" fill={VIOLET} {...s} strokeWidth="1.8" />
            <path d="M84 215c7 2 14 2 20-1" fill="none" stroke={GOLD} strokeWidth="1.2" />
            <Bell x={107} y={206} r={2.6} />
          </g>
          <ellipse cx="82.5" cy="181" rx="9" ry="4.5" transform="rotate(-20 82.5 181)" fill={GOLD} {...s} strokeWidth="1.4" />
          <path d="M77 181l2 4M82 182l1 4.5M87 180l1 4" stroke={GOLD_DARK} strokeWidth=".8" />
          <Bell x={80} y={189} r={2.2} />
        </g>

        {/* kicking leg */}
        <g data-j="kick-hip">
          <Seg d="M106 146L134 170" color={VIOLET} w={14} trim />
          <g data-j="kick-knee">
            <Seg d="M134 170L163 158" color={VIOLET} w={13} trim />
            <path d="M159 151c9-3 18 0 22 7 1 4-3 7-7 4-2-2 0-5 3-3" fill={RED} {...s} strokeWidth="1.8" />
            <path d="M162 156c5-1 10 0 14 3" fill="none" stroke={GOLD} strokeWidth="1.2" />
            <Bell x={178} y={162} r={2.6} />
          </g>
          <ellipse cx="134" cy="169.5" rx="9" ry="4.5" transform="rotate(55 134 169.5)" fill={GOLD} {...s} strokeWidth="1.4" />
          <Bell x={140} y={177} r={2.2} />
        </g>

        {/* doublet */}
        <path d="M83 98Q92 103 100 103Q108 103 117 98L113 144Q100 149 87 144Z" fill={`url(#${harl})`} {...s} strokeWidth="1.8" />
        <g clipPath={`url(#${torsoClip})`}>
          <path d="M104 100L120 100 116 150 104 150Z" fill="rgba(0,0,0,.24)" />
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <path key={i} d={`M${106 + (i % 2)} ${104 + i * 6}l7 -4`} stroke={INK} strokeWidth=".55" opacity=".55" />
          ))}
        </g>
        <path d="M97 103h6v41h-6z" fill={GOLD} {...s} strokeWidth="1.1" />
        {[109, 117, 125, 133].map((y) => (
          <circle key={y} cx="100" cy={y} r="1.7" fill={RED} stroke={INK} strokeWidth=".8" />
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
          <g key={i} data-tassel data-origin={`${x} ${y}`}>
            <path d={`M${x} ${y}v7`} stroke={INK} strokeWidth="1" />
            <Bell x={x} y={y + 9} r={2.2} />
          </g>
        ))}

        {/* arm raising the marotte */}
        <g data-j="l-shoulder">
          <Seg d="M84 103L66 105" color={VIOLET} w={10} />
          <g data-j="l-elbow">
            <g data-j="marotte">
              <path d="M44 170L58 64" stroke={INK} strokeWidth="5.4" strokeLinecap="round" />
              <path d="M44 170L58 64" stroke={GOLD} strokeWidth="3" strokeLinecap="round" />
              <path d="M44 170L58 64" stroke={RED} strokeWidth="3" strokeDasharray="3 4" strokeLinecap="round" />
              <circle cx="43.6" cy="172" r="3" fill={GOLD} {...s} strokeWidth="1.2" />
              <polygon points={ruff(59, 64, 5, 9, 7, Math.PI * 0.05, Math.PI * 0.9)} fill={GOLD} {...s} strokeWidth="1" />
              <circle cx="59" cy="56" r="7" fill={SKIN} {...s} strokeWidth="1.5" />
              <path d="M51 53c-2-6 0-10 2-11 2 1 4 4 5 9M53 51c2-7 5-11 7-12 2 1 5 5 6 12M60 51c3-5 7-7 10-6 0 3-2 6-5 8" fill={RED} {...s} strokeWidth="1.2" />
              <Bell x={52} y={41} r={1.8} />
              <Bell x={61} y={38} r={1.8} />
              <Bell x={70} y={45} r={1.8} />
              <path d="M55 55.5l2.4 1M63 55.5l-2.4 1M55.6 60q3.4 1.8 6.6-.6" stroke={INK} strokeWidth="1" fill="none" strokeLinecap="round" />
            </g>
            <Seg d="M66 105L57 89" color={VIOLET} w={10} />
            <polygon points={ruff(57.5, 90.5, 4, 7.5, 7)} fill={GOLD} {...s} strokeWidth="1" />
            <circle cx="56" cy="86" r="5" fill={SKIN} {...s} strokeWidth="1.5" />
            <path d="M53 83.5q2 1.5 4 0M54.5 88q1.5 1 3 0" stroke={INK} strokeWidth=".7" fill="none" />
          </g>
          <ellipse cx="85" cy="101" rx="8.5" ry="7" fill={VIOLET} {...s} strokeWidth="1.6" />
          <path d="M80 97l2 8M85 95v12M90 97l-2 8" stroke={RED} strokeWidth="1.6" />
        </g>

        {/* arm holding a fan of cards */}
        <g data-j="r-shoulder">
          <Seg d="M116 103L136 113" color={RED} w={10} />
          <g data-j="r-elbow">
            <g transform="translate(152 86)">
              {[-30, -12, 6].map((a, i) => (
                <g key={i} transform={`rotate(${a})`}>
                  <rect x="-7" y="-23" width="15" height="21" rx="1.8" fill={SKIN} {...s} strokeWidth="1.2" />
                  <rect x="-5.2" y="-21.2" width="11.4" height="17.4" rx="1" fill="none" stroke={i === 1 ? RED : INK} strokeWidth=".5" />
                  {i === 2 ? (
                    <text x="0.5" y="-9" textAnchor="middle" fontSize="8" fontFamily="Georgia, serif" fill={RED}>
                      A
                    </text>
                  ) : (
                    <path d={i === 1 ? "M0.5-16l3 4.2-3 4.2-3-4.2z" : "M0.5-17c-3.6 2.4-3.6 6 0 8.4 3.6-2.4 3.6-6 0-8.4z"} fill={i === 1 ? RED : INK} />
                  )}
                </g>
              ))}
            </g>
            <Seg d="M136 113L148 96" color={RED} w={10} />
            <polygon points={ruff(147.5, 97.5, 4, 7.5, 7)} fill={GOLD} {...s} strokeWidth="1" />
            <circle cx="149" cy="93" r="5" fill={SKIN} {...s} strokeWidth="1.5" />
          </g>
          <ellipse cx="115" cy="101" rx="8.5" ry="7" fill={RED} {...s} strokeWidth="1.6" />
          <path d="M110 97l2 8M115 95v12M120 97l-2 8" stroke={VIOLET} strokeWidth="1.6" />
        </g>

        {/* two-tier ruff, bells on the points */}
        <polygon points={ruff(100, 94, 9, 19, 11, Math.PI * 0.02, Math.PI * 0.96)} fill={RED} {...s} strokeWidth="1.5" />
        <polygon points={ruff(100, 94, 7, 14, 9, Math.PI * 0.06, Math.PI * 0.88)} fill={GOLD} {...s} strokeWidth="1.4" />
        {[0.15, 0.32, 0.5, 0.68, 0.85].map((t) => {
          const a = Math.PI * (0.06 + 0.88 * t);
          return <Bell key={t} x={100 + Math.cos(a) * 15.5} y={94 + Math.sin(a) * 15.5} r={1.7} />;
        })}

        {/* head and cap */}
        <g data-j="head">
          <g data-j="tail-l">
            <path d="M90 60C80 44 64 38 52 46c-4 3-5 9-3 15 3-7 8-9 14-8 10 2 16 6 22 10z" fill={RED} {...s} strokeWidth="1.8" />
            <path d="M86 57C77 47 66 43 56 48" fill="none" stroke={RED_DARK} strokeWidth="3" />
            <path d="M80 50l-3 6M72 46l-1 7M64 45l1 6" stroke={GOLD} strokeWidth="1.4" />
            <Bell x={48} y={63} />
          </g>
          <g data-j="tail-r">
            <path d="M110 60c10-16 26-22 38-14 4 3 5 9 3 15-3-7-8-9-14-8-10 2-16 6-22 10z" fill={VIOLET} {...s} strokeWidth="1.8" />
            <path d="M114 57c9-10 20-14 30-9" fill="none" stroke={VIOLET_DARK} strokeWidth="3" />
            <path d="M120 50l3 6M128 46l1 7M136 45l-1 6" stroke={GOLD} strokeWidth="1.4" />
            <Bell x={152} y={63} />
          </g>
          <g data-j="tail-c">
            <path d="M93 58c-2-18 4-32 18-38 6-2 12 1 13 6-6-3-11 0-14 5-4 8-5 17-5 27z" fill={GOLD} {...s} strokeWidth="1.8" />
            <path d="M97 54c0-14 4-24 12-29" fill="none" stroke={GOLD_DARK} strokeWidth="2.6" />
            <path d="M95 45l6 1M97 35l6 2M102 27l5 3" stroke={RED} strokeWidth="1.4" />
            <Bell x={125} y={27} />
          </g>
          <path d="M83 62Q100 53 117 62L115 70Q100 62 85 70Z" fill={RED} {...s} strokeWidth="1.6" />
          <path d="M86 64.5Q100 57 114 64.5" fill="none" stroke={GOLD} strokeWidth=".9" />
          {[89, 94.5, 100, 105.5, 111].map((x, i) => (
            <path key={x} d={`M${x} ${64.6 - (i === 2 ? 2 : i % 4 === 0 ? 0 : 1.2)}l1.8-1.8 1.8 1.8-1.8 1.8z`} fill={GOLD} stroke={INK} strokeWidth=".4" />
          ))}

          {/* painted face: angular, pointed chin */}
          <path d="M86.5 67.5C85.2 77 88.5 86 100 94c11.5-8 14.8-17 13.5-26.5-8.6-4.4-18.4-4.4-27 0z" fill={SKIN} {...s} strokeWidth="1.8" />
          {/* shade along the right of the face and under the cheekbones */}
          <path d="M108.8 69.5c2.6 8 .4 15.6-6 21.6 6.4-3.4 9.6-9 10.4-15.6.2-2.2 0-4.2-.6-6z" fill="rgba(90,60,40,.22)" />
          <path d="M88.6 80.5q3.2 2.6 7.2 2.2M111.2 80.5q-3.2 2.6-7.2 2.2" fill="none" stroke="rgba(90,60,40,.45)" strokeWidth=".7" />
          {/* harlequin diamond painted over the left eye */}
          <path d="M93.4 68.6l5 8.2-5 8.4-5-8.4z" fill={INK} opacity=".88" />
          <path d="M93.4 70.4l3.8 6.4-3.8 6.6-3.8-6.6z" fill="none" stroke={GOLD} strokeWidth=".45" />
          {/* brows: sharp, one arched higher */}
          <path d="M87.6 72.4c2.8-3 7.2-4 10.6-2.4-3.2-.2-6.6.8-10.6 2.4z" fill={INK} />
          <path d="M101.6 69.6c3.4-2.8 8.2-3 11-.4-3.4-.8-7 -.4-11 .4z" fill={INK} />
          {/* narrow eyes under heavy lids */}
          <path d="M90.4 77.2q3-2.2 6 0q-3 1.6-6 0z" fill="#fff" stroke={GOLD} strokeWidth=".4" />
          <path d="M103.6 76.6q3-2.2 6 0q-3 1.6-6 0z" fill="#fff" stroke={INK} strokeWidth=".5" />
          <circle cx="93.6" cy="77" r="1.1" fill={RED_DARK} />
          <circle cx="106.8" cy="76.4" r="1.1" fill={INK} />
          <circle cx="94" cy="76.6" r=".3" fill="#fff" />
          <circle cx="107.2" cy="76" r=".3" fill="#fff" />
          <path d="M90 76.6q3.4-3 7 0M103.2 76q3.4-3 7 0" fill="none" stroke={INK} strokeWidth="1.3" />
          <path d="M104 74.2q2.6-1.2 5.4.2" fill="none" stroke={INK} strokeWidth=".4" opacity=".6" />
          {/* long nose */}
          <path d="M100.6 75.5l-2.4 8.6q2 1.2 4.2 .2" fill="none" stroke={INK} strokeWidth="1" />
          {/* sly half smile, rising on one side */}
          <path d="M93.4 86.6q5.6 1.4 13-2.6q-6.4 5.6-13 2.6z" fill={RED} stroke={INK} strokeWidth=".9" />
          <path d="M94.6 86.8q5.4.6 11-2.2" fill="none" stroke="#fff" strokeWidth=".5" opacity=".75" />
          <path d="M106.4 84l1.8-1.6M92.6 86.2l-1.2.6" fill="none" stroke={INK} strokeWidth=".8" />
          {/* red tear and a beauty mark */}
          <path d="M107.2 80.4q1.8 2.6 0 4q-1.8-1.4 0-4z" fill={RED} stroke={INK} strokeWidth=".35" />
          <circle cx="96.6" cy="89.4" r=".55" fill={INK} />
          <path d="M98.4 91.6q1.6.8 3.2 0" fill="none" stroke="rgba(90,60,40,.5)" strokeWidth=".6" />
        </g>
      </g>
    </svg>
  );
}
