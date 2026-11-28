"use client";
import { useState } from "react";
import Link from "next/link";
import { Shirt } from "lucide-react";
import { Mascot, type Mood } from "./Mascot";
import { SPECIES, wearOf, type Look, type Species } from "@/lib/look";

const MOODS: { id: Mood; label: string }[] = [
  { id: "happy", label: "Feliz" },
  { id: "cheer", label: "Celebra" },
  { id: "think", label: "Piensa" },
  { id: "wow", label: "Sorpresa" },
  { id: "oops", label: "Ánimo" },
  { id: "sleep", label: "Descansa" },
];

/**
 * Mascota en Ajustes: nombre, especie (las que ya son tuyas) y vista de sus emociones.
 * La ropa y los accesorios se eligen en el Armario, donde cada mascota guarda su propio conjunto.
 */
export function MascotStudio({ look, setLook, onSpecies, ownedPets }: { look: Look; setLook: (p: Partial<Look>) => void; onSpecies: (id: Species) => void; ownedPets: string[] }) {
  const [mood, setMood] = useState<Mood>("happy");
  const [pulse, setPulse] = useState(0);
  const pets = SPECIES.filter((s) => ownedPets.includes(s.id));
  return (
    <div className="grid gap-4 md:grid-cols-[13rem_1fr] md:items-start">
      <div className="flex items-center gap-3 rounded-[var(--r-lg)] bg-brand-soft p-3 md:sticky md:top-6 md:flex-col md:p-4">
        <span key={pulse} className={pulse ? "mascot-nod" : ""}>
          <Mascot species={look.species} wear={mood === "happy" ? wearOf(look) : []} mood={mood} size={112} animate="none" label={`${look.name}: vista previa`} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2 md:w-full">
          <label className="flex flex-col gap-1 text-xs font-bold text-muted">
            Nombre
            <input aria-label="Nombre de tu compañero" className="h-10 w-full rounded-[var(--r-sm)] border border-line bg-surface px-3 text-base font-black text-text" value={look.name} maxLength={16} onChange={(e) => setLook({ name: e.target.value })} />
          </label>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Ver una emoción">
            {MOODS.map((m) => (
              <button key={m.id} type="button" aria-pressed={mood === m.id} onClick={() => setMood(m.id)} className={`rounded-full px-2 py-1 text-xs font-extrabold ${mood === m.id ? "bg-accent text-white" : "bg-surface text-muted"}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3">
        <p className="text-sm font-bold text-muted">Especie</p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Especie">
          {pets.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={look.species === s.id} title={s.blurb} onClick={() => (onSpecies(s.id), setPulse((n) => n + 1))} className={`pick ${look.species === s.id ? "is-on" : ""}`}>
              <Mascot species={s.id} size={52} animate="none" decorative />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <Link href="/tienda" className="flex items-center gap-2 self-start text-sm font-extrabold text-brand-ink underline-offset-4 hover:underline">
          <Shirt size={16} aria-hidden /> Ropa, accesorios y más mascotas en el Armario
        </Link>
      </div>
    </div>
  );
}
