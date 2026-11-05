"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { scene } from "@/lib/scene-store";
import { onThemeChange, readTheme } from "@/lib/theme";
import type { Quality } from "@/lib/gpu";
import { FLAT_SHAPES, getShape } from "./shapes";
import { CORE_FRAG, CORE_VERT, WAVE_FRAG, WAVE_VERT } from "./glsl";

// Brend palitrasi: oq, kumush, qizil (#E3262F)
const WHITE = new THREE.Color("#FFFFFF");
const SILVER = new THREE.Color("#8E8E9A");
const RED = new THREE.Color("#E3262F");
const INTRO_SECONDS = 2.6;
// Kun rejimi: oq fonda qorong'i grafit zarrachalar (oddiy aralashish)
const INK = new THREE.Color("#15151B");
const GRAPHITE = new THREE.Color("#6E6E7A");
const RED_LIGHT = new THREE.Color("#D21F28");
const WAVE_INK = new THREE.Color("#3A3A44");

/** Material ranglari va aralashish rejimini mavzuga moslaydi. */
function applyTheme(m: THREE.ShaderMaterial, light: boolean, kind: "core" | "wave") {
  m.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
  const u = m.uniforms;
  if (kind === "core") {
    (u.uWhite!.value as THREE.Color).copy(light ? INK : WHITE);
    (u.uSilver!.value as THREE.Color).copy(light ? GRAPHITE : SILVER);
  } else {
    (u.uWhite!.value as THREE.Color).copy(light ? WAVE_INK : WHITE);
  }
  (u.uRed!.value as THREE.Color).copy(light ? RED_LIGHT : RED);
  m.needsUpdate = true;
}
const FOV = 35;
const CAM_Z = 6;

const damp = (a: number, b: number, lambda: number, dt: number) => THREE.MathUtils.damp(a, b, lambda, dt);

function viewHalf(camera: THREE.PerspectiveCamera) {
  const h = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z;
  return { w: h * camera.aspect, h };
}

