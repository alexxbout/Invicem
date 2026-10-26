export type Question = {
  text: string;
  theme: string;
  /** 1 = léger, 2 = personnel, 3 = profond */
  depth: 1 | 2 | 3;
  /** a golden card, dealt now and then */
  rare?: boolean;
  /** written by one of the players on a blank card */
  written?: boolean;
  /** a card both players answer at once, in secret, then reveal together */
  duo?: Duo;
};

/**
 * "scale": each puts a cursor between two words. "word": each writes a single word.
 * Both answer for themselves; the two answers turn over at the same instant.
 */
export type Duo = { kind: "scale"; low: string; high: string } | { kind: "word" };

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

/**
 * Rare cards: bolder or more playful, dealt about once every eight hands, never filtered by
 * theme. They carry their own small labels.
 */
export const RARE_QUESTIONS: Question[] = [
  { theme: "Audace", depth: 2, text: "Dis-moi une chose que tu n'oses pas me demander." },
  { theme: "Audace", depth: 3, text: "Qu'est-ce que tu ne m'as jamais dit, parce que tu avais peur de ma réaction ?" },
  { theme: "Audace", depth: 2, text: "Quelle est la chose la plus folle que tu aimerais vivre avec moi ?" },
  { theme: "Audace", depth: 1, text: "Fais-moi un compliment que personne ne t'a jamais entendu faire." },
  { theme: "Confidence", depth: 3, text: "Quand t'es-tu senti(e) le plus seul(e) au monde ?" },
  { theme: "Confidence", depth: 3, text: "Quel rêve as-tu abandonné, et est-ce qu'il te manque ?" },
  { theme: "Confidence", depth: 2, text: "Quel secret d'enfance n'as-tu jamais raconté ?" },
  { theme: "Confidence", depth: 2, text: "De quoi es-tu le plus fier(e), en secret ?" },
  { theme: "Vertige", depth: 3, text: "Si tu savais que tout s'arrête dans un an, que changerais-tu dès demain ?" },
  { theme: "Vertige", depth: 3, text: "Qu'aimerais-tu que je comprenne de toi, même si tu ne sais pas l'expliquer ?" },
  { theme: "Vertige", depth: 2, text: "Quelle question aimerais-tu qu'on te pose plus souvent ?" },
  { theme: "Vertige", depth: 3, text: "À quel moment as-tu senti que ta vie prenait un tournant ?" },
  { theme: "Jeu", depth: 1, text: "Imite-moi pendant dix secondes. Je jugerai." },
  { theme: "Jeu", depth: 1, text: "Décris-moi en trois mots. Puis je fais pareil pour toi." },
  { theme: "Jeu", depth: 1, text: "Devine : quel est mon plus grand plaisir coupable ?" },
  { theme: "Jeu", depth: 2, text: "Raconte notre rencontre comme si c'était un film. Quel genre ?" },
  { theme: "Jeu", depth: 1, text: "Si on partait demain, sans bagage, où irait-on ?" },
  { theme: "Regard", depth: 2, text: "Qu'est-ce que tu as remarqué chez moi ce soir et que tu n'avais jamais vu ?" },
  { theme: "Regard", depth: 3, text: "Qu'est-ce que tu admires chez moi, sans jamais me l'avoir dit ?" },
  { theme: "Regard", depth: 2, text: "À ton avis, qu'est-ce que je cache le mieux ?" },
];

const scale = (low: string, high: string): Duo => ({ kind: "scale", low, high });
const word: Duo = { kind: "word" };

/**
 * Duo cards, slipped into a hand now and then. Both players answer on their own phone,
 * in secret, then the two answers are revealed side by side and talked about.
 */
export const DUO_QUESTIONS: Question[] = [
  { theme: "Goûts", depth: 1, text: "Plutôt soirée tranquille ou nuit qui dure ?", duo: scale("Tranquille", "Jusqu'au bout") },
  { theme: "Envies", depth: 1, text: "Plutôt casanier ou aventurier ?", duo: scale("Casanier", "Aventurier") },
  { theme: "Quotidien", depth: 1, text: "Plutôt du matin ou du soir ?", duo: scale("Du matin", "Du soir") },
  { theme: "Quotidien", depth: 1, text: "Ton bureau, ta chambre : plutôt rangé ou chaos créatif ?", duo: scale("Rangé", "Chaos") },
  { theme: "Regard", depth: 1, text: "Dans un groupe, plutôt discret ou au centre ?", duo: scale("Discret", "Au centre") },
  { theme: "Valeurs", depth: 2, text: "Face à une décision, plutôt la tête ou le cœur ?", duo: scale("La tête", "Le cœur") },
  { theme: "Peurs", depth: 2, text: "À quel point as-tu peur de décevoir les autres ?", duo: scale("Pas du tout", "Énormément") },
  { theme: "Relation", depth: 2, text: "Pour te sentir aimé(e), plutôt les mots ou les gestes ?", duo: scale("Les mots", "Les gestes") },
  { theme: "Souvenirs", depth: 2, text: "Ton enfance, plutôt légère ou lourde à porter ?", duo: scale("Légère", "Lourde") },
  { theme: "Envies", depth: 2, text: "Ta vie aujourd'hui : plutôt celle que tu voulais, ou loin de là ?", duo: scale("Loin de là", "Exactement") },
  { theme: "Valeurs", depth: 3, text: "À quel point te sens-tu libre d'être toi-même ?", duo: scale("Pas libre", "Totalement") },
  { theme: "Relation", depth: 3, text: "À quel point est-ce facile pour toi de demander de l'aide ?", duo: scale("Impossible", "Très facile") },
  { theme: "Souvenirs", depth: 1, text: "Un mot pour ton enfance.", duo: word },
  { theme: "Goûts", depth: 1, text: "Un mot pour ton dimanche idéal.", duo: word },
  { theme: "Quotidien", depth: 1, text: "Un mot pour ta semaine.", duo: word },
  { theme: "Envies", depth: 1, text: "Un mot pour l'endroit où tu aimerais être, là, maintenant.", duo: word },
  { theme: "Regard", depth: 2, text: "Un mot que tes proches utilisent pour te décrire.", duo: word },
  { theme: "Valeurs", depth: 2, text: "Un mot pour ce qui compte le plus pour toi.", duo: word },
  { theme: "Peurs", depth: 2, text: "Un mot pour ce qui t'empêche parfois de dormir.", duo: word },
  { theme: "Relation", depth: 2, text: "Un mot pour ce que tu attends de quelqu'un qui t'aime.", duo: word },
  { theme: "Envies", depth: 3, text: "Un mot pour la personne que tu voudrais devenir.", duo: word },
  { theme: "Souvenirs", depth: 3, text: "Un mot pour le moment qui t'a le plus changé(e).", duo: word },
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
