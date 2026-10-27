import { COLOR_COUNT, SYMBOL_COUNT } from "./palette";
import { CLOSING, DEFAULT_CRITERIA, DUO_QUESTIONS, matches, QUESTIONS, RARE_QUESTIONS, THEMES, type Criteria, type Question } from "./questions";
import { store } from "./store";

/** how long a drawn card keeps its back reserved */
const HOLD_SEC = 120;
/** both screens flip together this long after the match, in server time */
const FLIP_DELAY_MS = 2600;
/**
 * A game nobody has played for this long is abandoned: every move pushes it back, merely
 * looking at it does not. Its colour was already freed when the two cards met.
 */
const SESSION_SEC = 60 * 60;
/** questions in an evening before the closing card is offered */
const EVENING = 7;

type Card = {
  id: string;
  color: number;
  symbol: number;
  state: "waiting" | "matched";
  expiresAt: number;
  flipAt?: number;
};

/**
 * "write": the picker of a blank card writes their own question.
 * "words": after the closing card, each writes one word; "reveal": both words turn at once.
 */
type Phase = "card" | "choose" | "setup" | "closing" | "write" | "words" | "reveal" | "end";

/** every card id: >= 0 is in DECK (regular then rare), BLANK is the blank card, <= -2 a written one */
const DECK: Question[] = [...QUESTIONS, ...RARE_QUESTIONS.map((q) => ({ ...q, rare: true })), ...DUO_QUESTIONS];
const BLANK = -1;
const RARE_FROM = QUESTIONS.length;
const DUO_FROM = RARE_FROM + RARE_QUESTIONS.length;
/**
 * Each player is offered the blank card at their first pick from this question of the evening,
 * and once more from BLANK_AGAIN if they let it go; never again once they have written one.
 */
const BLANK_AT = 3;
const BLANK_AGAIN = 6;
/** chance that a hand holds a rare card */
const RARE_ODDS = 1 / 8;
/** chance that a hand holds a duo card (answered by both, in secret) */
const DUO_ODDS = 1 / 3;
/** a little time before the duo answers turn over, so both phones are ready */
const DUO_REVEAL_MS = 1400;

type Session = {
  /** monotonic counter, bumped by every change; lets both phones detect and dedupe moves */
  step: number;
  turn: "a" | "b";
  /**
   * "setup": the pair picks depth and themes before the first hand is dealt.
   * "closing": the shared last card. "end": the recap of the evening.
   */
  phase: Phase;
  /** the closing card comes once this many questions have been asked; grows by EVENING on "continue" */
  goal: number;
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
  /** jokers each player has already played: the one answering may pass a card */
  spent?: Record<"a" | "b", JokerKind[]>;
  /** which joker the last pass used, so both phones show the same card */
  lastJoker?: JokerKind;
  /** questions passed tonight, never dealt again */
  skipped?: number[];
  /** the last move was a pass, so the picker hears why they pick again */
  passed?: boolean;
  /** questions the players wrote on blank cards */
  custom?: string[];
  /** how many times each player was offered the blank card this evening */
  blankOffers?: Partial<Record<"a" | "b", number>>;
  /** players who already wrote a question this evening */
  blankUsed?: Partial<Record<"a" | "b", boolean>>;
  /** last words, one per player, hidden until both are in */
  words?: Partial<Record<"a" | "b", string>>;
  /** server time at which both phones turn the words over together */
  revealAt?: number;
  /** on a duo card: each player's secret answer (a 0..100 position or a word), and when they turn over */
  duo?: { a?: number | string; b?: number | string; revealAt?: number };
};

/** every player holds a single joker for the evening */
export const JOKER_KINDS = ["paper"] as const;
export type JokerKind = (typeof JOKER_KINDS)[number];

