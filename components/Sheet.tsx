"use client";

import type { ReactNode } from "react";
import { Tap } from "./Tap";

/** Bottom sheet shell shared by the history and the mood picker. */
export function Sheet({ title, label, onClose, children }: { title: string; label: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end" role="dialog" aria-modal aria-label={label}>
      <Tap aria-label="Fermer" onClick={onClose} className="sheet-fade absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
      <div className="sheet-up relative mx-auto flex max-h-[84dvh] w-full max-w-md flex-col rounded-t-[28px] border border-white/10 bg-[#1d1727]/95 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="display text-[22px] font-light">{title}</h2>
          <Tap onClick={onClose} className="text-[13px] text-paper/50">
            Fermer
          </Tap>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
