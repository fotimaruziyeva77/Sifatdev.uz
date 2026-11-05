"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Gorizontal scroll (TZ 5.1 "Tanlangan loyihalar"): vertikal scroll gorizontal harakatga aylanadi,
 * lekin brauzerning oddiy scroll'i o'zgarmaydi (sticky + transform, scroll-jacking yo'q).
 * Mobil va "kam harakat" rejimida — oddiy kartalar to'ri.
 */
export default function HorizontalScroll({ children }: { children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [h, setH] = useState<number | undefined>(undefined);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const check = () => setEnabled(mq.matches && document.documentElement.dataset.motion !== "reduced");
    check();
    mq.addEventListener("change", check);
    const mo = new MutationObserver(check);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-motion"] });
    return () => {
      mq.removeEventListener("change", check);
      mo.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!enabled) {
      setH(undefined);
      if (track.current) track.current.style.transform = "";
      return;
    }
    const measure = () => {
      const t = track.current;
      if (!t) return;
      const dist = t.scrollWidth - window.innerWidth;
      setH(window.innerHeight + Math.max(dist, 0));
    };
    let raf = 0;
    const update = () => {
      raf = 0;
      const o = outer.current, t = track.current;
      if (!o || !t) return;
      const r = o.getBoundingClientRect();
      const dist = t.scrollWidth - window.innerWidth;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(r.height - window.innerHeight, 1)));
      t.style.transform = `translate3d(${-p * Math.max(dist, 0)}px,0,0)`;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    measure();
    update();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return <div className="container-x grid gap-6 md:grid-cols-2">{children}</div>;

  return (
    <div ref={outer} style={{ height: h }} className="relative">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div ref={track} className="flex gap-6 pl-[var(--gutter)] pr-[var(--gutter)] will-change-transform">
          {children}
        </div>
      </div>
    </div>
  );
}