const left = (s: Session, role: "a" | "b") => JOKER_KINDS.filter((k) => !(s.spent?.[role] ?? []).includes(k));

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
/** colours drawn more often: Vermillon (0), Ambre (1), Améthyste (5) */
const FAVOURED = new Set([0, 1, 5]);

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

    // the warm golds, reds and violets show off the table best: they come up more often
    const weights = pool.map(([c]) => FAVOURED.has(c) ? 2.5 : 1);
    let roll = Math.random() * weights.reduce((a, w) => a + w, 0);
    let pick = 0;
    while (roll >= weights[pick] && pick < pool.length - 1) roll -= weights[pick++];
    const [color, symbol] = pool[pick];
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
    goal: EVENING,
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
  phase: Phase;
  /** set in phase "card", and the shared last card in phase "closing" */
  question: Question | null;
  /** set in phase "choose": theme and depth only, the text stays hidden until picked */
  hand: HandCard[];
  /** in phase "card": which of the three cards was turned, if the question came from a hand */
  pickedSlot: number | null;
  /** questions asked so far tonight, the one on the table included */
  round: number;
  /** the closing card is offered once `round` reaches this */
  goal: number;
  criteria: Criteria;
  /** every theme in the bank, for the criteria screen */
  themes: string[];
  /** how many questions in the bank fit the criteria */
  matching: number;
  /** questions already put down, newest first (the one on the table is not in it) */
  history: Question[];
  /** jokers each player still holds */
  jokers: Record<"a" | "b", JokerKind[]>;
  /** in phase "choose": the hand comes from a passed card */
  passed: boolean;
  /** the joker that was just played, when `passed` */
  lastJoker: JokerKind | null;
  /** who has already sealed a last word */
  sealed: Record<"a" | "b", boolean>;
  /** both last words, once both are in */
  words: Record<"a" | "b", string> | null;
  /** server time of the shared reveal of the words */
  revealAt: number | null;
  /** on a duo card: who has answered, both answers once both are in, and when they turn over */
  duo: {
    sealed: Record<"a" | "b", boolean>;
    answers: Record<"a" | "b", number | string> | null;
    revealAt: number | null;
  } | null;
  now: number;
};

export type HandCard = Pick<Question, "theme" | "depth"> & { rare?: boolean; blank?: boolean; duo?: boolean };

const BLANK_CARD: Question = { theme: "Carte blanche", depth: 2, text: "" };

/** any card id to its question, including blank and written ones */
function qOf(s: Session, id: number): Question {
  if (id === BLANK) return BLANK_CARD;
  if (id <= -2) return { theme: "Carte blanche", depth: 2, text: s.custom?.[-id - 2] ?? "", written: true };
  return DECK[id];
}

const roundOf = (s: Session) => s.history.length + (s.phase === "card" ? 1 : 0);

function view(s: Session): SessionView {
  return {
    step: s.step,
    turn: s.turn,
    phase: s.phase,
    question: s.phase === "card" ? qOf(s, s.current) : s.phase === "closing" ? CLOSING : null,
    hand:
      s.phase === "choose"
        ? s.hand.map((id) =>
            id === BLANK
              ? { theme: "Carte blanche", depth: 2, blank: true }
              : { theme: DECK[id].theme, depth: DECK[id].depth, rare: !!DECK[id].rare, duo: !!DECK[id].duo },
          )
        : [],
    pickedSlot: s.phase === "card" && s.lastPick !== undefined ? s.lastPick : null,
    round: roundOf(s),
    goal: s.goal,
    criteria: s.criteria,
    themes: THEMES,
    matching: QUESTIONS.filter((q) => matches(q, s.criteria)).length,
    history: s.history.map((id) => qOf(s, id)).reverse(),
    jokers: { a: left(s, "a"), b: left(s, "b") },
    passed: s.phase === "choose" && !!s.passed,
    lastJoker: s.phase === "choose" && s.passed ? (s.lastJoker ?? null) : null,
    sealed: { a: !!s.words?.a, b: !!s.words?.b },
    words: (s.phase === "reveal" || s.phase === "end") && s.words?.a && s.words?.b ? { a: s.words.a, b: s.words.b } : null,
    revealAt: s.phase === "reveal" ? (s.revealAt ?? null) : null,
    duo:
      s.phase === "card" && qOf(s, s.current).duo
        ? {
            sealed: { a: s.duo?.a !== undefined, b: s.duo?.b !== undefined },
            answers: s.duo?.a !== undefined && s.duo?.b !== undefined ? { a: s.duo.a, b: s.duo.b } : null,
            revealAt: s.duo?.revealAt ?? null,
          }
        : null,
    now: Date.now(),
  };
}

const isSession = (s: Session | null): s is Session => !!s && !!s.criteria && typeof s.goal === "number";

export async function sessionView(id: string): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  return isSession(s) ? view(s) : null;
}

/**
 * Depth the evening has reached: light first, then deeper, like a real conversation.
 * The allowed depths are spread over the EVENING questions of the current stretch.
 */
