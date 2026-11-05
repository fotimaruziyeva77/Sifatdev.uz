"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import DeviceMock from "./DeviceMock";

type Shot = { src: string; device: "laptop" | "phone" };
type Labels = { zoom: string; prev: string; next: string; close: string };

/** Skrinshotlar galereyasi: 3D maketlarda, bosilganda kattalashadi (TZ 5.3 lightbox). */
export default function CaseGallery({ shots, title, labels }: { shots: Shot[]; title: string; labels: Labels }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);

  const open = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
  };
  const step = useCallback((d: number) => setIndex((i) => (i + d + shots.length) % shots.length), [shots.length]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    el.addEventListener("keydown", key);
    return () => el.removeEventListener("keydown", key);
  }, [step]);

  const current = shots[index];

  return (
    <>
      <ul className="grid gap-5 sm:grid-cols-2">
        {shots.map((s, i) => (
          <li key={s.src}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={`${labels.zoom}: ${title} ${i + 1}`}
              className="card grid aspect-[4/3] w-full cursor-zoom-in place-items-center overflow-hidden p-4 transition hover:border-accent"
              style={{ perspective: "900px" }}
            >
              <DeviceMock device={s.device} hue={0} image={s.src} alt={`${title} — ${i + 1}`} className={s.device === "phone" ? "!w-[30%]" : ""} />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={title}
        className="m-auto max-h-none max-w-none bg-transparent p-4 backdrop:bg-black/85 backdrop:backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="relative">
          {current && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={current.src}
              alt={`${title} — ${index + 1}`}
              className={`block rounded-[var(--radius-sm)] object-contain ${current.device === "phone" ? "max-h-[88dvh] w-auto" : "max-h-[88dvh] w-[min(1200px,92vw)]"}`}
            />
          )}
          <button type="button" autoFocus onClick={() => dialog.current?.close()} aria-label={labels.close} className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full bg-black/70 text-white">
            <X size={20} aria-hidden="true" />
          </button>
          {shots.length > 1 && (
            <>
              <button type="button" onClick={() => step(-1)} aria-label={labels.prev} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white">
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => step(1)} aria-label={labels.next} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </dialog>
    </>
  );
}
