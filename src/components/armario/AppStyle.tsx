"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { applyTheme } from "../Prefs";
import { ExtraSettings } from "../ExtraSettings";
import { ACCENTS, type AccentId } from "@/lib/look";
import type { SeasonId, SeasonPrefs } from "@/lib/seasons";

type Mode = "system" | "light" | "dark";
const MODES: { id: Mode; label: string; Icon: typeof Sun }[] = [
  { id: "system", label: "Automático", Icon: Monitor },
  { id: "light", label: "Claro", Icon: Sun },
  { id: "dark", label: "Oscuro", Icon: Moon },
];

async function saveSettings(settings: Record<string, unknown>) {
  const r = await fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings }) });
  return r.ok;
}

/**
 * «Tu estilo» (Armario → Estilo): color principal, modo claro u oscuro y temporadas, con guardado al instante.
 * Las temáticas legendarias y los fondos van debajo (componente Appearance).
 */
export function AppStyle({ accent: initialAccent, mode: initialMode, season }: { accent: AccentId; mode: Mode; season: { prefs?: SeasonPrefs; current: SeasonId } }) {
  const router = useRouter();
  const [accent, setAccent] = useState(initialAccent);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function pickAccent(id: AccentId) {
    setAccent(id);
    document.documentElement.dataset.accent = id;
    document.cookie = `fluye-accent=${id}; path=/; max-age=31536000; samesite=lax`;
    setStatus((await saveSettings({ look: { accent: id } })) ? "saved" : "error");
    router.refresh();
  }
  async function pickMode(m: Mode) {
    setMode(m);
    applyTheme(m);
    try {
      localStorage.setItem("theme", m);
    } catch {}
    setStatus((await saveSettings({ theme: m })) ? "saved" : "error");
  }

  return (
    <section className="flex flex-col gap-4" aria-labelledby="estilo">
      <div>
        <h2 id="estilo" className="text-xl font-black">
          Colores y modo
        </h2>
        <p className="text-sm text-muted">Se aplican al instante en toda la app.</p>
      </div>
      <div className="module flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-muted">Color principal</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6" role="radiogroup" aria-label="Color principal">
            {ACCENTS.map((a) => {
              const on = accent === a.id;
              return (
                <button key={a.id} type="button" role="radio" aria-checked={on} onClick={() => void pickAccent(a.id)} className={`style-swatch ${on ? "is-on" : ""}`}>
                  <span className="style-dot" style={{ background: a.swatch }} aria-hidden>
                    {on && <Check size={16} strokeWidth={3.5} />}
                  </span>
                  <span className="text-sm font-extrabold">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-sm font-bold text-muted">Modo</p>
          <div className="seg grid grid-cols-3 sm:inline-flex sm:self-start" role="radiogroup" aria-label="Modo claro u oscuro">
            {MODES.map(({ id, label, Icon }) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} onClick={() => void pickMode(id)} className="flex items-center justify-center gap-1.5 !px-2">
                <Icon size={16} aria-hidden /> {label}
              </button>
            ))}
          </div>
        </div>
        <p role="status" aria-live="polite" className={`text-sm font-bold ${status === "error" ? "text-bad" : "text-muted"}`}>
          {status === "saved" && "Guardado."}
          {status === "error" && "No se pudo guardar. Revisa tu conexión."}
        </p>
      </div>
      <ExtraSettings only="season" initial={{ season: season.prefs, currentSeason: season.current }} />
    </section>
  );
}

/** Nombre de tu compañero (Armario → Mascotas): se guarda solo al dejar de escribir. */
export function CompanionName({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const v = name.trim();
    if (!v) return;
    const t = setTimeout(async () => {
      setStatus("saving");
      const ok = await saveSettings({ look: { name: v } });
      setStatus(ok ? "saved" : "error");
      if (ok) router.refresh();
    }, 700);
    return () => clearTimeout(t);
  }, [name, router]);
  return (
    <label className="module flex flex-col gap-1.5 p-4 sm:flex-row sm:items-center sm:gap-4">
      <span className="text-sm font-bold text-muted sm:w-48">Nombre de tu compañero</span>
      <input aria-label="Nombre de tu compañero" value={name} maxLength={16} onChange={(e) => setName(e.target.value)} className="h-11 w-full rounded-[var(--r-md)] border-2 border-line bg-surface px-3 font-black outline-none focus:border-accent sm:flex-1" />
      <span role="status" aria-live="polite" className={`text-xs font-bold sm:w-24 ${status === "error" ? "text-bad" : "text-muted"}`}>
        {status === "saving" ? "Guardando…" : status === "saved" ? "Guardado" : status === "error" ? "No se guardó" : ""}
      </span>
    </label>
  );
}
