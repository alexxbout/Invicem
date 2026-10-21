"use client";

import type { Question } from "@/lib/client";
import { Depth } from "./Hand";

/** Bottom sheet listing the questions already drawn, newest first. */
export function History({ items, onClose }: { items: Question[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal aria-label="Questions déjà tirées">
      <button aria-label="Fermer" onClick={onClose} className="sheet-fade absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="sheet-up relative mx-auto flex max-h-[78dvh] w-full max-w-md flex-col rounded-t-[28px] border border-white/10 bg-[#1d1727]/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="display text-[22px] font-light">Questions tirées</h2>
          <button onClick={onClose} className="text-[13px] text-paper/50">
            Fermer
          </button>
        </div>
        {items.length === 0 ? (
          <p className="display py-10 text-center text-[16px] italic text-paper/50">Rien pour l&apos;instant.</p>
        ) : (
          <ol className="-mx-1 space-y-3 overflow-y-auto px-1 pb-2">
            {items.map((q, i) => (
              <li key={i} className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-paper/50">{q.theme}</span>
                  <Depth depth={q.depth} />
                </div>
                <p className="display text-[17px] leading-snug text-paper/90">{q.text}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
