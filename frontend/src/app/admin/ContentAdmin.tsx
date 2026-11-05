"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, Trash2, X } from "lucide-react";

type Call = (path: string, init?: RequestInit) => Promise<Response>;
type Lang = "uz" | "ru" | "en";
type L = Record<Lang, string>;
type Doc = Record<string, any>;
type Item = { id: string; data: Doc; published: boolean };
type Section = "case" | "vacancy" | "stats";

const EMPTY: L = { uz: "", ru: "", en: "" };
const LANGS: { k: Lang; l: string }[] = [
  { k: "uz", l: "O'zbekcha" },
  { k: "ru", l: "Ruscha" },
  { k: "en", l: "Inglizcha" },
];
const INDUSTRIES: Record<string, string> = { gov: "Davlat sektori", construction: "Qurilish", agro: "Agro", hr: "HR", retail: "Savdo", legal: "Huquq", services: "Xizmat ko'rsatish" };
const SERVICES: Record<string, string> = { web: "Veb-platforma", mobile: "Mobil ilova", ai: "AI agentlar", gov: "Davlat tizimlari", automation: "Avtomatlashtirish", outsourcing: "Autsors" };
const DIRECTIONS = ["frontend", "backend", "mobile", "design", "qa", "ai"];
const WORK_TYPES: Record<string, string> = { office: "Ofis", remote: "Masofaviy", hybrid: "Gibrid" };

const newCase = (): Doc => ({
  order: 100, title: { ...EMPTY }, client: { ...EMPTY }, clientHidden: false, industry: "services", services: [], year: new Date().getFullYear(),
  duration: { ...EMPTY }, team: { ...EMPTY }, summary: { ...EMPTY }, problem: { ...EMPTY }, solution: { ...EMPTY }, features: [], results: [], tech: [], hue: 220, device: "laptop", url: "", shots: [],
});
const newVacancy = (): Doc => ({
  open: true, direction: "frontend", level: { ...EMPTY }, type: "office", title: { ...EMPTY }, intro: { ...EMPTY }, tasks: [], requirements: [], conditions: [], posted: new Date().toISOString().slice(0, 10),
});

