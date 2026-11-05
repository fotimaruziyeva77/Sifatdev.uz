/**
 * Qurilma darajasini aniqlash (TZ 7.6). Uchinchi tomon CDN'ga so'rov yubormaydi —
 * WebGL renderer qatori, xotira va protsessor soni bo'yicha evristika + ishlash vaqtida FPS nazorati.
 */
export type Tier = 0 | 1 | 2 | 3;

export type Quality = { tier: Tier; core: number; wave: number; dpr: number };

export const QUALITY: Record<Exclude<Tier, 0>, Omit<Quality, "tier">> = {
  1: { core: 16_000, wave: 30_000, dpr: 1.5 }, // zamonaviy smartfon
  2: { core: 40_000, wave: 70_000, dpr: 1.5 }, // o'rnatilgan GPU'li noutbuk
  3: { core: 80_000, wave: 120_000, dpr: 2 }, // diskret GPU
};

const WEAK = /SwiftShader|llvmpipe|Software|Basic Render|Mali-4|Mali-T[67]|Adreno \(TM\) [2-4]\d\d|PowerVR SGX|Intel\(R\) HD Graphics [2-4]\d{3}/i;
const STRONG = /NVIDIA|GeForce|RTX|Quadro|Radeon RX|Radeon Pro|Apple M\d (Pro|Max|Ultra)/i;

export function detectTier(): Tier {
  if (typeof window === "undefined") return 0;
  // Sinov/diagnostika: ?force3d — kuchsiz GPU'da ham 3D yoqiladi (faqat shu tashrif uchun)
  if (new URLSearchParams(location.search).has("force3d")) {
    try {
      return document.createElement("canvas").getContext("webgl2") ? 2 : 0;
    } catch {
      return 0;
    }
  }
  let gl: WebGL2RenderingContext | null = null;
  try {
    const c = document.createElement("canvas");
    gl = c.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  } catch {
    return 0;
  }
  if (!gl) return 0;
  let renderer = "";
  try {
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    renderer = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
  } catch {
    /* ignore */
  }
  gl.getExtension("WEBGL_lose_context")?.loseContext();

  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  const mem = nav.deviceMemory ?? 8;
  const cores = nav.hardwareConcurrency ?? 4;
  if (WEAK.test(renderer) || mem <= 2 || cores <= 2) return 0;

  const mobile = window.matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) < 900;
  if (mobile || nav.connection?.saveData) return 1;
  return STRONG.test(renderer) ? 3 : 2;
}

export function qualityFor(tier: Tier): Quality | null {
  if (tier === 0) return null;
  return { tier, ...QUALITY[tier] };
}
