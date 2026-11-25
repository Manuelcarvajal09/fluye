"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send, UserPlus, X } from "lucide-react";
import { Mascot } from "../Mascot";
import { IcoBoost, IcoFlame, IcoGem, IcoGift, IcoMail, IcoTrophy } from "../Icons";
import { opKey, useWallet, type Wallet } from "../wallet";
import { post } from "../armario/api";
import { GiftScene, type GiftKind, type Pet } from "./GiftScene";
import { GIFT } from "@/lib/wardrobe";

type Card = { id: string; name: string; species: string; wear: string[]; streak: number; weekXp: number; lastDay: string | null; status: "accepted" | "incoming" | "outgoing"; me?: boolean };
type Mail = { id: string; kind: GiftKind; amount: number; message: string; sentAt: string; openedAt: string | null; thanks: string | null; other: { id: string; name: string; species: string; wear: string[] } };
const THANKS: Record<string, string> = { gracias: "¡Gracias!", corazon: "Te quiero mucho", abrazo: "Un abrazo", estrella: "Eres una estrella", fiesta: "¡Me encantó!" };
const KIND_LABEL: Record<GiftKind, string> = { letter: "Carta", gems: "Gemas", boost: "Potenciador" };
const KIND_ICON: Record<GiftKind, React.ReactNode> = { letter: <IcoMail size={22} />, gems: <IcoGem size={22} />, boost: <IcoBoost size={22} /> };

function lastSeen(day: string | null, today: string) {
  if (!day) return "Sin estudio reciente";
  const d = Math.round((Date.parse(today) - Date.parse(day)) / 86_400_000);
  return d <= 0 ? "Estudió hoy" : d === 1 ? "Estudió ayer" : `Estudió hace ${d} días`;
}

type Scene = { mode: "send" | "receive"; kind: GiftKind; amount: number; message: string; pet: Pet; other: string; mail?: Mail; demo?: boolean };

