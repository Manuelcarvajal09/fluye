"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck } from "lucide-react";
import { AREAS, GROUP_LABEL, type AreaGroup } from "@/lib/areas";
import type { Level } from "@/lib/types";
import { Bar } from "./ui";
import { Mascot } from "./Mascot";
import { SPECIES, type Look, type Species } from "@/lib/look";
import { Logo } from "./Nav";

const SELF: { level: Level; title: string; text: string }[] = [
  { level: "A1", title: "Empiezo de cero", text: "Conozco palabras sueltas y frases básicas." },
  { level: "A2", title: "Me defiendo poco", text: "Entiendo frases simples si hablan despacio." },
  { level: "B1", title: "Me comunico", text: "Mantengo conversaciones sencillas; me cuesta el oído rápido." },
  { level: "B2", title: "Bastante bien", text: "Sigo series con subtítulos y hablo con soltura sobre muchos temas." },
  { level: "C1", title: "Avanzado", text: "Casi todo lo entiendo; quiero sonar natural y preciso." },
];

/** Bienvenida corta: 3 pantallas. El test completo es opcional y se hace cuando quieras. */
export function Onboarding({ name: initialName, level: initialLevel, areas: initialAreas, minutes: initialMinutes, look }: { name: string; level: string; areas: string[]; minutes: number; look: Look }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(initialName);
  const [level, setLevel] = useState<Level>((initialLevel as Level) ?? "B1");
  const [areas, setAreas] = useState<string[]>(initialAreas);
  const [minutes, setMinutes] = useState([5, 10, 15, 20].includes(initialMinutes) ? initialMinutes : 10);
  const [species, setSpecies] = useState<Species>(look.species);
  const [busy, setBusy] = useState(false);

  async function save(then: string) {
    setBusy(true);
    await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, level, goalMinutes: minutes, dailyNew: minutes >= 15 ? 12 : minutes >= 10 ? 8 : 5, topics: areas, settings: { look: { species, color: SPECIES.find((x) => x.id === species)!.color, name: SPECIES.find((x) => x.id === species)!.defaultName } }, tz: Intl.DateTimeFormat().resolvedOptions().timeZone, onboarded: true }),
    });
    router.push(then);
  }

  const groups = (Object.keys(GROUP_LABEL) as AreaGroup[]).map((g) => ({ g, items: AREAS.filter((a) => a.group === g) }));

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex items-center gap-3">
        <Logo size={36} />
        <Bar value={step + 1} max={3} label="Pasos de bienvenida" />
        <span className="text-sm font-bold text-muted">{step + 1}/3</span>
      </div>

      {step === 0 && (
        <section className="flex flex-1 flex-col gap-5">
          <h1 className="text-3xl font-black">¡Hola! Empecemos rápido</h1>
          <label className="flex flex-col gap-2">
            <span className="font-bold">¿Cómo te llamas?</span>
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} className="h-13 rounded-2xl border-2 border-line bg-surface px-4 text-lg font-bold outline-none focus:border-accent" />
          </label>
          <div>
            <p className="mb-2 font-bold">¿Cómo describes tu inglés hoy?</p>
            <div className="grid gap-2">
              {SELF.map((s) => (
                <button key={s.level} type="button" aria-pressed={level === s.level} onClick={() => setLevel(s.level)} className="option flex items-center gap-3" data-state={level === s.level ? "selected" : undefined}>
                  <span className="grid h-10 w-12 shrink-0 place-items-center rounded-xl bg-surface-2 font-black">{s.level}</span>
                  <span>
                    <span className="block font-black">{s.title}</span>
                    <span className="block text-sm font-semibold text-muted">{s.text}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted">Es un punto de partida. Después puedes hacer el test completo (≈30 min) para medirlo bien.</p>
          </div>
          <button type="button" className="btn btn-primary mt-auto" onClick={() => setStep(1)}>
            Continuar
          </button>
        </section>
      )}

      {step === 1 && (
        <section className="flex flex-1 flex-col gap-5">
          <div>
            <h1 className="text-3xl font-black">¿Para qué quieres el inglés?</h1>
            <p className="text-muted">Elige tus áreas: las sesiones priorizan su vocabulario, phrasal verbs y situaciones. Puedes cambiarlas en Ajustes.</p>
          </div>
          {groups.map(({ g, items }) => (
            <div key={g}>
              <p className="mb-2 text-sm font-black uppercase tracking-wide text-muted">{GROUP_LABEL[g]}</p>
              <div className="flex flex-wrap gap-2">
                {items.map((a) => {
                  const on = areas.includes(a.id);
                  return (
                    <button key={a.id} type="button" aria-pressed={on} onClick={() => setAreas((x) => (on ? x.filter((y) => y !== a.id) : [...x, a.id]))} className={`btn h-10 min-h-10 px-3 text-sm ${on ? "btn-accent" : "btn-ghost"}`}>
                      {on && <Check size={15} aria-hidden />} {a.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="mt-auto grid grid-cols-2 gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
              Atrás
            </button>
            <button type="button" className="btn btn-primary" disabled={!areas.length} onClick={() => setStep(2)}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-1 flex-col gap-5">
          <div>
            <h1 className="text-3xl font-black">Elige a tu compañero</h1>
            <p className="text-muted">Te acompañará en cada sesión. Después podrás cambiar su nombre, color y accesorios.</p>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {SPECIES.map((sp) => (
              <button key={sp.id} type="button" aria-pressed={species === sp.id} onClick={() => setSpecies(sp.id)} className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-2 ${species === sp.id ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}>
                <Mascot species={sp.id} color={sp.color} accessory="toque" mood={species === sp.id ? "cheer" : "happy"} size={76} animate={species === sp.id ? "bob" : "none"} decorative />
                <span className="text-sm font-black">{sp.label}</span>
              </button>
            ))}
          </div>
          <h2 className="text-2xl font-black">¿Cuánto tiempo al día?</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[5, 10, 15, 20].map((m) => (
              <button key={m} type="button" className={`btn h-16 text-lg ${minutes === m ? "btn-primary" : "btn-ghost"}`} onClick={() => setMinutes(m)} aria-pressed={minutes === m}>
                {m} min
              </button>
            ))}
          </div>
          <p className="text-muted">Con 20 minutos: 5 de repaso, 10 de contenido nuevo y 5 de práctica oral.</p>
          <div className="mt-auto flex flex-col gap-3">
            <button type="button" disabled={busy} className="btn btn-primary" onClick={() => save(`/sesion?min=${minutes}`)}>
              Empezar mi primera sesión
            </button>
            <button type="button" disabled={busy} className="btn btn-ghost" onClick={() => save("/practicar/test")}>
              <ClipboardCheck size={18} aria-hidden /> Prefiero hacer primero el test completo (≈30 min)
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