/** Sarlavhadan manzil (URL) uchun id yasaydi. */
function slugify(text: string): string {
  const s = text.toLowerCase().replace(/[ʻʼ'`’‘]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/, "");
  return s.length >= 2 ? s : `yozuv-${Date.now()}`;
}

function describe(res: Response, body: any): string {
  if (res.status === 409) return "Bunday nomli yozuv allaqachon bor. Sarlavhani o'zgartiring.";
  if (res.status === 403) return "Bu amal uchun ruxsatingiz yo'q.";
  if (res.status === 413 || body?.error === "file_rejected") return "Rasm mos emas: faqat png, jpg yoki webp, 5 MB gacha.";
  if (res.status === 429 || res.status === 503) return "Juda ko'p so'rov. Bir daqiqadan keyin qayta urinib ko'ring.";
  if (body?.fields?.length) {
    const names = body.fields.map((f: { field: string }) => f.field).join(", ");
    return `Maydonlarni tekshiring: ${names}`;
  }
  return "Saqlab bo'lmadi. Qayta urinib ko'ring.";
}

function Box({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="text-[13px] text-muted">{hint}</span>}
    </label>
  );
}

function TextL({ label, value, lang, onChange, area, hint }: { label: string; value?: L; lang: Lang; onChange: (v: L) => void; area?: boolean; hint?: string }) {
  const v = value ?? EMPTY;
  const set = (t: string) => onChange({ ...v, [lang]: t });
  return (
    <Box label={label} hint={hint}>
      {area ? <textarea className="input" rows={4} value={v[lang]} onChange={(e) => set(e.target.value)} /> : <input className="input" value={v[lang]} onChange={(e) => set(e.target.value)} />}
    </Box>
  );
}

/** Ro'yxat: har qator alohida band. Tillar qator raqami bo'yicha bog'lanadi. */
function LinesL({ label, value, lang, onChange }: { label: string; value: L[]; lang: Lang; onChange: (v: L[]) => void }) {
  const text = value.map((x) => x[lang]).join("\n");
  const set = (t: string) => {
    const lines = t.split("\n");
    const n = Math.max(lines.length, value.length);
    const next: L[] = [];
    for (let i = 0; i < n; i++) next.push({ ...(value[i] ?? EMPTY), [lang]: lines[i] ?? "" });
    while (next.length > lines.length && !next[next.length - 1]!.uz && !next[next.length - 1]!.ru && !next[next.length - 1]!.en) next.pop();
    onChange(next);
  };
  return (
    <Box label={label} hint="Har bir band alohida qatorda. Avval o'zbekcha yozing.">
      <textarea className="input" rows={Math.max(3, value.length + 1)} value={text} onChange={(e) => set(e.target.value)} />
    </Box>
  );
}

function LangTabs({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {LANGS.map((x) => (
        <button key={x.k} type="button" onClick={() => setLang(x.k)} className={`btn btn-sm ${lang === x.k ? "btn-primary" : "btn-secondary"}`}>{x.l}</button>
      ))}
      <span className="text-[13px] text-muted">Ruscha va inglizcha bo&apos;sh qolsa, o&apos;zbekcha matn ko&apos;rsatiladi.</span>
    </div>
  );
}

function Shots({ value, onChange, call, setMsg }: { value: { src: string; device: string }[]; onChange: (v: { src: string; device: string }[]) => void; call: Call; setMsg: (m: string) => void }) {
  const [busy, setBusy] = useState(false);
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setMsg("");
    const next = [...value];
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", f, f.name);
      const res = await call("/media", { method: "POST", body: fd });
      const body = await res.json().catch(() => null);
      if (res.ok && body?.src) next.push({ src: body.src, device: "laptop" });
      else setMsg(describe(res, body));
    }
    onChange(next);
    setBusy(false);
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const n = [...value];
    [n[i], n[j]] = [n[j]!, n[i]!];
    onChange(n);
  };
  return (
    <div className="field">
      <span className="label">Skrinshotlar (birinchisi muqova bo&apos;ladi)</span>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {value.map((s, i) => (
          <div key={s.src + i} className="rounded-lg border border-line p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={`Skrinshot ${i + 1}`} className="aspect-video w-full rounded object-cover object-top" />
            <div className="mt-2 flex items-center gap-1">
              <select className="input !min-h-9 !py-1 text-[14px]" value={s.device} aria-label="Qurilma" onChange={(e) => onChange(value.map((x, k) => (k === i ? { ...x, device: e.target.value } : x)))}>
                <option value="laptop">Noutbuk</option>
                <option value="phone">Telefon</option>
              </select>
              <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="Oldinga" onClick={() => move(i, -1)}><ArrowUp size={16} /></button>
              <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="Orqaga" onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
              <button type="button" className="btn btn-ghost btn-sm !px-2" aria-label="O'chirish" onClick={() => onChange(value.filter((_, k) => k !== i))}><X size={16} /></button>
            </div>
          </div>
        ))}
      </div>
      <label className="btn btn-secondary btn-sm w-fit cursor-pointer">
        <Plus size={16} aria-hidden="true" /> {busy ? "Yuklanmoqda…" : "Rasm yuklash"}
        <input type="file" className="sr-only" multiple accept=".png,.jpg,.jpeg,.webp" onChange={(e) => { void upload(e.target.files); e.target.value = ""; }} />
      </label>
      <span className="text-[13px] text-muted">png, jpg yoki webp, 5 MB gacha. Skrinshotda maxfiy ma&apos;lumot bo&apos;lmasin.</span>
    </div>
  );
}

