export type Question = {
  text: string;
  theme: string;
  /** 1 = léger, 2 = personnel, 3 = profond */
  depth: 1 | 2 | 3;
};

// Placeholder deck, to be replaced by the real one.
export const QUESTIONS: Question[] = [
  { theme: "Souvenirs", depth: 1, text: "Quel est le premier souvenir qui te vient quand tu penses à l'enfance ?" },
  { theme: "Quotidien", depth: 1, text: "Quel petit rituel de ta journée ne changerais-tu pour rien au monde ?" },
  { theme: "Goûts", depth: 1, text: "Quelle chanson te met de bonne humeur à coup sûr ?" },
  { theme: "Envies", depth: 1, text: "Si tu avais une semaine entière sans obligation, que ferais-tu ?" },
  { theme: "Souvenirs", depth: 2, text: "Quel moment de ta vie voudrais-tu revivre une seule fois, en entier ?" },
  { theme: "Valeurs", depth: 2, text: "Qu'est-ce qui te fait te sentir vraiment respecté(e) ?" },
  { theme: "Peurs", depth: 2, text: "De quoi as-tu peur, sans l'avoir jamais dit à voix haute ?" },
  { theme: "Relation", depth: 2, text: "Quel geste de ma part te touche le plus, même discret ?" },
  { theme: "Envies", depth: 2, text: "Quelle version de toi aimerais-tu rencontrer dans dix ans ?" },
  { theme: "Valeurs", depth: 3, text: "Qu'as-tu appris de plus difficile sur toi-même ces dernières années ?" },
  { theme: "Relation", depth: 3, text: "Dans quelle situation as-tu le plus besoin de moi sans oser le demander ?" },
  { theme: "Peurs", depth: 3, text: "Quelle blessure t'a le plus façonné(e) ?" },
  // Regard: how others see you. Works on a first evening, no need to know each other yet.
  { theme: "Regard", depth: 1, text: "Quelle première impression penses-tu laisser aux gens ? Est-elle juste ?" },
  { theme: "Regard", depth: 1, text: "Pour quoi tes amis t'appellent-ils en premier ?" },
  { theme: "Regard", depth: 2, text: "Si tes amis devaient te décrire avec une qualité et un défaut, que diraient-ils ?" },
  { theme: "Regard", depth: 2, text: "Comment ta famille te décrirait-elle en trois mots ? Serais-tu d'accord ?" },
  { theme: "Regard", depth: 2, text: "Quel malentendu à ton sujet revient souvent ?" },
  { theme: "Regard", depth: 3, text: "Qu'est-ce que l'enfant que tu étais penserait de la personne que tu es devenue ?" },
  { theme: "Regard", depth: 3, text: "Qu'est-ce qu'on te reproche parfois et qui, au fond, est vrai ?" },
];

/** The shared last card of an evening; both answer it. */
export const CLOSING: Question = {
  theme: "Pour finir",
  depth: 3,
  text: "Qu'as-tu découvert de l'autre ce soir ?",
};

export type Depth = Question["depth"];

/** What the pair wants to talk about tonight. Empty `themes` means every theme. */
export type Criteria = { depths: Depth[]; themes: string[] };

export const DEFAULT_CRITERIA: Criteria = { depths: [1, 2, 3], themes: [] };

export const THEMES = [...new Set(QUESTIONS.map((q) => q.theme))];

export const matches = (q: Question, c: Criteria) =>
  c.depths.includes(q.depth) && (c.themes.length === 0 || c.themes.includes(q.theme));

/** Parse untrusted input; returns null when unusable. */
export function parseCriteria(raw: unknown): Criteria | null {
  const r = raw as { depths?: unknown; themes?: unknown } | null;
  if (!Array.isArray(r?.depths) || !Array.isArray(r?.themes)) return null;
  const depths = ([1, 2, 3] as Depth[]).filter((d) => (r.depths as unknown[]).includes(d));
  const themes = THEMES.filter((t) => (r.themes as unknown[]).includes(t));
  return depths.length ? { depths, themes } : null;
}
