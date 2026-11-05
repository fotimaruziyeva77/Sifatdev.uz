"use client";

import { useCallback, useEffect, useState } from "react";

type User = { id: string; email: string; name: string; role: string };
type Lead = {
  id: string; kind: string; status: string; name: string | null; phone: string | null; email: string | null; telegram: string | null;
  locale: string; source: Record<string, string>; created_at: string; first_response_at: string | null; assignee_id: string | null;
  data?: Record<string, unknown>;
};
type Detail = { lead: Lead; files: { id: string; original_name: string; size: number }[]; notes: { id: number; body: string; created_at: string; author: string | null }[] };

const API = "/api/v1/admin";
const STATUS: Record<string, string> = { new: "Yangi", in_progress: "Ishlanmoqda", closed: "Yopildi" };
const KIND: Record<string, string> = { brief: "Brif", quick: "Tezkor", application: "Ariza", subscribe: "Obuna" };

/**
 * Admin panel: so'rovlar (TZ 8.6). Sessiya httpOnly cookie'da, o'zgartiruvchi so'rovlar CSRF token bilan.
 * Ma'lumotlar React orqali chiqariladi (avtomatik escape) — dangerouslySetInnerHTML ishlatilmaydi.
 */
export default function AdminApp({ initialLead }: { initialLead?: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [csrf, setCsrf] = useState("");
  const [checking, setChecking] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState({ kind: "", status: "" });
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [err, setErr] = useState("");

  const call = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const res = await fetch(`${API}${path}`, {
        ...init,
        credentials: "same-origin",
        headers: { ...(init.body ? { "content-type": "application/json" } : {}), ...(init.method && init.method !== "GET" ? { "x-csrf-token": csrf } : {}), ...init.headers },
      });
      if (res.status === 401) {
        setUser(null);
        throw new Error("unauthorized");
      }
      return res;
    },
    [csrf],
  );

  useEffect(() => {
    fetch(`${API}/me`, { credentials: "same-origin" })
      .then(async (r) => {
        if (r.ok) {
          const d = await r.json();
          setUser(d.user);
          setCsrf(d.csrf);
        }
      })
      .finally(() => setChecking(false));
  }, []);

  const load = useCallback(async () => {
    const q = new URLSearchParams({ page: String(page) });
    if (filter.kind) q.set("kind", filter.kind);
    if (filter.status) q.set("status", filter.status);
    const r = await call(`/leads?${q}`);
    if (r.ok) setLeads((await r.json()).items);
  }, [call, filter, page]);

  const open = useCallback(
    async (id: string) => {
      const r = await call(`/leads/${id}`);
      if (r.ok) {
        setDetail(await r.json());
        history.replaceState(null, "", `/admin/leads/${id}`);
      }
    },
    [call],
  );

  useEffect(() => {
    if (!user) return;
    void load();
    call("/users").then(async (r) => r.ok && setUsers((await r.json()).items)).catch(() => undefined);
  }, [user, load, call]);

  useEffect(() => {
    if (user && initialLead) void open(initialLead);
  }, [user, initialLead, open]);

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr("");
    const fd = new FormData(e.currentTarget);
    const r = await fetch(`${API}/auth/login`, {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: fd.get("email"), password: fd.get("password"), totp: fd.get("totp") }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setUser(d.user);
      setCsrf(d.csrf);
    } else setErr(r.status === 423 ? "Hisob vaqtincha bloklangan (15 daqiqa)." : r.status === 429 ? "Juda ko'p urinish." : "Email, parol yoki kod noto'g'ri.");
  }

  async function patch(id: string, body: Record<string, unknown>) {
    await call(`/leads/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    await Promise.all([open(id), load()]);
  }

  async function addNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!detail) return;
    const form = e.currentTarget;
    const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    await call(`/leads/${detail.lead.id}/notes`, { method: "POST", body: JSON.stringify({ body }) });
    form.reset();
    await open(detail.lead.id);
  }

  async function remove(id: string) {
    if (!confirm("So'rov va fayllar butunlay o'chiriladi (GDPR). Davom etasizmi?")) return;
    await call(`/leads/${id}`, { method: "DELETE" });
    setDetail(null);
    history.replaceState(null, "", "/admin");
    await load();
  }

  async function logout() {
    await call("/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  }

  if (checking) return <p className="p-10 text-fg-2">Yuklanmoqda…</p>;

  if (!user) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <form onSubmit={login} className="card grid w-full max-w-sm gap-4 p-8">
          <h1 className="text-xl font-semibold">SIFATDEV Admin</h1>
          <label className="field"><span className="label">Email</span><input name="email" type="email" autoComplete="username" required className="input" /></label>
          <label className="field"><span className="label">Parol</span><input name="password" type="password" autoComplete="current-password" required className="input" /></label>
          <label className="field"><span className="label">2FA kod</span><input name="totp" inputMode="numeric" pattern="\d{6}" maxLength={6} autoComplete="one-time-code" required className="input font-mono tracking-[.3em]" /></label>
          {err && <p className="err" role="alert">{err}</p>}
          <button className="btn btn-primary">Kirish</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto grid max-w-[1400px] gap-6 p-6 lg:grid-cols-[1fr_480px]">
      <section>
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold">So&apos;rovlar</h1>
          <div className="flex items-center gap-3 text-sm text-fg-2">
            {user.name} · {user.role}
            <a href={`${API}/leads.csv`} className="btn btn-secondary btn-sm">CSV eksport</a>
            <button onClick={logout} className="btn btn-ghost btn-sm">Chiqish</button>
          </div>
        </header>
        <div className="mb-4 flex flex-wrap gap-3">
          <select className="input !w-auto" value={filter.kind} onChange={(e) => { setPage(1); setFilter((f) => ({ ...f, kind: e.target.value })); }} aria-label="Turi">
            <option value="">Barcha turlar</option>
            {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select className="input !w-auto" value={filter.status} onChange={(e) => { setPage(1); setFilter((f) => ({ ...f, status: e.target.value })); }} aria-label="Status">
            <option value="">Barcha statuslar</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="text-muted">
              <tr className="border-b border-line">
                <th className="p-3">Sana</th><th className="p-3">Turi</th><th className="p-3">Ism</th><th className="p-3">Aloqa</th><th className="p-3">Til</th><th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} onClick={() => open(l.id)} className={`cursor-pointer border-b border-line hover:bg-elevated ${detail?.lead.id === l.id ? "bg-elevated" : ""}`}>
                  <td className="p-3 font-mono text-[13px]">{new Date(l.created_at).toLocaleString("uz-UZ")}</td>
                  <td className="p-3">{KIND[l.kind]}</td>
                  <td className="p-3">{l.name}</td>
                  <td className="p-3">{l.phone || l.email || (l.telegram ? `@${l.telegram}` : "")}</td>
                  <td className="p-3 uppercase">{l.locale}</td>
                  <td className="p-3"><span className={`chip ${l.status === "new" ? "!border-hi !text-hi" : ""}`}>{STATUS[l.status]}</span></td>
                </tr>
              ))}
              {leads.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">Bo&apos;sh</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Oldingi</button>
          <button className="btn btn-ghost btn-sm" disabled={leads.length < 50} onClick={() => setPage((p) => p + 1)}>Keyingi →</button>
        </div>
      </section>

      {detail && (
        <aside className="card h-fit p-6 lg:sticky lg:top-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="t-label">{KIND[detail.lead.kind]} · {detail.lead.locale.toUpperCase()}</p>
              <h2 className="mt-2 text-lg font-semibold">{detail.lead.name}</h2>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setDetail(null); history.replaceState(null, "", "/admin"); }} aria-label="Yopish">✕</button>
          </div>
          <dl className="mt-4 grid gap-2 text-[14px]">
            {detail.lead.phone && <div><dt className="text-muted">Telefon</dt><dd><a href={`tel:${detail.lead.phone}`} className="text-accent-soft">{detail.lead.phone}</a></dd></div>}
            {detail.lead.email && <div><dt className="text-muted">Email</dt><dd>{detail.lead.email}</dd></div>}
            {detail.lead.telegram && <div><dt className="text-muted">Telegram</dt><dd>@{detail.lead.telegram}</dd></div>}
            {Object.entries(detail.lead.data ?? {}).filter(([, v]) => v !== null && v !== "" && v !== undefined).map(([k, v]) => (
              <div key={k}><dt className="text-muted">{k}</dt><dd className="whitespace-pre-wrap break-words">{Array.isArray(v) ? v.join(", ") : String(v)}</dd></div>
            ))}
            <div><dt className="text-muted">Manba</dt><dd className="break-words font-mono text-[12px]">{Object.entries(detail.lead.source ?? {}).map(([k, v]) => `${k}=${v}`).join(" · ")}</dd></div>
          </dl>
          {detail.files.length > 0 && (
            <ul className="mt-4 grid gap-2">
              {detail.files.map((f) => (
                <li key={f.id}><a href={`${API}/files/${f.id}`} className="chip">📎 {f.original_name} ({Math.round(f.size / 1024)} KB)</a></li>
              ))}
            </ul>
          )}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <label className="field"><span className="label">Status</span>
              <select className="input" value={detail.lead.status} onChange={(e) => patch(detail.lead.id, { status: e.target.value })}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="field"><span className="label">Mas&apos;ul</span>
              <select className="input" value={detail.lead.assignee_id ?? ""} onChange={(e) => patch(detail.lead.id, { assigneeId: e.target.value || null })}>
                <option value="">—</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
          </div>
          <h3 className="mt-6 font-semibold">Izohlar</h3>
          <ul className="mt-2 grid gap-2 text-[14px]">
            {detail.notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-elevated p-3">
                <p className="whitespace-pre-wrap">{n.body}</p>
                <p className="mt-1 text-[12px] text-muted">{n.author} · {new Date(n.created_at).toLocaleString("uz-UZ")}</p>
              </li>
            ))}
          </ul>
          <form onSubmit={addNote} className="mt-3 grid gap-2">
            <textarea name="body" className="input" rows={2} maxLength={4000} placeholder="Izoh qo'shish" />
            <button className="btn btn-secondary btn-sm">Qo&apos;shish</button>
          </form>
          {user.role === "admin" && (
            <button onClick={() => remove(detail.lead.id)} className="btn btn-ghost btn-sm mt-6 !text-error">Butunlay o&apos;chirish (GDPR)</button>
          )}
        </aside>
      )}
    </main>
  );
}
