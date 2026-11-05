"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { onMotionChange, readMotionPref, setMotionOff } from "@/lib/scene-store";

/** Barcha .reveal elementlarini kuzatadi (har sahifa almashganda qayta). */
export function RevealObserver() {
  const pathname = usePathname();
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
    );
    // Faqat yangi elementlar qo'shilganda, kadrga bir marta skanerlash (tezlik uchun)
    let raf = 0;
    const scan = () => {
      raf = 0;
      document.querySelectorAll(".reveal:not(.is-in)").forEach((el) => io.observe(el));
    };
    scan();
    const mo = new MutationObserver((muts) => {
      if (!raf && muts.some((m) => m.addedNodes.length)) raf = requestAnimationFrame(scan);
    });
    const root = document.getElementById("main") ?? document.body;
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname]);
  return null;
}

/** Magnit tugma: kursorga maks. 8 px tortiladi (TZ 7.5). */
export function Magnetic({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(pointer: coarse)").matches) return;
    const move = (e: PointerEvent) => {
      if (document.documentElement.dataset.motion === "reduced") return;
      const r = el.getBoundingClientRect();
      const dx = ((e.clientX - (r.left + r.width / 2)) / r.width) * 16;
      const dy = ((e.clientY - (r.top + r.height / 2)) / r.height) * 16;
      el.style.transform = `translate(${Math.max(-8, Math.min(8, dx))}px, ${Math.max(-8, Math.min(8, dy))}px)`;
    };
    const leave = () => (el.style.transform = "");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <span ref={ref} className={`inline-block transition-transform duration-200 ${className}`}>
      {children}
    </span>
  );
}

/** Hover'da ±8° perspektiv og'ish va yaltiroq qatlam (TZ 7.4). */
export function Tilt({ children, className = "", max = 8 }: { children: ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: none)").matches) return;
    const move = (e: PointerEvent) => {
      if (document.documentElement.dataset.motion === "reduced") return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * max}deg) rotateY(${(px - 0.5) * max}deg)`;
      el.style.setProperty("--mx", `${px * 100}%`);
      el.style.setProperty("--my", `${py * 100}%`);
    };
    const leave = () => (el.style.transform = "");
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, [max]);
  return (
    <div ref={ref} className={`tilt relative ${className}`}>
      {children}
      <span className="shine" aria-hidden="true" />
    </div>
  );
}

/** Raqamlar 0 dan sanab chiqadi (1,5 s). "Kam harakat"da — darhol yakuniy qiymat. */
export function Counter({ value, suffix = "", locale }: { value: number; suffix?: string; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const out = num.current;
    if (!el || !out || readMotionPref()) return;
    const fmt = new Intl.NumberFormat(locale);
    out.textContent = fmt.format(0);
    const io = new IntersectionObserver(([e]) => {
      if (!e?.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1500);
        out.textContent = fmt.format(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [value, locale]);
  return (
    <span ref={ref}>
      <span className="sr-only">{`${value}${suffix}`}</span>
      <span aria-hidden="true">
        <span ref={num}>{new Intl.NumberFormat(locale).format(value)}</span>
        {suffix}
      </span>
    </span>
  );
}

/** Footerdagi "Animatsiyalarni o'chirish" kaliti (TZ 7.7) — tanlov brauzerda saqlanadi. */
export function MotionToggle({ offLabel, onLabel }: { offLabel: string; onLabel: string }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(readMotionPref());
    return onMotionChange(setReduced);
  }, []);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={reduced}
      className="btn btn-ghost btn-sm !px-3"
      onClick={() => {
        setMotionOff(!reduced);
        window.dispatchEvent(new CustomEvent("sifat:track", { detail: { name: "motion_toggle", params: { off: !reduced } } }));
      }}
    >
      <span className={`inline-block h-5 w-9 rounded-full border border-input p-0.5 transition ${reduced ? "bg-accent" : ""}`} aria-hidden="true">
        <span className={`block h-3.5 w-3.5 rounded-full bg-fg transition ${reduced ? "translate-x-4" : ""}`} />
      </span>
      {reduced ? onLabel : offLabel}
    </button>
  );
}

/** Maxsus kursor (nuqta + halqa), silliqlik koeffitsienti 0,15 — faqat desktop. */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches || readMotionPref()) return;
    setOn(true);
    let x = -100, y = -100, rx = -100, ry = -100, raf = 0;
    const move = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      ring.current?.setAttribute("data-idle", "0");
      const t = e.target as HTMLElement | null;
      ring.current?.setAttribute("data-hover", t?.closest("a,button,[role=button],label,input,select,textarea") ? "1" : "0");
    };
    const loop = () => {
      rx += (x - rx) * 0.15;
      ry += (y - ry) * 0.15;
      if (dot.current) dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      raf = requestAnimationFrame(loop);
    };
    const hide = () => ring.current?.setAttribute("data-idle", "1");
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", hide);
    raf = requestAnimationFrame(loop);
    const off = onMotionChange((r) => setOn(!r));
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", hide);
      cancelAnimationFrame(raf);
      off();
    };
  }, []);
  if (!on) return null;
  return (
    <>
      <div ref={ring} className="cursor-ring" data-idle="1" aria-hidden="true" />
      <div ref={dot} className="cursor-dot" aria-hidden="true" />
    </>
  );
}

/** Loaderni yopadi: 3D birinchi kadri chizilganda (kamida 1,1 s), 3D kechiksa 2,4 s dan keyin. */
export function LoaderGate() {
  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.loaded) return;
    const start = performance.now();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      root.classList.add("loader-done");
      try {
        sessionStorage.setItem("sifat-loaded", "1");
      } catch {
        /* private mode */
      }
    };
    const onReady = () => window.setTimeout(finish, Math.max(0, 1100 - (performance.now() - start)));
    window.addEventListener("sifat:scene-ready", onReady, { once: true });
    const cap = window.setTimeout(finish, 2400);
    return () => {
      window.removeEventListener("sifat:scene-ready", onReady);
      window.clearTimeout(cap);
    };
  }, []);
  return null;
}
