import { SYMBOLS } from "@/lib/palette";

export function Glyph({
  id,
  className,
  strokeWidth = 1.3,
}: {
  id: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {SYMBOLS[id].d.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}
