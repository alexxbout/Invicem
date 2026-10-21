"use client";

import { DEPTH_LABELS } from "@/lib/labels";
import type { Criteria as CriteriaValue } from "@/lib/client";
import { Depth } from "./Hand";

type DepthKey = 1 | 2 | 3;

const chip = (on: boolean) =>
  `rounded-full border px-4 py-2 text-[14px] transition active:scale-95 ${
    on ? "border-accent/70 bg-accent/15 text-paper" : "border-white/12 bg-white/[.03] text-paper/55"
  }`;

/** Depth + themes picker. Empty themes means "everything". */
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
  const toggleDepth = (d: DepthKey) =>
    onChange((v) => {
      const on = v.depths.includes(d);
      // keep at least one depth selected
      if (on && v.depths.length === 1) return v;
      return { ...v, depths: on ? v.depths.filter((x) => x !== d) : [...v.depths, d].sort() };
    });

  const toggleTheme = (t: string) =>
    onChange((v) => {
      const next = v.themes.includes(t) ? v.themes.filter((x) => x !== t) : [...v.themes, t];
      // picking every theme is the same as picking none
      return { ...v, themes: next.length === themes.length ? [] : next };
    });

  return (
    <div className="flex w-full flex-col gap-7">
      <section>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-paper/45">Profondeur</h3>
        <div className="grid grid-cols-3 gap-2">
          {([1, 2, 3] as DepthKey[]).map((d) => {
            const on = value.depths.includes(d);
            return (
              <button
                key={d}
                onClick={() => toggleDepth(d)}
                aria-pressed={on}
                className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3.5 transition active:scale-95 ${
                  on ? "border-accent/70 bg-accent/15 text-paper" : "border-white/12 bg-white/[.03] text-paper/50"
                }`}
              >
                <Depth depth={d} />
                <span className="text-[13px]">{DEPTH_LABELS[d]}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.24em] text-paper/45">Thèmes</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onChange((v) => ({ ...v, themes: [] }))} aria-pressed={value.themes.length === 0} className={chip(value.themes.length === 0)}>
            Tous
          </button>
          {themes.map((t) => (
            <button key={t} onClick={() => toggleTheme(t)} aria-pressed={value.themes.includes(t)} className={chip(value.themes.includes(t))}>
              {t}
            </button>
          ))}
        </div>
      </section>

      <p className="display text-center text-[15px] italic text-paper/50" aria-live="polite">
        {matching} {matching > 1 ? "questions" : "question"} dans cette ambiance
      </p>
    </div>
  );
}