function CaseForm({ d, set, lang, call, setMsg }: { d: Doc; set: (p: Doc) => void; lang: Lang; call: Call; setMsg: (m: string) => void }) {
  return (
    <div className="grid gap-5">
      <TextL label="Loyiha nomi *" value={d.title} lang={lang} onChange={(v) => set({ title: v })} />
      <TextL label="Qisqa tavsif *" value={d.summary} lang={lang} onChange={(v) => set({ summary: v })} area />
      <TextL label="Muammo" value={d.problem} lang={lang} onChange={(v) => set({ problem: v })} area hint="Bo'sh qolsa, saytda ko'rsatilmaydi." />
      <TextL label="Yechim" value={d.solution} lang={lang} onChange={(v) => set({ solution: v })} area />
      <LinesL label="Asosiy funksiyalar" value={d.features ?? []} lang={lang} onChange={(v) => set({ features: v })} />
      <LinesL label="Natijalar (faqat tasdiqlangan)" value={d.results ?? []} lang={lang} onChange={(v) => set({ results: v })} />
      <div className="grid gap-5 md:grid-cols-3">
        <TextL label="Mijoz" value={d.client} lang={lang} onChange={(v) => set({ client: v })} />
        <TextL label="Muddat" value={d.duration} lang={lang} onChange={(v) => set({ duration: v })} hint="Masalan: 4 oy" />
        <TextL label="Jamoa" value={d.team} lang={lang} onChange={(v) => set({ team: v })} hint="Masalan: 5 kishi" />
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        <Box label="Soha">
          <select className="input" value={d.industry} onChange={(e) => set({ industry: e.target.value })}>
            {Object.entries(INDUSTRIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Box>
        <Box label="Yil"><input className="input" type="number" min={2000} max={2100} value={d.year} onChange={(e) => set({ year: Number(e.target.value) })} /></Box>
        <Box label="Tartib raqami" hint="Kichik raqam oldinda turadi"><input className="input" type="number" min={0} step="0.1" value={d.order} onChange={(e) => set({ order: Number(e.target.value) })} /></Box>
      </div>
      <fieldset className="field">
        <legend className="label mb-2 text-[14px] font-medium text-fg-2">Xizmatlar</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SERVICES).map(([k, v]) => (
            <label key={k} className="opt !min-h-10 !text-[14px]">
              <input type="checkbox" checked={(d.services ?? []).includes(k)} onChange={(e) => set({ services: e.target.checked ? [...(d.services ?? []), k] : d.services.filter((x: string) => x !== k) })} />
              {v}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-5 md:grid-cols-2">
        <Box label="Texnologiyalar" hint="Vergul bilan: React, Python, PostgreSQL">
          <input className="input" value={(d.tech ?? []).join(", ")} onChange={(e) => set({ tech: e.target.value.split(",").map((x) => x.trimStart()) })} onBlur={(e) => set({ tech: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} />
        </Box>
        <Box label="Sayt manzili" hint="Bo'sh qolsa, 'Saytni ochish' tugmasi chiqmaydi"><input className="input" type="url" placeholder="https://" value={d.url ?? ""} onChange={(e) => set({ url: e.target.value.trim() })} /></Box>
      </div>
      <label className="check"><input type="checkbox" checked={!!d.clientHidden} onChange={(e) => set({ clientHidden: e.target.checked })} /><span>Mijoz nomini yashirish (davlat loyihalari uchun yozma ruxsat bo&apos;lmasa)</span></label>
      <Shots value={d.shots ?? []} onChange={(v) => set({ shots: v })} call={call} setMsg={setMsg} />
    </div>
  );
}

function VacancyForm({ d, set, lang }: { d: Doc; set: (p: Doc) => void; lang: Lang }) {
  return (
    <div className="grid gap-5">
      <TextL label="Lavozim *" value={d.title} lang={lang} onChange={(v) => set({ title: v })} />
      <TextL label="Qisqa tavsif *" value={d.intro} lang={lang} onChange={(v) => set({ intro: v })} area />
      <LinesL label="Vazifalar" value={d.tasks ?? []} lang={lang} onChange={(v) => set({ tasks: v })} />
      <LinesL label="Talablar" value={d.requirements ?? []} lang={lang} onChange={(v) => set({ requirements: v })} />
      <LinesL label="Shartlar" value={d.conditions ?? []} lang={lang} onChange={(v) => set({ conditions: v })} />
      <div className="grid gap-5 md:grid-cols-4">
        <TextL label="Daraja" value={d.level} lang={lang} onChange={(v) => set({ level: v })} hint="Masalan: Middle" />
        <Box label="Yo'nalish">
          <select className="input" value={d.direction} onChange={(e) => set({ direction: e.target.value })}>
            {DIRECTIONS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </Box>
        <Box label="Ish turi">
          <select className="input" value={d.type} onChange={(e) => set({ type: e.target.value })}>
            {Object.entries(WORK_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Box>
        <Box label="E'lon sanasi"><input className="input" type="date" value={d.posted} onChange={(e) => set({ posted: e.target.value })} /></Box>
      </div>
      <label className="check"><input type="checkbox" checked={!!d.open} onChange={(e) => set({ open: e.target.checked })} /><span>Vakansiya ochiq (yopilsa, sahifa &quot;Vakansiya yopilgan&quot; deb ko&apos;rsatadi)</span></label>
    </div>
  );
}

function ItemsPanel({ kind, call }: { kind: "case" | "vacancy"; call: Call }) {
  const [items, setItems] = useState<Item[]>([]);
  const [edit, setEdit] = useState<{ id: string | null; data: Doc; published: boolean } | null>(null);
  const [lang, setLang] = useState<Lang>("uz");
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const word = kind === "case" ? "loyiha" : "vakansiya";

  const load = useCallback(async () => {
    const r = await call(`/content/${kind}`);
    if (r.ok) setItems((await r.json()).items);
  }, [call, kind]);
  useEffect(() => { void load(); }, [load]);

  const put = async (id: string, data: Doc, published: boolean, create: boolean) => {
    const r = await call(`/content/${kind}/${id}`, { method: "PUT", body: JSON.stringify({ data, published, create }) });
    const body = await r.json().catch(() => null);
    return { ok: r.ok, message: r.ok ? "" : describe(r, body) };
  };

  const save = async () => {
    if (!edit) return;
    setSaving(true);
    setMsg("");
    const create = edit.id === null;
    const id = edit.id ?? slugify(edit.data.title?.uz ?? "");
    const r = await put(id, edit.data, edit.published, create);
    setSaving(false);
    if (!r.ok) return setMsg(r.message);
    setEdit(null);
    setMsg("Saqlandi. Saytda 15 soniyagacha vaqt ichida yangilanadi.");
    await load();
  };

  const toggle = async (it: Item) => {
    const r = await put(it.id, it.data, !it.published, false);
    setMsg(r.ok ? (it.published ? "Saytdan yashirildi." : "Saytda ko'rsatildi.") : r.message);
    await load();
  };

  const remove = async (it: Item) => {
    if (!confirm(`"${it.data.title?.uz ?? it.id}" butunlay o'chirilsinmi? Faqat yashirish uchun ko'z belgisini bosing.`)) return;
    const r = await call(`/content/${kind}/${it.id}`, { method: "DELETE" });
    setMsg(r.ok ? "O'chirildi." : "O'chirib bo'lmadi.");
    await load();
  };

  if (edit) {
    return (
      <section className="card grid gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{edit.id ? `Tahrirlash: ${edit.data.title?.uz ?? edit.id}` : `Yangi ${word}`}</h2>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEdit(null); setMsg(""); }}>Bekor qilish</button>
        </div>
        <LangTabs lang={lang} setLang={setLang} />
        {kind === "case"
          ? <CaseForm d={edit.data} set={(p) => setEdit({ ...edit, data: { ...edit.data, ...p } })} lang={lang} call={call} setMsg={setMsg} />
          : <VacancyForm d={edit.data} set={(p) => setEdit({ ...edit, data: { ...edit.data, ...p } })} lang={lang} />}
        <label className="check"><input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} /><span>Saytda ko&apos;rsatish</span></label>
        {msg && <p className="err" role="alert">{msg}</p>}
        <div><button type="button" className="btn btn-primary" disabled={saving} onClick={save}>{saving ? "Saqlanmoqda…" : "Saqlash"}</button></div>
      </section>
    );
  }

  const rows = [...items].sort((a, b) => (a.data.order ?? 0) - (b.data.order ?? 0));
  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-fg-2">{items.length} ta {word}</p>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => { setMsg(""); setLang("uz"); setEdit({ id: null, data: kind === "case" ? newCase() : newVacancy(), published: true }); }}>
          <Plus size={16} aria-hidden="true" /> Yangi {word}
        </button>
      </div>
      {msg && <p className="text-[14px] text-fg-2" role="status">{msg}</p>}
      <ul className="grid gap-2">
        {rows.map((it) => (
          <li key={it.id} className={`card flex flex-wrap items-center justify-between gap-3 p-4 ${it.published ? "" : "opacity-60"}`}>
            <span>
              <span className="block font-medium">{it.data.title?.uz ?? it.id}</span>
              <span className="text-[13px] text-muted">
                {it.published ? "Saytda ko'rinadi" : "Yashirin"}
                {kind === "vacancy" && (it.data.open ? " · Ochiq" : " · Yopilgan")}
                {kind === "case" && ` · ${INDUSTRIES[it.data.industry] ?? ""} · ${it.data.year}`}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <button type="button" className="btn btn-ghost btn-sm !px-3" onClick={() => { setMsg(""); setLang("uz"); setEdit({ id: it.id, data: it.data, published: it.published }); }}><Pencil size={16} aria-hidden="true" /> Tahrirlash</button>
              <button type="button" className="btn btn-ghost btn-sm !px-3" aria-label={it.published ? "Yashirish" : "Ko'rsatish"} title={it.published ? "Yashirish" : "Ko'rsatish"} onClick={() => toggle(it)}>{it.published ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              <button type="button" className="btn btn-ghost btn-sm !px-3 !text-error" aria-label="O'chirish" title="O'chirish" onClick={() => remove(it)}><Trash2 size={16} /></button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

type Stat = { value: number; suffix: string; label: L };

function StatsPanel({ call }: { call: Call }) {
  const [stats, setStats] = useState<Stat[]>([]);
  const [lang, setLang] = useState<Lang>("uz");
  const [msg, setMsg] = useState("");
  useEffect(() => {
    void call("/stats").then(async (r) => { if (r.ok) setStats((await r.json()).stats); });
  }, [call]);
  const patch = (i: number, p: Partial<Stat>) => setStats(stats.map((s, k) => (k === i ? { ...s, ...p } : s)));
  const save = async () => {
    const r = await call("/stats", { method: "PUT", body: JSON.stringify({ stats }) });
    const body = await r.json().catch(() => null);
    setMsg(r.ok ? "Saqlandi. Saytda 15 soniyagacha vaqt ichida yangilanadi." : describe(r, body));
  };
  return (
    <section className="card grid gap-5 p-6">
      <p className="text-fg-2">Bosh sahifa va &quot;Kompaniya&quot; sahifasidagi raqamlar. Faqat haqiqiy raqamlarni yozing.</p>
      <LangTabs lang={lang} setLang={setLang} />
      {stats.map((s, i) => (
        <div key={i} className="grid items-end gap-3 md:grid-cols-[120px_90px_1fr_auto]">
          <Box label="Raqam"><input className="input" type="number" min={0} value={s.value} onChange={(e) => patch(i, { value: Number(e.target.value) })} /></Box>
          <Box label="Qo'shimcha"><input className="input" maxLength={4} placeholder="+" value={s.suffix} onChange={(e) => patch(i, { suffix: e.target.value })} /></Box>
          <TextL label="Yozuv" value={s.label} lang={lang} onChange={(v) => patch(i, { label: v })} />
          <button type="button" className="btn btn-ghost btn-sm !px-3 !text-error" aria-label="O'chirish" onClick={() => setStats(stats.filter((_, k) => k !== i))}><Trash2 size={16} /></button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        {stats.length < 8 && <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStats([...stats, { value: 0, suffix: "", label: { ...EMPTY } }])}><Plus size={16} aria-hidden="true" /> Qo&apos;shish</button>}
        <button type="button" className="btn btn-primary btn-sm" onClick={save}>Saqlash</button>
      </div>
      {msg && <p className="text-[14px] text-fg-2" role="status">{msg}</p>}
    </section>
  );
}

/** Sayt kontenti: loyihalar, vakansiyalar, statistika. Rol: admin va content hammasi, hr faqat vakansiyalar. */
export default function ContentAdmin({ call, role }: { call: Call; role: string }) {
  const onlyVacancy = role === "hr";
  const [section, setSection] = useState<Section>(onlyVacancy ? "vacancy" : "case");
  const tabs: { k: Section; l: string }[] = onlyVacancy
    ? [{ k: "vacancy", l: "Vakansiyalar" }]
    : [{ k: "case", l: "Loyihalar" }, { k: "vacancy", l: "Vakansiyalar" }, { k: "stats", l: "Statistika" }];
  return (
    <main className="mx-auto grid max-w-[1100px] gap-6 p-6">
      <div className="flex flex-wrap gap-2 border-b border-line pb-4">
        {tabs.map((t) => (
          <button key={t.k} type="button" onClick={() => setSection(t.k)} aria-current={section === t.k ? "page" : undefined} className={`btn btn-sm ${section === t.k ? "btn-secondary !border-accent" : "btn-ghost"}`}>{t.l}</button>
        ))}
      </div>
      {section === "stats" ? <StatsPanel call={call} /> : <ItemsPanel key={section} kind={section} call={call} />}
    </main>
  );
}