function targetDepth(s: Session): number {
  const depths = [...s.criteria.depths].sort();
  const upcoming = s.history.length + 1;
  const into = (upcoming - (s.goal - EVENING)) / EVENING;
  return depths[Math.max(0, Math.min(depths.length - 1, Math.floor(into * depths.length - 1e-9)))];
}

/**
 * Up to three candidates that fit the criteria: unseen before seen, and closest to the depth
 * the evening has reached. If nothing fits at all, deals random cards so the game never stalls.
 */
function deal(s: Session): number[] {
  const skipped = s.skipped ?? [];
  const all = QUESTIONS.map((_, i) => i).filter((i) => i !== s.current && !skipped.includes(i));
  const fit = shuffle(all.filter((i) => matches(QUESTIONS[i], s.criteria)));
  const target = targetDepth(s);
  const score = (i: number) => (s.history.includes(i) ? 10 : 0) + Math.abs(QUESTIONS[i].depth - target);
  // a narrow filter gives a smaller hand rather than off-criteria cards; only an empty match relaxes
  const hand = [...fit].sort((x, y) => score(x) - score(y)).slice(0, 3);
  const dealt = hand.length ? hand : shuffle(all).slice(0, 3);

  // now and then a duo card slips in, fitting the mood like any other
  const duos = DECK.map((_, i) => i).filter(
    (i) => i >= DUO_FROM && !s.history.includes(i) && !skipped.includes(i) && matches(DECK[i], s.criteria),
  );
  if (duos.length && dealt.length && Math.random() < DUO_ODDS) {
    dealt[rand(dealt.length)] = duos[rand(duos.length)];
    return dealt;
  }
  // the picker (whose turn it is) may get the blank card to write their own question
  const upcoming = s.history.length + 1 - (s.goal - EVENING);
  const picker = s.turn;
  const offers = s.blankOffers?.[picker] ?? 0;
  const due = (offers === 0 && upcoming >= BLANK_AT) || (offers === 1 && upcoming >= BLANK_AGAIN);
  if (!s.blankUsed?.[picker] && due && dealt.length) {
    s.blankOffers = { ...s.blankOffers, [picker]: offers + 1 };
    dealt[rand(dealt.length)] = BLANK;
    return dealt;
  }
  // now and then a golden card slips in
  const rares = DECK.map((_, i) => i).filter((i) => i >= RARE_FROM && !s.history.includes(i) && !skipped.includes(i));
  if (rares.length && dealt.length && Math.random() < RARE_ODDS) dealt[rand(dealt.length)] = rares[rand(rares.length)];
  return dealt;
}

async function update(id: string, change: (s: Session) => boolean): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  if (change(s)) {
    s.step += 1;
    if (s.phase !== "choose") s.passed = false;
    await store.set(`sess:${id}`, s, SESSION_SEC);
  }
  return view(s);
}

/**
 * Put the card down. The first time the pair sets the mood; once the evening's goal is reached
 * the closing card comes; otherwise a hand is dealt to whoever just answered. From the closing
 * card it moves on to the recap. Idempotent per `step`.
 */
export const nextQuestion = (id: string, step: number) =>
  update(id, (s) => {
    if (s.step !== step) return false;
    if (s.phase === "closing") {
      s.words = {};
      s.revealAt = undefined;
      s.phase = "words";
      return true;
    }
    if (s.phase === "reveal") {
      s.phase = "end";
      return true;
    }
    if (s.phase !== "card") return false;
    s.history.push(s.current);
    s.lastPick = undefined;
    // the one who answered picks next; flip first so the deal knows who is picking
    s.turn = s.turn === "a" ? "b" : "a";
    if (!s.configured) s.phase = "setup";
    else if (s.history.length >= s.goal) s.phase = "closing";
    else {
      s.hand = deal(s);
      s.phase = "choose";
    }
    return true;
  });

/** Either player can adjust the mood at any time; it applies to the next hand. Last write wins. */
export async function setCriteria(id: string, criteria: Criteria): Promise<SessionView | null> {
  const s = await store.get<Session>(`sess:${id}`);
  if (!isSession(s)) return null;
  s.criteria = criteria;
  await store.set(`sess:${id}`, s, SESSION_SEC);
  return view(s);
}

/** Leave the criteria screen and deal the first hand. */
export const startQuestions = (id: string, step: number) =>
  update(id, (s) => {
    if (s.step !== step || s.phase !== "setup") return false;
    s.configured = true;
    s.hand = deal(s);
    s.phase = "choose";
    return true;
  });

