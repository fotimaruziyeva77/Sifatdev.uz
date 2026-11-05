import type { ShapeName } from "@/lib/scene-store";
import { LOGO_BAR, LOGO_PATHS, LOGO_STROKE, LOGO_VIEWBOX } from "@/content/brand";

/**
 * Har bir shakl uchun nuqtalar oldindan hisoblanadi (TZ 7.2 "Morf usuli"):
 * GPU shader ikki shakl orasida interpolatsiya qiladi.
 * `red` — nuqtaning brend qizil rangidagi ulushi (0..1): logotip chizig'i, O'zbekiston, belgi va h.k.
 */
export type ShapeData = { pos: Float32Array; red: Float32Array };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = [number, number, number, number]; // x, y, z, red
type Gen = (n: number, r: () => number) => ShapeData;

const gauss = (r: () => number) => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-6))) * Math.cos(2 * Math.PI * r());

function fill(n: number, fn: (i: number) => P): ShapeData {
  const pos = new Float32Array(n * 3);
  const red = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const p = fn(i);
    pos[i * 3] = p[0];
    pos[i * 3 + 1] = p[1];
    pos[i * 3 + 2] = p[2];
    red[i] = p[3];
  }
  return { pos, red };
}

/** 2D canvas'da chizilgan shakldan nuqta olish. `draw` qizil kanalga brend qismini, oqga — qolganini chizadi. */
function rasterPoints(W: number, H: number, worldW: number, depth: number, draw: (ctx: CanvasRenderingContext2D) => void, n: number, r: () => number, redShare = 0): ShapeData {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  draw(ctx);
  const data = ctx.getImageData(0, 0, W, H).data;
  const white: number[] = [];
  const reds: number[] = [];
  for (let y = 0; y < H; y += 2)
    for (let x = 0; x < W; x += 2) {
      const k = (y * W + x) * 4;
      if (data[k + 3]! < 128) continue;
      (data[k + 1]! < 80 ? reds : white).push(x, y);
    }
  const scale = worldW / W;
  // Qizil qism kichik bo'lsa ham ko'rinishi uchun ulushi oshiriladi
  const redCount = reds.length ? Math.floor(n * Math.max(redShare, reds.length / (reds.length + white.length))) : 0;
  return fill(n, (i) => {
    const isRed = i < redCount;
    const src = isRed ? reds : white.length ? white : reds;
    const k = Math.floor(r() * (src.length / 2)) * 2;
    const px = src[k] ?? W / 2;
    const py = src[k + 1] ?? H / 2;
    return [(px - W / 2) * scale + (r() - 0.5) * 0.01, -(py - H / 2) * scale + (r() - 0.5) * 0.01, (r() - 0.5) * depth, isRed ? 1 : 0];
  });
}

function textShape(text: string, n: number, r: () => number, worldW: number, redChars: number[] = []): ShapeData {
  const W = 720, H = 300;
  return rasterPoints(W, H, worldW, 0.28, (ctx) => {
    ctx.font = `800 230px "Manrope", ui-sans-serif, system-ui, sans-serif`;
    ctx.textBaseline = "middle";
    const total = ctx.measureText(text).width;
    let x = (W - total) / 2;
    [...text].forEach((ch, i) => {
      ctx.fillStyle = redChars.includes(i) ? "#f00" : "#fff";
      ctx.fillText(ch, x, H / 2 + 10);
      x += ctx.measureText(ch).width;
    });
  }, n, r, redChars.length ? 0.2 : 0);
}

function sphereSurface(r: () => number, radius = 1): [number, number, number] {
  const u = r() * 2 - 1;
  const t = r() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return [s * Math.cos(t) * radius, u * radius, s * Math.sin(t) * radius];
}

function latLon(lat: number, lon: number, rad = 1): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const th = ((lon + 180) * Math.PI) / 180;
  return [-rad * Math.sin(phi) * Math.cos(th), rad * Math.cos(phi), rad * Math.sin(phi) * Math.sin(th)];
}

const sprinkle = (r: () => number, p = 0.05) => (r() < p ? 1 : 0);

