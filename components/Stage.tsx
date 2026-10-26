"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import {
  call,
  msUntil,
  usePoll,
  writeSaved,
  type Criteria as CriteriaValue,
  type JokerKind,
  type Match,
  type Question,
  type Role,
  type SessionView,
} from "@/lib/client";
import { reduced, scratch } from "@/lib/feel";
import { motion } from "@/lib/motion";
import { THEME_GLYPH } from "@/lib/labels";
import { COLORS, SYMBOLS } from "@/lib/palette";
import { ambient, setAccent } from "./Ambient";
import { Card } from "./Card";
import { Criteria } from "./Criteria";
import { Depth, Hand, type HandHandle } from "./Hand";
import { QuillWait, WordSeal, WordsReveal, WriteCard } from "./Scribe";
import { Glyph } from "./Glyph";
import { JokerFan } from "./joker/JokerFan";
import { JokerPlay } from "./joker/JokerPlay";
import { History } from "./History";
import { Sheet } from "./Sheet";
import { SoundToggle } from "./SoundToggle";
import { Screen, Wordmark } from "./Screen";
import { Tap } from "./Tap";

type Mode = "drawing" | "waiting" | "charging" | "open" | "full";

type CardInfo = { id?: string; color: number; symbol: number };

type DrawResponse = { id: string; color: number; symbol: number };
type StatusResponse =
  | { state: "waiting" }
  | { state: "expired" }
  | { state: "matched"; sessionId: string; flipAt: number; now: number };

