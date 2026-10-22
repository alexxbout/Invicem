export const DEPTH_LABELS: Record<1 | 2 | 3, string> = { 1: "Effleurer", 2: "Se confier", 3: "Se dévoiler" };

/** each theme borrows a symbol from the card backs (index into SYMBOLS) */
export const THEME_GLYPH: Record<string, number> = {
  Souvenirs: 10,
  Quotidien: 0,
  Goûts: 4,
  Envies: 2,
  Valeurs: 11,
  Peurs: 1,
  Relation: 8,
  Regard: 6,
  "Pour finir": 9,
};