/** Turn a candidate face up; the other two stay in the bank. */
export const pickQuestion = (id: string, step: number, slot: number) =>
  update(id, (s) => {
    if (s.step !== step || s.phase !== "choose" || slot < 0 || slot >= s.hand.length) return false;
    s.current = s.hand[slot];
    s.duo = undefined;
    s.lastPick = slot;
    s.passed = false;
    s.hand = [];
    s.phase = s.current === BLANK ? "write" : "card";
    return true;
  });

/** End the evening early: straight to the closing card. */
export const finishEvening = (id: string, step: number) =>
  update(id, (s) => {
    if (s.step !== step || !["card", "choose", "setup", "write"].includes(s.phase)) return false;
    if (s.phase === "card") s.history.push(s.current);
    s.lastPick = undefined;
    s.hand = [];
    s.phase = "closing";
    return true;
  });

/** From the recap, keep playing for another evening's worth of questions. */
export const continueEvening = (id: string, step: number) =>
  update(id, (s) => {
    if (s.step !== step || s.phase !== "end") return false;
    s.goal = s.history.length + EVENING;
    s.blankOffers = undefined;
    s.blankUsed = undefined;
    s.words = undefined;
    s.revealAt = undefined;
    s.configured = true;
    s.turn = s.turn === "a" ? "b" : "a";
    s.hand = deal(s);
    s.phase = "choose";
    return true;
  });

/**
 * The one answering spends a joker: the card goes back unanswered, never to be dealt again
 * tonight, and the same player picks again from a fresh hand. Doesn't count as a question.
 */
export const passQuestion = (id: string, step: number, role: "a" | "b", kind: JokerKind) =>
  update(id, (s) => {
    // a question written by the other player can't be passed
    // nor can a duo card, which both answer together
    if (s.step !== step || s.phase !== "card" || role === s.turn || s.current <= -2 || !!DECK[s.current]?.duo || !left(s, role).includes(kind)) return false;
    s.spent = { a: s.spent?.a ?? [], b: s.spent?.b ?? [] };
    s.spent[role].push(kind);
    s.lastJoker = kind;
    s.skipped = [...(s.skipped ?? []), s.current];
    s.lastPick = undefined;
    s.hand = deal(s);
    s.phase = "choose";
    s.passed = true;
    return true;
  });

const clean = (text: unknown, max: number) =>
  typeof text === "string" ? text.replace(/\s+/g, " ").trim().slice(0, max) : "";

/** The picker of the blank card writes their question; it goes on the table like any other. */
export const writeQuestion = (id: string, step: number, role: "a" | "b", text: unknown) =>
  update(id, (s) => {
    const q = clean(text, 140);
    if (s.step !== step || s.phase !== "write" || role !== s.turn || q.length < 4) return false;
    s.custom = [...(s.custom ?? []), q];
    s.blankUsed = { ...s.blankUsed, [role]: true };
    s.current = -2 - (s.custom.length - 1);
    s.phase = "card";
    return true;
  });

/**
 * On a duo card, each player answers for themselves in secret: a 0..100 position on the scale,
 * or a single word. Once both are in, the two answers turn over together a moment later.
 */
export const answerDuo = (id: string, role: "a" | "b", value: unknown) =>
  update(id, (s) => {
    const q = s.phase === "card" ? qOf(s, s.current) : null;
    if (!q?.duo || s.duo?.[role] !== undefined) return false;
    let answer: number | string;
    if (q.duo.kind === "scale") {
      if (typeof value !== "number" || !Number.isFinite(value)) return false;
      answer = Math.round(Math.max(0, Math.min(100, value)));
    } else {
      answer = clean(value, 28);
      if (!answer) return false;
    }
    s.duo = { ...s.duo, [role]: answer };
    if (s.duo.a !== undefined && s.duo.b !== undefined) s.duo.revealAt = Date.now() + DUO_REVEAL_MS;
    return true;
  });

/** Each seals one last word; when both are in, the pair turns them over together. */
export const sealWord = (id: string, role: "a" | "b", word: unknown) =>
  update(id, (s) => {
    const w = clean(word, 28);
    if (s.phase !== "words" || !w || s.words?.[role]) return false;
    s.words = { ...s.words, [role]: w };
    if (s.words.a && s.words.b) {
      s.phase = "reveal";
      s.revealAt = Date.now() + FLIP_DELAY_MS;
    }
    return true;
  });
