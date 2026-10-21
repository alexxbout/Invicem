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
];
