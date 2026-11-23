"use client";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MailPlus, RotateCw, Ban, UserCheck, XCircle } from "lucide-react";

type Member = { email: string; status: string; role: string; sends: number; invitedAt: string; expiresAt: string | null; activatedAt: string | null; disabledAt: string | null; lastSentAt: string | null; linked: boolean };

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Activo", cls: "bg-good-soft text-good" },
  invited: { label: "Invitación pendiente", cls: "bg-accent-soft text-accent" },
  expired: { label: "Invitación caducada", cls: "bg-fire-soft text-fire" },
  revoked: { label: "Invitación revocada", cls: "bg-surface-2 text-muted" },
  disabled: { label: "Desactivado", cls: "bg-bad-soft text-bad" },
};
const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" }) : "—");

export function AdminPanel() {
  const [list, setList] = useState<Member[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/admin");
    if (r.ok) setList((await r.json()).members);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde la API
    void load();
  }, [load]);

  async function act(action: string, target: string, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(action + target);
    const r = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, email: target }) });
    const j = await r.json().catch(() => ({}));
    setBusy(null);
    setMsg(r.ok ? { text: action === "invite" ? `Invitación enviada a ${target}.` : "Listo.", ok: true } : { text: j.error ?? "No se pudo.", ok: false });
    if (r.ok && action === "invite") setEmail("");
    await load();
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        className="module flex flex-col gap-3 p-5 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          if (email.trim()) void act("invite", email.trim(), `¿Enviar una invitación real a ${email.trim()}?`);
        }}
      >
        <label className="flex flex-1 flex-col gap-1.5">
          <span className="font-bold">Invitar por correo</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" className="h-12 rounded-[var(--r-md)] border border-line bg-surface px-4 font-bold outline-none focus:border-accent" />
        </label>
        <button type="submit" className="btn btn-primary" disabled={!!busy}>
          {busy?.startsWith("invite") ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <MailPlus size={18} aria-hidden />} Enviar invitación
        </button>
      </form>
      {msg && (
        <p role="status" className={`rounded-[var(--r-md)] px-4 py-2 font-bold ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
          {msg.text}
        </p>
      )}
      {!list ? (
        <p className="flex items-center gap-2 text-muted">
          <Loader2 size={18} className="animate-spin" aria-hidden /> Cargando…
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((m) => {
            const st = STATUS[m.status] ?? { label: m.status, cls: "bg-surface-2" };
            return (
              <li key={m.email} className="module flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{m.email}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
                    <span className={`chip ${st.cls}`}>{st.label}</span>
                    {m.role === "owner" && <span className="chip">Propietario</span>}
                    {m.status === "invited" && <span>Caduca: {fmt(m.expiresAt)}</span>}
                    {m.activatedAt && <span>Miembro desde: {fmt(m.activatedAt)}</span>}
                    {m.sends > 0 && <span>Envíos: {m.sends}</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(m.status === "invited" || m.status === "expired") && (
                    <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" disabled={!!busy} onClick={() => act("resend", m.email, `¿Reenviar la invitación a ${m.email}?`)}>
                      <RotateCw size={15} aria-hidden /> Reenviar
                    </button>
                  )}
                  {m.status === "invited" && (
                    <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" disabled={!!busy} onClick={() => act("revoke", m.email, "La invitación dejará de funcionar. ¿Revocar?")}>
                      <XCircle size={15} aria-hidden /> Revocar
                    </button>
                  )}
                  {m.status === "active" && m.role !== "owner" && (
                    <button type="button" className="btn btn-bad h-10 min-h-10 text-sm" disabled={!!busy} onClick={() => act("disable", m.email, `${m.email} ya no podrá entrar (su historial se conserva). ¿Desactivar?`)}>
                      <Ban size={15} aria-hidden /> Desactivar
                    </button>
                  )}
                  {m.status === "disabled" && (
                    <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" disabled={!!busy} onClick={() => act("enable", m.email)}>
                      <UserCheck size={15} aria-hidden /> Reactivar
                    </button>
                  )}
                </div>
              </li>
            );
          })}
          {!list.length && <p className="text-muted">Aún no hay miembros.</p>}
        </ul>
      )}
    </div>
  );
}
