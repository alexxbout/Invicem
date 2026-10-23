/** the app icon: a gilded card on the night table, with the sun of the deck */
export function IconArt({ size }: { size: number }) {
  const card = size * 0.56;
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at 50% 42%, #4a2f1e 0%, #1d1426 55%, #130f1a 100%)",
      }}
    >
      <div
        style={{
          width: card,
          height: card * 1.4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: card * 0.08,
          background: "linear-gradient(150deg, #ffc94d 0%, #bf7208 100%)",
          border: `${Math.max(2, size * 0.012)}px solid #f6dc8f`,
          boxShadow: "0 0 0 1px #2a1604",
          transform: "rotate(-6deg)",
        }}
      >
        <div
          style={{
            width: card * 0.62,
            height: card * 0.62,
            borderRadius: card,
            border: `${Math.max(1.5, size * 0.008)}px solid #2a1604`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#2a1604",
            fontSize: card * 0.42,
          }}
        >
          ☀
        </div>
      </div>
    </div>
  );
}
