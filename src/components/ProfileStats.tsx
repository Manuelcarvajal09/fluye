"use client";
import { useEffect, useMemo, useState } from "react";
import { IcoBolt, IcoCards, IcoClock, IcoFlame, IcoTarget } from "./Icons";

type Day = { day: string; xp: number; reviews: number; correct: number; seconds: number };
type LevelBar = { level: string; total: number; studied: number; mastered: number };
const PERIODS = [
  { id: 7, label: "7 días" },
  { id: 30, label: "30 días" },
  { id: 90, label: "90 días" },
  { id: 0, label: "Todo" },
] as const;

const reduced = () => typeof window !== "undefined" && (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduced");

/** Número que sube hasta su valor (sin animación con movimiento reducido). */
function Count({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0;
    if (reduced()) {
      raf = requestAnimationFrame(() => setN(to));
      return () => cancelAnimationFrame(raf);
    }
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 700);
      setN(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return (
    <>
      {n.toLocaleString("es-MX")}
      {suffix}
    </>
  );
}

/** Barra del idioma: cuánto de cada nivel ya estudiaste (y cuánto ya está consolidado). */
export function LanguageBar({ levels }: { levels: LevelBar[] }) {
  const pct = (l: LevelBar) => (l.total ? (l.studied + l.mastered) / (2 * l.total) : 0);
  const overall = levels.reduce((a, l) => a + pct(l), 0) / Math.max(1, levels.length);
  return (
    <section className="module flex flex-col gap-3 p-5" aria-labelledby="lang-title">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="lang-title" className="font-display text-2xl font-black">
            Tu recorrido en inglés
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">Avanza con cada expresión que estudias y consolidas en cada nivel. Es una guía, no una certificación.</p>
        </div>
        <p className="font-display text-3xl font-black text-brand-ink">
          <Count to={Math.round(overall * 100)} suffix="%" />
        </p>
      </div>
      <div className="flex gap-1.5" role="img" aria-label={`Recorrido total ${Math.round(overall * 100)} %`}>
        {levels.map((l, i) => (
          <div key={l.level} className="flex flex-1 flex-col gap-1">
            <div className="lang-seg">
              <span className="lang-studied" style={{ width: `${l.total ? (l.studied / l.total) * 100 : 0}%`, animationDelay: `${i * 120}ms` }} />
              <span className="lang-mastered" style={{ width: `${l.total ? (l.mastered / l.total) * 100 : 0}%`, animationDelay: `${i * 120 + 200}ms` }} />
            </div>
            <p className="text-center text-xs font-black">{l.level}</p>
            <p className="text-center text-xs font-bold text-muted">
              {l.studied}/{l.total}
            </p>
          </div>
        ))}
      </div>
      <p className="flex flex-wrap gap-3 text-xs font-bold text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--brand)] opacity-45" /> Estudiadas
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--brand)]" /> Consolidadas
        </span>
      </p>
    </section>
  );
}