/** "Sifat yadrosi" — scroll bo'ylab morf bo'ladigan partikul tizimi. */
function Core({ count, reduced, scaleCount, light }: { count: number; reduced: boolean; scaleCount: number; light: boolean }) {
  const { camera, size } = useThree();
  const pts = useRef<THREE.Points>(null);
  const pair = useRef({ from: scene.from, to: scene.to, m: scene.morph });
  const readySent = useRef(false);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const a = getShape(scene.from, count);
    const b = getShape(scene.to, count);
    g.setAttribute("position", new THREE.BufferAttribute(a.pos.slice(), 3));
    g.setAttribute("posB", new THREE.BufferAttribute(b.pos.slice(), 3));
    g.setAttribute("redA", new THREE.BufferAttribute(a.red.slice(), 1));
    g.setAttribute("redB", new THREE.BufferAttribute(b.red.slice(), 1));
    const rnd = new Float32Array(count * 4);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 4));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: CORE_VERT,
        fragmentShader: CORE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: scene.morph },
          uPush: { value: 0 },
          uSize: { value: 22 },
          uPR: { value: 1 },
          uScale: { value: 1 },
          uMotion: { value: 1 },
          uOpacity: { value: 0 },
          uMouse: { value: new THREE.Vector3(99, 99, 0) },
          uIntro: { value: reduced ? 1 : 0 },
          uSpin: { value: FLAT_SHAPES.has(scene.from) ? 0.25 : 1 },
          uWave: { value: 0 },
          uWarp: { value: 0 },
          uScrollSpin: { value: 0 },
          uWhite: { value: WHITE.clone() },
          uSilver: { value: SILVER.clone() },
          uRed: { value: RED.clone() },
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => applyTheme(material, light, "core"), [material, light]);

  useEffect(() => {
    geometry.setDrawRange(0, Math.floor(count * scaleCount));
  }, [geometry, count, scaleCount]);

  useFrame((state, dt) => {
    const u = material.uniforms;
    const p = pair.current;
    if (!readySent.current) {
      // Birinchi kadr chizildi: loader yopilishi mumkin
      readySent.current = true;
      window.dispatchEvent(new Event("sifat:scene-ready"));
    }
    // Shakl juftligi almashganda morfni uzluksiz saqlash
    if (scene.from !== p.from || scene.to !== p.to) {
      if (scene.from === p.to) p.m -= 1;
      else if (scene.to === p.from) p.m += 1;
      else p.m = scene.morph;
      const A = getShape(scene.from, count);
      const B = getShape(scene.to, count);
      (geometry.attributes.position as THREE.BufferAttribute).copyArray(A.pos).needsUpdate = true;
      (geometry.attributes.posB as THREE.BufferAttribute).copyArray(B.pos).needsUpdate = true;
      (geometry.attributes.redA as THREE.BufferAttribute).copyArray(A.red).needsUpdate = true;
      (geometry.attributes.redB as THREE.BufferAttribute).copyArray(B.red).needsUpdate = true;
      p.from = scene.from;
      p.to = scene.to;
    }
    const k = reduced ? 1000 : 6;
    p.m = reduced ? scene.morph : damp(p.m, scene.morph, 4, dt);
    u.uMorph!.value = THREE.MathUtils.clamp(p.m, 0, 1);
    u.uTime!.value += reduced ? 0 : dt;
    u.uMotion!.value = reduced ? 0 : 1;
    u.uPR!.value = state.gl.getPixelRatio();
    // Kirish: zarrachalar sferadan logotipga yig'iladi
    u.uIntro!.value = reduced ? 1 : Math.min(1, u.uIntro!.value + dt / INTRO_SECONDS);
    // Matnli shakllar (logotip, </>, 404) o'qilishi uchun kam aylanadi; to'lqin — okean harakati
    const mm = u.uMorph!.value as number;
    const flat = (FLAT_SHAPES.has(scene.from) ? 1 - mm : 0) + (FLAT_SHAPES.has(scene.to) ? mm : 0);
    u.uSpin!.value = damp(u.uSpin!.value, 1 - flat * 0.8, 4, dt);
    // Telefonda shakl scroll bilan aylanadi (matnli shakllar bundan mustasno)
    u.uScrollSpin!.value = size.width < 768 && !reduced ? scene.scrollY * 0.0014 * (1 - Math.min(flat, 1)) : 0;
    const wave = (scene.from === "wave" ? 1 - mm : 0) + (scene.to === "wave" ? mm : 0);
    u.uWave!.value = damp(u.uWave!.value, wave, 4, dt);
    // O'tish: tez tarqaladi, sekinroq yig'iladi
    const wt = reduced ? 0 : scene.warp;
    u.uWarp!.value = damp(u.uWarp!.value, wt, wt > u.uWarp!.value ? 9 : 2.4, dt);

    const half = viewHalf(camera as THREE.PerspectiveCamera);
    const mobile = size.width < 768;
    const tx = mobile ? 0 : scene.x * half.w;
    const ty = (mobile ? scene.my : scene.y) * half.h;
    if (pts.current) {
      pts.current.position.x = damp(pts.current.position.x, tx, k, dt);
      pts.current.position.y = damp(pts.current.position.y, ty, k, dt);
    }
    // Tor ekranda yadro matnni yopmasligi uchun kenglikka qarab ham kichrayadi.
    // Telefonda shakl ekran kengligining ~70% ini egallaydi (avval juda kichrayib ketardi)
    const scaleTarget = mobile
      ? scene.mscale * THREE.MathUtils.clamp(half.w / 1.45, 0.4, 1)
      : scene.scale * 0.9 * Math.min(1, half.h / 1.9, half.w / 3.6);
    u.uScale!.value = damp(u.uScale!.value, scaleTarget, k, dt);
    if (pts.current) {
      scene.core.x = pts.current.position.x;
      scene.core.y = pts.current.position.y;
    }
    // Shakl radiusi (~1.6 birlik) × masshtab; to'lqin/tarqoq shakllarda bo'sh joy kerak emas
    const spread = scene.to === "wave" || scene.from === "wave" ? 0 : 1;
    scene.core.r = 1.65 * (u.uScale!.value as number);
    scene.core.o = damp(scene.core.o, scene.coreOpacity > 0.3 ? spread : 0, 3, dt);
    u.uOpacity!.value = damp(u.uOpacity!.value, scene.coreOpacity, 3, dt);
    u.uSize!.value = (mobile ? 13 : 16) * Math.sqrt(50_000 / Math.max(count * scaleCount, 10_000));

    const mouseOn = scene.mouse.active && !reduced;
    // Telefonda barmoq tegmagan paytda ham zarrachalar o'zi girdob hosil qiladi
    const auto = mobile && !mouseOn && !reduced;
    u.uPush!.value = damp(u.uPush!.value, mouseOn ? scene.push : auto ? 0.16 * (1 - 0.7 * Math.min(flat, 1)) : 0, 5, dt);
    if (mouseOn) (u.uMouse!.value as THREE.Vector3).set(scene.mouse.x * half.w, scene.mouse.y * half.h, 0);
    else if (auto && pts.current) {
      const t = u.uTime!.value as number;
      const r = scene.core.r;
      (u.uMouse!.value as THREE.Vector3).set(pts.current.position.x + Math.cos(t * 0.7) * r * 0.75, pts.current.position.y + Math.sin(t * 1.1) * r * 0.55, 0);
    }

    const cam = camera as THREE.PerspectiveCamera;
    cam.position.z = damp(cam.position.z, CAM_Z - scene.depth * 1.6 - (u.uWarp!.value as number) * 2.2, 4, dt);
  });

  return <points ref={pts} geometry={geometry} material={material} frustumCulled={false} />;
}

