"use client";

import type { Question } from "@/lib/client";
import { Depth } from "./Hand";
import { Sheet } from "./Sheet";

/** Questions already drawn, newest first. */
export function History({ items, onClose }: { items: Question[]; onClose: () => void }) {
  return (
    <Sheet title="Questions tirées" label="Questions déjà tirées" onClose={onClose}>
      {items.length === 0 ? (
        <p className="display py-10 text-center text-[16px] italic text-paper/50">Rien pour l&apos;instant.</p>
      ) : (
        <ol className="-mx-1 space-y-3 px-1 pb-2">
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
    </Sheet>
  );
}
