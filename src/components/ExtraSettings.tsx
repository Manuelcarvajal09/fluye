"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { SeasonId, SeasonPrefs } from "@/lib/seasons";
import { SEASONS } from "@/lib/seasons";
import { useSettingsTab } from "./SettingsTabs";

type Hoy = Partial<Record<"week" | "load" | "goal" | "achievement" | "theme" | "challenges", boolean>>;
type Init = { season?: SeasonPrefs; celebrations?: boolean; social?: boolean; explicit?: boolean; hoy?: Hoy; currentSeason: SeasonId };

const HOY_LABEL: Record<keyof Hoy & string, string> = { challenges: "Retos diarios y semanales", week: "Esta semana", load: "Próximos repasos", goal: "Tu objetivo", achievement: "Próximo logro", theme: "Recomendación temática" };

/** Temporadas, experiencia (celebraciones, lenguaje explícito, social) y módulos de Hoy. */
/** `only="season"`: solo las temporadas (se muestran en el Armario → Estilo). Sin `only`: experiencia y módulos de Hoy (Ajustes). */
export function ExtraSettings({ initial, only }: { initial: Init; only?: "season" }) {
  const router = useRouter();
  const [season, setSeason] = useState<SeasonPrefs>({ mode: "auto", region: "CA", holidays: false, palette: true, decor: true, content: true, ...initial.season });
  const [celebrations, setCelebrations] = useState(initial.celebrations !== false);
  const [social, setSocial] = useState(initial.social === true);
  const [explicit, setExplicit] = useState(initial.explicit === true);
  const [hoy, setHoy] = useState<Hoy>({ week: true, load: true, goal: true, achievement: true, theme: true, challenges: true, ...initial.hoy });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const ss = (p: Partial<SeasonPrefs>) => setSeason((s) => ({ ...s, ...p }));
  const firstRun = useRef(true);
  const tab = useSettingsTab();

  // Guardado automático: cada cambio se guarda 600 ms después, sin botón que pueda olvidarse.
  async function persist() {
    setStatus("saving");
    try {
      const r = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: only === "season" ? { season: { ...season, simDate: season.simDate ?? "" } } : { season: { ...season, simDate: season.simDate ?? "" }, celebrations, social, explicit, hoy } }) });
      if (!r.ok) throw new Error(String(r.status));
      setStatus("saved");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => void persist(), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season, celebrations, social, explicit, hoy]);

  return (
    <div className="flex flex-col gap-5" hidden={!only && tab !== "experiencia"}>
      <section className="module flex flex-col gap-4 p-5" hidden={only !== "season"}>
        <h2 className="text-xl font-black">Temporadas</h2>
        <p className="text-sm text-muted">Cambian el color de la tarjeta principal, una pequeña decoración y la misión sugerida. Nunca cambian tu progreso. Ahora: {SEASONS.find((s) => s.id === initial.currentSeason)?.label}.</p>
        <div className="seg grid grid-cols-3 sm:inline-flex sm:self-start" role="radiogroup" aria-label="Modo de temporadas">
          {(
            [
              ["auto", "Automático"],
              ["manual", "Elegir tema"],
              ["off", "Sin temporadas"],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" role="radio" aria-checked={season.mode === id} onClick={() => ss({ mode: id })} className="!px-2">
              {label}
            </button>
          ))}
        </div>
        {season.mode === "manual" && (
          <label className="flex flex-col gap-1 text-sm font-bold">
            Tema
            <select value={season.manual ?? "invierno"} onChange={(e) => ss({ manual: e.target.value as SeasonId })} className="h-11 rounded-[var(--r-md)] border border-line bg-surface px-3">
              {SEASONS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {season.mode === "auto" && (
          <>
            <label className="flex flex-col gap-1 text-sm font-bold">
              Región cultural (independiente de tu zona horaria)
              <select value={season.region} onChange={(e) => ss({ region: e.target.value as SeasonPrefs["region"] })} className="h-11 rounded-[var(--r-md)] border border-line bg-surface px-3">
                <option value="CA">Canadá</option>
                <option value="US">Estados Unidos</option>
                <option value="MX">México</option>
              </select>
            </label>
            <Toggle on={!!season.holidays} set={(v) => ss({ holidays: v })} label="Incluir Navidad" hint="Solo si la celebras. Del 1 de diciembre al 1 de enero (en México, hasta Reyes)." />
          </>
        )}
        <Toggle on={season.palette !== false} set={(v) => ss({ palette: v })} label="Paleta de temporada" />
        <Toggle on={season.decor !== false} set={(v) => ss({ decor: v })} label="Decoración" hint="Un detalle fijo en una esquina. Nunca partículas encima del texto." />
        <Toggle on={season.content !== false} set={(v) => ss({ content: v })} label="Misiones de temporada sugeridas" hint="Las misiones temáticas siguen disponibles todo el año." />
        <label className="flex flex-col gap-1 text-sm font-bold">
          Probar con otra fecha (simulación)
          <input type="date" value={season.simDate ?? ""} onChange={(e) => ss({ simDate: e.target.value })} className="h-11 rounded-[var(--r-md)] border border-line bg-surface px-3" />
          <span className="font-normal text-muted">Déjalo vacío para usar la fecha real.</span>
        </label>
      </section>

      <section className="module flex flex-col gap-4 p-5" hidden={!!only || tab !== "experiencia"}>
        <h2 className="text-xl font-black">Experiencia</h2>
        <Toggle on={celebrations} set={setCelebrations} label="Celebraciones" hint="Confeti y animaciones al terminar una sesión." />
        <Toggle on={explicit} set={setExplicit} label="Lenguaje explícito" hint="Muestra groserías e insultos completos, sin asteriscos, en la biblioteca, el inglés real y la música. Las expresiones ofensivas siguen marcadas como «para entenderla»." />
        <Toggle on={social} set={setSocial} label="Retos privados con amistades" hint="Solo con miembros que también lo activen. Se comparte únicamente tu nombre y cuántos días cumpliste tu propia meta; nunca respuestas ni grabaciones." />
      </section>

      <section className="module flex flex-col gap-3 p-5" hidden={!!only || tab !== "experiencia"}>
        <h2 className="text-xl font-black">Módulos de Hoy</h2>
        {(Object.keys(HOY_LABEL) as (keyof Hoy)[]).map((k) => (
          <Toggle key={k} on={hoy[k] !== false} set={(v) => setHoy((h) => ({ ...h, [k]: v }))} label={HOY_LABEL[k]} />
        ))}
      </section>

      <p role="status" aria-live="polite" className={`flex items-center gap-2 text-sm font-bold ${status === "error" ? "text-bad" : "text-muted"}`}>
        {status === "saving" && "Guardando…"}
        {status === "saved" && (
          <>
            <Check size={16} aria-hidden /> Guardado
          </>
        )}
        {status === "error" && (
          <>
            No se pudo guardar. Revisa tu conexión.
            <button type="button" className="btn btn-ghost h-9 px-3 text-sm" onClick={() => void persist()}>
              Reintentar
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function Toggle({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block font-bold">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => set(e.target.checked)} className="mt-1 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-line transition-colors duration-200 before:block before:h-5 before:w-5 before:translate-x-0.5 before:rounded-full before:bg-white before:shadow before:transition-transform before:duration-200 checked:bg-brand checked:before:translate-x-5.5" />
    </label>
  );
}