/**
 * Fon to'lqini — butun sayt ortida oqib turadigan zarracha lentasi (scroll bilan fazasi siljiydi).
 * Kursor yaqinida zarrachalar biroz chetga suriladi va yorqinlashadi.
 */
function WaveBackground({ count, reduced, scaleCount, light }: { count: number; reduced: boolean; scaleCount: number; light: boolean }) {
  const { camera, size } = useThree();
  const pts = useRef<THREE.Points>(null);
  const mouse = useRef(new THREE.Vector2(99, 99));

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    // Ekran nisbatiga yaqin setka (kenglik > balandlik)
    const cols = Math.round(Math.sqrt(count * 1.7));
    const rows = Math.max(1, Math.floor(count / cols));
    const n = cols * rows;
    const uv = new Float32Array(n * 2);
    const rnd = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      uv[i * 2] = ((i % cols) + Math.random() * 0.9) / cols;
      uv[i * 2 + 1] = (Math.floor(i / cols) + Math.random() * 0.9) / rows;
      rnd[i * 3] = Math.random();
      rnd[i * 3 + 1] = Math.random();
      rnd[i * 3 + 2] = Math.random();
    }
    // position faqat three.js talab qilgani uchun (shakl shader'da hisoblanadi)
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute("aUV", new THREE.BufferAttribute(uv, 2));
    g.setAttribute("aRand", new THREE.BufferAttribute(rnd, 3));
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: WAVE_VERT,
        fragmentShader: WAVE_FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uScroll: { value: 0 },
          uMotion: { value: 1 },
          uOpacity: { value: 0 },
          uPR: { value: 1 },
          uSize: { value: 14 },
          uPush: { value: 0 },
          uWarp: { value: 0 },
          uCore: { value: new THREE.Vector4(0, 0, 1, 0) },
          uMouse: { value: mouse.current },
          uHalf: { value: new THREE.Vector2(3, 2) },
          uWhite: { value: WHITE.clone() },
          uRed: { value: RED.clone() },
        },
      }),
    [],
  );

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useEffect(() => applyTheme(material, light, "wave"), [material, light]);

  useEffect(() => {
    geometry.setDrawRange(0, Math.floor(geometry.attributes.position!.count * scaleCount));
  }, [geometry, scaleCount]);

  useFrame((state, dt) => {
    const u = material.uniforms;
    const half = viewHalf(camera as THREE.PerspectiveCamera);
    (u.uHalf!.value as THREE.Vector2).set(half.w, half.h);
    (u.uCore!.value as THREE.Vector4).set(scene.core.x, scene.core.y, scene.core.r, scene.core.o);
    const warp = reduced ? 0 : scene.warp;
    u.uWarp!.value = damp(u.uWarp!.value, warp, warp > u.uWarp!.value ? 8 : 2, dt);
    // O'tish paytida to'lqin tezlashadi
    u.uTime!.value += reduced ? 0 : dt * (1 + (u.uWarp!.value as number) * 5);
    u.uMotion!.value = reduced ? 0 : 1;
    u.uPR!.value = state.gl.getPixelRatio();
    u.uScroll!.value = scene.scrollY * 0.0009;
    const mobile = size.width < 768;
    u.uSize!.value = (mobile ? 22 : 24) * Math.sqrt(70_000 / Math.max(count * scaleCount, 10_000));
    // Matn ustida o'qilishi uchun fon yumshoq
    u.uOpacity!.value = damp(u.uOpacity!.value, mobile ? 0.22 : 0.5, 2.5, dt);
    const on = scene.mouse.active && !reduced;
    u.uPush!.value = damp(u.uPush!.value, on ? 1 : 0, 4, dt);
    if (on) mouse.current.set(scene.mouse.x * half.w, scene.mouse.y * half.h);
  });

  return <points ref={pts} geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />;
}

