"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { detectTier, qualityFor, type Quality } from "@/lib/gpu";
import { onMotionChange, readMotionPref, scene } from "@/lib/scene-store";

// 3D kodi alohida chunk — boshlang'ich JS'ga kirmaydi (TZ 9.2).
const Scene = dynamic(() => import("./Scene"), { ssr: false });

/**
 * 3D qatlamni hero matni chiqqandan keyin yuklaydi (LCP'ga xalaqit bermaydi, TZ 7.6).
 * WebGL2 yo'q yoki kuchsiz qurilmada — statik poster (nur dog'lari + nuqtalar).
 */
export default function SceneLoader() {
  const [quality, setQuality] = useState<Quality | null>(null);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const r = readMotionPref();
    setReduced(r);
    scene.reduced = r;
    const off = onMotionChange((v) => setReduced(v));
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduced(readMotionPref());
    mq.addEventListener("change", onMq);

    let started = false;
    const start = () => {
      if (started) return;
      started = true;
      setQuality(qualityFor(detectTier()));
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    let id: number | undefined;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const EVENTS = ["pointerdown", "touchstart", "scroll", "keydown", "pointermove"] as const;
    const onFirst = () => {
      EVENTS.forEach((ev) => window.removeEventListener(ev, onFirst));
      start();
    };
    // 3D sahifa yuklangach darhol (brauzer bo'sh vaqtida) ishga tushadi; mobilda ham kech qolmaydi.
    const kick = () => {
      EVENTS.forEach((ev) => window.addEventListener(ev, onFirst, { passive: true, once: true }));
      if (w.requestIdleCallback) id = w.requestIdleCallback(start, { timeout: coarse ? 1200 : 600 });
      else id = window.setTimeout(start, 200);
    };
    if (document.readyState === "complete") kick();
    else window.addEventListener("load", kick, { once: true });
    return () => {
      off();
      mq.removeEventListener("change", onMq);
      window.removeEventListener("load", kick);
      EVENTS.forEach((ev) => window.removeEventListener(ev, onFirst));
      if (id) clearTimeout(id);
    };
  }, []);

  const live = quality && !failed;
  return (
    <div className="scene-layer" aria-hidden="true">
      <div className="scene-poster" data-live={live ? "1" : "0"} />
      {live && (
        <div className="scene-canvas">
          <Scene quality={quality} reduced={reduced} onFail={() => setFailed(true)} />
        </div>
      )}
    </div>
  );
}
