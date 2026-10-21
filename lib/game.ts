import { COLOR_COUNT, SYMBOL_COUNT } from "./palette";
import { DEFAULT_CRITERIA, matches, QUESTIONS, THEMES, type Criteria, type Question } from "./questions";
import { store } from "./store";

/** how long a drawn card keeps its back reserved */
const HOLD_SEC = 120;
/** both screens flip together this long after the match, in server time */
const FLIP_DELAY_MS = 2600;
const SESSION_SEC = 60 * 60 * 6;

type Card = {
  id: string;
  color: number;
  symbol: number;
  state: "waiting" | "matched";
  expiresAt: number;
  flipAt?: number;
};

type Session = {
  /** monotonic counter, bumped by every change; lets both phones detect and dedupe moves */
  step: number;
  turn: "a" | "b";
  /** "setup": the pair picks depth and themes before the first hand is dealt */
  phase: "card" | "choose" | "setup";
  /** question on the table (meaningful in phase "card") */
  current: number;
  /** three face-down candidates (phase "choose") */
  hand: number[];
  criteria: Criteria;
  /** slot the last pick came from, so the other phone can replay the gesture */
  lastPick?: number;
  /** the first hand is only dealt once the pair has seen the criteria screen */
  configured: boolean;
  /** questions already put down, oldest first (the one on the table is not in it) */
  history: number[];
};

const rand = (n: number) => Math.floor(Math.random() * n);
const newId = () => crypto.randomUUID().replace(/-/g, "").slice(0, 12);
const backKey = (color: number, symbol: number) => `back:${color}:${symbol}`;

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


export class GameFullError extends Error {}

/** Reserve a unique back. Prefers a colour nobody holds, so the partner needs one tap. */
export async function drawCard() {
  const all: [number, number][] = [];
  for (let c = 0; c < COLOR_COUNT; c++) for (let s = 0; s < SYMBOL_COUNT; s++) all.push([c, s]);

  for (let attempt = 0; attempt < 6; attempt++) {
    const held = await store.mget<string>(all.map(([c, s]) => backKey(c, s)));
    const busyColors = new Set<number>();
    const free: [number, number][] = [];
    held.forEach((id, i) => {
      if (id) busyColors.add(all[i][0]);
      else free.push(all[i]);
    });
    const freeColors = free.filter(([c]) => !busyColors.has(c));
    const pool = freeColors.length ? freeColors : free;
    if (!pool.length) throw new GameFullError();

    const [color, symbol] = pool[rand(pool.length)];
    const id = newId();
    if (!(await store.setNX(backKey(color, symbol), id, HOLD_SEC))) continue;

    const card: Card = { id, color, symbol, state: "waiting", expiresAt: Date.now() + HOLD_SEC * 1000 };
    await store.set(`card:${id}`, card, HOLD_SEC + 30);
    return { id, color, symbol, expiresAt: card.expiresAt, now: Date.now() };
  }
  throw new GameFullError();
}

export async function cardStatus(id: string) {
  const now = Date.now();
  const card = await store.get<Card>(`card:${id}`);
  if (!card) return { state: "expired" as const, now };
  if (card.state === "matched") {
    return { state: "matched" as const, sessionId: card.id, flipAt: card.flipAt!, now };
  }
  if (now > card.expiresAt) return { state: "expired" as const, now };
  return { state: "waiting" as const, expiresAt: card.expiresAt, now };
}

export async function cancelCard(id: string) {
  const card = await store.get<Card>(`card:${id}`);
  if (!card || card.state !== "waiting") return;
  await store.del(backKey(card.color, card.symbol), `card:${id}`);
}

export type FindResult =
  | { result: "none" }
  | { result: "need-symbol" }
  | { result: "matched"; sessionId: string; color: number; symbol: number; flipAt: number; now: number };

/** The partner points at a colour (and a symbol when the colour is shared). */
export async function findCard(color: number, symbol?: number): Promise<FindResult> {
  const symbols = symbol === undefined ? Array.from({ length: SYMBOL_COUNT }, (_, s) => s) : [symbol];
  const held = await store.mget<string>(symbols.map((s) => backKey(color, s)));
  const hits = held.filter((id): id is string => !!id);

  if (hits.length === 0) return { result: "none" };
  if (hits.length > 1) return { result: "need-symbol" };

  const id = hits[0];
  // only one finder can win a card
  if (!(await store.setNX(`claim:${id}`, 1, 60))) return { result: "none" };
  const card = await store.get<Card>(`card:${id}`);
  if (!card || card.state !== "waiting") return { result: "none" };

  const now = Date.now();
  const flipAt = now + FLIP_DELAY_MS;
  // the opening question is always a light one, whatever the criteria will be
  const openers = QUESTIONS.map((q, i) => (q.depth === 1 ? i : -1)).filter((i) => i >= 0);
  const session: Session = {
    step: 0,
    turn: Math.random() < 0.5 ? "a" : "b",
    phase: "card",
    current: openers[rand(openers.length)],
    hand: [],
    criteria: DEFAULT_CRITERIA,
    configured: false,
    history: [],
  };
  await store.set(`sess:${id}`, session, SESSION_SEC);
  await store.set(`card:${id}`, { ...card, state: "matched", flipAt } satisfies Card, 600);
  await store.del(backKey(card.color, card.symbol));
  return { result: "matched", sessionId: id, color: card.color, symbol: card.symbol, flipAt, now };
}

