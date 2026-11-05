"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";
import { SITE } from "@/content/site";

/** Xarita avval statik ko'rinishda, bosilganda interaktivga aylanadi (TZ 5.6) — tezlik va maxfiylik uchun. */
export default function MapEmbed({ label }: { label: string }) {
  const [live, setLive] = useState(false);
  const { lat, lng } = SITE.geo;
  const d = 0.012;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d}%2C${lat - d / 2}%2C${lng + d}%2C${lat + d / 2}&layer=mapnik&marker=${lat}%2C${lng}`;
  if (live) {
    return (
      <iframe
        title="Map"
        src={src}
        className="aspect-[16/10] w-full rounded-[var(--radius-card)] border border-line"
        loading="lazy"
        referrerPolicy="no-referrer"
        sandbox="allow-scripts allow-same-origin allow-popups"
      />
    );
  }
  return (
    <button type="button" onClick={() => setLive(true)} className="card group relative grid aspect-[16/10] w-full place-items-center overflow-hidden">
      <svg className="absolute inset-0 h-full w-full opacity-40" aria-hidden="true">
        <defs>
          <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path d="M28 0H0V28" fill="none" stroke="#26262d" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        <path d="M0 120 C 120 80, 220 200, 420 140 S 700 60, 900 160" stroke="#e3262f" strokeOpacity=".4" strokeWidth="6" fill="none" />
        <path d="M200 0 C 240 120, 180 220, 260 400" stroke="#ffffff" strokeOpacity=".25" strokeWidth="4" fill="none" />
      </svg>
      <span className="relative flex flex-col items-center gap-3">
        <MapPin size={32} className="text-hi" aria-hidden="true" />
        <span className="btn btn-secondary btn-sm">{label}</span>
      </span>
    </button>
  );
}
