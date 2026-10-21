export const COLOR_COUNT = 8;
export const SYMBOL_COUNT = 12;

export type CardColor = {
  name: string;
  from: string;
  to: string;
  /** glyph / ornament colour that stays readable on the gradient */
  ink: string;
};

export const COLORS: CardColor[] = [
  { name: "Vermillon", from: "#ff7a56", to: "#b02416", ink: "#fff6ee" },
  { name: "Ambre", from: "#ffc94d", to: "#bf7208", ink: "#2a1604" },
  { name: "Émeraude", from: "#37dba1", to: "#0a6e52", ink: "#f0fff8" },
  { name: "Lagon", from: "#52dcf0", to: "#0d7690", ink: "#04222a" },
  { name: "Outremer", from: "#6b84ff", to: "#1f2bb0", ink: "#f2f4ff" },
  { name: "Améthyste", from: "#b98aff", to: "#5628ac", ink: "#f7f0ff" },
  { name: "Rose", from: "#ff86bf", to: "#a82a68", ink: "#fff1f7" },
  { name: "Argent", from: "#f0ecf6", to: "#8b8499", ink: "#231d2e" },
];

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export type CardSymbol = { name: string; d: string[] };

export const SYMBOLS: CardSymbol[] = [
  {
    name: "Soleil",
    d: [
      circle(12, 12, 4),
      "M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1",
    ],
  },
  { name: "Lune", d: ["M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"] },
  {
    name: "Étoile",
    d: ["M12 3l2.7 5.9 6.3.7-4.7 4.3 1.3 6.3L12 17l-5.6 3.2 1.3-6.3L3 9.6l6.3-.7z"],
  },
  { name: "Goutte", d: ["M12 3c3.5 4.5 6 7.5 6 11a6 6 0 0 1-12 0c0-3.5 2.5-6.5 6-11z"] },
  {
    name: "Flamme",
    d: ["M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 .3 1.5 1 2 2 2-.5-3 0-6 1-8z"],
  },
  { name: "Feuille", d: ["M5 19C5 10 10 5 20 4c0 10-4 15-13 15", "M5 19l8-8"] },
  {
    name: "Œil",
    d: ["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z", circle(12, 12, 3)],
  },
  { name: "Clé", d: [circle(8, 12, 4), "M12 12h9M18 12v3M21 12v2"] },
  { name: "Cœur", d: ["M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"] },
  {
    name: "Vague",
    d: ["M2 9c3-3 5-3 8 0s5 3 8 0 3-1 4 0", "M2 15c3-3 5-3 8 0s5 3 8 0 3-1 4 0"],
  },
  {
    name: "Spirale",
    d: ["M12 12a1.5 1.5 0 0 1 3 0a3 3 0 0 1-6 0a4.5 4.5 0 0 1 9 0a6 6 0 0 1-12 0a7.5 7.5 0 0 1 15 0"],
  },
  { name: "Montagne", d: ["M2 19l7-12 4 7 3-4 6 9z"] },
];
