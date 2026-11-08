/** 3D simplex noise (Ashima Arts / Stefan Gustavson, MIT). */
export const SNOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
/* Curl-noise'ga yaqin, arzon "suzish" maydoni */
vec3 drift(vec3 p, float t){
  return vec3(snoise(p+vec3(0.0,t,0.0)), snoise(p+vec3(17.3,-t,4.1)), snoise(p+vec3(-9.7,2.3,t)));
}
`;


/**
 * "Sifat yadrosi" — oq/kumush zarrachalar, qizil brend urg'ulari.
 * uIntro: birinchi kadrlarda zarrachalar katta sferadan uchib kelib shaklga yig'iladi.
 * uWave: "to'lqin" shaklida okean kabi harakat. Kursor itaradi va girdob kabi aylantiradi.
 */
export const CORE_VERT = /* glsl */ `
attribute vec3 posB;
attribute float redA;
attribute float redB;
attribute vec4 aRand;
uniform float uTime, uMorph, uPush, uSize, uPR, uScale, uMotion, uIntro, uSpin, uWave, uWarp, uScrollSpin;
uniform vec3 uMouse;
uniform vec3 uWhite, uSilver, uRed;
varying vec3 vColor;
varying float vAlpha;
${SNOISE}
void main(){
  float r = aRand.x;
  float m = smoothstep(r * 0.45, r * 0.45 + 0.55, uMorph);
  vec3 p = mix(position, posB, m);
  float red = mix(redA, redB, m);
  float mid = sin(m * 3.14159);

  // To'lqin (okean) harakati
  p.y += (sin(p.x * 1.3 + uTime * 0.9) * 0.16 + cos(p.z * 1.7 + uTime * 0.7) * 0.12) * uWave * uMotion;

  // Shakl o'tish paytida suzadi, joyida turganda tiniq qoladi
  p += drift(p * 0.7, uTime * 0.08 * uMotion) * (0.008 + mid * 0.5);
  p *= 1.0 + (sin(uTime * 0.45) * 0.01) * uMotion;

  // Faqat yengil tebranish (to'planib boruvchi aylanish yo'q — logotip doim o'qiladi)
  float a = sin(uTime * 0.22) * 0.45 * uSpin * uMotion + uScrollSpin;
  float b = sin(uTime * 0.17 + 1.3) * 0.14 * uSpin * uMotion;
  p.xz = mat2(cos(a), -sin(a), sin(a), cos(a)) * p.xz;
  p.yz = mat2(cos(b), -sin(b), sin(b), cos(b)) * p.yz;

  // Kirish animatsiyasi: tasodifiy sferadan yig'ilish (har zarracha o'z vaqtida)
  vec3 dir = normalize(vec3(aRand.y - 0.5, aRand.z - 0.5, aRand.w - 0.5) + 1e-3);
  vec3 start = dir * (5.0 + aRand.y * 4.0);
  float it = smoothstep(aRand.z * 0.5, aRand.z * 0.5 + 0.5, uIntro);
  it = 1.0 - pow(1.0 - it, 3.0);
  p = mix(start, p, it);

  // Sahifa o'tishi: zarrachalar spiral bo'lib tarqaladi (kamera ichidan uchib o'tadi)
  float wa = uWarp * (0.6 + aRand.y * 0.8);
  float sw = wa * (2.2 + aRand.x * 0.6); // uWarp = 0 bo'lsa burilish ham 0
  p.xy = mat2(cos(sw), -sin(sw), sin(sw), cos(sw)) * p.xy;
  p += dir * wa * (2.5 + aRand.z * 3.0);
  p.z += wa * 2.5;

  p *= uScale;
  vec4 world = modelMatrix * vec4(p, 1.0);

  // Kursor: itarish + girdob
  vec2 d = world.xy - uMouse.xy;
  float dist2 = dot(d, d);
  // Ta'sir kichik va yumshoq: shakl o'qiladigan bo'lib qoladi
  float f = exp(-dist2 * 16.0) * uPush;
  vec2 nd = normalize(d + 1e-4);
  world.xy += nd * f * 0.12 + vec2(-nd.y, nd.x) * f * 0.06;
  world.z += f * 0.08;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  // Shakl kichik bo'lsa zarracha ham kichrayadi — dog'ga aylanib ketmaydi
  gl_PointSize = uSize * clamp(uScale * 1.15, 0.35, 1.0) * (0.55 + aRand.y * 0.9) * (1.0 + red * 0.2) * uPR / max(-mv.z, 0.1);

  float tw = 0.75 + 0.25 * sin(uTime * (1.5 + aRand.w * 2.0) + r * 40.0) * uMotion; // miltillash (sekin)
  vAlpha = (0.34 + 0.46 * aRand.z) * tw * (1.0 + f * 1.2) * mix(0.4, 1.0, it);
  vec3 base = mix(uSilver, uWhite, 0.55 + 0.45 * smoothstep(-1.0, 1.0, p.y * 0.7 + aRand.w));
  vColor = mix(base, uRed, clamp(red + f * 0.6 + uWarp * step(0.6, aRand.x), 0.0, 1.0));
}
`;

export const CORE_FRAG = /* glsl */ `
precision mediump float;
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor * (0.75 + a * 0.5), a * a * vAlpha * uOpacity);
}
`;

/**
 * Fon to'lqini — butun sayt ortida oqib turadigan, buralib harakatlanadigan zarracha lentasi.
 * Har zarracha (u, v) setkada: u — lenta bo'ylab, v — eni bo'ylab. Shakl to'liq GPU'da hisoblanadi,
 * shuning uchun CPU yuklamasi yo'q. Bir cheti oqib yuruvchi qizil, qolgani oq/kumush.
 */
export const WAVE_VERT = /* glsl */ `
attribute vec2 aUV;
attribute vec3 aRand;
uniform float uTime, uMotion, uScroll, uOpacity, uPR, uSize, uPush, uWarp;
uniform vec2 uMouse, uHalf;
uniform vec4 uCore; // x, y, radius, kuch
uniform vec3 uWhite, uRed;
varying vec3 vColor;
varying float vAlpha;
${SNOISE}
// Butun ekranni qoplaydigan to'lqinli sirt balandligi
float waveH(vec2 q, float t){
  return sin(q.x * 0.55 + t * 0.45) * 0.42
       + sin(q.x * 1.1 - q.y * 0.7 + t * 0.32) * 0.22
       + sin(q.y * 0.9 + t * 0.27) * 0.25
       + snoise(vec3(q * 0.35, t * 0.08)) * 0.35;
}
void main(){
  float t = uTime * uMotion + uScroll * 2.0;
  // Setka ekrandan biroz kattaroq — chetlarda bo'shliq qolmaydi
  vec2 q = (aUV - 0.5) * vec2(uHalf.x * 2.5, uHalf.y * 2.9);
  q += (aRand.xy - 0.5) * 0.05;
  float h = waveH(q, t);
  vec3 p = vec3(q.x, q.y, h);
  // Sirt qiya: pastki qismi yaqinroq, yuqorisi uzoqroq — chuqurlik hissi
  float tilt = -0.55;
  p = vec3(p.x, p.y * cos(tilt) - p.z * sin(tilt), p.y * sin(tilt) + p.z * cos(tilt) - 0.6);

  vec4 world = modelMatrix * vec4(p, 1.0);
  vec2 d = world.xy - uMouse;
  float f = exp(-dot(d, d) * 1.4) * uPush;
  world.xy += normalize(d + 1e-4) * f * 0.28;
  world.z += f * 0.25;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.6 + aRand.z * 1.1) * uPR / max(-mv.z, 0.1);

  // To'lqin cho'qqilari yorqinroq — sirt shakli ko'rinadi
  float crest = smoothstep(-0.6, 0.9, h);
  // Kamera z=6 da; sirt ~4.5–8 birlik uzoqda — faqat eng uzoq qismi yumshoq so'nadi
  float depthFade = 0.35 + 0.65 * smoothstep(-11.0, -5.0, mv.z);
  // 3D shakl turgan joyda fon xiralashadi — shakl aniq ko'rinadi
  float cd = length(world.xy - uCore.xy) / max(uCore.z, 0.01);
  float hole = mix(1.0, 0.08 + 0.92 * smoothstep(0.55, 1.25, cd), uCore.w);
  vAlpha = (0.22 + 0.78 * crest) * (0.45 + 0.55 * aRand.z) * depthFade * uOpacity * hole * (1.0 + f * 1.5);
  // Qizil oqim sirt bo'ylab diagonal siljiydi
  float red = smoothstep(0.55, 0.95, 0.5 + 0.5 * sin(q.x * 0.35 + q.y * 0.5 - t * 0.4)) * crest;
  red = max(red, step(0.982, aRand.x) * 0.9);
  vColor = mix(uWhite * (0.65 + 0.35 * crest), uRed, red);
}
`;

export const WAVE_FRAG = /* glsl */ `
precision mediump float;
varying vec3 vColor;
varying float vAlpha;
void main(){
  float d = length(gl_PointCoord - 0.5);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(vColor, a * a * vAlpha);
}
`;
