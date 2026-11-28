"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SignOutButton } from "@clerk/nextjs";
import { Download, Upload, CalendarPlus, Check, Volume2, ChevronDown } from "lucide-react";
import { useSettingsTab, type SettingsTab } from "./SettingsTabs";
import { availableHdVoices, englishVoices, onVoicesReady, setTtsPrefs, speak, unlockAudio } from "@/lib/audio/tts";
import { HD_VOICES } from "@/lib/audio/voices";
import { setSfxEnabled, playSfx } from "@/lib/audio/sfx";
import { AREAS, GROUP_LABEL, type AreaGroup } from "@/lib/areas";
import type { Look } from "@/lib/look";

type Initial = {
  name: string;
  level: string;
  goalMinutes: number;
  dailyNew: number;
  topics: string[];
  theme?: "system" | "light" | "dark";
  voice?: string;
  rate?: number;
  accent?: "en-US" | "en-CA";
  retention?: number;
  reminder?: string;
  autoplay?: boolean;
  sfx?: boolean;
  engine?: "hd" | "device";
  hdVoice?: string;
  look: Look;
  ownedPets: string[];
  themeName?: string | null;
  backgroundName?: string | null;
};


export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [v, setV] = useState({ theme: "system", rate: 1, accent: "en-US", retention: 0.9, reminder: "20:00", autoplay: true, sfx: true, engine: "hd", hdVoice: "af_heart", voice: "", ...initial } as Required<Initial>);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [coverage, setCoverage] = useState<Record<string, number> | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const firstRun = useRef(true);
  const [failed, setFailed] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const tab = useSettingsTab();
  const [areasOpen, setAreasOpen] = useState(false);

  useEffect(() => onVoicesReady(() => setVoices(englishVoices())), []);
  useEffect(() => {
    void availableHdVoices().then(setCoverage);
  }, []);

  const set = <K extends keyof Initial>(k: K, val: Initial[K]) => setV((s) => ({ ...s, [k]: val }));

  async function save() {
    setStatus("saving");
    const r = await fetch("/api/profile", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: v.name,
        level: v.level,
        goalMinutes: v.goalMinutes,
        dailyNew: v.dailyNew,
        topics: v.topics,
        settings: {
          voice: v.voice || undefined,
          rate: v.rate,
          accent: v.accent,
          retention: v.retention,
          reminder: v.reminder,
          autoplay: v.autoplay,
          sfx: v.sfx,
          engine: v.engine,
          hdVoice: v.hdVoice,
        },
      }),
    });
    if (!r.ok) {
      setFailed(true);
      setStatus("idle");
      return;
    }
    setFailed(false);
    setTtsPrefs({ voice: v.voice || undefined, rate: v.rate, accent: v.accent, autoplay: v.autoplay, engine: v.engine, hdVoice: v.hdVoice });
    setSfxEnabled(v.sfx);
    setStatus("saved");
    router.refresh();
  }
  // Guardado automático: cada cambio se guarda 700 ms después (sin botón que se pueda olvidar).
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const t = setTimeout(() => void save(), 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.name, v.level, v.goalMinutes, v.dailyNew, v.topics, v.voice, v.rate, v.accent, v.retention, v.reminder, v.autoplay, v.sfx, v.engine, v.hdVoice]);

  async function importFile(f: File) {
    setMsg("Importando…");
    const r = await fetch("/api/data", { method: "POST", headers: { "content-type": "application/json" }, body: await f.text() });
    const j = await r.json().catch(() => ({}));
    setMsg(r.ok ? `Listo: ${j.imported} tarjetas importadas${j.skipped ? `, ${j.skipped} omitidas` : ""}.` : `No se pudo importar: ${j.error ?? "error"}`);
    router.refresh();
  }

  function preview(engine: "hd" | "device", hdVoice: string) {
    unlockAudio();
    setTtsPrefs({ engine, hdVoice, voice: v.voice || undefined, rate: v.rate, accent: v.accent });
    void speak("I'm looking forward to catching up with you this weekend.");
  }

  return (
    <div className="flex flex-col gap-5">
      <Card tab="estudio" title="Tú">
        <Field label="Tu nombre">
          <input aria-label="Nombre" className="input" value={v.name} maxLength={40} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <Field label="Nivel de inglés">
          <Seg value={v.level} options={["A1", "A2", "B1", "B2", "C1"].map((l) => [l, l])} onChange={(x) => set("level", x)} />
        </Field>
        <Field label="Meta diaria">
          <Seg value={String(v.goalMinutes)} options={[5, 10, 15, 20].map((m) => [String(m), `${m} min`])} onChange={(x) => set("goalMinutes", Number(x))} />
        </Field>
        <Field label={`Expresiones nuevas por día: ${v.dailyNew}`}>
          <input aria-label="Expresiones nuevas por día" type="range" min={0} max={30} value={v.dailyNew} onChange={(e) => set("dailyNew", Number(e.target.value))} className="w-full accent-[var(--brand)]" />
        </Field>
      </Card>

      <Card tab="estudio" title="Tus áreas de interés">
        <p className="-mt-2 text-sm text-muted">Las sesiones priorizan expresiones nuevas de estas áreas.</p>
        <div className="flex flex-wrap items-center gap-2">
          {v.topics.length === 0 && <span className="text-sm text-muted">Ninguna elegida.</span>}
          {!areasOpen &&
            AREAS.filter((a) => v.topics.includes(a.id)).map((a) => (
              <span key={a.id} className="chip text-xs">
                {a.label}
              </span>
            ))}
          <button type="button" className="btn btn-ghost h-10 min-h-10 px-3 text-sm" aria-expanded={areasOpen} onClick={() => setAreasOpen((o) => !o)}>
            {areasOpen ? "Listo" : `${v.topics.length} elegidas · Editar`} <ChevronDown size={16} aria-hidden className={areasOpen ? "rotate-180" : ""} />
          </button>
        </div>
        {areasOpen && (Object.keys(GROUP_LABEL) as AreaGroup[]).map((g) => (
          <div key={g}>
            <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted">{GROUP_LABEL[g]}</p>
            <div className="flex flex-wrap gap-2">
              {AREAS.filter((a) => a.group === g).map((a) => {
                const on = v.topics.includes(a.id);
                return (
                  <button key={a.id} type="button" aria-pressed={on} onClick={() => set("topics", on ? v.topics.filter((x) => x !== a.id) : [...v.topics, a.id])} className={`btn h-10 min-h-10 px-3 text-sm ${on ? "btn-accent" : "btn-ghost"}`}>
                    {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </Card>

      <Card tab="voz" title="Voz y sonidos">
        <Field label="Motor de voz">
          <Seg
            value={v.engine}
            options={[
              ["hd", "Voces HD (recomendado)"],
              ["device", "Voz del dispositivo"],
            ]}
            onChange={(x) => set("engine", x as "hd" | "device")}
          />
        </Field>

        {v.engine === "hd" ? (
          <Field label="Elige una voz">
            <ul className="grid gap-2 sm:grid-cols-2">
              {HD_VOICES.map((hv) => {
                const cov = coverage?.[hv.id] ?? null;
                const dialogueOnly = cov === -1;
                const ready = !dialogueOnly && (cov === null ? hv.id === "af_heart" : cov >= 0.9);
                return (
                  <li key={hv.id}>
                    <div className={`flex items-center gap-3 rounded-2xl border-2 p-3 ${v.hdVoice === hv.id ? "border-accent bg-accent-soft" : "border-line bg-surface"}`}>
                      <button type="button" aria-label={`Probar la voz ${hv.label}`} className="btn btn-accent h-11 w-11 shrink-0 !p-0" onClick={() => preview("hd", hv.id)}>
                        <Volume2 size={20} aria-hidden />
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="font-black">{hv.label}</p>
                        <p className="text-xs text-muted">{hv.desc}</p>
                        {dialogueOnly && <p className="text-xs font-bold text-accent">Voz de tus personajes e interlocutores</p>}
                        {cov !== null && cov >= 0 && cov < 0.9 && <p className="text-xs font-bold text-text">{Math.round(cov * 100)} % del audio listo</p>}
                      </div>
                      <button type="button" aria-pressed={v.hdVoice === hv.id} disabled={!ready} onClick={() => set("hdVoice", hv.id)} className={`btn h-10 min-h-10 px-3 text-sm ${v.hdVoice === hv.id ? "btn-primary" : "btn-ghost"}`}>
                        {v.hdVoice === hv.id ? "En uso" : dialogueOnly ? "Automática" : "Usar"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 text-xs text-muted">Son voces neuronales gratuitas (Kokoro, licencia Apache 2.0) grabadas de antemano: suenan igual en tu iPhone, iPad o PC. En las conversaciones, tu interlocutor usa la otra voz y cada personaje tiene la suya. Si falta algún audio, se usa la voz del dispositivo.</p>
          </Field>
        ) : (
          <>
            <Field label="Acento de la voz del dispositivo">
              <Seg value={v.accent} options={[["en-US", "EE. UU."], ["en-CA", "Canadá"]]} onChange={(x) => set("accent", x as Initial["accent"])} />
            </Field>
            <Field label="Voz del dispositivo">
              <div className="flex gap-2">
                <select aria-label="Voz" className="input" value={v.voice} onChange={(e) => set("voice", e.target.value)}>
                  <option value="">Automática (la mejor disponible)</option>
                  {voices.map((x) => (
                    <option key={x.voiceURI} value={x.voiceURI}>
                      {x.name} · {x.lang}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-ghost shrink-0" onClick={() => preview("device", v.hdVoice)}>
                  Probar
                </button>
              </div>
              <p className="mt-1 text-xs text-muted">Calidad variable según tu dispositivo. En iPhone/iPad puedes descargar voces «Mejoradas» o «Premium» en Ajustes › Accesibilidad › Contenido leído › Voces › Inglés. En Edge (Windows) busca las voces «Online (Natural)».</p>
            </Field>
          </>
        )}

        <Field label={`Velocidad: ${v.rate.toFixed(2)}×`}>
          <input aria-label="Velocidad de la voz" type="range" min={0.6} max={1.3} step={0.05} value={v.rate} onChange={(e) => set("rate", Number(e.target.value))} className="w-full accent-[var(--brand)]" />
        </Field>
        <label className="flex items-center gap-3 font-bold">
          <input type="checkbox" checked={v.autoplay} onChange={(e) => set("autoplay", e.target.checked)} className="h-5 w-5 accent-[var(--brand)]" />
          Reproducir audio automáticamente
        </label>
        <label className="flex items-center gap-3 font-bold">
          <input
            type="checkbox"
            checked={v.sfx}
            onChange={(e) => {
              set("sfx", e.target.checked);
              setSfxEnabled(e.target.checked);
              if (e.target.checked) playSfx("ok");
            }}
            className="h-5 w-5 accent-[var(--brand)]"
          />
          Efectos de sonido (aciertos, errores, celebraciones)
        </label>
      </Card>

      <Card tab="estudio" title="Repetición espaciada (FSRS)">
        <Field label={`Retención objetivo: ${Math.round(v.retention * 100)}%`}>
          <input aria-label="Retención objetivo" type="range" min={0.8} max={0.97} step={0.01} value={v.retention} onChange={(e) => set("retention", Number(e.target.value))} className="w-full accent-[var(--brand)]" />
          <p className="mt-1 text-xs text-muted">Más alto = recuerdas más pero repasas más seguido. 90% es el equilibrio recomendado.</p>
        </Field>
      </Card>

      <Card tab="estudio" title="Recordatorio">
        <Field label="Hora del recordatorio diario">
          <div className="flex flex-wrap gap-2">
            <input aria-label="Hora del recordatorio" type="time" className="input max-w-40" value={v.reminder} onChange={(e) => set("reminder", e.target.value)} />
            <a href="/api/reminder" className="btn btn-ghost" onClick={() => void save()}>
              <CalendarPlus size={18} aria-hidden /> Añadir a mi calendario
            </a>
          </div>
          <p className="mt-1 text-xs text-muted">Se crea un evento diario con aviso en tu calendario (iPhone, iPad, Mac o Windows). Sin notificaciones molestas: lo quitas cuando quieras desde el calendario.</p>
        </Field>
      </Card>

      <p role="status" aria-live="polite" hidden={tab === "datos"} className={`flex items-center gap-2 text-sm font-bold ${failed ? "text-bad" : "text-muted"}`}>
        {status === "saving" && "Guardando…"}
        {status === "saved" && (
          <>
            <Check size={16} aria-hidden /> Cambios guardados
          </>
        )}
        {failed && (
          <>
            No se pudo guardar. Revisa tu conexión.
            <button type="button" className="btn btn-ghost h-9 min-h-9 px-3 text-sm" onClick={() => void save()}>
              Reintentar
            </button>
          </>
        )}
      </p>

      <Card tab="datos" title="Tus datos">
        <div className="flex flex-wrap gap-2">
          <a href="/api/data" className="btn btn-ghost">
            <Download size={18} aria-hidden /> Exportar todo (JSON)
          </a>
          <button type="button" className="btn btn-ghost" onClick={() => file.current?.click()}>
            <Upload size={18} aria-hidden /> Importar respaldo
          </button>
          <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
        </div>
        {msg && (
          <p className="text-sm font-bold" role="status">
            {msg}
          </p>
        )}
        <p className="text-xs text-muted">La importación fusiona: por cada tarjeta se queda la versión repasada más recientemente. Las grabaciones de voz nunca se guardan en el servidor.</p>
      </Card>

      <div hidden={tab !== "datos"}>
        <SignOutButton redirectUrl="/">
          <button type="button" className="btn btn-ghost">
            Cerrar sesión
          </button>
        </SignOutButton>
      </div>

      <style>{`.input{height:3rem;width:100%;border-radius:.9rem;border:2px solid var(--line);background:var(--surface);padding:0 .9rem;font-weight:700;outline:none}.input:focus{border-color:var(--accent)}`}</style>
    </div>
  );
}

function Card({ title, tab, children }: { title: string; tab: SettingsTab; children: React.ReactNode }) {
  const current = useSettingsTab();
  return (
    <section className="card flex flex-col gap-4 p-5" hidden={current !== tab}>
      <h2 className="text-lg font-black">{title}</h2>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-muted">{label}</p>
      {children}
    </div>
  );
}

function Seg({ value, options, onChange }: { value: string; options: [string, string][]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map(([k, l]) => (
        <button key={k} type="button" role="radio" aria-checked={value === k} onClick={() => onChange(k)} className={`btn h-11 min-h-11 px-4 ${value === k ? "btn-primary" : "btn-ghost"}`}>
          {l}
        </button>
      ))}
    </div>
  );
}
