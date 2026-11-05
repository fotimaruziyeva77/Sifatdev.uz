"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { scene, type ShapeName } from "@/lib/scene-store";

type Anchor = { shape: ShapeName; x: number; y: number; scale: number; opacity: number; depth: number; push: number; c: number };

const num = (v: string | undefined, d: number) => (v === undefined || v === "" ? d : Number(v));
const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/**
 * Scroll'ni 3D sahnaga bog'laydi: sahifadagi [data-shape] bo'limlari "langar" (anchor).
 * Ekran markazi ikki langar orasida bo'lsa — partikullar shu ikki shakl orasida morf bo'ladi.
 * Brauzerning oddiy scroll'i o'zgartirilmaydi (scroll-jacking yo'q, TZ 7.1).
 */
export default function SceneDirector() {
  const pathname = usePathname();

  useEffect(() => {
    let raf = 0;
    let lastY = window.scrollY;
    let lastT = performance.now();

    const read = (): Anchor[] => {
      const vh = window.innerHeight;
      return Array.from(document.querySelectorAll<HTMLElement>("[data-shape]")).map((el) => {
        const r = el.getBoundingClientRect();
        const d = el.dataset;
        return {
          shape: d.shape as ShapeName,
          x: num(d.x, 0.45),
          y: num(d.y, 0),
          scale: num(d.scale, 1),
          opacity: num(d.opacity, 1),
          depth: num(d.depth, 0),
          push: num(d.push, 1),
          c: r.top + Math.min(r.height, vh) / 2 - vh / 2,
        };
      });
    };

    const update = () => {
      raf = 0;
      const now = performance.now();
      const y = window.scrollY;
      scene.scrollVel = ((y - lastY) / Math.max(now - lastT, 1)) * 16;
      scene.scrollY = y;
      lastY = y;
      lastT = now;

      const a = read();
      if (!a.length) return;
      let i = 0;
      while (i < a.length - 1 && a[i + 1]!.c <= 0) i++;
      const A = a[i]!;
      const B = a[Math.min(i + 1, a.length - 1)]!;
      let p = 0;
      if (B !== A && A.c <= 0) p = Math.min(1, -A.c / Math.max(B.c - A.c, 1));
      const m = smooth(0.25, 0.75, p);
      scene.from = A.shape;
      scene.to = B.shape;
      scene.morph = A === B ? 0 : m;
      const lerp = (u: number, v: number) => u + (v - u) * m;
      scene.x = lerp(A.x, B.x);
      scene.y = lerp(A.y, B.y);
      scene.scale = lerp(A.scale, B.scale);
      scene.coreOpacity = lerp(A.opacity, B.opacity);
      scene.depth = lerp(A.depth, B.depth);
      scene.push = lerp(A.push, B.push);
    };

    const on = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    // Sahifa almashgandan keyin DOM tayyor bo'lishini kutamiz
    const t1 = setTimeout(on, 50);
    const t2 = setTimeout(on, 400);
    on();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      clearTimeout(t1);
      clearTimeout(t2);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);

  return null;
}