export type SessionView = {
  step: number;
  turn: "a" | "b";
  phase: "card" | "choose" | "setup";
  /** set in phase "card" */
  question: Question | null;
  /** set in phase "choose": theme and depth only, the text stays hidden until picked */
  hand: Pick<Question, "theme" | "depth">[];
  /** in phase "card": which of the three cards was turned, if the question came from a hand */
  pickedSlot: number | null;
  criteria: Criteria;
  /** every theme in the bank, for the criteria screen */
  themes: string[];
  /** how many questions in the bank fit the criteria */
  matching: number;
  /** questions already put down, newest first (the one on the table is not in it) */
  history: Question[];
  now: number;
};

function view(s: Session): SessionView {
  return {
    step: s.step,
    turn: s.turn,
    phase: s.phase,
    question: s.phase === "card" ? QUESTIONS[s.current] : null,
    hand: s.phase === "choose" ? s.hand.map((id) => ({ theme: QUESTIONS[id].theme, depth: QUESTIONS[id].depth })) : [],
    pickedSlot: s.phase === "card" && s.lastPick !== undefined ? s.lastPick : null,
    criteria: s.criteria,
    themes: THEMES,
    matching: QUESTIONS.filter((q) => matches(q, s.criteria)).length,
    history: s.history.map((id) => QUESTIONS[id]).reverse(),
    now: Date.now(),
  };
}

const isSession = (s: Session | null): s is Session => !!s && !!s.criteria;

export async function sessionView(id: string): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  return isSession(s) ? view(s) : null;
}

/**
 * Up to three candidates that fit the criteria, unseen ones first, then already-seen ones.
 * If nothing fits at all, deals random cards so the game never stalls.
 */
function deal(s: Session): number[] {
  const all = QUESTIONS.map((_, i) => i).filter((i) => i !== s.current);
  const fit = shuffle(all.filter((i) => matches(QUESTIONS[i], s.criteria)));
  const unseen = fit.filter((i) => !s.history.includes(i));
  const seen = fit.filter((i) => s.history.includes(i));
  // a narrow filter gives a smaller hand rather than off-criteria cards; only an empty match relaxes
  const hand = [...unseen, ...seen].slice(0, 3);
  return hand.length ? hand : shuffle(all).slice(0, 3);
}

/** Put the card down. The first time the pair sets the mood, afterwards a hand is dealt. Idempotent per `step`. */
export async function nextQuestion(id: string, step: number): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  if (s.step === step && s.phase === "card") {
    s.history.push(s.current);
    s.lastPick = undefined;
    if (s.configured) {
      s.hand = deal(s);
      s.phase = "choose";
    } else {
      s.phase = "setup";
    }
    s.turn = s.turn === "a" ? "b" : "a";
    s.step += 1;
    await store.set(`sess:${id}`, s, SESSION_SEC);
  }
  return view(s);
}

/** Either player can adjust the mood at any time; it applies to the next hand. Last write wins. */
export async function setCriteria(id: string, criteria: Criteria): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  s.criteria = criteria;
  await store.set(`sess:${id}`, s, SESSION_SEC);
  return view(s);
}

/** Leave the criteria screen and deal the first hand. */
export async function startQuestions(id: string, step: number): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  if (s.step === step && s.phase === "setup") {
    s.configured = true;
    s.hand = deal(s);
    s.phase = "choose";
    s.step += 1;
    await store.set(`sess:${id}`, s, SESSION_SEC);
  }
  return view(s);
}

/** Turn a candidate face up; the other two stay in the bank. */
export async function pickQuestion(id: string, step: number, slot: number): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  if (s.step === step && s.phase === "choose" && slot >= 0 && slot < s.hand.length) {
    s.current = s.hand[slot];
    s.lastPick = slot;
    s.hand = [];
    s.phase = "card";
    s.step += 1;
    await store.set(`sess:${id}`, s, SESSION_SEC);
  }
  return view(s);
}
