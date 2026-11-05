import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Code2, Smartphone, BrainCircuit, ShieldCheck, Cog, Globe2 } from "lucide-react";
import type { ServiceId } from "@/content/slugs";
import { BRAND, LOGO_BAR, LOGO_PATHS, LOGO_STROKE, LOGO_VIEWBOX } from "@/content/brand";

/** SIFAT logotipi: qizil vertikal chiziq + oq geometrik yozuv (brend fayli asosida). */
export function Logo({ className = "", height = 22 }: { className?: string; height?: number }) {
  const { w, h } = LOGO_VIEWBOX;
  return (
    <span className={`inline-flex items-center ${className}`}>
      <svg height={height} width={(height * w) / h} viewBox={`-2 -2 ${w + 4} ${h + 4}`} role="img" aria-label="SIFAT">
        <rect x={LOGO_BAR.x} y={LOGO_BAR.y} width={LOGO_BAR.w} height={LOGO_BAR.h} fill={BRAND.red} />
        <g fill="none" stroke="currentColor" strokeWidth={LOGO_STROKE} strokeLinejoin="miter" strokeLinecap="butt">
          {LOGO_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
      </svg>
    </span>
  );
}

export const SERVICE_ICONS: Record<ServiceId, typeof Code2> = {
  web: Code2,
  mobile: Smartphone,
  ai: BrainCircuit,
  gov: ShieldCheck,
  automation: Cog,
  outsourcing: Globe2,
};

/** Sarlavha so'zma-so'z paydo bo'ladi (TZ 7.5). Matn SSR'da to'liq — SEO va a11y uchun. */
export function Words({ text, as: Tag = "h1", className = "", highlight }: { text: string; as?: "h1" | "h2"; className?: string; highlight?: number[] }) {
  const words = text.split(" ");
  return (
    <Tag className={`words ${className}`} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} aria-hidden="true">
          <span className={`w ${highlight?.includes(i) ? "grad-word" : ""}`} style={{ ["--i" as string]: i }}>
            {w}
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}

export function SectionHead({ label, title, lead, className = "" }: { label?: string; title: string; lead?: string; className?: string }) {
  return (
    <div className={`mb-10 max-w-3xl md:mb-14 ${className}`}>
      {label && <p className="t-label reveal mb-4">{label}</p>}
      <h2 className="t-h2 reveal">{title}</h2>
      {lead && <p className="t-lead reveal mt-5" style={{ ["--i" as string]: 1 }}>{lead}</p>}
    </div>
  );
}

export function ButtonLink({ variant = "primary", size = "", children, className = "", ...rest }: ComponentProps<typeof Link> & { variant?: "primary" | "secondary" | "ghost"; size?: "" | "sm" | "lg"; children: ReactNode }) {
  return (
    <Link className={`btn btn-${variant} ${size ? `btn-${size}` : ""} ${className}`} {...rest}>
      {children}
    </Link>
  );
}

/** JSON-LD: "<" belgisi escape qilinadi — skript tegidan chiqib ketish (XSS) imkonsiz. */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
