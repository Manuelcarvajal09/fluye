import Link from "next/link";
import { eq } from "drizzle-orm";
import { Star, Flame, BookOpen, Trophy, Mic, MessagesSquare, Target, Crown, Info, Lightbulb, Users } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { achievementTotals, forecast, itemStatus, modeBreakdown } from "@/lib/stats";
import { ACHIEVEMENTS, unlockedCount, type AchStats } from "@/lib/achievements";
import { SOUNDS } from "@/lib/content";
import { addDays, levelFromXp, localDay } from "@/lib/game";
import { AREA_LABEL } from "@/lib/areas";
import { ERROR_LABEL, type ErrorCategory } from "@/lib/grading";
import { activeTimeStats, areaProgress, consistency, errorStats, friendChallenge, observedRetention, oralStats, PERIODS, periodStart, sessionStats, SMALL_SAMPLE, vocabStates, type Period } from "@/lib/insights";
import { Bar } from "@/components/ui";
import { SectionHeader } from "@/components/ux/SectionHeader";

export const metadata = { title: "Progreso" };

const MODE_ES: Record<string, string> = { recog: "Reconocer", prod: "Producir", listen: "Escuchar", speak: "Hablar" };
const SECTION_ES: Record<string, string> = { grammar: "Gramática", vocab: "Vocabulario", reading: "Lectura", listening: "Comprensión auditiva" };
const fmtMin = (s: number) => (s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${Math.floor(s / 3600)} h ${Math.round((s % 3600) / 60)} min`);
const ICONS = { star: Star, flame: Flame, book: BookOpen, trophy: Trophy, mic: Mic, chat: MessagesSquare, target: Target, crown: Crown } as const;

export default async function Progress({ searchParams }: PageProps<"/progreso">) {
  const profile = await requireProfile();
  const s = settingsOf(profile);
  const p = (["7", "30", "90", "all"].includes(String((await searchParams).p)) ? (await searchParams).p : "30") as Period;
  const from = periodStart(profile, p);
  const fromDate = from ? new Date(from + "T00:00:00Z") : null;
  const today = localDay(profile.tz);
  const [act, sess, ret, errs, vocab, areas, oral, cons, load, modes, totals, status, sounds, friends] = await Promise.all([
    activeTimeStats(profile, from),
    sessionStats(profile.userId, fromDate),
    observedRetention(profile.userId, fromDate),
    errorStats(profile.userId, fromDate),
    vocabStates(profile, s.known ?? []),
    areaProgress(profile.userId),
    oralStats(profile.userId, fromDate),
    consistency(profile, from),
    forecast(profile, 14),
    modeBreakdown(profile.userId),
    achievementTotals(profile.userId),
    itemStatus(profile.userId),
    db().select().from(schema.soundProgress).where(eq(schema.soundProgress.userId, profile.userId)),
    s.social ? friendChallenge(profile) : Promise.resolve(null),
  ]);

  // Días del periodo para el gráfico (máx. 90 barras; "Todo" muestra los últimos 90).
  const span = p === "all" ? 90 : Number(p);
  const chartDays = Array.from({ length: span }, (_, i) => addDays(today, i - span + 1));
  const knownSince = act.since;
  const daysInPeriod = from ? span : cons.first ? Math.round((Date.parse(today) - Date.parse(cons.first)) / 86_400_000) + 1 : 0;
  const maxSec = Math.max(60, ...chartDays.map((d) => act.byDay.get(d) ?? 0));
  const lvl = levelFromXp(profile.xp);
  const mastered = [...status.values()].filter((x) => x === "mastered").length;
  const ach: AchStats = { ...totals, bestStreak: profile.bestStreak, learned: status.size, mastered, level: lvl.level, placement: s.placement ? 1 : 0 };
  const modeRows = ["recog", "prod", "listen", "speak"].map((m) => {
    const rows = modes.filter((r) => r.mode === m);
    const n = (st: number) => rows.filter((r) => r.state === st).reduce((a, r) => a + r.n, 0);
    return { m, fresh: n(0), learning: n(1) + n(3), review: n(2), total: rows.reduce((a, r) => a + r.n, 0) };
  });
  const perc = sounds.filter((x) => x.perceptionTotal > 0).map((x) => ({ id: x.soundId, acc: x.perceptionCorrect / x.perceptionTotal, n: x.perceptionTotal }));
  const recordings = sounds.reduce((a, x) => a + x.recordings, 0);
  const pl = s.placement;
  const next7 = load.slice(0, 7).reduce((a, d) => a + d.n, 0);

  // Resúmenes accionables (solo con datos que existen).
  const tips: string[] = [];
  if (ret.rate !== null && ret.n >= SMALL_SAMPLE && ret.rate < (s.retention ?? 0.9) - 0.05) tips.push(`Tu retención observada (${Math.round(ret.rate * 100)} %) está por debajo de tu objetivo. Baja un poco las expresiones nuevas por día en Ajustes.`);
  if (errs[0] && errs[0].n >= 3) tips.push(`Lo que más se te complica: ${ERROR_LABEL[errs[0].category as ErrorCategory]?.toLowerCase() ?? errs[0].category}. Una micro-práctica en «Corrige la frase» ayuda.`);
  if (next7 > 150) tips.push(`Vienen ${next7} repasos en 7 días: prioriza repasar antes de aprender más.`);
  if (!oral && sess.started > 2) tips.push("Aún no practicas en voz alta en este periodo: una misión incluye un fragmento oral.");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <SectionHeader art="progreso" title="Progreso" />
        <nav aria-label="Periodo" className="seg self-start">
          {PERIODS.map((x) => (
            <Link key={x.id} href={`/progreso?p=${x.id}`} aria-current={p === x.id ? "page" : undefined} className="grid place-items-center">
              {x.label}
            </Link>
          ))}
        </nav>
      </header>

      {tips.length > 0 && (
        <section className="hero-card flex flex-col gap-2 p-5" aria-label="Sugerencias">
          {tips.map((t) => (
            <p key={t} className="flex items-start gap-2 font-bold">
              <Lightbulb size={18} className="mt-0.5 shrink-0 text-fire" aria-hidden /> {t}
            </p>
          ))}
        </section>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Resumen del periodo">
        <Kpi label="Tiempo activo" value={knownSince ? fmtMin(act.total) : "Sin datos"} hint={knownSince ? `Medido desde ${knownSince}; antes, desconocido` : "Se empieza a medir desde esta versión"} />
        <Kpi label="Sesiones" value={sess.started} hint={sess.started ? `${sess.finished} terminadas · ${sess.missions} misiones` : "Ninguna en este periodo"} />
        <Kpi label="Constancia" value={daysInPeriod ? `${cons.active}/${daysInPeriod} días` : "—"} hint={`${cons.goalDays} con meta${cons.frozen ? ` · ${cons.frozen} protegidos` : ""}`} />
        <Kpi
          label="Retención observada"
          value={ret.rate === null ? "—" : `${Math.round(ret.rate * 100)} %`}
          hint={ret.n ? `${ret.n} primeros intentos elegibles${ret.n < SMALL_SAMPLE ? " · pocos datos" : ""}` : "Sin repasos elegibles aún"}
        />
      </section>

      <section className="module p-5" aria-labelledby="tiempo">
        <h2 id="tiempo" className="mb-1 font-black">
          Tiempo activo por día
        </h2>
        <p className="mb-3 text-xs text-muted">Interacción, audio y grabación; se pausa si la pestaña está oculta o sin actividad un minuto. Varias pestañas no suman doble.</p>
        <div className="flex h-28 items-end gap-[2px]" role="img" aria-label={`Minutos activos en los últimos ${span} días`}>
          {chartDays.map((d) => {
            const v = act.byDay.get(d) ?? 0;
            const unknown = !knownSince || d < knownSince;
            return <div key={d} title={`${d}: ${unknown ? "sin datos" : fmtMin(v)}`} className="flex-1 rounded-t-sm" style={{ height: unknown ? "3px" : `${Math.max(3, (v / maxSec) * 100)}%`, background: unknown ? "var(--line)" : "var(--brand)", opacity: unknown ? 0.6 : 1 }} />;
          })}
        </div>
        <table className="sr-only">
          <caption>Minutos activos por día</caption>
          <tbody>
            {chartDays.map((d) => (
              <tr key={d}>
                <th>{d}</th>
                <td>{!knownSince || d < knownSince ? "sin datos" : fmtMin(act.byDay.get(d) ?? 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="module p-5" aria-labelledby="vocab">
          <h2 id="vocab" className="mb-1 font-black">
            Vocabulario por estado
          </h2>
          <p className="mb-4 text-xs text-muted">Cada palabra o expresión cuenta una vez, en su estado más alto. «Declarada» = dijiste que ya la conocías (no es dominio).</p>
          {(["words", "expressions"] as const).map((k) => {
            const v = vocab[k];
            const total = v.explored + v.declared + v.recognized + v.produced + v.consolidated;
            return (
              <div key={k} className="mb-4">
                <p className="mb-2 text-sm font-black">
                  {k === "words" ? "Palabras" : "Expresiones (phrasal verbs, frases, idioms…)"} · {total}
                </p>
                <ul className="grid grid-cols-5 gap-2 text-center">
                  {(
                    [
                      ["explored", "Explorada"],
                      ["declared", "Declarada"],
                      ["recognized", "Reconocida"],
                      ["produced", "Producida"],
                      ["consolidated", "Consolidada"],
                    ] as const
                  ).map(([key, label]) => (
                    <li key={key} className="rounded-[var(--r-sm)] bg-surface-2 p-2">
                      <p className="text-xl font-black">{v[key]}</p>
                      <p className="text-xs font-bold leading-tight text-muted">{label}</p>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </section>

        <section className="module p-5" aria-labelledby="cefr">
          <h2 id="cefr" className="mb-1 font-black">
            Nivel por habilidad (orientativo)
          </h2>
          <p className="mb-4 text-xs text-muted">Solo con evidencia: el test de nivel. No se calcula con XP ni con cuántas palabras sabes. No es una certificación.</p>
          {pl ? (
            <>
              <p className="mb-3 text-sm">
                Estimación global: <b>{pl.level}</b> · test del {new Date(pl.date).toLocaleDateString("es-MX")} ({pl.score}/{pl.total})
              </p>
              <ul className="flex flex-col gap-3">
                {Object.entries(pl.bySection).map(([k, v]) => (
                  <li key={k}>
                    <p className="mb-1 flex justify-between text-sm font-bold">
                      <span>{SECTION_ES[k] ?? k}</span>
                      <span className="text-muted">
                        {v.right}/{v.total}
                        {v.total < 10 ? " · pocos datos" : ""}
                      </span>
                    </p>
                    <Bar value={v.right} max={v.total} color="var(--accent)" label={SECTION_ES[k] ?? k} />
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-muted">Sin evidencia suficiente. Haz el test de nivel para tener una estimación por habilidad.</p>
          )}
          <p className="mt-4 text-sm">
            <b>Expresión oral y escrita:</b> <span className="text-muted">Sin evidencia suficiente (la app no las evalúa de forma fiable).</span>
          </p>
          <Link href="/practicar/test" className="btn btn-ghost mt-4 h-11 min-h-11">
            {pl ? "Repetir el test" : "Hacer el test"}
          </Link>
        </section>

        <section className="module p-5" aria-labelledby="errores">
          <h2 id="errores" className="mb-3 font-black">
            Errores frecuentes
          </h2>
          {errs.length ? (
            <ul className="flex flex-col gap-3">
              {errs.slice(0, 6).map((e) => (
                <li key={e.category}>
                  <p className="mb-1 flex justify-between text-sm font-bold">
                    <span>{ERROR_LABEL[e.category as ErrorCategory] ?? e.category}</span>
                    <span className="text-muted">{e.n}</span>
                  </p>
                  <Bar value={e.n} max={errs[0].n} color="var(--fire)" label={ERROR_LABEL[e.category as ErrorCategory] ?? e.category} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Sin errores registrados en este periodo. Se registran desde esta versión, por categoría (artículos, preposiciones, orden, comprensión…).</p>
          )}
        </section>

        <section className="module p-5" aria-labelledby="modos">
          <h2 id="modos" className="mb-3 font-black">
            Por modalidad
          </h2>
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="pb-2 font-bold">Modo</th>
                <th className="pb-2 font-bold">Nuevas</th>
                <th className="pb-2 font-bold">Aprendiendo</th>
                <th className="pb-2 font-bold">En repaso</th>
              </tr>
            </thead>
            <tbody>
              {modeRows.map((r) => (
                <tr key={r.m} className="border-t border-line">
                  <td className="py-2 font-bold">{MODE_ES[r.m]}</td>
                  <td>{r.fresh}</td>
                  <td>{r.learning}</td>
                  <td>{r.review}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="module p-5" aria-labelledby="oral">
          <h2 id="oral" className="mb-3 font-black">
            Práctica oral
          </h2>
          <p className="text-sm">
            <b>{oral}</b> ejercicios hablados en el periodo · <b>{recordings}</b> grabaciones de sonidos en total.
          </p>
          <p className="mt-1 text-xs text-muted">Las grabaciones nunca salen de tu dispositivo. Lo que entiende el reconocedor es orientativo y no afecta tu progreso.</p>
          {perc.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3">
              {perc.slice(0, 6).map((x) => {
                const snd = SOUNDS.find((y) => y.id === x.id);
                return (
                  <li key={x.id}>
                    <p className="mb-1 flex justify-between text-sm font-bold">
                      <span>
                        Oído /{snd?.symbol}/ {snd?.name_es}
                      </span>
                      <span className="text-muted">
                        {Math.round(x.acc * 100)} % de {x.n}
                        {x.n < 20 ? " · pocos datos" : ""}
                      </span>
                    </p>
                    <Bar value={x.acc} max={1} color={x.acc >= 0.85 ? "var(--good)" : "var(--fire)"} label={snd?.name_es} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="module p-5" aria-labelledby="carga">
          <h2 id="carga" className="mb-1 font-black">
            Carga de repasos (14 días)
          </h2>
          <p className="mb-3 text-xs text-muted">Estimación de FSRS: puede cambiar según cómo respondas.</p>
          <div className="flex h-32 items-end gap-1.5" role="img" aria-label={`Repasos previstos: ${load.map((d) => d.n).join(", ")}`}>
            {load.map((d, i) => {
              const max = Math.max(1, ...load.map((x) => x.n));
              return (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-muted">{d.n || ""}</span>
                  <div className="w-full rounded-t-md bg-accent" style={{ height: `${Math.max(3, (d.n / max) * 90)}px`, opacity: i === 0 ? 1 : 0.55 }} />
                  <span className="text-[10px] text-muted">{d.day.slice(8)}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="module p-5" aria-labelledby="areas">
          <h2 id="areas" className="mb-3 font-black">
            Por área
          </h2>
          {areas.length ? (
            <ul className="flex flex-col gap-2">
              {areas.slice(0, 8).map(([a, n]) => (
                <li key={a} className="flex items-center gap-3 text-sm">
                  <span className="w-36 shrink-0 truncate font-bold">{AREA_LABEL[a] ?? a}</span>
                  <Bar value={n} max={areas[0][1]} color="var(--brand)" label={AREA_LABEL[a] ?? a} />
                  <span className="w-8 text-right text-muted">{n}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Aún no hay expresiones en estudio.</p>
          )}
        </section>

        {friends && (
          <section className="module p-5" aria-labelledby="amigos">
            <h2 id="amigos" className="mb-1 flex items-center gap-2 font-black">
              <Users size={18} aria-hidden /> Reto de constancia (privado)
            </h2>
            <p className="mb-3 text-xs text-muted">Días de esta semana con la meta de cada quien. Justo aunque cada persona elija distintos minutos.</p>
            <ul className="flex flex-col gap-2">
              {friends.map((f) => (
                <li key={f.name + f.days} className={`flex items-center gap-3 text-sm ${f.me ? "font-black" : ""}`}>
                  <span className="w-28 truncate">{f.me ? "Tú" : f.name}</span>
                  <Bar value={f.days} max={f.of} color="var(--accent)" label={f.name} />
                  <span className="w-12 text-right text-muted">
                    {f.days}/{f.of}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <section className="module p-5" id="logros" aria-labelledby="logros-t">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 id="logros-t" className="font-black">
            Logros
          </h2>
          <p className="text-sm font-bold text-muted">
            {unlockedCount(ach)} de {ACHIEVEMENTS.length}
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4">
          {ACHIEVEMENTS.map((a) => {
            const v = a.value(ach);
            const ok = v >= a.goal;
            const Icon = ICONS[a.icon];
            return (
              <li key={a.id} className={`relative flex items-center gap-3 overflow-hidden rounded-[var(--r-md)] border p-3 ${ok ? "border-fire/40 bg-fire-soft" : "border-line bg-surface"}`}>
                {ok && <span aria-hidden className="shimmer pointer-events-none absolute inset-0" />}
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${ok ? "bg-fire text-white" : "bg-surface-2 text-muted"}`}>
                  <Icon size={22} aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-black">{a.title}</p>
                  <p className="text-xs text-muted">{a.desc}</p>
                  {!ok ? <Bar value={v} max={a.goal} color="var(--accent)" className="mt-1.5 h-1.5" label={a.title} /> : <p className="text-xs font-black text-fire">Conseguido</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="flex items-start gap-2 text-xs text-muted">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden /> El rango y el nivel de juego miden práctica, no tu nivel de inglés. Las estimaciones de FSRS y del test son orientativas.
      </p>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="module p-4">
      <p className="text-2xl font-black sm:text-3xl">{value}</p>
      <p className="text-sm font-bold text-muted">{label}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