/** Amigos: código para agregar, solicitudes, clasificación semanal, regalos y buzón. */
export function Friends({ code, friends, ranking, inbox: initialInbox, sent, me, wallet, today }: { code: string; friends: Card[]; ranking: Card[]; inbox: Mail[]; sent: Mail[]; me: Pet; wallet: Omit<Wallet, "streak">; today: string }) {
  const router = useRouter();
  const w = useWallet({ ...wallet, streak: 0 });
  const [inbox, setInbox] = useState(initialInbox);
  const [add, setAdd] = useState("");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [composer, setComposer] = useState<Card | null>(null);
  const [scene, setScene] = useState<Scene | null>(null);
  const accepted = friends.filter((f) => f.status === "accepted");
  const incoming = friends.filter((f) => f.status === "incoming");
  const outgoing = friends.filter((f) => f.status === "outgoing");
  const top = Math.max(1, ...ranking.map((r) => r.weekXp));

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const j = await post("/api/friends", { action: "add", code: add });
    setBusy(false);
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo agregar.", ok: false });
    setAdd("");
    setMsg({ text: j.status === "accepted" ? `¡${j.name} y tú ya son amistades!` : `Solicitud enviada a ${j.name}. Aparecerá cuando la acepte.`, ok: true });
    router.refresh();
  }
  async function respond(id: string, accept: boolean) {
    setBusy(true);
    await post("/api/friends", { action: "respond", id, accept });
    setBusy(false);
    router.refresh();
  }
  async function open(m: Mail) {
    if (m.openedAt) return setScene({ mode: "receive", kind: m.kind, amount: m.amount, message: m.message, pet: me, other: m.other.name, mail: m });
    const j = await post("/api/gifts", { action: "open", id: m.id }, { reason: `Regalo de ${m.other.name}` });
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo abrir.", ok: false });
    const opened = { ...m, openedAt: new Date().toISOString() };
    setInbox((list) => list.map((x) => (x.id === m.id ? opened : x)));
    setScene({ mode: "receive", kind: m.kind, amount: m.amount, message: m.message, pet: me, other: m.other.name, mail: opened });
  }
  async function thank(m: Mail, t: string) {
    const j = await post("/api/gifts", { action: "thank", id: m.id, thanks: t });
    if (j.ok) {
      setInbox((list) => list.map((x) => (x.id === m.id ? { ...x, thanks: t } : x)));
      setScene((s) => (s?.mail ? { ...s, mail: { ...s.mail, thanks: t } } : s));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="eyebrow">Estudiar acompañado</p>
        <h1 className="font-display text-4xl font-extrabold">Amigos</h1>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="module flex flex-col gap-2 p-5">
          <h2 className="font-black">Tu código de amistad</h2>
          <div className="flex items-center gap-2">
            <code className="rounded-[var(--r-sm)] bg-surface-2 px-4 py-2 font-display text-2xl font-black tracking-[0.25em]">{code}</code>
            <button
              type="button"
              className="btn btn-ghost h-11 min-h-11"
              onClick={() => {
                void navigator.clipboard?.writeText(code);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-muted">Compártelo con quien quieras. Tus amistades ven tu nombre, tu mascota, tu racha, tu XP de la semana y tu último día de estudio; nunca tus respuestas ni grabaciones.</p>
        </div>
        <form className="module flex flex-col gap-2 p-5" onSubmit={addFriend}>
          <label htmlFor="friend-code" className="font-black">
            Agregar una amistad
          </label>
          <div className="flex gap-2">
            <input id="friend-code" className="h-12 min-w-0 flex-1 rounded-[var(--r-sm)] border border-line bg-surface px-3 font-display text-lg font-black uppercase tracking-[0.2em]" value={add} onChange={(e) => setAdd(e.target.value)} placeholder="CÓDIGO" maxLength={12} autoComplete="off" />
            <button type="submit" className="btn btn-primary" disabled={busy || add.trim().length < 4}>
              <UserPlus size={18} /> Agregar
            </button>
          </div>
          {msg && (
            <p role="status" className={`rounded-[var(--r-sm)] px-3 py-2 text-sm font-bold ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
              {msg.text}
            </p>
          )}
        </form>
      </section>

      {(incoming.length > 0 || outgoing.length > 0) && (
        <section className="module flex flex-col gap-3 p-5">
          <h2 className="font-black">Solicitudes</h2>
          {incoming.map((f) => (
            <div key={f.id} className="flex items-center gap-3">
              <Mascot species={f.species} wear={f.wear} size={48} decorative />
              <p className="flex-1 font-bold">{f.name} quiere ser tu amistad</p>
              <button type="button" className="btn btn-primary h-10 min-h-10" disabled={busy} onClick={() => respond(f.id, true)}>
                <Check size={16} /> Aceptar
              </button>
              <button type="button" className="btn btn-ghost h-10 min-h-10" disabled={busy} onClick={() => respond(f.id, false)} aria-label={`Rechazar a ${f.name}`}>
                <X size={16} />
              </button>
            </div>
          ))}
          {outgoing.map((f) => (
            <p key={f.id} className="flex items-center gap-3 text-sm text-muted">
              <Mascot species={f.species} wear={f.wear} size={40} decorative /> Esperando a que {f.name} acepte.
            </p>
          ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="module flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black">
            <IcoTrophy size={28} /> Clasificación de la semana
          </h2>
          <p className="text-xs text-muted">Por XP de estudio desde el lunes. Se reinicia cada semana.</p>
          <ol className="flex flex-col gap-2">
            {ranking.map((r, i) => (
              <li key={r.id} className={`flex items-center gap-3 rounded-[var(--r-md)] p-2 ${r.me ? "bg-brand-soft" : ""}`}>
                <span className={`grid h-8 w-8 place-items-center rounded-full font-black ${i === 0 ? "bg-[var(--gold)] text-white" : "bg-surface-2"}`}>{i + 1}</span>
                <Mascot species={r.species} wear={r.wear} size={44} decorative />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black">{r.me ? `${r.name} (tú)` : r.name}</p>
                  <div className="rank-bar" aria-hidden>
                    <span style={{ width: `${(r.weekXp / top) * 100}%`, animationDelay: `${i * 80}ms` }} />
                  </div>
                </div>
                <span className="font-black tabular-nums">{r.weekXp} XP</span>
              </li>
            ))}
          </ol>
          {accepted.length === 0 && <p className="text-sm text-muted">Agrega una amistad para competir esta semana.</p>}
        </div>

        <div className="module flex flex-col gap-3 p-5">
          <h2 className="flex items-center gap-2 font-display text-2xl font-black">
            <IcoMail size={28} /> Buzón
          </h2>
          {inbox.length === 0 && <p className="text-sm text-muted">Aún no tienes regalos. Cuando alguien te envíe uno, llegará aquí.</p>}
          <ul className="flex flex-col gap-2">
            {inbox.map((m) => (
              <li key={m.id}>
                <button type="button" onClick={() => open(m)} className={`flex w-full items-center gap-3 rounded-[var(--r-md)] border p-2 text-left transition-colors hover:bg-surface-2 ${m.openedAt ? "border-line" : "border-brand/50 bg-brand-soft/40"}`}>
                  <span className={m.openedAt ? "" : "mail-new inline-flex"}>{KIND_ICON[m.kind]}</span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate">
                      {KIND_LABEL[m.kind]} de {m.other.name}
                    </b>
                    <span className="text-xs text-muted">{m.openedAt ? (m.thanks ? `Agradeciste: ${THANKS[m.thanks]}` : "Abierto") : "Sin abrir · toca para abrir"}</span>
                  </span>
                  <Mascot species={m.other.species} wear={m.other.wear} size={36} decorative />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-2xl font-black">Tus amistades</h2>
        {accepted.length === 0 && <p className="module p-5 text-muted">Todavía no hay nadie. Comparte tu código o escribe el de alguien.</p>}
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {accepted.map((f) => (
            <li key={f.id} className="module flex items-center gap-3 p-4">
              <Mascot species={f.species} wear={f.wear} size={76} animate="none" decorative />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-black">{f.name}</p>
                <p className="flex items-center gap-1 text-sm font-bold text-fire">
                  <IcoFlame size={16} /> {f.streak} {f.streak === 1 ? "día" : "días"}
                </p>
                <p className="text-xs text-muted">
                  {lastSeen(f.lastDay, today)} · {f.weekXp} XP esta semana
                </p>
              </div>
              <button type="button" className="btn btn-accent h-11 min-h-11" onClick={() => setComposer(f)} aria-label={`Enviar regalo a ${f.name}`}>
                <IcoGift size={20} />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {sent.length > 0 && (
        <section className="module flex flex-col gap-2 p-5">
          <h2 className="font-black">Enviados</h2>
          <ul className="flex flex-col divide-y divide-line">
            {sent.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2 text-sm">
                {KIND_ICON[m.kind]}
                <span className="flex-1">
                  {KIND_LABEL[m.kind]}
                  {m.kind === "gems" ? ` (${m.amount})` : ""} para {m.other.name}
                </span>
                <span className={`font-bold ${m.thanks ? "text-good" : "text-muted"}`}>{m.thanks ? `${m.other.name}: ${THANKS[m.thanks]}` : m.openedAt ? "Abierto" : "Sin abrir"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="module p-4">
        <summary className="cursor-pointer font-black">Probar los recorridos de regalo (no envía nada)</summary>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["letter", "gems", "boost"] as const).map((k) => (
            <span key={k} className="flex gap-1">
              <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" onClick={() => setScene({ mode: "send", kind: k, amount: 5, message: "", pet: me, other: "tu amistad", demo: true })}>
                Enviar {KIND_LABEL[k].toLowerCase()}
              </button>
              <button type="button" className="btn btn-ghost h-10 min-h-10 text-sm" onClick={() => setScene({ mode: "receive", kind: k, amount: 5, message: "¡Sigue así! Cada día suenas mejor.", pet: me, other: "Fluye", demo: true })}>
                Recibir {KIND_LABEL[k].toLowerCase()}
              </button>
            </span>
          ))}
        </div>
      </details>

      {composer && (
        <Composer
          to={composer}
          gems={w.gems}
          boosts={w.boosts}
          onClose={() => setComposer(null)}
          onSent={(kind, amount, message) => {
            setScene({ mode: "send", kind, amount, message, pet: me, other: composer.name });
            setComposer(null);
            router.refresh();
          }}
        />
      )}
      {scene && (
        <GiftScene mode={scene.mode} kind={scene.kind} amount={scene.amount} message={scene.message} pet={scene.pet} otherName={scene.other} onClose={() => setScene(null)}>
          {scene.mode === "receive" && scene.mail && !scene.demo && (
            <>
              {scene.mail.thanks ? (
                <p className="font-bold text-good">Agradeciste: {THANKS[scene.mail.thanks]}</p>
              ) : (
                <>
                  <p className="font-bold">Envía un agradecimiento a {scene.other}:</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {Object.entries(THANKS).map(([k, label]) => (
                      <button key={k} type="button" className="chip-btn" onClick={() => thank(scene.mail!, k)}>
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          <button type="button" className="btn btn-primary w-full" onClick={() => setScene(null)}>
            Seguir
          </button>
        </GiftScene>
      )}
    </div>
  );
}

function Composer({ to, gems, boosts, onClose, onSent }: { to: Card; gems: number; boosts: number; onClose: () => void; onSent: (kind: GiftKind, amount: number, message: string) => void }) {
  const [kind, setKind] = useState<GiftKind>("letter");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState(Math.min(5, Math.max(1, gems)));
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [key] = useState(opKey);
  async function send() {
    setBusy(true);
    setErr("");
    const j = await post("/api/gifts", { action: "send", to: to.id, kind, amount, message, key }, { reason: kind === "gems" ? `Regalaste gemas a ${to.name}` : kind === "boost" ? `Regalaste un potenciador a ${to.name}` : undefined });
    setBusy(false);
    if (!j.ok) return setErr(j.error ?? "No se pudo enviar.");
    onSent(kind, amount, message);
  }
  const can = kind === "letter" ? message.trim().length > 0 : kind === "gems" ? gems >= amount && amount > 0 : boosts > 0;
  return (
    <div className="scene-backdrop" role="dialog" aria-modal="true" aria-label={`Regalo para ${to.name}`}>
      <div className="gift-stage">
        <button type="button" className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-surface/80" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <h2 className="font-display text-2xl font-black">Regalo para {to.name}</h2>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Tipo de regalo">
          {(["letter", "gems", "boost"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} onClick={() => setKind(k)} className={`pick ${kind === k ? "is-on" : ""}`}>
              {KIND_ICON[k]}
              <span>{KIND_LABEL[k]}</span>
            </button>
          ))}
        </div>
        {kind === "gems" && (
          <label className="flex flex-col gap-1 font-bold">
            Cuántas gemas ({amount}) · tienes {gems}
            <input type="range" min={1} max={Math.max(1, Math.min(GIFT.maxGems, gems))} value={amount} onChange={(e) => setAmount(Number(e.target.value))} disabled={gems < 1} />
          </label>
        )}
        {kind === "boost" && <p className="text-sm text-muted">Le das uno de tus potenciadores (tienes {boosts}). Doble XP durante 15 minutos cuando lo active.</p>}
        <label className="flex flex-col gap-1 font-bold">
          {kind === "letter" ? "Tu carta" : "Nota (opcional)"}
          <textarea className="min-h-24 rounded-[var(--r-sm)] border border-line bg-surface p-3 font-medium" maxLength={280} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="¡Vas muy bien! Nos vemos en la clasificación." />
        </label>
        {err && (
          <p role="alert" className="rounded-[var(--r-sm)] bg-bad-soft px-3 py-2 text-sm font-bold text-bad">
            {err}
          </p>
        )}
        <button type="button" className="btn btn-primary w-full" disabled={busy || !can} onClick={send}>
          <Send size={18} /> Enviar
        </button>
        <p className="text-center text-xs text-muted">Hasta {GIFT.perDay} regalos al día. Lo que regalas se descuenta al enviarlo y se entrega cuando lo abren.</p>
      </div>
    </div>
  );
}
