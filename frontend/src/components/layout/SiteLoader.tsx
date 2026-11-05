import { BRAND, LOGO_BAR, LOGO_PATHS, LOGO_STROKE, LOGO_VIEWBOX } from "@/content/brand";
import { LoaderGate } from "@/components/ui/interactive";

const DOTS = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2;
  const r = 34 + ((i * 37) % 22); // vmin: tasodifiyga o'xshash, lekin server va brauzerda bir xil
  return { x: (Math.cos(a) * r).toFixed(1), y: (Math.sin(a) * r).toFixed(1), red: i % 5 === 0, d: ((i * 13) % 28) * 0.018 };
});

/**
 * Sayt ochilishidagi loader (har seansda bir marta). HTML'ning o'zida keladi, shuning uchun
 * sahifa bir lahza ham loadersiz ko'rinmaydi. JS ishlamasa, CSS uni 3,2 s dan keyin o'zi yopadi.
 */
export default function SiteLoader() {
  const { w, h } = LOGO_VIEWBOX;
  return (
    <div className="site-loader" aria-hidden="true">
      <div className="site-loader-dots">
        {DOTS.map((d, i) => (
          <i key={i} className={d.red ? "is-red" : ""} style={{ ["--x" as string]: `${d.x}vmin`, ["--y" as string]: `${d.y}vmin`, animationDelay: `${d.d}s` }} />
        ))}
      </div>
      <svg className="site-loader-logo" viewBox={`-2 -2 ${w + 4} ${h + 4}`}>
        <rect className="site-loader-mark" x={LOGO_BAR.x} y={LOGO_BAR.y} width={LOGO_BAR.w} height={LOGO_BAR.h} fill={BRAND.red} />
        <g fill="none" stroke="currentColor" strokeWidth={LOGO_STROKE}>
          {LOGO_PATHS.map((d, i) => (
            <path key={d} d={d} pathLength={1} style={{ animationDelay: `${0.28 + i * 0.1}s` }} />
          ))}
        </g>
      </svg>
      <div className="site-loader-bar"><span /></div>
      <LoaderGate />
    </div>
  );
}
