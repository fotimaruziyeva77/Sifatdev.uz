"use client";

import { useEffect, useRef } from "react";

/** Texnologiyalar 3D sferada aylanadi, sichqoncha/barmoq yoki klaviatura bilan buriladi (TZ 5.1, 7.4). */
export default function TechSphere({ items, label }: { items: string[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: -0.25, y: 0, vx: 0, vy: 0.0035, drag: false, px: 0, py: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const nodes = Array.from(el.querySelectorAll<HTMLElement>("[data-i]"));
    const n = nodes.length;
    const base = nodes.map((_, i) => {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = i * Math.PI * (3 - Math.sqrt(5));
      return [Math.cos(th) * r, y, Math.sin(th) * r] as const;
    });
    let raf = 0;
    const reduced = () => document.documentElement.dataset.motion === "reduced";
    const render = () => {
      const R = el.clientWidth / 2.4;
      const { x: ax, y: ay } = rot.current;
      const cx = Math.cos(ax), sx = Math.sin(ax), cy = Math.cos(ay), sy = Math.sin(ay);
      nodes.forEach((node, i) => {
        const [x0, y0, z0] = base[i]!;
        const x1 = x0 * cy + z0 * sy;
        const z1 = -x0 * sy + z0 * cy;
        const y2 = y0 * cx - z1 * sx;
        const z2 = y0 * sx + z1 * cx;
        const s = 0.6 + (z2 + 1) * 0.25;
        node.style.transform = `translate(-50%,-50%) translate3d(${x1 * R}px, ${y2 * R}px, 0) scale(${s})`;
        node.style.opacity = String(0.62 + (z2 + 1) * 0.19);
        node.style.zIndex = String(Math.round((z2 + 1) * 100));
      });
    };
    const loop = () => {
      const r = rot.current;
      if (!r.drag && !reduced()) {
        r.y += r.vy;
        r.x += r.vx;
        r.vx *= 0.95;
        r.vy += (0.0035 - r.vy) * 0.02;
      }
      render();
      raf = requestAnimationFrame(loop);
    };
    const io = new IntersectionObserver(([e]) => {
      cancelAnimationFrame(raf);
      if (e?.isIntersecting) raf = requestAnimationFrame(loop);
    });
    io.observe(el);
    render();

    const down = (e: PointerEvent) => {
      rot.current.drag = true;
      rot.current.px = e.clientX;
      rot.current.py = e.clientY;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      const r = rot.current;
      if (!r.drag) return;
      const dx = e.clientX - r.px, dy = e.clientY - r.py;
      r.px = e.clientX;
      r.py = e.clientY;
      r.y += dx * 0.006;
      r.x = Math.max(-1.2, Math.min(1.2, r.x - dy * 0.006));
      r.vy = dx * 0.0008;
      render();
    };
    const up = () => (rot.current.drag = false);
    const key = (e: KeyboardEvent) => {
      const r = rot.current;
      if (e.key === "ArrowLeft") r.y -= 0.2;
      else if (e.key === "ArrowRight") r.y += 0.2;
      else if (e.key === "ArrowUp") r.x -= 0.2;
      else if (e.key === "ArrowDown") r.x += 0.2;
      else return;
      e.preventDefault();
      render();
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("keydown", key);
    };
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="group"
      aria-label={label}
      className="relative mx-auto aspect-square w-full max-w-[520px] cursor-grab touch-none select-none rounded-full active:cursor-grabbing"
    >
      <ul className="contents">
        {items.map((t, i) => (
          <li key={t} data-i={i} className="absolute left-1/2 top-1/2 whitespace-nowrap rounded-full border border-line bg-surface/80 px-3 py-1.5 font-mono text-[13px] text-fg will-change-transform">
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}
