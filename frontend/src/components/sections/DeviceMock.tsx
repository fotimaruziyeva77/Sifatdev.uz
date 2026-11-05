/**
 * 3D qurilma maketlari (CSS perspective) — real skrinshotlar qo'shilgunga qadar
 * protsedural interfeys chiziladi. `image` berilsa, ekranda skrinshot ko'rsatiladi.
 */
function Screen({ hue, compact }: { hue: number; compact?: boolean }) {
  const c1 = hue % 2 ? "#e3262f" : "#ff5a5f";
  const c2 = "#f5f5f7";
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full" aria-hidden="true" preserveAspectRatio="none">
      <rect width="320" height="200" fill="#0b0b0e" />
      {!compact && <rect width="60" height="200" fill="#111115" />}
      {!compact && [30, 50, 70, 90, 110].map((y) => <rect key={y} x="12" y={y} width={y === 50 ? 36 : 30} height="6" rx="3" fill={y === 50 ? c1 : "#2a2a31"} />)}
      <rect x={compact ? 14 : 74} y="16" width="120" height="10" rx="5" fill="#2a2a31" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <rect x={(compact ? 14 : 74) + i * (compact ? 98 : 80)} y="38" width={compact ? 90 : 72} height="44" rx="8" fill="#141418" />
          <rect x={(compact ? 22 : 82) + i * (compact ? 98 : 80)} y="48" width="30" height="6" rx="3" fill="#34343c" />
          <rect x={(compact ? 22 : 82) + i * (compact ? 98 : 80)} y="62" width={20 + i * 8} height="10" rx="3" fill={i === 1 ? c2 : c1} opacity=".9" />
        </g>
      ))}
      <rect x={compact ? 14 : 74} y="94" width={compact ? 292 : 232} height="92" rx="8" fill="#141418" />
      <polyline
        fill="none"
        stroke={c1}
        strokeWidth="2.5"
        points={Array.from({ length: 12 }, (_, i) => `${(compact ? 24 : 84) + i * (compact ? 25 : 19.5)},${170 - (Math.sin(i * 0.9 + hue) * 0.5 + 0.5) * 50 - i * 2}`).join(" ")}
      />
      <polyline
        fill="none"
        stroke={c2}
        strokeWidth="1.5"
        opacity=".7"
        points={Array.from({ length: 12 }, (_, i) => `${(compact ? 24 : 84) + i * (compact ? 25 : 19.5)},${174 - (Math.cos(i * 0.7 + hue) * 0.5 + 0.5) * 34}`).join(" ")}
      />
    </svg>
  );
}

export default function DeviceMock({ device, hue, className = "", image, alt = "", priority = false }: { device: "laptop" | "phone"; hue: number; className?: string; image?: string; alt?: string; priority?: boolean }) {
  const load = priority ? ("eager" as const) : ("lazy" as const);
  if (device === "phone") {
    return (
      <div className={`mx-auto aspect-[9/18] w-[46%] rounded-[28px] border border-[#2a2a31] bg-[#050506] p-2 shadow-[0_40px_80px_-30px_rgba(227,38,47,.5)] ${className}`} style={{ transform: "rotateY(-14deg) rotateX(6deg)" }}>
        <div className="relative h-full overflow-hidden rounded-[22px]">
          {image ? <img src={image} alt={alt} className="h-full w-full object-cover object-top" loading={load} decoding="async" /> : <Screen hue={hue} compact />}
          <span className="absolute left-1/2 top-2 h-4 w-14 -translate-x-1/2 rounded-full bg-black" />
        </div>
      </div>
    );
  }
  return (
    <div className={`mx-auto w-[88%] ${className}`} style={{ transform: "rotateX(10deg) rotateY(-10deg)", transformStyle: "preserve-3d" }}>
      <div className="rounded-t-[14px] border border-[#2a2a31] bg-[#050506] p-[2.5%] shadow-[0_50px_90px_-35px_rgba(227,38,47,.55)]">
        <div className="aspect-[16/10] overflow-hidden rounded-[6px]">
          {image ? <img src={image} alt={alt} className="h-full w-full object-cover object-top" loading={load} decoding="async" /> : <Screen hue={hue} />}
        </div>
      </div>
      <div className="mx-[-6%] h-3 rounded-b-[14px] bg-gradient-to-b from-[#2a2a31] to-[#141418]" />
    </div>
  );
}
