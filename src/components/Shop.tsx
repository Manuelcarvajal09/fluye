"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { IcoIce } from "./Icons";
import { Mascot } from "./Mascot";
import { Gem } from "./Nav";
import { Burst } from "./Burst";
import { playSfx } from "@/lib/audio/sfx";
import { ACCESSORIES, OUTFITS, FUR_COLORS, slotOf, type Accessory, type Look, type Outfit, type ShopItem } from "@/lib/look";

/** Cada accesorio va a su zona (cabeza, cara o cuello), así se combinan en vez de reemplazarse. */
const KEY = { head: "accessory", face: "face", neck: "neck" } as const;
const accPatch = (value: string): Partial<Look> => ({ [KEY[slotOf(value)]]: value as Accessory });
const accOn = (look: Look, value: string) => look[KEY[slotOf(value)]] === value;

type Tab = "accessory" | "outfit" | "color" | "freeze";
const TABS: { id: Tab; label: string }[] = [
  { id: "accessory", label: "Accesorios" },
  { id: "outfit", label: "Atuendos" },
  { id: "color", label: "Colores" },
  { id: "freeze", label: "Racha" },
];

/** Tienda cosmética: probar en vivo, comprar con gemas y equipar. Nada de esto afecta el aprendizaje. */
export function Shop({ catalog, owned: initialOwned, gems: initialGems, freezes: initialFreezes, look: initialLook }: { catalog: ShopItem[]; owned: string[]; gems: number; freezes: number; look: Look }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("accessory");
  const [owned, setOwned] = useState(new Set(initialOwned));
  const [gems, setGems] = useState(initialGems);
  const [freezes, setFreezes] = useState(initialFreezes);
  const [look, setLook] = useState(initialLook);
  const [trying, setTrying] = useState<Partial<Look>>({});
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [party, setParty] = useState(0);
  const preview = { ...look, ...trying };

  async function call(body: unknown) {
    setBusy(true);
    const r = await fetch("/api/shop", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    return j as { ok?: boolean; error?: string; gems?: number; look?: Look };
  }

  async function purchase(it: ShopItem) {
    const j = await call({ action: "buy", itemId: it.id });
    if (!j.ok) return setMsg({ text: j.error ?? "No se pudo comprar.", ok: false });
    setGems(j.gems ?? gems);
    if (it.kind === "freeze") setFreezes((f) => Math.min(2, f + 1));
    else setOwned((o) => new Set(o).add(it.id));
    setParty((p) => p + 1);
    playSfx("level");
    setMsg({ text: `¡${it.label} es tuyo!`, ok: true });
    if (it.kind !== "freeze") await equip(it);
    router.refresh();
  }

  async function equip(it: { kind: string; value: string }) {
    const patch = it.kind === "accessory" ? accPatch(it.value) : it.kind === "outfit" ? { outfit: it.value as Outfit } : { color: it.value };
    const j = await call({ action: "equip", look: patch });
    if (!j.ok || !j.look) return setMsg({ text: j.error ?? "No se pudo equipar.", ok: false });
    setLook(j.look);
    setTrying({});
    router.refresh();
  }

  const free = tab === "accessory" ? ACCESSORIES.filter((a) => a.price === 0).map((a) => ({ kind: "accessory", value: a.id as string, label: a.label })) : tab === "outfit" ? OUTFITS.filter((o) => o.price === 0).map((o) => ({ kind: "outfit", value: o.id as string, label: o.label })) : tab === "color" ? FUR_COLORS.slice(0, 6).map((c) => ({ kind: "color", value: c as string, label: "Color básico" })) : [];
  const items = catalog.filter((c) => c.kind === tab);
  const isOn = (kind: string, value: string) => (kind === "accessory" ? accOn(look, value) : kind === "outfit" ? look.outfit === value : kind === "color" ? look.color.toLowerCase() === value.toLowerCase() : false);
  const tryOn = (kind: string, value: string) => setTrying(kind === "accessory" ? accPatch(value) : kind === "outfit" ? { outfit: value as Outfit } : kind === "color" ? { color: value } : {});

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <section className="hero-card flex flex-col items-center gap-3 p-6 lg:sticky lg:top-8 lg:self-start">
        <div className="relative">
          {party > 0 && <Burst key={party} kind="stars" count={16} spread={110} size={18} />}
          <Mascot species={preview.species} color={preview.color} accessory={preview.accessory} face={preview.face} neck={preview.neck} outfit={preview.outfit} mood={party ? "cheer" : "happy"} size={190} label={`${preview.name} con el aspecto que estás probando`} />
        </div>
        <p className="font-display text-2xl font-extrabold">{preview.name}</p>
        <p className="flex items-center gap-2 rounded-full bg-surface/80 px-4 py-2 text-lg font-black text-accent" aria-live="polite">
          <Gem size={20} /> {gems} gemas
        </p>
        <p className="text-center text-xs text-muted">Las gemas se ganan cumpliendo tu meta, retos diarios y semanales, misiones y logros. Son solo decoración.</p>
      </section>

      <section className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-extrabold">Tienda</h1>
        <div className="seg max-w-full self-start overflow-x-auto" role="tablist" aria-label="Categorías">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => (setTab(t.id), setTrying({}))}>
              {t.label}
            </button>
          ))}
        </div>
        {msg && (
          <p role="status" className={`animate-pop rounded-[var(--r-md)] px-4 py-2 font-bold ${msg.ok ? "bg-good-soft text-good" : "bg-bad-soft text-bad"}`}>
            {msg.text}
          </p>
        )}

        {tab === "freeze" ? (
          <div className="module flex flex-col gap-3 p-5">
            <p className="flex items-center gap-2 text-lg font-black">
              <IcoIce size={28} /> Protector de racha
            </p>
            <p className="text-muted">Si un día no llegas a tu meta, un protector cubre ese día y tu racha sigue. El día se marca como «protegido», no como estudiado. Puedes tener 2.</p>
            <p className="font-bold">Tienes {freezes}/2</p>
            {items.map((it) => (
              <button key={it.id} type="button" className="btn btn-primary self-start" disabled={busy || freezes >= 2 || gems < it.price} onClick={() => purchase(it)}>
                Comprar por <Gem size={16} /> {it.price}
              </button>
            ))}
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 2xl:grid-cols-4">
            {free.map((f) => (
              <Card key={f.kind + f.value} look={look} kind={f.kind} value={f.value} label={f.label} on={isOn(f.kind, f.value)} color={f.kind === "color" ? f.value : undefined} onTry={() => tryOn(f.kind, f.value)}>
                <button type="button" className="btn btn-ghost h-10 min-h-10 w-full text-sm" disabled={busy || isOn(f.kind, f.value)} onClick={() => equip(f)}>
                  {isOn(f.kind, f.value) ? (
                    <>
                      <Check size={15} aria-hidden /> En uso
                    </>
                  ) : (
                    "Usar"
                  )}
                </button>
              </Card>
            ))}
            {items.map((it) => {
              const have = owned.has(it.id);
              const on = isOn(it.kind, it.value);
              return (
                <Card key={it.id} look={look} kind={it.kind} value={it.value} label={it.label} on={on} color={it.kind === "color" ? it.value : undefined} onTry={() => tryOn(it.kind, it.value)}>
                  {have ? (
                    <button type="button" className="btn btn-ghost h-10 min-h-10 w-full text-sm" disabled={busy || on} onClick={() => equip(it)}>
                      {on ? (
                        <>
                          <Check size={15} aria-hidden /> En uso
                        </>
                      ) : (
                        "Usar"
                      )}
                    </button>
                  ) : (
                    <button type="button" className="btn btn-accent h-10 min-h-10 w-full text-sm" disabled={busy || gems < it.price} onClick={() => purchase(it)} aria-label={`Comprar ${it.label} por ${it.price} gemas`}>
                      <Gem size={15} /> {it.price}
                    </button>
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ label, on, color, onTry, children, look, kind, value }: { label: string; on: boolean; color?: string; onTry: () => void; children: React.ReactNode; look: Look; kind: string; value: string }) {
  const p = { ...look, ...(kind === "accessory" ? accPatch(value) : kind === "outfit" ? { outfit: value as Outfit } : { color: value }) };
  return (
    <li className={`module flex flex-col gap-2 p-3 ${on ? "ring-2 ring-brand" : ""}`}>
      <button type="button" onClick={onTry} onMouseEnter={onTry} onFocus={onTry} className="flex flex-col items-center gap-2 rounded-[var(--r-md)] p-2 text-center hover:bg-surface-2">
        <span className="relative grid place-items-center">
          <Mascot species={p.species} color={p.color} accessory={p.accessory} face={p.face} neck={p.neck} outfit={p.outfit} size={76} animate="none" decorative />
          {color && <span className="absolute -right-1 bottom-0 h-5 w-5 rounded-full border-2 border-surface" style={{ background: color }} aria-hidden />}
        </span>
        <span className="text-sm font-black">{label}</span>
        <span className="sr-only">Probar en tu compañero</span>
      </button>
      {children}
    </li>
  );
}
