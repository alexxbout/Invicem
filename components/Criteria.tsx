"use client";

import type { Criteria as CriteriaValue } from "@/lib/client";
import { DEPTH_LABELS, THEME_GLYPH } from "@/lib/labels";
import { Glyph } from "./Glyph";
import { Depth } from "./Hand";

type DepthKey = 1 | 2 | 3;

/** how far the evening may go; the climb itself is automatic */
const REACH: { max: DepthKey; hint: string }[] = [
  { max: 1, hint: "Faire connaissance" },
  { max: 2, hint: "Parler de soi" },
  { max: 3, hint: "Aller à l'essentiel" },
];

/**
 * Two questions, both one tap: how deep may we go tonight, and what about.
 * Reach maps to depths 1..max; every theme on is stored as an empty list ("all").
 */
export function Criteria({
  value,
  themes,
  matching,
  onChange,
}: {
  value: CriteriaValue;
  themes: string[];
  matching: number;
  /** receives an updater so rapid taps always build on the latest value */
  onChange: (update: (prev: CriteriaValue) => CriteriaValue) => void;
}) {
  const reach = Math.max(...value.depths) as DepthKey;
  const isOn = (t: string) => value.themes.length === 0 || value.themes.includes(t);

  const setReach = (max: DepthKey) =>
    onChange((v) => ({ ...v, depths: ([1, 2, 3] as DepthKey[]).filter((d) => d <= max) }));

  const toggleTheme = (t: string) =>
    onChange((v) => {
      const current = v.themes.length === 0 ? themes : v.themes;
      const next = current.includes(t) ? current.filter((x) => x !== t) : [...current, t];
      // keep at least one theme; every theme on is the same as "all"
      if (next.length === 0) return v;
      return { ...v, themes: next.length === themes.length ? [] : next };
    });

  return (
    <div className="flex w-full flex-col gap-7">
      <section>
        <h2 className="display mb-1 text-center text-[24px] font-light leading-snug">Jusqu&apos;où aller ce soir&nbsp;?</h2>
        <p className="mb-4 text-center text-[13px] text-paper/45">On commence léger, la profondeur vient d&apos;elle-même.</p>
        <div className="grid grid-cols-3 gap-2">
          {REACH.map((r) => {
            const on = reach === r.max;
            return (
              <button
                key={r.max}
                onClick={() => setReach(r.max)}
                aria-pressed={on}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-2 pb-3 pt-3.5 transition active:scale-95 ${
                  on
                    ? "border-accent/70 bg-accent/15 text-paper shadow-[0_0_28px_-6px_var(--accent)]"
                    : "border-white/10 bg-white/[.03] text-paper/45"
                }`}
              >
                <Depth depth={r.max} />
                <span className="display text-[16px] leading-tight">{DEPTH_LABELS[r.max]}</span>
                <span className="text-[11px] opacity-70">{r.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="display mb-4 text-center text-[24px] font-light leading-snug">De quoi parler&nbsp;?</h2>
        <div className="grid grid-cols-4 gap-2">
          {themes.map((t) => {
            const on = isOn(t);
            return (
              <button
                key={t}
                onClick={() => toggleTheme(t)}
                aria-pressed={on}
                className={`flex aspect-[5/6] flex-col items-center justify-center gap-2 rounded-2xl border transition active:scale-95 ${
                  on ? "border-accent/60 bg-accent/12 text-paper" : "border-white/8 bg-white/[.02] text-paper/30"
                }`}
              >
                <Glyph
                  id={THEME_GLYPH[t] ?? 3}
                  className={`w-[38%] transition ${on ? "text-accent drop-shadow-[0_0_8px_var(--accent)]" : ""}`}
                  strokeWidth={1.4}
                />
                <span className="text-[11px] leading-none">{t}</span>
              </button>
            );
          })}
        </div>
      </section>

      <p className="display text-center text-[14px] italic text-paper/45" aria-live="polite">
        {matching} {matching > 1 ? "questions possibles" : "question possible"}
      </p>
    </div>
  );
}
