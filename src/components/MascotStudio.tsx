"use client";
import { useState } from "react";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Mascot, type Mood } from "./Mascot";
import { ACCESSORIES, FUR_COLORS, OUTFITS, SLOT_LABEL, SPECIES, type Accessory, type Look, type Outfit, type Slot, type Species } from "@/lib/look";

type Tab = "species" | "color" | Slot | "outfit";
const TABS: { id: Tab; label: string }[] = [
  { id: "species", label: "Especie" },
  { id: "color", label: "Color" },
  { id: "head", label: SLOT_LABEL.head },
  { id: "face", label: SLOT_LABEL.face },
  { id: "neck", label: SLOT_LABEL.neck },
  { id: "outfit", label: "Atuendo" },
];
const MOODS: { id: Mood; label: string }[] = [
  { id: "happy", label: "Feliz" },
  { id: "cheer", label: "Celebra" },
  { id: "think", label: "Piensa" },
  { id: "wow", label: "Sorpresa" },
  { id: "oops", label: "Ánimo" },
  { id: "sleep", label: "Descansa" },
];
const SLOT_KEY: Record<Slot, "accessory" | "face" | "neck"> = { head: "accessory", face: "face", neck: "neck" };

/**
 * Estudio de la mascota: vista previa compacta que reacciona en vivo, y pestañas para especie, color,
 * accesorios por zona (se combinan: cabeza + cara + cuello) y atuendo. Solo muestra lo gratis o lo que ya usas;
 * lo demás está en la Tienda.
 */
export function MascotStudio({ look, setLook, onSpecies }: { look: Look; setLook: (p: Partial<Look>) => void; onSpecies: (id: Species) => void }) {
  const [tab, setTab] = useState<Tab>("species");
  const [mood, setMood] = useState<Mood>("happy");
  const [pulse, setPulse] = useState(0);
  const change = (p: Partial<Look>) => {
    setLook(p);
    setPulse((n) => n + 1);
  };
  const slot = tab === "head" || tab === "face" || tab === "neck" ? tab : null;
  const options = slot ? ACCESSORIES.filter((a) => (a.id === "none" || a.slot === slot) && (a.price === 0 || look[SLOT_KEY[slot]] === a.id)) : [];

  return (
    <div className="grid gap-4 md:grid-cols-[13rem_1fr] md:items-start">
      <div className="flex items-center gap-3 rounded-[var(--r-lg)] bg-brand-soft p-3 md:sticky md:top-6 md:flex-col md:p-4">
        <span key={pulse} className={pulse ? "mascot-nod" : ""}>
          <Mascot species={look.species} color={look.color} accessory={look.accessory} face={look.face} neck={look.neck} outfit={look.outfit} mood={mood} size={112} animate="none" label={`${look.name}: vista previa`} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2 md:w-full">
          <label className="flex flex-col gap-1 text-xs font-bold text-muted">
            Nombre
            <input aria-label="Nombre de tu compañero" className="h-10 w-full rounded-[var(--r-sm)] border border-line bg-surface px-3 text-base font-black text-text" value={look.name} maxLength={16} onChange={(e) => setLook({ name: e.target.value })} />
          </label>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Ver una emoción">
            {MOODS.map((m) => (
              <button key={m.id} type="button" aria-pressed={mood === m.id} onClick={() => setMood(m.id)} className={`rounded-full px-2 py-1 text-[11px] font-extrabold ${mood === m.id ? "bg-accent text-white" : "bg-surface text-muted"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <div className="seg" role="tablist" aria-label="Qué personalizar">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "species" && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7 md:grid-cols-4 xl:grid-cols-7" role="radiogroup" aria-label="Especie">
            {SPECIES.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={look.species === s.id} title={s.blurb} onClick={() => (onSpecies(s.id), setPulse((n) => n + 1))} className={`pick ${look.species === s.id ? "is-on" : ""}`}>
                <Mascot species={s.id} color={look.species === s.id ? look.color : s.color} size={52} animate="none" decorative />
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        )}

        {tab === "color" && (
          <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Color del pelaje">
            {FUR_COLORS.map((c) => (
              <button key={c} type="button" role="radio" aria-checked={look.color.toLowerCase() === c} aria-label={`Color ${c}`} onClick={() => change({ color: c })} className={`h-11 w-11 rounded-full border-4 ${look.color.toLowerCase() === c ? "border-accent" : "border-surface"} shadow-card`} style={{ background: c }} />
            ))}
          </div>
        )}

        {slot && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-label={SLOT_LABEL[slot]}>
            {options.map((a) => {
              const on = look[SLOT_KEY[slot]] === a.id;
              return (
                <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => change({ [SLOT_KEY[slot]]: a.id as Accessory })} className={`pick ${on ? "is-on" : ""}`}>
                  <Mascot species={look.species} color={look.color} {...{ [SLOT_KEY[slot]]: a.id as Accessory }} size={56} animate="none" decorative />
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {tab === "outfit" && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-label="Atuendo">
            {OUTFITS.filter((o) => o.price === 0 || look.outfit === o.id).map((o) => (
              <button key={o.id} type="button" role="radio" aria-checked={look.outfit === o.id} onClick={() => change({ outfit: o.id as Outfit })} className={`pick ${look.outfit === o.id ? "is-on" : ""}`}>
                <Mascot species={look.species} color={look.color} outfit={o.id as Outfit} size={56} animate="none" decorative />
                <span>{o.label}</span>
              </button>
            ))}
          </div>
        )}

        {(slot || tab === "outfit" || tab === "color") && (
          <Link href="/tienda" className="flex items-center gap-2 self-start text-sm font-extrabold text-brand-ink underline-offset-4 hover:underline">
            <ShoppingBag size={16} aria-hidden /> Más opciones en la Tienda
          </Link>
        )}
        {slot && <p className="text-xs text-muted">Puedes combinar uno de cabeza, uno de cara y uno de cuello, además del atuendo.</p>}
      </div>
    </div>
  );
}
