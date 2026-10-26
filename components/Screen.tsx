"use client";

import gsap from "gsap";
import { useEffect, useRef, type ReactNode } from "react";
import { Tap } from "./Tap";

/** Full-height column that eases in; children flagged data-rise stagger up (CSS, see globals.css). */
export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { opacity: 0, duration: 0.5, ease: "power1.out" });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={`app-h mx-auto flex w-full max-w-md flex-col items-center px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] ${className}`}
    >
      {children}
    </div>
  );
}

export function Wordmark({ onBack, right }: { onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="relative flex h-10 w-full items-center justify-center">
      {onBack && (
        <Tap
          onClick={onBack}
          aria-label="Retour"
          className="absolute left-0 grid size-10 place-items-center rounded-full text-paper/60 transition hover:bg-white/5 hover:text-paper"
        >
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Tap>
      )}
      <span className="display text-[15px] italic tracking-[0.18em] text-paper/70">invicem</span>
      {right && <div className="absolute right-0">{right}</div>}
    </header>
  );
}
