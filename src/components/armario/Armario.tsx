"use client";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Lock, RotateCcw, Save, X } from "lucide-react";
import { Mascot } from "../Mascot";
import { Burst } from "../Burst";
import { IcoChest, IcoGem, IcoHeart, IcoIce, IcoShop, IcoStar } from "../Icons";
import { opKey, useWallet, type Wallet } from "../wallet";
import { post } from "./api";
import { Chests } from "./Chests";
import { Appearance } from "./Appearance";
import { AppStyle, CompanionName } from "./AppStyle";
import type { SeasonId, SeasonPrefs } from "@/lib/seasons";
import { bgImage } from "@/lib/themes";
import { LivesPanel } from "./LivesPanel";
import { playSfx } from "@/lib/audio/sfx";
import { AWARDS, FREEZE, PETS, PIECES, SLOT_LABEL, SLOTS, TIERS, combine, ownsPet, ownsPiece, petPrice, type Piece, type Slot } from "@/lib/wardrobe";
import type { Look } from "@/lib/look";

type Tab = "armario" | "mascotas" | "temas" | "cofres" | "vidas" | "movimientos";
const TAB_LABEL: Record<Tab, string> = { armario: "Armario", mascotas: "Mascotas", temas: "Estilo", cofres: "Cofres", vidas: "Vidas y extras", movimientos: "Movimientos" };
type Move = { key: string; currency: string; amount: number; reason: string; at: string };
type Progress = { streak: number; review: number; friend: number };

export const TIER_CLS = ["tier-0", "tier-1", "tier-2", "tier-3"] as const;

/** Armario y tienda: probar cualquier pieza, comprar con gemas, guardar un conjunto por mascota, cofres y vidas. */
export function Armario(props: { tab: Tab; owned: string[]; look: Look; wallet: Omit<Wallet, "streak">; freezes: number; newAwards: string[]; progress: Progress; practice: { today: number; earned: number }; moves: Move[]; appearance: { allThemes: boolean; themePack: string | null; background: string | null }; style: { mode: "system" | "light" | "dark"; season?: SeasonPrefs; currentSeason: SeasonId } }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(props.tab);
  const [owned, setOwned] = useState(() => new Set(props.owned));
  const [look, setLook] = useState(props.look);
  const w = useWallet({ ...props.wallet, streak: 0 });
  const go = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, "", t === "armario" ? "/tienda" : `/tienda?tab=${t}`);
  };
  const addOwned = (k: string) => setOwned((o) => new Set(o).add(k));

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Tu compañero</p>
          <h1 className="font-display text-4xl font-extrabold">Armario</h1>
        </div>
        <p className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 font-black shadow-card">
          <IcoGem size={22} /> {w.gems} gemas
        </p>
      </header>
      {props.newAwards.length > 0 && (
        <p role="status" className="animate-pop flex items-center gap-2 rounded-[var(--r-md)] bg-good-soft px-4 py-3 font-bold text-good">
          <IcoStar size={22} /> ¡Logro! Nuevas piezas en tu armario: {props.newAwards.map((id) => PIECES.find((p) => p.id === id)?.name ?? id).join(", ")}.
        </p>
      )}
      <div className="seg max-w-full self-start overflow-x-auto" role="tablist" aria-label="Secciones del armario">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => go(t)}>
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>
      {tab === "armario" && (
        <button type="button" onClick={() => go("vidas")} className="module flex items-center gap-3 p-3 text-left">
          <IcoIce size={30} />
          <span className="min-w-0 flex-1">
            <b className="block">Protector de racha</b>
            <span className="text-sm text-muted">Cubre un día sin meta para que no pierdas tu racha. Puedes tener {FREEZE.max}.</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 font-black">
            <IcoGem size={18} /> {FREEZE.price}
          </span>
        </button>
      )}
      {tab === "armario" && <Wardrobe look={look} setLook={setLook} owned={owned} addOwned={addOwned} gems={w.gems} progress={props.progress} background={props.appearance.background} />}
      {tab === "temas" && (
        <div className="flex flex-col gap-8">
          <AppStyle accent={look.accent} mode={props.style.mode} season={{ prefs: props.style.season, current: props.style.currentSeason }} />
          <Appearance owned={owned} addOwned={addOwned} gems={w.gems} {...props.appearance} />
        </div>
      )}
      {tab === "mascotas" && (
        <div className="flex flex-col gap-4">
          <CompanionName initial={look.name} />
          <Pets look={look} setLook={setLook} owned={owned} addOwned={addOwned} gems={w.gems} />
        </div>
      )}
      {tab === "cofres" && <Chests look={look} gems={w.gems} onGot={(k) => (addOwned(k), router.refresh())} />}
      {tab === "vidas" && <LivesPanel wallet={w} freezes={props.freezes} practice={props.practice} />}
      {tab === "movimientos" && <Moves moves={props.moves} />}
    </div>
  );
}

