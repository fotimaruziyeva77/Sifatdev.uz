/**
 * 3D qatlam boshqaruvchisi (TZ 7.9): scroll, kursor va qurilma darajasi shu yerga keladi,
 * sahna har kadrda shu obyektdan o'qiydi. React state emas — 60 FPS'da re-render bo'lmasligi uchun.
 */
export type ShapeName =
  | "logo" | "code" | "phone" | "neural" | "shield" | "gears" | "globe"
  | "wave" | "helix" | "ring" | "n404" | "sphere";

export type SceneState = {
  from: ShapeName;
  to: ShapeName;
  morph: number; // 0..1
  /** Yadro joylashuvi: ekran yarim kengligiga nisbatan (-1..1) */
  x: number;
  y: number;
  scale: number;
  coreOpacity: number;
  depth: number; // kamera chuqurligi (0..1)
  push: number; // kursor itarish kuchi
  mouse: { x: number; y: number; active: boolean; lastMove: number };
  scrollY: number;
  scrollVel: number;
  reduced: boolean;
  /** Sahifalar orasidagi o'tish: 1 — zarrachalar tarqalgan, 0 — yig'ilgan */
  warp: number;
  /** Yadroning dunyo koordinatalaridagi markazi va radiusi (Scene yozadi) */
  core: { x: number; y: number; r: number; o: number };
};

export const scene: SceneState = {
  from: "logo",
  to: "logo",
  morph: 0,
  x: 0.45,
  y: 0,
  scale: 1,
  coreOpacity: 1,
  depth: 0,
  push: 1,
  mouse: { x: 0, y: 0, active: false, lastMove: 0 },
  scrollY: 0,
  scrollVel: 0,
  reduced: false,
  warp: 0,
  core: { x: 0, y: 0, r: 0, o: 0 },
};

// --- "Kam harakat" rejimi (TZ 7.7): prefers-reduced-motion yoki footerdagi kalit ---
const MOTION_KEY = "sifat-motion";
type Listener = (reduced: boolean) => void;
const listeners = new Set<Listener>();

export function readMotionPref(): boolean {
  if (typeof window === "undefined") return false;
  let stored: string | null = null;
  try {
    stored = localStorage.getItem(MOTION_KEY);
  } catch {
    /* private mode */
  }
  if (stored === "off") return true;
  if (stored === "on") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function setMotionOff(off: boolean) {
  try {
    localStorage.setItem(MOTION_KEY, off ? "off" : "on");
  } catch {
    /* ignore */
  }
  document.documentElement.dataset.motion = off ? "reduced" : "full";
  scene.reduced = off;
  listeners.forEach((l) => l(off));
}

export function onMotionChange(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

/** <head> ichida bo'yashdan oldin ishlaydigan skript (miltillashsiz). */
export const MOTION_BOOTSTRAP = `try{var s=localStorage.getItem("${MOTION_KEY}");var r=s==="off"||(s!=="on"&&matchMedia("(prefers-reduced-motion: reduce)").matches);document.documentElement.dataset.motion=r?"reduced":"full"}catch(e){}`;