const GENS: Record<ShapeName, Gen> = {
  /** SIFAT logotipi: brend vektor yo'llaridan (qizil chiziq — qizil zarrachalar) */
  logo: (n, r) => {
    const { w, h } = LOGO_VIEWBOX;
    const k = 2;
    const W = (w + 20) * k, H = (h + 20) * k;
    return rasterPoints(W, H, 3.9, 0.22, (ctx) => {
      ctx.translate(10 * k, 10 * k);
      ctx.scale(k, k);
      ctx.fillStyle = "#f00";
      ctx.fillRect(LOGO_BAR.x, LOGO_BAR.y, LOGO_BAR.w, LOGO_BAR.h);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = LOGO_STROKE;
      ctx.lineJoin = "miter";
      for (const d of LOGO_PATHS) ctx.stroke(new Path2D(d));
    }, n, r, 0.12);
  },

  code: (n, r) => textShape("</>", n, r, 3.0, [1]),

  n404: (n, r) => textShape("404", n, r, 3.3, [1]),

  phone: (n, r) =>
    fill(n, () => {
      const w = 0.62, h = 1.25, k = r();
      if (k < 0.42) {
        const per = r() * 4, side = Math.floor(per), t = per - side;
        const p = side === 0 ? [-w + 2 * w * t, h] : side === 1 ? [w, h - 2 * h * t] : side === 2 ? [w - 2 * w * t, -h] : [-w, -h + 2 * h * t];
        return [p[0]! + gauss(r) * 0.012, p[1]! + gauss(r) * 0.012, (r() - 0.5) * 0.12, 0];
      }
      if (k < 0.48) return [(r() - 0.5) * 0.25, h - 0.09 + gauss(r) * 0.01, 0.02, 1]; // dinamik orol — qizil
      const row = Math.floor(r() * 7);
      return [-w + 0.1 + r() * (row % 3 === 0 ? 1.04 : 0.7), h - 0.3 - row * 0.32 + (r() - 0.5) * 0.12, 0.03, row === 0 ? 1 : 0];
    }),

  neural: (n, r) => {
    const layers = [3, 5, 5, 3];
    const nodes = layers.map((count, li) =>
      Array.from({ length: count }, (_, k) => [-1.3 + (li * 2.6) / (layers.length - 1), (k - (count - 1) / 2) * 0.5, Math.sin(li + k) * 0.25] as const),
    );
    return fill(n, () => {
      if (r() < 0.4) {
        const L = nodes[Math.floor(r() * nodes.length)]!;
        const idx = Math.floor(r() * L.length);
        const p = L[idx]!;
        return [p[0] + gauss(r) * 0.045, p[1] + gauss(r) * 0.045, p[2] + gauss(r) * 0.045, idx === 2 ? 1 : 0];
      }
      const li = Math.floor(r() * (nodes.length - 1));
      const a = nodes[li]![Math.floor(r() * nodes[li]!.length)]!;
      const b = nodes[li + 1]![Math.floor(r() * nodes[li + 1]!.length)]!;
      const t = r();
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + gauss(r) * 0.006, a[2] + (b[2] - a[2]) * t, sprinkle(r, 0.03)];
    });
  },

  shield: (n, r) => {
    const half = (y: number) => (y > 0.25 ? 0.95 - (y - 0.25) * 0.15 : 0.95 * Math.pow((y + 1.25) / 1.5, 0.75));
    const top = (x: number) => 1.05 - 0.06 * Math.cos((x / 0.95) * Math.PI);
    return fill(n, () => {
      const k = r();
      if (k < 0.3) {
        const y = -1.25 + r() * 2.3;
        const side = r() < 0.5 ? -1 : 1;
        return [side * half(y) + gauss(r) * 0.01, Math.min(y, top(side * half(y))), (r() - 0.5) * 0.1, 0];
      }
      if (k < 0.47) {
        const t = r();
        const p = t < 0.35 ? [-0.38 + t * 0.6, -0.05 - t * 0.6] : [-0.17 + (t - 0.35) * 1.05, -0.26 + (t - 0.35) * 1.15];
        return [p[0]! + gauss(r) * 0.012, p[1]! + gauss(r) * 0.012, 0.06, 1]; // ✓ — qizil
      }
      for (;;) {
        const x = (r() * 2 - 1) * 0.95;
        const y = -1.25 + r() * 2.3;
        if (Math.abs(x) <= half(y) && y <= top(x)) return [x, y, (r() - 0.5) * 0.18 * (1 - Math.abs(x)), 0];
      }
    });
  },

  gears: (n, r) => {
    const gear = (cx: number, cy: number, R: number, teeth: number, phase: number, red: number): P => {
      const th = r() * Math.PI * 2;
      const tooth = Math.max(0, Math.min(1, (Math.sin(th * teeth + phase) + 0.3) * 3));
      const outer = R + tooth * R * 0.18;
      const inner = R * 0.42;
      const rr = r() < 0.25 ? inner + r() * 0.04 : inner + Math.sqrt(r()) * (outer - inner);
      return [cx + Math.cos(th) * rr, cy + Math.sin(th) * rr, (r() - 0.5) * 0.2, red];
    };
    return fill(n, () => (r() < 0.62 ? gear(-0.35, 0.25, 0.85, 12, 0, 0) : gear(0.82, -0.68, 0.52, 8, 0.4, 1)));
  },

  globe: (n, r) => {
    const uz: [number, number] = [41.3, 64.5];
    const cities: [number, number][] = [[51.5, -0.1], [52.5, 13.4], [40.7, -74], [55.7, 37.6], [25.2, 55.3], [1.35, 103.8], [37.5, 127], [48.9, 2.35]];
    return fill(n, () => {
      const k = r();
      if (k < 0.5) return [...sphereSurface(r, 1.15), 0];
      if (k < 0.66) {
        if (r() < 0.5) return [...latLon(-80 + Math.floor(r() * 9) * 20, r() * 360 - 180, 1.15), 0];
        return [...latLon(r() * 180 - 90, -180 + Math.floor(r() * 12) * 30, 1.15), 0];
      }
      if (k < 0.73) {
        const p = latLon(uz[0], uz[1], 1.16);
        return [p[0] + gauss(r) * 0.03, p[1] + gauss(r) * 0.03, p[2] + gauss(r) * 0.03, 1]; // O'zbekiston — qizil
      }
      const c = cities[Math.floor(r() * cities.length)]!;
      const t = r();
      return [...latLon(uz[0] + (c[0] - uz[0]) * t, uz[1] + (c[1] - uz[1]) * t, 1.16 + Math.sin(t * Math.PI) * 0.35), t < 0.5 ? 1 : 0];
    });
  },

  /** Loyihalar: to'lqinli zarracha okeani (shader'da harakatlanadi) */
  wave: (n, r) =>
    fill(n, () => {
      const x = (r() * 2 - 1) * 4.6;
      const z = (r() * 2 - 1) * 2.4;
      const y = Math.sin(x * 0.9) * 0.18 + Math.cos(z * 1.4 + x * 0.3) * 0.14 - 0.55;
      return [x, y, z, sprinkle(r, 0.04)];
    }),

  /** Ish jarayoni: DNK uslubidagi qo'sh spiral + 6 bosqich tugunlari */
  helix: (n, r) =>
    fill(n, () => {
      const t = r();
      const x = -3 + t * 6;
      const a = t * Math.PI * 6;
      const k = r();
      if (k < 0.16) {
        // pog'onalar (zinapoyalar)
        const step = Math.round(t * 30) / 30;
        const aa = step * Math.PI * 6;
        const u = r() * 2 - 1;
        return [-3 + step * 6, Math.cos(aa) * 0.5 * u, Math.sin(aa) * 0.5 * u, 0];
      }
      if (k < 0.28) {
        const stage = (Math.floor(r() * 6) + 0.5) / 6;
        const sa = stage * Math.PI * 6;
        return [-3 + stage * 6 + gauss(r) * 0.06, Math.cos(sa) * 0.5 + gauss(r) * 0.06, Math.sin(sa) * 0.5 + gauss(r) * 0.06, 1];
      }
      const side = r() < 0.5 ? 0 : Math.PI;
      return [x + gauss(r) * 0.02, Math.cos(a + side) * 0.5 + gauss(r) * 0.025, Math.sin(a + side) * 0.5 + gauss(r) * 0.025, 0];
    }),

  ring: (n, r) =>
    fill(n, () => {
      const th = r() * Math.PI * 2;
      if (r() < 0.82) {
        const tube = Math.abs(gauss(r)) * 0.06;
        const ph = r() * Math.PI * 2;
        const R = 1.25 + Math.cos(ph) * tube;
        return [Math.cos(th) * R, Math.sin(th) * R * 0.5, Math.sin(ph) * tube + Math.sin(th) * 0.2, th > 2.6 && th < 3.6 ? 1 : 0];
      }
      const R = 1.25 + gauss(r) * 0.35;
      return [Math.cos(th) * R, Math.sin(th) * R * 0.5, gauss(r) * 0.2, sprinkle(r, 0.1)];
    }),

  sphere: (n, r) =>
    fill(n, () => {
      const p = sphereSurface(r, 1);
      const k = 0.85 + r() * 0.2;
      return [p[0] * k, p[1] * k, p[2] * k, sprinkle(r, 0.05)];
    }),
};

const cache = new Map<string, ShapeData>();

export function getShape(name: ShapeName, n: number): ShapeData {
  const key = `${name}:${n}`;
  let a = cache.get(key);
  if (!a) {
    a = GENS[name](n, rng(name.length * 7919 + n));
    cache.set(key, a);
  }
  return a;
}

/** Matnli shakllar — o'qilishi uchun kam aylantiriladi. */
export const FLAT_SHAPES: ReadonlySet<ShapeName> = new Set(["logo", "code", "n404"]);