function TierChip({ tier }: { tier: number }) {
  return <span className={`tier-chip ${TIER_CLS[tier]}`}>{TIERS[tier]}</span>;
}

function awardProgress(id: string, p: Progress) {
  const a = AWARDS.find((x) => x.id === id);
  if (!a) return null;
  const v = a.rule === "streak" ? p.streak : a.rule === "review" ? p.review : p.friend;
  return { v: Math.min(v, a.n), n: a.n };
}

function Wardrobe({ look, setLook, owned, addOwned, gems, progress, background }: { look: Look; setLook: (l: Look) => void; owned: Set<string>; addOwned: (k: string) => void; gems: number; progress: Progress; background: string | null }) {
  const router = useRouter();
  const saved = look.sets[look.species] ?? [];
  const [trial, setTrial] = useState<string[]>(saved);
  const [slot, setSlot] = useState<Slot | "all">("all");
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [party, setParty] = useState(0);
  const [mood, setMood] = useState<"happy" | "proud">("happy");
  const stage = useRef<HTMLDivElement>(null);
  const dirty = trial.join() !== saved.join();
  const locked = trial.filter((k) => !ownsPiece(k, owned));
  const list = useMemo(() => PIECES.filter((p) => slot === "all" || p.slot === slot).sort((a, b) => Number(ownsPiece(b.id, owned)) - Number(ownsPiece(a.id, owned)) || a.tier - b.tier), [slot, owned]);

  const toggle = (p: Piece) => setTrial((t) => (t.includes(p.id) ? t.filter((k) => k !== p.id) : combine(t, p.id)));
  const celebrate = () => {
    setParty((n) => n + 1);
    setMood("proud");
    setTimeout(() => setMood("happy"), 1300);
  };

  async function buy(p: Piece, el: HTMLElement) {
    setBusy(true);
    const j = await post("/api/shop", { action: "buy", kind: "piece", id: p.id, key: opKey() }, { reason: `Compraste ${p.name}` });
    setBusy(false);
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo comprar.", ok: false });
    addOwned(`pz-${p.id}`);
    setTrial((t) => combine(t, p.id));
    playSfx("level");
    celebrate();
    setMsg({ text: `¡${p.name} es tuya! Pulsa «Guardar conjunto» para llevarla puesta.`, ok: true });
    el.blur();
  }
  async function save() {
    setBusy(true);
    const j = await post("/api/shop", { action: "equip", species: look.species, wear: trial });
    setBusy(false);
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo guardar.", ok: false });
    setLook(j.look as Look);
    playSfx("ok");
    celebrate();
    setMsg({ text: "Conjunto guardado. Así te acompañará al estudiar.", ok: true });
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,21rem)_1fr]">
      <section className="hero-card flex flex-col items-center gap-3 p-5 lg:sticky lg:top-6 lg:self-start">
        <div ref={stage} className={`relative ${background ? "overflow-hidden rounded-[var(--r-lg)] bg-cover bg-center px-6 pt-4" : ""}`} style={background ? { backgroundImage: `url(${bgImage(background, "square")})` } : undefined}>
          {party > 0 && <Burst key={party} kind="stars" count={18} spread={120} size={18} />}
          <span key={`e${party}`} className={party ? "equip-pop inline-block" : "inline-block"}>
            <Mascot species={look.species} wear={trial} mood={mood} size={190} label={`${look.name} con el conjunto que estás probando`} />
          </span>
        </div>
        <p className="font-display text-2xl font-extrabold">{look.name}</p>
        <ul className="grid w-full grid-cols-2 gap-1.5" aria-label="Piezas puestas por zona">
          {SLOTS.map((s) => {
            const k = trial.find((id) => PIECES.find((p) => p.id === id)?.slot === s);
            const p = k ? PIECES.find((x) => x.id === k) : null;
            return (
              <li key={s} className="flex min-w-0 items-center gap-1 rounded-[var(--r-sm)] bg-surface/80 px-2 py-1 text-xs">
                <span className="shrink-0 font-bold text-muted">{SLOT_LABEL[s]}</span>
                <span className="min-w-0 flex-1 truncate font-extrabold">{p ? p.name : "—"}</span>
                {p && !ownsPiece(p.id, owned) && <Lock size={14} className="text-muted" aria-label="Aún no es tuya" />}
                {p && (
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-full hover:bg-surface-2" aria-label={`Quitar ${p.name} del conjunto`} onClick={() => setTrial((t) => t.filter((x) => x !== p.id))}>
                    <X size={15} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="flex w-full flex-wrap gap-2">
          <button type="button" className="btn btn-primary flex-1" disabled={busy || !dirty || locked.length > 0} onClick={save}>
            <Save size={18} aria-hidden /> Guardar conjunto
          </button>
          <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => setTrial(saved)} aria-label="Volver al conjunto guardado">
            <RotateCcw size={18} aria-hidden />
          </button>
        </div>
        {locked.length > 0 && <p className="text-center text-xs font-bold text-muted">Estás probando piezas que aún no tienes. Consíguelas para guardar el conjunto.</p>}
        <p className="text-center text-xs text-muted">Cada mascota guarda su propio conjunto: una pieza por zona.</p>
      </section>

      <section className="flex min-w-0 flex-col gap-4">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrar por zona">
          {(["all", ...SLOTS] as const).map((s) => (
            <button key={s} type="button" aria-pressed={slot === s} className={`chip-btn ${slot === s ? "is-on" : ""}`} onClick={() => setSlot(s)}>
              {s === "all" ? "Todo" : SLOT_LABEL[s]}
            </button>
          ))}
        </div>
        {msg && (
          <p role="status" className={`animate-pop rounded-[var(--r-md)] px-4 py-2 font-bold ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
            {msg.text}
          </p>
        )}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
          {list.map((p) => {
            const have = ownsPiece(p.id, owned);
            const on = trial.includes(p.id);
            const ap = p.source === "award" ? awardProgress(p.id, progress) : null;
            return (
              <li key={p.id} className={`item-card ${TIER_CLS[p.tier]} ${on ? "is-on" : ""}`}>
                <button type="button" className="item-try" onClick={() => toggle(p)} aria-pressed={on} aria-label={`${on ? "Quitar" : "Probar"} ${p.name}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- miniatura local */}
                  <img src={`/armario/items/${p.id}.webp`} alt="" className="h-20 w-20 object-contain" loading="lazy" />
                  {on && (
                    <span className="item-check" aria-hidden>
                      <Check size={14} strokeWidth={3.5} />
                    </span>
                  )}
                </button>
                <p className="line-clamp-2 min-h-[2.5rem] text-center text-sm font-black leading-tight">{p.name}</p>
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted">
                  <TierChip tier={p.tier} /> {SLOT_LABEL[p.slot]}
                </div>
                {have ? (
                  <p className="text-center text-xs font-extrabold text-good">
                    <Check size={13} className="inline" aria-hidden /> Tuya
                  </p>
                ) : p.source === "award" && ap ? (
                  <div className="flex flex-col gap-1 text-center">
                    <p className="text-xs font-bold leading-tight text-muted">{p.how}</p>
                    <div className="h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={ap.n} aria-valuenow={ap.v} aria-label={`Avance: ${ap.v} de ${ap.n}`}>
                      <div className="bar-fill h-full rounded-full bg-[var(--gold)]" style={{ width: `${(ap.v / ap.n) * 100}%` }} />
                    </div>
                    <p className="text-xs font-black">
                      {ap.v}/{ap.n}
                    </p>
                  </div>
                ) : (
                  <button type="button" className="btn btn-accent h-10 min-h-10 w-full text-sm" disabled={busy || gems < p.price} onClick={(e) => buy(p, e.currentTarget)} aria-label={`Comprar ${p.name} por ${p.price} gemas`}>
                    <IcoGem size={17} /> {p.price}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <p className="flex items-center gap-2 text-xs text-muted">
          <IcoChest size={18} /> Las piezas de tienda también salen en los cofres, más baratos pero al azar. Las de logro solo se ganan.
        </p>
      </section>
    </div>
  );
}

function Pets({ look, setLook, owned, addOwned, gems }: { look: Look; setLook: (l: Look) => void; owned: Set<string>; addOwned: (k: string) => void; gems: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [party, setParty] = useState<string | null>(null);
  async function choose(id: string) {
    setBusy(true);
    const j = await post("/api/shop", { action: "equip", species: id, wear: look.sets[id as Look["species"]] ?? [] });
    setBusy(false);
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo elegir.", ok: false });
    setLook(j.look as Look);
    setParty(id);
    setMsg({ text: `${PETS.find((p) => p.id === id)!.label} ahora te acompaña.`, ok: true });
    router.refresh();
  }
  async function buy(id: string) {
    setBusy(true);
    const label = PETS.find((p) => p.id === id)!.label;
    const j = await post("/api/shop", { action: "buy", kind: "pet", id, key: opKey() }, { reason: `Adoptaste: ${label}` });
    setBusy(false);
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo adoptar.", ok: false });
    addOwned(`pet-${id}`);
    playSfx("level");
    setParty(id);
    setMsg({ text: `¡${label} es parte de tu equipo!`, ok: true });
  }
  return (
    <section className="flex flex-col gap-4">
      {msg && (
        <p role="status" className={`animate-pop rounded-[var(--r-md)] px-4 py-2 font-bold ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
          {msg.text}
        </p>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {PETS.map((p) => {
          const have = ownsPet(p.id, owned);
          const on = look.species === p.id;
          return (
            <li key={p.id} className={`item-card ${TIER_CLS[p.tier]} ${on ? "is-on" : ""}`}>
              <div className="relative grid place-items-center">
                {party === p.id && <Burst kind="stars" count={14} spread={90} />}
                <Mascot species={p.id} wear={look.sets[p.id] ?? []} mood={party === p.id ? "cheer" : "happy"} size={120} animate={on ? "bob" : "none"} decorative />
              </div>
              <p className="text-center font-display text-lg font-black">{p.label}</p>
              <div className="flex justify-center">
                <TierChip tier={p.tier} />
              </div>
              {on ? (
                <p className="text-center text-sm font-extrabold text-good">
                  <Check size={14} className="inline" aria-hidden /> Te acompaña
                </p>
              ) : have ? (
                <button type="button" className="btn btn-ghost h-10 min-h-10 w-full text-sm" disabled={busy} onClick={() => choose(p.id)}>
                  Elegir
                </button>
              ) : (
                <button type="button" className="btn btn-accent h-10 min-h-10 w-full text-sm" disabled={busy || gems < petPrice(p.id)} onClick={() => buy(p.id)} aria-label={`Adoptar ${p.label} por ${petPrice(p.id)} gemas`}>
                  <IcoGem size={17} /> {petPrice(p.id)}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted">Las siete primeras son gratis. Las nuevas se adoptan con gemas o pueden salir en un cofre. Cambiar de mascota no borra el conjunto de ninguna.</p>
    </section>
  );
}

function Moves({ moves }: { moves: Move[] }) {
  const ico = (c: string) => (c === "gems" || c === "coins" ? <IcoGem size={22} /> : c === "lives" || c === "shield" ? <IcoHeart size={22} /> : <IcoShop size={22} />);
  const unit: Record<string, string> = { gems: "gemas", coins: "monedas (antes)", lives: "vidas", shield: "protección", boosts: "potenciadores" };
  if (!moves.length) return <p className="module p-5 text-muted">Aún no hay movimientos.</p>;
  return (
    <ul className="module flex flex-col divide-y divide-line">
      {moves.map((m) => (
        <li key={m.key} className="flex items-center gap-3 px-4 py-3">
          {ico(m.currency)}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{m.reason}</p>
            <p className="text-xs text-muted">{new Date(m.at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</p>
          </div>
          <span className={`font-black tabular-nums ${m.amount >= 0 ? "text-good" : "text-bad"}`}>
            {m.amount >= 0 ? "+" : "−"}
            {Math.abs(m.amount)} {unit[m.currency] ?? ""}
          </span>
        </li>
      ))}
    </ul>
  );
}
