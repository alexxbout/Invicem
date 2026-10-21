"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";
import {
  call,
  msUntil,
  usePoll,
  writeSaved,
  type Match,
  type Question,
  type Role,
  type SessionView,
} from "@/lib/client";
import { COLORS, SYMBOLS } from "@/lib/palette";
import { setAccent } from "./Ambient";
import { Card } from "./Card";
import { Hand } from "./Hand";
import { History } from "./History";
import { Screen, Wordmark } from "./Screen";

type Mode = "drawing" | "waiting" | "charging" | "open" | "full";

type CardInfo = { id?: string; color: number; symbol: number };

type DrawResponse = { id: string; color: number; symbol: number };
type StatusResponse =
  | { state: "waiting" }
  | { state: "expired" }
  | { state: "matched"; sessionId: string; flipAt: number; now: number };

function QuestionFace({ question }: { question: Question }) {
  return (
    <div className="flex h-full flex-col items-center text-center">
      <div className="pt-[2cqw] text-[3.4cqw] font-medium uppercase tracking-[0.3em] text-[#8a6a33]">
        {question.theme}
      </div>
      <div className="flex flex-1 items-center px-[2cqw]">
        <p className="display text-[7cqw] leading-[1.2]">{question.text}</p>
      </div>
      <div className="flex gap-[2cqw] pb-[2cqw] text-[#b8914d]">
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

  const commitView = (v: SessionView) => {
    shownRef.current = v;
    setShown(v);
  };

  /** first reveal needs the timer AND the question; whichever lands last triggers it */
  const tryReveal = (sid: string) => {
    if (!flipDue.current || !shownRef.current || !alive.current) return;
    flipDue.current = false;
    setModeBoth("open");
    setFlipped(true);
    navigator.vibrate?.([40, 60, 90]);
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
  const showNext = (v: SessionView) => {
    latest.current = v;
    if (busy.current) return;
    if (shownRef.current && v.step === shownRef.current.step) {
      commitView(v);
      return;
    }
    busy.current = true;
    setFirstReveal(false);
    setFlipped(false);
    later(() => {
      const target = latest.current!;
      commitView(target);
      // the card remounts face down when coming back from the hand, give it a beat before flipping
      later(() => {
        if (target.phase === "card") setFlipped(true);
        busy.current = false;
        if (latest.current && latest.current.step !== shownRef.current?.step) showNext(latest.current);
      }, 700);
    }, 650);
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
      { opacity: 0, scale: 0.9, y: 40, filter: "blur(10px)" },
      { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 1, ease: "power3.out" },
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
          setFlipped(data.phase === "card");
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
          filter: "blur(14px)",
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
      if (status === 404) {
        writeSaved(null);
        return onExit();
      }
      if (data) showNext(data);
    },
    1500,
    mode === "open" && shown !== null,
  );

  const next = async () => {
    if (!sessionId || !shownRef.current || busy.current) return;
    const { data } = await call<SessionView>(`/api/session/${sessionId}/next`, "POST", { step: shownRef.current.step });
    if (data && alive.current) showNext(data);
  };

  const pick = async (slot: number) => {
    if (!sessionId || !shownRef.current || busy.current) return;
    const { data } = await call<SessionView>(`/api/session/${sessionId}/pick`, "POST", {
      step: shownRef.current.step,
      slot,
    });
    if (data && alive.current) showNext(data);
  };

  const leave = (forget: boolean) => {
    if (forget) writeSaved(null);
    onExit();
  };

  const color = card ? COLORS[card.color] : null;
  const mine = shown ? shown.turn === role : false;
  const choosing = mode === "open" && shown?.phase === "choose";
  const pastCount = shown?.history.length ?? 0;

  return (
    <Screen>
      <Wordmark
        onBack={() => leave(false)}
        right={
          mode === "open" && pastCount > 0 ? (
            <button
              onClick={() => setHistoryOpen(true)}
              className="flex h-10 items-center gap-2 rounded-full px-3 text-[13px] text-paper/60 transition hover:bg-white/5 hover:text-paper"
            >
              <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <rect x="6" y="4" width="12" height="16" rx="2" />
                <path d="M3 7v11a2 2 0 0 0 2 2M21 7v11" />
              </svg>
              {pastCount}
            </button>
          ) : null
        }
      />

      <div className="flex flex-1 items-center justify-center py-3">
        {choosing && card && shown && (
          <Hand
            key={shown.step}
            color={card.color}
            hand={shown.hand}
            canPick={mine}
            onPick={(slot) => void pick(slot)}
          />
        )}
        <div ref={wrapRef} style={{ opacity: seed ? 1 : 0, display: choosing ? "none" : undefined }}>
          {card && !choosing && (
            <Card
              key={card.id ?? "seed"}
              color={card.color}
              symbol={card.symbol}
              flipped={flipped}
              charging={mode === "charging"}
              duration={firstReveal ? 1.5 : 0.6}
              burst={firstReveal}
              front={shown ? shown.question && <QuestionFace question={shown.question} /> : null}
            />
          )}
        </div>
      </div>

      <div className="flex min-h-[132px] w-full flex-col items-center justify-start gap-4 pb-1 text-center">
        {(mode === "waiting" || mode === "drawing") && (
          <div data-rise className="space-y-2">
            <p className="display text-[22px] font-light leading-snug">
              Montre cet écran à l&apos;autre.
              <br />
              <em className="text-paper/60">Il doit retrouver ta carte.</em>
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
              {note ?? " "}
            </p>
          </div>
        )}

        {mode === "charging" && (
          <p className="display animate-pulse text-[22px] italic text-paper/80">Vous y êtes presque…</p>
        )}

        {mode === "open" && shown && (
          <>
            <p className="flex items-center gap-2.5 text-[14px] text-paper/70" aria-live="polite">
              <span
                className="size-2 rounded-full bg-accent"
                style={{ boxShadow: "0 0 12px var(--accent)", opacity: mine ? 1 : 0.35 }}
              />
              {choosing
                ? mine
                  ? "À toi de choisir une carte"
                  : "L'autre choisit une carte…"
                : mine
                  ? "Tu réponds en premier"
                  : "L'autre répond en premier"}
            </p>
            {choosing ? (
              <p className="display h-[50px] text-[15px] italic text-paper/45">
                {mine ? "Thème et profondeur sont visibles, la question reste cachée." : "\u00a0"}
              </p>
            ) : (
              <button
                onClick={next}
                className="rounded-full border border-white/15 bg-white/[.06] px-8 py-3.5 text-[15px] text-paper backdrop-blur transition active:scale-95"
              >
                Question suivante
              </button>
            )}
            <button onClick={() => leave(true)} className="text-[12px] text-paper/35 underline-offset-4 hover:underline">
              Terminer la partie
            </button>
          </>
        )}

        {mode === "full" && (
          <div data-rise className="space-y-4">
            <p className="display text-[20px] italic text-paper/70">Beaucoup de monde ce soir. Réessayez dans un instant.</p>
            <button onClick={() => leave(false)} className="rounded-full border border-white/15 px-6 py-3 text-[14px]">
              Retour
            </button>
          </div>
        )}
      </div>
      {historyOpen && shown && <History items={shown.history} onClose={() => setHistoryOpen(false)} />}
    </Screen>
  );
}
