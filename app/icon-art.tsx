/**
 * App icon candidates, drawn with plain divs and SVG so they render both in the browser
 * (to compare them) and through next/og (to export the PNG).
 */
export type IconVariant = "pair" | "seal" | "monogram" | "jester";

const NIGHT = "radial-gradient(circle at 50% 40%, #3a1f4f 0%, #1d1426 55%, #130f1a 100%)";

function Frame({ size, children }: { size: number; children: React.ReactNode }) {
  return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: NIGHT, position: "relative" }}>
      {children}
    </div>
  );
}

export function IconArt({ size, variant = "pair" }: { size: number; variant?: IconVariant }) {
  const u = size / 100;
  if (variant === "pair") {
    // two cards leaning on each other: one face down, one face up: l'un l'autre
    return (
      <Frame size={size}>
        <div style={{ position: "absolute", width: 40 * u, height: 56 * u, left: 22 * u, top: 20 * u, borderRadius: 4 * u, transform: "rotate(-12deg)", background: "linear-gradient(150deg,#b98aff,#4b1f73)", border: `${1.2 * u}px solid #e0b54a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 18 * u, height: 18 * u, borderRadius: 18 * u, border: `${1 * u}px solid #f3d27a` }} />
        </div>
        <div style={{ position: "absolute", width: 40 * u, height: 56 * u, left: 40 * u, top: 24 * u, borderRadius: 4 * u, transform: "rotate(10deg)", background: "linear-gradient(165deg,#f8f0e3,#e3d3ba)", border: `${1.2 * u}px solid #e0b54a`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3 * u }}>
          <div style={{ width: 22 * u, height: 1.6 * u, background: "#8a6a33" }} />
          <div style={{ width: 16 * u, height: 1.6 * u, background: "#8a6a33" }} />
          <div style={{ width: 20 * u, height: 1.6 * u, background: "#8a6a33" }} />
        </div>
      </Frame>
    );
  }
  if (variant === "seal") {
    // a red wax seal with a gold star: the sealed last words
    return (
      <Frame size={size}>
        <div style={{ width: 62 * u, height: 62 * u, borderRadius: 62 * u, background: "radial-gradient(circle at 38% 32%, #d4485c, #8e1b30 60%, #5e0f1e)", boxShadow: `0 0 0 ${3 * u}px rgba(224,181,74,.55)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 44 * u, height: 44 * u, borderRadius: 44 * u, border: `${1 * u}px solid rgba(243,210,122,.7)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#f3d27a", fontSize: 26 * u }}>
            ✦
          </div>
        </div>
      </Frame>
    );
  }
  if (variant === "monogram") {
    // a gold engraved I in a double ring, like the title
    return (
      <Frame size={size}>
        <div style={{ width: 70 * u, height: 70 * u, borderRadius: 70 * u, border: `${1.6 * u}px solid #e0b54a`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 61 * u, height: 61 * u, borderRadius: 61 * u, border: `${0.8 * u}px solid rgba(224,181,74,.5)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#e9c46a", fontSize: 44 * u, fontFamily: "Georgia, serif", lineHeight: 1 }}>
            I
          </div>
        </div>
      </Frame>
    );
  }
  // the joker's cap, in gold on night
  return (
    <Frame size={size}>
      <svg width={70 * u} height={70 * u} viewBox="0 0 24 24" fill="none" stroke="#e0b54a" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5.2 15C4.4 9 3 5.5 2.2 12.4C3.8 8.5 6.6 8 8.6 15C9.2 9.4 10.6 4.6 14.6 3.8C12.9 5.6 13.9 10 15.4 15C17.4 8 20.2 8.5 21.8 12.4C21 5.5 19.6 9 18.8 15Z" fill="#8e1b30" />
        <path d="M4.6 15h14.8v2.4a.9.9 0 0 1-.9.9H5.5a.9.9 0 0 1-.9-.9z" fill="#3d1660" />
        <circle cx="2.2" cy="13.8" r="1.2" fill="#e0b54a" />
        <circle cx="15.9" cy="3.6" r="1.15" fill="#e0b54a" />
        <circle cx="21.8" cy="13.8" r="1.2" fill="#e0b54a" />
      </svg>
    </Frame>
  );
}
