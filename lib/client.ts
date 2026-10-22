import { useEffect, useRef } from "react";

export type Role = "a" | "b";
export type JokerKind = "paper";

export type Question = { text: string; theme: string; depth: 1 | 2 | 3; rare?: boolean; written?: boolean };
export type HandCard = Pick<Question, "theme" | "depth"> & { rare?: boolean; blank?: boolean };
export type Criteria = { depths: (1 | 2 | 3)[]; themes: string[] };
export type SessionView = {
  step: number;
  turn: Role;
  phase: "card" | "choose" | "setup" | "closing" | "write" | "words" | "reveal" | "end";
  question: Question | null;
  hand: HandCard[];
  /** slot the question was picked from, for replaying the gesture on the other phone */
  pickedSlot: number | null;
  /** questions asked so far tonight, the one on the table included */
  round: number;
  /** the closing card is offered once `round` reaches this */
  goal: number;
  criteria: Criteria;
  themes: string[];
  matching: number;
  /** newest first, current question excluded */
  history: Question[];
  /** jokers each player still holds */
  jokers: Record<Role, JokerKind[]>;
  /** in phase "choose": the hand comes from a passed card */
  passed: boolean;
  /** the joker that was just played, when `passed` */
  lastJoker: JokerKind | null;
  /** who has already sealed a last word */
  sealed: Record<Role, boolean>;
  /** both last words, once both are in */
  words: Record<Role, string> | null;
  /** server time of the shared reveal of the words */
  revealAt: number | null;
  now: number;
};

export type Match = {
  sessionId: string;
  color: number;
  symbol: number;
  /** ms until the shared flip, already corrected for server clock and latency */
  flipInMs: number;
};

export type Saved = { sessionId: string; color: number; symbol: number; role: Role };

/** JSON request that also reports the round trip, for clock-free flip syncing. */
export async function call<T>(url: string, method: "GET" | "POST" | "DELETE" = "GET", body?: unknown) {
  const t0 = performance.now();
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const rtt = performance.now() - t0;
  const data = (res.status === 204 ? null : await res.json().catch(() => null)) as T;
  return { ok: res.ok, status: res.status, data, rtt };
}

/** server timeline -> ms from now, assuming the answer left the server rtt/2 ago */
export const msUntil = (flipAt: number, serverNow: number, rtt: number) => Math.max(0, flipAt - serverNow - rtt / 2);

const KEY = "invicem:session";

export const readSaved = (): string | null => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

export function writeSaved(value: Saved | null) {
  try {
    if (value) localStorage.setItem(KEY, JSON.stringify(value));
    else localStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event("invicem-saved"));
}

export function subscribeSaved(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener("invicem-saved", cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener("invicem-saved", cb);
  };
}

/** Sequential polling (never overlaps), skips ticks while the tab is hidden. */
export function usePoll(fn: () => Promise<void> | void, ms: number, on: boolean) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useEffect(() => {
    if (!on) return;
    let stopped = false;
    let timer: number;
    const loop = async () => {
      if (stopped) return;
      if (!document.hidden) {
        try {
          await ref.current();
        } catch {}
      }
      if (!stopped) timer = window.setTimeout(loop, ms);
    };
    timer = window.setTimeout(loop, ms);
    return () => {
      stopped = true;
      window.clearTimeout(timer);
    };
  }, [ms, on]);
}

