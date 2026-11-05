import { ImageResponse } from "next/og";

export const alt = "SIFATDEV";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TAG: Record<string, string> = {
  uz: "Biznesingiz uchun sayt, mobil ilova va AI yechimlar",
  ru: "Websites, mobile apps and AI for your business",
  en: "Websites, mobile apps and AI for your business",
};

/** Avtomatik Open Graph rasmi (TZ 8.7). */
export default async function OG({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const dots = Array.from({ length: 140 }, (_, i) => {
    const a = (i / 140) * Math.PI * 2;
    const r = 190 + Math.sin(i * 1.7) * 18;
    return { x: 900 + Math.cos(a) * r, y: 315 + Math.sin(a) * r, c: i % 3 ? "#e3262f" : "#ffffff" };
  });
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#050506", color: "#f5f5f7", position: "relative", fontFamily: "sans-serif" }}>
        {dots.map((d, i) => (
          <div key={i} style={{ position: "absolute", left: d.x, top: d.y, width: 14, height: 4, borderRadius: 4, background: d.c, opacity: 0.85, transform: `rotate(${(i / 140) * 360}deg)` }} />
        ))}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, width: 760 }}>
          <div style={{ fontSize: 30, letterSpacing: 6, color: "#ff5a5f" }}>SIFATDEV</div>
          <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1, marginTop: 24 }}>{TAG[locale] ?? TAG.en}</div>
          <div style={{ fontSize: 26, color: "#b4b4be", marginTop: 28 }}>Web · Mobile · AI · GovTech — Navoi, Uzbekistan</div>
        </div>
      </div>
    ),
    size,
  );
}