/** the evening laid out once the closing card is answered */
function Recap({ items, words }: { items: Question[]; words: [string, string] | null }) {
  return (
    <div data-rise className="flex max-h-[62dvh] w-full flex-col gap-5">
      <h2 className="display text-center text-[28px] font-light leading-snug">
        Votre soirée
        <br />
        <em className="text-[20px] text-paper/55">
          {items.length} {items.length > 1 ? "questions partagées" : "question partagée"}
        </em>
      </h2>
      {words && (
        <p className="hand text-center text-[30px] leading-none text-gold">
          {words[0]} <span className="text-paper/40">·</span> {words[1]}
        </p>
      )}
      <ol className="-mx-1 space-y-2.5 overflow-y-auto px-1">
        {items.map((q, i) => (
          <li
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3"
            style={{ animation: `rise .6s cubic-bezier(.2,.7,.2,1) ${0.15 + i * 0.07}s both` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-paper/50">{q.theme}</span>
              <Depth depth={q.depth} />
            </div>
            <p className={q.written ? "hand text-[20px] leading-snug text-paper/90" : "display text-[16px] leading-snug text-paper/90"}>{q.text}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Whether this phone shows the question face. The one answering only hears it read aloud: their
 * card stays face down. The opening card is the shared reveal, so both see it.
 */
const faceUpFor = (v: SessionView, role: Role) => {
  if (!onTable(v.phase)) return false;
  if (v.phase !== "card" || (v.round === 1 && v.history.length === 0)) return true;
  // a question written on a blank card is a gift: the other reads it, its author keeps it face down
  if (v.question?.written) return v.turn !== role;
  return v.turn === role;
};

/** what the hidden question is about, laid over the back for the one listening */
function Listening({ question }: { question: Question }) {
  return (
    <div className="pointer-events-none absolute inset-x-[9%] bottom-[9%] flex flex-col items-center gap-1.5 rounded-xl bg-black/35 px-3 py-2.5 text-center backdrop-blur-[2px]">
      <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-white/90">
        {question.written ? "Ta question" : question.theme}
      </span>
      {question.written ? <span className="text-[11px] text-white/70">entre ses mains</span> : <Depth depth={question.depth} />}
    </div>
  );
}

/** phases where a card lies face up on the table */
const onTable = (p: SessionView["phase"]) => p === "card" || p === "closing";

/**
 * The evening as a row of seven small cards: the ones already played lie face up with their
 * theme's symbol, the one on the table glows, the rest are empty slots. Tap to reread them.
 */
function Frise({ view, onOpen }: { view: SessionView; onOpen: () => void }) {
  const asked = [...view.history].reverse();
  if (view.phase === "card" && view.question) asked.push(view.question);
  const start = view.goal - 7;
  return (
    <Tap
      onClick={onOpen}
      disabled={asked.length === 0}
      aria-label={`Question ${view.round} sur ${view.goal}, revoir les cartes`}
      className="flex items-end justify-center gap-1.5 rounded-xl px-2 py-1 transition active:scale-95 aria-disabled:cursor-default"
    >
      {Array.from({ length: 7 }, (_, k) => {
        const q = asked[start + k];
        const current = view.phase === "card" && start + k === view.round - 1;
        return (
          <span
            key={k}
            data-frise-current={start + k === view.round - 1 || undefined}
            className={`grid aspect-[5/7] w-[22px] place-items-center rounded-[4px] border transition-all duration-700 ${current ? "-translate-y-1" : ""}`}
            style={
              q
                ? {
                    background: "linear-gradient(165deg, #f8f0e3, #e3d3ba)",
                    borderColor: current ? "var(--accent)" : "rgba(184,145,77,.5)",
                    boxShadow: current ? "0 0 12px var(--accent)" : `0 0 ${(q.depth - 1) * 4}px color-mix(in srgb, var(--accent) 60%, transparent)`,
                    opacity: current ? 1 : 0.55 + q.depth * 0.12,
                  }
                : { borderColor: "rgba(244,234,219,.18)", borderStyle: "dashed" }
            }
          >
            {q && <Glyph id={THEME_GLYPH[q.theme] ?? 3} className="w-[70%] text-[#8a6a33]" strokeWidth={1.8} />}
          </span>
        );
      })}
    </Tap>
  );
}

function QuestionFace({ question, play }: { question: Question; play: boolean }) {
  const ref = useRef<HTMLParagraphElement>(null);

  // words surface one after another once the card is turned; a handwritten question
  // writes itself letter by letter instead, as if the pen were moving in front of you
  useEffect(() => {
    const parts = ref.current?.querySelectorAll("[data-w]");
    if (!parts) return;
    // turning away, the words stay printed: the face hides them as it turns, so blanking them
    // here would show an empty card for a moment before the flip
    if (!play) return;
    if (reduced()) {
      gsap.set(parts, { opacity: 1, y: 0, filter: "none", scale: 1 });
      return;
    }
    if (question.written) {
      const stagger = Math.min(0.06, 2.4 / parts.length);
      scratch(stagger * parts.length, 0.7);
      gsap.fromTo(
        parts,
        { opacity: 0, y: 3, scale: 0.6 },
        { opacity: 1, y: 0, scale: 1, duration: 0.18, ease: "power1.out", stagger, delay: 0.7 },
      );
      return;
    }
    gsap.fromTo(
      parts,
      { opacity: 0, y: 10, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power2.out", stagger: 0.05, delay: 0.5 },
    );
    // question is fixed for the life of this face
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  return (
    <div className="relative flex h-full flex-col items-center text-center">
      {question.rare && <div className="holo pointer-events-none absolute -inset-[15%] opacity-70" />}
      {/* the theme is stamped in gold leaf, with a small fleuron under it */}
      <div
        className="relative pt-[2cqw] text-[3.4cqw] font-semibold uppercase tracking-[0.3em]"
        style={{
          background: "linear-gradient(100deg, #a77a22 0%, #e0b54a 35%, #f6dc8f 50%, #e0b54a 65%, #a77a22 100%)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {question.rare ? `✦ Carte rare · ${question.theme} ✦` : question.written ? "Carte blanche" : question.theme}
      </div>
      <svg viewBox="0 0 60 8" className="relative mt-[1.5cqw] w-[30%]" fill="none" stroke="#c9993a" strokeWidth="0.9" aria-hidden>
        <path d="M2 4 H24 M36 4 H58" strokeLinecap="round" />
        <path d="M30 0.8 L33.2 4 L30 7.2 L26.8 4 Z" fill="#c9993a" stroke="none" />
      </svg>
      <div className="relative flex flex-1 items-center px-[2cqw]">
        <p ref={ref} className={question.written ? "hand text-[9.5cqw] leading-[1.1]" : "display text-[7cqw] leading-[1.2]"}>
          {question.written
            ? question.text.split(" ").map((w, i) => (
                // letters animate one by one, but each word stays unbreakable
                <span key={i} className="inline-block whitespace-nowrap">
                  {[...w].map((ch, j) => (
                    <span key={j} data-w className="inline-block">
                      {ch}
                    </span>
                  ))}
                  &nbsp;
                </span>
              ))
            : question.text.split(" ").map((w, i) => (
                <span key={i}>
                  <span data-w className="inline-block">
                    {w}
                  </span>{" "}
                </span>
              ))}
        </p>
      </div>
      <div className="flex gap-[2cqw] pb-[2cqw] text-[#c9993a]">
        {[1, 2, 3].map((d) => (
          <span key={d} className={`size-[2.2cqw] rotate-45 border border-current ${d <= question.depth ? "bg-current" : ""}`} />
        ))}
      </div>
    </div>
  );
}

/**
 * One table for both players: the card is drawn (role a) or found (role b),
 * both phones charge, flip at the same server instant, then trade questions.
 */
export function Stage({
  role,
  seed,
  onExit,
}: {
  role: Role;
  /** set when the partner found the card, or when resuming a saved table */
  seed?: Match & { resume?: boolean };
  onExit: () => void;
}) {
  const [card, setCard] = useState<CardInfo | null>(seed ? { color: seed.color, symbol: seed.symbol } : null);
  const [sessionId, setSessionId] = useState<string | null>(seed?.sessionId ?? null);
  const [mode, setMode] = useState<Mode>(seed ? (seed.resume ? "open" : "charging") : "drawing");
  const [shown, setShown] = useState<SessionView | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [firstReveal, setFirstReveal] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  /** a move was sent and its answer is on its way: buttons show it at once */
  const [pending, setPending] = useState(false);
  /** what I'm writing on a blank card, and my last word */
  const [draft, setDraft] = useState("");
  const [word, setWord] = useState("");
  /** the last words have been turned over; the way to the recap opens */
  const [revealed, setRevealed] = useState(false);
  /** bumped to replay the joker flash on both phones */
  /** a joker being played on the table (both phones), and the one that just left my hand */
  const [jokerRun, setJokerRun] = useState<{ kind: JokerKind; from: DOMRect | null; n: number } | null>(null);
  const [flying, setFlying] = useState<JokerKind | null>(null);
  const jokerFrom = useRef<DOMRect | null>(null);
  const jokerDone = useRef<(() => void) | null>(null);
  const editedAt = useRef(0);
  const editSeq = useRef(0);
  const handRef = useRef<HandHandle>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const cardRef = useRef<CardInfo | null>(card);
  const modeRef = useRef<Mode>(mode);
  const shownRef = useRef<SessionView | null>(null);
  const flipDue = useRef(false);
  const busy = useRef(false);
  const latest = useRef<SessionView | null>(null);
  const timers = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  };

  const setModeBoth = (m: Mode) => {
    modeRef.current = m;
    setMode(m);
  };

  /** what a view says, minus any server clock, which changes on every poll */
  const sameView = (a: SessionView | null, b: SessionView) => {
    const skipClock = (k: string, v: unknown) => (k === "now" ? undefined : v);
    return !!a && JSON.stringify(a, skipClock) === JSON.stringify(b, skipClock);
  };

  const commitView = (v: SessionView) => {
    // an unchanged poll must not re-render the table: it could land in the middle of a flip
    if (sameView(shownRef.current, v)) return;
    shownRef.current = v;
    setShown(v);
  };

  /** first reveal needs the timer AND the question; whichever lands last triggers it */
  const tryReveal = (sid: string) => {
    if (!flipDue.current || !shownRef.current || !alive.current) return;
    flipDue.current = false;
    setModeBoth("open");
    setFlipped(true);
    const c = cardRef.current;
    if (c) writeSaved({ sessionId: sid, color: c.color, symbol: c.symbol, role });
  };

  const startCharging = async (sid: string, flipInMs: number) => {
    setSessionId(sid);
    setModeBoth("charging");
    flipDue.current = false;
    later(() => {
      flipDue.current = true;
      tryReveal(sid);
    }, flipInMs);
    const { data, ok } = await call<SessionView>(`/api/session/${sid}`);
    if (ok && data && alive.current) {
      commitView(data);
      tryReveal(sid);
    }
  };

  /** every step: flip face down, apply the new state, then flip up again if a question is on the table */
  /**
   * Bring the card back upright and visible. Any put-back still running is stopped first,
   * or it would finish after this and hide the next card.
   */
  const standUp = () => {
    gsap.killTweensOf(wrapRef.current, "x,y,rotation,scale,opacity,filter");
    gsap.set(wrapRef.current, { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, filter: "none" });
  };

  /**
   * A played card is never just erased: it shrinks and flies up into its slot in the frieze,
   * up towards the other side of the table, then the table is cleared for what comes next.
   */
  const toFrise = (then?: () => void) => {
    const el = wrapRef.current;
    if (!el || reduced()) return then?.();
    const from = el.getBoundingClientRect();
    const slot = document.querySelector("[data-frise-current]")?.getBoundingClientRect();
    const tx = slot ? slot.left + slot.width / 2 : window.innerWidth / 2;
    const ty = slot ? slot.top + slot.height / 2 : 40;
    const scale = slot ? slot.width / from.width : 0.1;
    gsap.to(el, {
      x: tx - (from.left + from.width / 2),
      y: ty - (from.top + from.height / 2),
      scale,
      rotation: motion.vary(8, 0.5) * (Math.random() < 0.5 ? -1 : 1),
      opacity: 0,
      duration: 0.62 * motion.tempo(),
      ease: "power3.in",
      onComplete: () => then?.(),
    });
  };

  /** the card sinks a little and fades, giving the table over to what comes next */
  const settle = (then: () => void) => {
    const el = wrapRef.current;
    if (!el || reduced()) return then();
    gsap.to(el, { y: 26, scale: 0.94, opacity: 0, duration: 0.55 * motion.tempo(), ease: "power2.in", onComplete: then });
  };

  /**
   * `head` is how long the card has already been turning before the server answered
   * (the move started on tap), so that much is taken off the wait.
   */
  const showNext = (v: SessionView, played = false, head = 0) => {
    latest.current = v;
    if (busy.current) return;
    if (shownRef.current && v.step === shownRef.current.step) {
      commitView(v);
      return;
    }
    busy.current = true;
    setFirstReveal(false);
    // coming from the hand there is no card to turn face down first, so go straight to the new one
    const fromHand = shownRef.current !== null && !onTable(shownRef.current.phase);
    // a joker was just played: both phones see it land on the card before the card goes back
    const joker = !fromHand && v.phase === "choose" && v.passed;
    if (!joker) setFlipped(false);

    const swap = () => {
      const target = latest.current!;
      commitView(target);
      standUp();
      // the card remounts face down when coming back from the hand, give it a beat before flipping
      later(() => {
        if (faceUpFor(target, role)) setFlipped(true);
        busy.current = false;
        if (latest.current && latest.current.step !== shownRef.current?.step) showNext(latest.current);
      }, fromHand ? 250 : 450);
    };

    if (fromHand && !played && v.phase === "card" && v.pickedSlot !== null && handRef.current) {
      // the other player chose: replay their card rising to the table before it turns
      void handRef.current.playPick(v.pickedSlot).then(() => alive.current && swap());
    } else if (joker) {
      // the joker lands on the card and knocks it away; once it has slid off, the hand comes
      jokerDone.current = () => {
        jokerDone.current = null;
        setJokerRun(null);
        setFlying(null);
        setFlipped(false);
        swap();
      };
      const from = jokerFrom.current;
      jokerFrom.current = null;
      setJokerRun({ kind: v.lastJoker ?? "paper", from, n: v.step });
    } else if (fromHand) {
      later(swap, 0);
    } else {
      const prev = shownRef.current;
      const wasFaceUp = !!prev && faceUpFor(prev, role);
      // a face-up card turns over first; a face-down one (or one already flying) goes at once
      const wait = wasFaceUp ? 1150 * motion.tempo() - head : 250 - head;
      // the frieze only stays on screen for the next cards; when the table gives way to the
      // mood or the last words, the card settles down and fades instead of flying to it
      const toFriseNext = v.phase === "card" || v.phase === "choose" || v.phase === "closing";
      if (head > 0 && !wasFaceUp) later(swap, Math.max(0, 1300 - head));
      else later(() => (toFriseNext ? toFrise(swap) : settle(swap)), Math.max(0, wait));
    }
  };

  const draw = async () => {
    const { data, status } = await call<DrawResponse>("/api/card", "POST");
    if (!alive.current) return;
    if (status === 503 || !data) return setModeBoth("full");
    const info = { id: data.id, color: data.color, symbol: data.symbol };
    cardRef.current = info;
    setCard(info);
    setAccent(COLORS[data.color].from);
    setModeBoth("waiting");
    gsap.fromTo(
      wrapRef.current,
      { opacity: 0, scale: 0.9, y: 40 },
      { opacity: 1, scale: 1, y: 0, duration: 1, ease: "power3.out" },
    );
  };

  // mount: draw as role a, or take the seed as role b / resume
  useEffect(() => {
    alive.current = true;
    cardRef.current = card;
    const ts = timers.current;
    if (!seed) {
      later(() => void draw(), 0);
    } else if (seed.resume) {
      setAccent(COLORS[seed.color].from);
      void call<SessionView>(`/api/session/${seed.sessionId}`).then(({ data, ok }) => {
        if (!alive.current) return;
        if (ok && data) {
          commitView(data);
          setFlipped(faceUpFor(data, role));
          setFirstReveal(false);
        } else {
          writeSaved(null);
          onExit();
        }
      });
    } else {
      setAccent(COLORS[seed.color].from);
      const { sessionId: sid, flipInMs } = seed;
      later(() => void startCharging(sid, flipInMs), 0);
    }
    return () => {
      alive.current = false;
      ts.forEach((t) => window.clearTimeout(t));
      const c = cardRef.current;
      if (modeRef.current === "waiting" && c?.id) {
        void fetch(`/api/card/${c.id}`, { method: "DELETE", keepalive: true });
      }
    };
    // runs once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // waiting: has the partner found our card?
  usePoll(
    async () => {
      const c = cardRef.current;
      if (!c?.id || modeRef.current !== "waiting") return;
      const { data, rtt } = await call<StatusResponse>(`/api/card/${c.id}`);
      if (!data || !alive.current || modeRef.current !== "waiting") return;
      if (data.state === "matched") {
        void startCharging(data.sessionId, msUntil(data.flipAt, data.now, rtt));
      } else if (data.state === "expired") {
        // fade away softly and deal a fresh card
        setModeBoth("drawing");
        setNote("Cette carte s'est effacée doucement. En voilà une nouvelle.");
        later(() => setNote(null), 5000);
        gsap.to(wrapRef.current, {
          opacity: 0,
          scale: 0.92,
          y: -20,
          duration: 1.1,
          ease: "power2.in",
          onComplete: () => void draw(),
        });
      }
    },
    1000,
    mode === "waiting",
  );

  // open: follow the shared question
  usePoll(
    async () => {
      if (!sessionId || busy.current) return;
      const { data, status } = await call<SessionView>(`/api/session/${sessionId}`);
      if (!alive.current) return;
      // a poll that was in flight during a local edit would roll the chips back
      if (Date.now() - editedAt.current < 2500) return;
      if (status === 404) {
        writeSaved(null);
        return onExit();
      }
      if (data) showNext(data);
    },
    1500,
    mode === "open" && shown !== null,
  );

  /** the card starts turning on tap; the server's answer arrives during the turn */
  const next = async () => {
    const cur = shownRef.current;
    if (!sessionId || !cur || busy.current || pending) return;
    setPending(true);
    // a face-up card turns over; a face-down one (the listener's) is put back on the deck
    const faceDown = !faceUpFor(cur, role);
    if (faceDown) toFrise();
    else setFlipped(false);
    const t0 = performance.now();
    const { data } = await call<SessionView>(`/api/session/${sessionId}/next`, "POST", { step: cur.step });
    setPending(false);
    if (!alive.current) return;
    // the put-back is shorter than a flip, so count it as further along
    if (data) showNext(data, false, performance.now() - t0 + (faceDown ? 750 : 0));
    else {
      // nothing came back: put the card as it was
      setFlipped(faceUpFor(cur, role));
      standUp();
    }
  };

  /** the hand plays its lift-to-centre motion while the request runs; the swap waits for both */
  const pick = async (slot: number, settled: Promise<unknown>) => {
    if (!sessionId || !shownRef.current || busy.current) return;
    busy.current = true;
    const [{ data }] = await Promise.all([
      call<SessionView>(`/api/session/${sessionId}/pick`, "POST", { step: shownRef.current.step, slot }),
      settled,
    ]);
    busy.current = false;
    if (data && alive.current) showNext(data, true);
  };

  /** spend a joker: the card goes back unanswered and the asker picks again */
  const pass = async (kind: JokerKind, el: HTMLElement) => {
    if (!sessionId || !shownRef.current || busy.current) return;
    // the played joker leaves the fan at once and flies from where it was
    jokerFrom.current = el.getBoundingClientRect();
    setFlying(kind);
    const { data } = await call<SessionView>(`/api/session/${sessionId}/pass`, "POST", {
      step: shownRef.current.step,
      role,
      kind,
    });
    if (data && alive.current) showNext(data);
    else setFlying(null);
  };

  /** the picker of the blank card puts their own question on the table */
  const writeQuestion = async () => {
    const cur = shownRef.current;
    if (!sessionId || !cur || busy.current || pending) return;
    setPending(true);
    const { data } = await call<SessionView>(`/api/session/${sessionId}/write`, "POST", { step: cur.step, role, text: draft });
    setPending(false);
    if (data && alive.current) {
      setDraft("");
      showNext(data);
    }
  };

  /** seal my last word; the reveal starts when the other's is in too */
  const seal = async () => {
    if (!sessionId || pending) return;
    setPending(true);
    const { data } = await call<SessionView>(`/api/session/${sessionId}/word`, "POST", { role, word });
    setPending(false);
    if (data && alive.current) showNext(data);
  };

  /** a move that only needs the current step: start, finish, continue */
  const act = async (path: "start" | "finish" | "continue") => {
    if (!sessionId || !shownRef.current || busy.current || pending) return;
    setPending(true);
    if (path === "continue") {
      // a new stretch of the evening: fresh last words later
      setRevealed(false);
      setWord("");
    }
    const { data } = await call<SessionView>(`/api/session/${sessionId}/${path}`, "POST", { step: shownRef.current.step });
    setPending(false);
    if (data && alive.current) showNext(data);
  };

  /** optimistic: chips move at once, the server answer (and the partner's screen) follow */
  const changeCriteria = async (update: (prev: CriteriaValue) => CriteriaValue) => {
    const cur = shownRef.current;
    if (!sessionId || !cur) return;
    const criteria = update(cur.criteria);
    if (criteria === cur.criteria) return;
    editedAt.current = Date.now();
    const seq = ++editSeq.current;
    commitView({ ...cur, criteria });
    const { data } = await call<SessionView>(`/api/session/${sessionId}/criteria`, "POST", criteria);
    // only the answer to the latest tap may touch the chips
    if (data && alive.current && seq === editSeq.current && shownRef.current?.step === data.step) {
      editedAt.current = Date.now();
      commitView({ ...shownRef.current, criteria: data.criteria, matching: data.matching });
    }
  };

  const leave = (forget: boolean) => {
    if (forget) writeSaved(null);
    onExit();
  };

  // the room follows the depth of what is on the table, so the climb is felt rather than shown
  const roomDepth = !shown
    ? 2
    : onTable(shown.phase) && shown.question
      ? shown.question.depth
      : shown.phase === "choose" && shown.hand.length
        ? shown.hand.reduce((a, h) => a + h.depth, 0) / shown.hand.length
        : shown.criteria.depths.reduce((a, b) => a + b, 0) / shown.criteria.depths.length;
  useEffect(() => {
    ambient.depth(roomDepth);
    motion.setDepth(roomDepth);
  }, [roomDepth]);
  useEffect(() => () => ambient.depth(2), []);

  const color = card ? COLORS[card.color] : null;
  const phase = mode === "open" ? shown?.phase : undefined;
  /** "mine" = I picked this card (or pick the next one in a hand); the other answers */
  const mine = shown ? shown.turn === role : false;
  const choosing = phase === "choose";
  const setup = phase === "setup";
  const ended = phase === "end";
  const writing = phase === "write";
  const sealing = phase === "words";
  const revealing = phase === "reveal";
  const offTable = choosing || setup || ended || writing || sealing || revealing;
  const other: Role = role === "a" ? "b" : "a";
  const opening = !!shown && shown.round === 1 && shown.history.length === 0;
  /** I answer this card: it stays face down, I only hear it */
  const listening = phase === "card" && !!shown && !faceUpFor(shown, role);
  const written = !!shown?.question?.written;
  /** I answer this card: my joker is at hand, except on a question the other wrote for me */
  const answering =
    phase === "card" && !!shown && shown.turn !== role && !(shown.round === 1 && shown.history.length === 0) && !written;
  const lastOne = !!shown && shown.round >= shown.goal;
  /** rare cards and the last question of the evening get a bigger moment */
  const peak = !!shown?.question && (!!shown.question.rare || (phase === "card" && lastOne));
  /** the flip takes the tempo of the depth, a little longer on a peak, never twice the same */
  const [flipJitter] = useState(() => motion.vary(1, 0.05));
  const flipTime = 1.35 * motion.tempo(roomDepth) * (peak ? 1.4 : 1) * flipJitter;
  /** nothing touched for a while: what can be touched next starts to glow */
  const [idle, setIdle] = useState(false);
  const stepKey = shown ? `${shown.step}:${mode}` : mode;
  useEffect(() => {
    let timer = 0;
    const arm = () => {
      window.clearTimeout(timer);
      setIdle(false);
      timer = window.setTimeout(() => setIdle(true), 9000);
    };
    timer = window.setTimeout(() => setIdle(true), 9000);
    window.addEventListener("pointerdown", arm);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", arm);
      later(() => setIdle(false), 0);
    };
    // re-armed at every new step
  }, [stepKey]);
  /** my phone has nothing to do for now: its light goes down a little */
  const resting =
    (choosing && !mine) || (writing && !mine) || (sealing && !!shown?.sealed[role] && !shown?.sealed[other]);

  const waiting = pending ? " pointer-events-none btn-pending" : "";
  const primary =
    (idle ? "nudge " : "") +
    "rounded-full bg-gradient-to-b from-[#ecd09a] to-[#c79a50] px-9 py-3.5 text-[15px] font-medium text-[#2a1d0a] shadow-[0_10px_36px_-8px_rgba(217,183,121,.55)] transition active:scale-95";
  const secondary =
    (idle ? "nudge " : "") +
    "rounded-full border border-white/15 bg-white/[.06] px-8 py-3.5 text-[15px] text-paper backdrop-blur transition active:scale-95";

  const status = !shown
    ? ""
    : setup
      ? "Choisissez ensemble"
      : choosing
        ? mine
          ? "À toi de piocher une carte"
          : "La pioche est en face…"
        : phase === "closing"
          ? "Chacun votre tour"
          : writing
            ? mine
              ? "Écris la question que tu veux lui poser"
              : "Une question s'écrit pour toi…"
            : sealing || revealing || ended
            ? ""
            : mine
              ? written
                ? "Ta question est sous ses yeux"
                : "Lis-lui la question à voix haute"
              : opening
                ? "C'est à toi de répondre"
                : written
                  ? "Une question écrite pour toi"
                  : "Écoute, puis réponds";

  return (
    <Screen>
      {/* when the move is the other's, this phone's light goes down a little */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-[5] bg-[#06030a] transition-opacity duration-[1400ms]"
        style={{ opacity: resting ? 0.32 : 0 }}
      />
      <Wordmark
        onBack={() => leave(false)}
        right={
          mode === "open" && !setup ? (
            <div className="flex items-center">
              <SoundToggle />
              <Tap
                onClick={() => setMoodOpen(true)}
                aria-label="Ambiance"
                className="grid size-10 place-items-center rounded-full text-paper/60 transition hover:bg-white/5 hover:text-paper"
              >
                <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
                  <circle cx="15" cy="7" r="2" />
                  <circle cx="9" cy="17" r="2" />
                </svg>
              </Tap>
            </div>
          ) : null
        }
      />
      <div className="mt-1 h-10">
        {shown && (phase === "card" || choosing || phase === "closing") && <Frise view={shown} onOpen={() => setHistoryOpen(true)} />}
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center py-3">
        {jokerRun && (
          <JokerPlay
            key={jokerRun.n}
            from={jokerRun.from}
            question={() => wrapRef.current}
            onDone={() => jokerDone.current?.()}
          />
        )}
        {choosing && card && shown && (
          <Hand
            key={shown.step}
            color={card.color}
            hand={shown.hand}
            handle={handRef}
            canPick={mine}
            nudge={idle}
            onPick={(slot, settled) => void pick(slot, settled)}
          />
        )}
        {setup && shown && (
          <div key={shown.step} data-rise className="flex w-full flex-col gap-6">
            <Criteria
              value={shown.criteria}
              themes={shown.themes}
              matching={shown.matching}
              onChange={(u) => void changeCriteria(u)}
            />
          </div>
        )}
        {ended && shown && (
          <Recap
            key={shown.step}
            items={[...shown.history].reverse()}
            words={shown.words ? [shown.words[role], shown.words[other]] : null}
          />
        )}
        {writing && shown && (mine ? <WriteCard value={draft} onChange={setDraft} /> : <QuillWait label="Une question s'écrit pour toi…" />)}
        {sealing && shown && (
          <WordSeal value={word} onChange={setWord} sealed={shown.sealed[role]} partnerSealed={shown.sealed[other]} />
        )}
        {revealing && shown?.words && (
          <WordsReveal
            key={shown.step}
            mine={shown.words[role]}
            theirs={shown.words[other]}
            delayMs={Math.max(0, (shown.revealAt ?? shown.now) - shown.now)}
            onRevealed={() => setRevealed(true)}
          />
        )}
        <div ref={wrapRef} className="relative" style={{ opacity: seed ? 1 : 0, display: offTable ? "none" : undefined }}>
          {/* my jokers, tucked behind the bottom-right corner while I answer */}
          {answering && shown && !jokerRun && (
            <JokerFan kinds={shown.jokers[role].filter((k) => k !== flying)} onPlay={(k, el) => void pass(k, el)} />
          )}
          {card && !offTable && (
            <Card
              key={card.id ?? "seed"}
              color={card.color}
              symbol={card.symbol}
              flipped={flipped}
              charging={mode === "charging"}
              duration={firstReveal ? 2.6 : flipTime}
              burst={firstReveal || peak}
              front={shown ? shown.question && <QuestionFace question={shown.question} play={flipped} /> : null}
              backNote={listening && shown?.question ? <Listening question={shown.question} /> : null}
              blank={written}
            />
          )}
        </div>
      </div>

      <div className="flex min-h-[132px] w-full flex-col items-center justify-start gap-4 pb-1 text-center">
        {(mode === "waiting" || mode === "drawing") && (
          <div data-rise className="space-y-2">
            <p className="display text-[22px] font-light leading-snug">
              Montre cet écran en face.
              <br />
              <em className="text-paper/60">Ta carte doit y être retrouvée.</em>
            </p>
            {color && card && mode === "waiting" && (
              <p className="text-[13px] tracking-wide text-paper/45">
                {color.name} · {SYMBOLS[card.symbol].name}
              </p>
            )}
            <p
              className="display text-[14px] italic text-paper/50 transition-opacity duration-700"
              style={{ opacity: note ? 1 : 0 }}
            >
              {note ?? "\u00a0"}
            </p>
          </div>
        )}

        {mode === "charging" && (
          <p className="display animate-pulse text-[22px] italic text-paper/80">Vous y êtes presque…</p>
        )}

        {mode === "open" && shown && (
          <>
            {status && (
              <p className="flex items-center gap-2.5 text-[14px] text-paper/70" aria-live="polite">
                <span
                  className="size-2 rounded-full bg-accent"
                  style={{ boxShadow: "0 0 12px var(--accent)", opacity: mine || setup || phase === "closing" ? 1 : 0.35 }}
                />
                {status}
              </p>
            )}

            {setup && (
              <Tap onClick={() => void act("start")} className={(primary) + waiting}>
                Commencer
              </Tap>
            )}

            {choosing && (
              <p className="display h-[50px] text-[15px] italic text-paper/45">
                {shown.passed ? (mine ? "Ta carte a été passée. Repioche." : "Carte passée. Nouvelle pioche en face.") : "\u00a0"}
              </p>
            )}

            {/* only the one who answered moves on: the deck passes to them */}
            {phase === "card" &&
              (mine ? (
                <p className="display flex h-[50px] items-center text-[15px] italic text-paper/45">
                  {lastOne ? "Ensuite, la dernière carte." : opening ? "Ensuite, vous choisirez l'ambiance." : "Ensuite, la pioche change de main."}
                </p>
              ) : (
                <Tap onClick={next} className={(lastOne ? primary : secondary) + waiting}>
                  {lastOne ? "Dernière carte" : opening ? "Choisir l'ambiance" : "À moi de piocher"}
                </Tap>
              ))}

            {phase === "closing" && (
              <Tap onClick={next} className={(primary) + waiting}>
                Un dernier mot
              </Tap>
            )}

            {writing && mine && (
              <Tap
                onClick={() => void writeQuestion()}
                disabled={draft.trim().length < 4}
                className={(primary) + waiting + " aria-disabled:opacity-40"}
              >
                Poser la question
              </Tap>
            )}

            {sealing && !shown.sealed[role] && (
              <Tap onClick={() => void seal()} disabled={!word.trim()} className={(primary) + waiting + " aria-disabled:opacity-40"}>
                Sceller mon mot
              </Tap>
            )}
            {sealing && shown.sealed[role] && (
              <p className="display text-[15px] italic text-paper/50">{shown.sealed[other] ? "\u00a0" : "On attend le second mot…"}</p>
            )}

            {revealing && revealed && (
              <Tap data-rise onClick={next} className={(primary) + waiting}>
                Voir notre soirée
              </Tap>
            )}

            {ended && (
              <div className="flex w-full flex-col items-center gap-3">
                <Tap onClick={() => void act("continue")} className={(secondary) + waiting}>
                  Continuer à jouer
                </Tap>
                <Tap onClick={() => leave(true)} className="text-[13px] text-paper/50 underline-offset-4 hover:underline">
                  Terminer et quitter
                </Tap>
              </div>
            )}

            {(phase === "card" || choosing) && !lastOne && (
              <Tap onClick={() => void act("finish")} className="text-[12px] text-paper/35 underline-offset-4 hover:underline">
                Terminer la soirée
              </Tap>
            )}
          </>
        )}

        {mode === "full" && (
          <div data-rise className="space-y-4">
            <p className="display text-[20px] italic text-paper/70">Beaucoup de monde ce soir. Réessayez dans un instant.</p>
            <Tap onClick={() => leave(false)} className="rounded-full border border-white/15 px-6 py-3 text-[14px]">
              Retour
            </Tap>
          </div>
        )}
      </div>
      {moodOpen && shown && (
        <Sheet title="Ambiance" label="Choisir l'ambiance" onClose={() => setMoodOpen(false)}>
          <div className="pb-2">
            <Criteria
              value={shown.criteria}
              themes={shown.themes}
              matching={shown.matching}
              onChange={(u) => void changeCriteria(u)}
            />
            <p className="display mt-5 text-center text-[14px] italic text-paper/40">Appliqué aux prochaines cartes.</p>
          </div>
        </Sheet>
      )}
      {historyOpen && shown && <History items={shown.history} onClose={() => setHistoryOpen(false)} />}
    </Screen>
  );
}
