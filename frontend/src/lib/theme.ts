/**
 * Kun/tun rejimi. Standart — tun (qorong'i, TZ 6.1 asosiy mavzu); tanlov brauzerda saqlanadi.
 * html[data-theme] bo'yashdan oldin THEME_BOOTSTRAP orqali qo'yiladi (miltillash bo'lmaydi).
 */
export type Theme = "dark" | "light";
const KEY = "sifat-theme";
type Listener = (t: Theme) => void;
const listeners = new Set<Listener>();

export function readTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function setTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* private mode */
  }
  document.documentElement.dataset.theme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t === "light" ? "#F6F6F8" : "#050506");
  listeners.forEach((l) => l(t));
}

export function onThemeChange(l: Listener) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export const THEME_BOOTSTRAP = `try{var t=localStorage.getItem("${KEY}");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch(e){document.documentElement.dataset.theme="dark"}`;