/** FPS kuzatuvi: 2 soniya davomida < 30 bo'lsa sifat bir pog'ona tushadi (TZ 7.6). */
function Governor({ onDegrade }: { onDegrade: () => void }) {
  const acc = useRef({ frames: 0, time: 0, grace: 3 });
  useFrame((_, dt) => {
    const a = acc.current;
    if (a.grace > 0) {
      a.grace -= dt;
      return;
    }
    a.frames++;
    a.time += dt;
    if (a.time >= 2) {
      const fps = a.frames / a.time;
      a.frames = 0;
      a.time = 0;
      if (fps < 30) {
        a.grace = 2;
        onDegrade();
      }
    }
  });
  return null;
}

function Invalidator({ reduced }: { reduced: boolean }) {
  const { invalidate } = useThree();
  useEffect(() => {
    if (!reduced) return;
    // Statik rejimda scroll/shakl o'zgarganda bitta kadr chiziladi.
    let raf = 0;
    const tick = () => {
      invalidate();
      raf = 0;
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    const id = setInterval(on, 500);
    on();
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
      clearInterval(id);
    };
  }, [reduced, invalidate]);
  return null;
}

export default function Scene({ quality, reduced, onFail }: { quality: Quality; reduced: boolean; onFail: () => void }) {
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, quality.dpr));
  const [scaleCount, setScaleCount] = useState(1);
  const [hidden, setHidden] = useState(false);
  const [light, setLight] = useState(() => readTheme() === "light");
  useEffect(() => onThemeChange((t) => setLight(t === "light")), []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    const onMove = (e: PointerEvent) => {
      scene.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      scene.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
      scene.mouse.active = true;
      scene.mouse.lastMove = performance.now();
    };
    const onLeave = () => {
      scene.mouse.active = false;
    };
    // Telefon: barmoq bilan zarrachalarni surish
    const onTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      scene.mouse.x = (t.clientX / window.innerWidth) * 2 - 1;
      scene.mouse.y = -((t.clientY / window.innerHeight) * 2 - 1);
      scene.mouse.active = true;
      scene.mouse.lastMove = performance.now();
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchstart", onTouch, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("touchend", onLeave, { passive: true });
    window.addEventListener("touchcancel", onLeave, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("touchend", onLeave);
      window.removeEventListener("touchcancel", onLeave);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const degrade = () => {
    if (dpr > 1) setDpr((d) => Math.max(1, d - 0.5));
    else if (scaleCount > 0.35) setScaleCount((s) => s * 0.65);
    else onFail();
  };

  return (
    <Canvas
      style={{ pointerEvents: "none" }}
      dpr={dpr}
      frameloop={hidden ? "never" : reduced ? "demand" : "always"}
      camera={{ fov: FOV, position: [0, 0, CAM_Z], near: 0.1, far: 50 }}
      gl={{ antialias: false, alpha: true, powerPreference: quality.tier === 3 ? "high-performance" : "default", stencil: false, depth: false }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.domElement.addEventListener("webglcontextlost", (e) => {
          e.preventDefault();
          onFail();
        });
      }}
    >
      <WaveBackground count={quality.wave} reduced={reduced} scaleCount={scaleCount} light={light} />
      <Core count={quality.core} reduced={reduced} scaleCount={scaleCount} light={light} />
      {!reduced && <Governor onDegrade={degrade} />}
      <Invalidator reduced={reduced} />
    </Canvas>
  );
}