/** Estadísticas por periodo e historial de estudio (calendario de las últimas 12 semanas). */
export function StudyStats({ days, today, streak, bestStreak, totalXp }: { days: Day[]; today: string; streak: number; bestStreak: number; totalXp: number }) {
  const [period, setPeriod] = useState<number>(7);
  const from = useMemo(() => {
    if (!period) return "";
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() - (period - 1));
    return d.toISOString().slice(0, 10);
  }, [period, today]);
  const sel = days.filter((d) => d.day >= from);
  const sum = (k: keyof Day) => sel.reduce((a, d) => a + (d[k] as number), 0);
  const active = sel.filter((d) => d.reviews > 0 || d.xp > 0).length;
  const acc = sum("reviews") ? Math.round((sum("correct") / sum("reviews")) * 100) : 0;
  const map = new Map(days.map((d) => [d.day, d]));
  const weeks = 12;
  const end = new Date(`${today}T12:00:00`);
  const startCal = new Date(end);
  startCal.setDate(end.getDate() - ((end.getDay() + 6) % 7) - (weeks - 1) * 7);
  const cells = Array.from({ length: weeks * 7 }, (_, i) => {
    const d = new Date(startCal);
    d.setDate(startCal.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { key, xp: map.get(key)?.xp ?? 0, future: key > today };
  });
  const maxXp = Math.max(1, ...cells.map((c) => c.xp));
  const bars = sel.slice(-30);
  const maxBar = Math.max(1, ...bars.map((d) => d.xp));
  const stats = [
    { label: "XP", value: sum("xp"), icon: <IcoBolt size={26} />, cls: "text-[var(--gold)]" },
    { label: "Días con estudio", value: active, icon: <IcoFlame size={26} />, cls: "text-fire" },
    { label: "Repasos", value: sum("reviews"), icon: <IcoCards size={26} />, cls: "text-accent" },
    { label: "Precisión", value: acc, suffix: "%", icon: <IcoTarget size={26} />, cls: "text-good" },
    { label: "Minutos", value: Math.round(sum("seconds") / 60), icon: <IcoClock size={26} />, cls: "text-text" },
  ];
  return (
    <section className="module flex flex-col gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-black">Tu estudio</h2>
        <div className="seg" role="tablist" aria-label="Periodo">
          {PERIODS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={period === p.id} onClick={() => setPeriod(p.id)}>
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {stats.map((s) => (
          <div key={`${s.label}-${period}`} className="fade-up flex flex-col items-center gap-0.5 rounded-[var(--r-md)] bg-surface-2 p-3 text-center">
            <span className={s.cls}>{s.icon}</span>
            <span className={`font-display text-2xl font-black ${s.cls}`}>
              <Count to={s.value} suffix={s.suffix} />
            </span>
            <span className="text-xs font-bold text-muted">{s.label}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-muted">XP por día</p>
        <div className="flex h-28 items-end gap-[3px]" role="img" aria-label="XP por día en el periodo elegido">
          {bars.length < 4 && <span className="self-center text-xs text-muted">Con más días de estudio aquí verás tu evolución.</span>}
          {bars.map((d, i) => (
            <span key={d.day} className="day-bar max-w-6 flex-1 rounded-t-md bg-[var(--brand)]" title={`${d.day}: ${d.xp} XP`} style={{ height: `${Math.max(3, (d.xp / maxBar) * 100)}%`, opacity: d.xp ? 1 : 0.18, animationDelay: `${i * 18}ms` }} />
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-bold text-muted">
          Historial · racha {streak} {streak === 1 ? "día" : "días"} · mejor {bestStreak} · {totalXp.toLocaleString("es-MX")} XP en total
        </p>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1" role="img" aria-label="Calendario de estudio de las últimas 12 semanas">
          {cells.map((c) => (
            <span key={c.key} title={`${c.key}: ${c.xp} XP`} className="h-3.5 w-3.5 rounded-[4px]" style={{ background: c.future ? "transparent" : c.xp ? `color-mix(in oklab, var(--brand) ${25 + Math.round((c.xp / maxXp) * 75)}%, var(--surface-2))` : "var(--surface-2)" }} />
          ))}
        </div>
      </div>
    </section>
  );
}

/** Movimiento reducido: además del ajuste del sistema, se puede elegir aquí. */
export function MotionToggle({ initial }: { initial: "auto" | "reduced" }) {
  const [v, setV] = useState(initial);
  const set = (next: "auto" | "reduced") => {
    setV(next);
    if (next === "reduced") document.documentElement.dataset.motion = "reduced";
    else delete document.documentElement.dataset.motion;
    try {
      localStorage.setItem("motion", next);
    } catch {}
    void fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: { motion: next } }) }).catch(() => {});
  };
  return (
    <label className="module flex items-center justify-between gap-3 p-4">
      <span>
        <span className="block font-black">Reducir movimiento</span>
        <span className="block text-sm text-muted">Quita saltos, destellos y animaciones de las mascotas, cofres y regalos.</span>
      </span>
      <input type="checkbox" className="h-6 w-6 accent-[var(--brand)]" checked={v === "reduced"} onChange={(e) => set(e.target.checked ? "reduced" : "auto")} />
    </label>
  );
}
