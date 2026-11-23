import Link from "next/link";
import { and, eq, gte } from "drizzle-orm";
import { Flame, Clock, Layers, Sparkles, Check, Snowflake, Trophy, Target, ClipboardCheck, ChevronRight } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { dueCount, lastDays, forecast, achievementTotals, itemStatus } from "@/lib/stats";
import { goalXp, levelFromXp, localDay, missionsFor, visibleStreak, addDays } from "@/lib/game";
import { greetingSay } from "@/lib/motivation";
import { HeroCoach } from "@/components/HeroCoach";
import { getScene, ROUTES } from "@/lib/content";
import { Bar, Ring } from "@/components/ui";
import { Gem } from "@/components/Nav";
import { StartButton } from "@/components/StartButton";
import { recommendMission, trackFor } from "@/lib/recommend";
import { seasonFor, seasonLabel, seasonRoute } from "@/lib/seasons";
import { settleWeekly } from "@/lib/rewards";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { RouteIcon } from "@/components/RouteIcon";

export const metadata = { title: "Hoy" };

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const SKILL: Record<string, string> = { listen: "Escuchar", read: "Leer", speak: "Hablar", write: "Escribir" };

export default async function Today() {
  const profile = await requireProfile();
  const s = settingsOf(profile);
  const mods = { week: true, load: true, goal: true, achievement: true, theme: true, challenges: true, ...s.hoy };
  const today = localDay(profile.tz);
  const [due, week, load, done, totals, status, weekly, frozenRows] = await Promise.all([
    dueCount(profile.userId),
    lastDays(profile, 7),
    forecast(profile, 7),
    db().select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId)),
    achievementTotals(profile.userId),
    itemStatus(profile.userId),
    settleWeekly(profile),
    db()
      .select({ day: schema.dailyStats.day })
      .from(schema.dailyStats)
      .where(and(eq(schema.dailyStats.userId, profile.userId), eq(schema.dailyStats.frozen, 1), gte(schema.dailyStats.day, addDays(today, -6)))),
  ]);
  const frozen = new Set(frozenRows.map((r) => r.day));
  const todayRow = week[week.length - 1];
  const goal = goalXp(profile.goalMinutes);
  const streak = visibleStreak(profile.streak, profile.lastGoalDay, today);
  const doneIds = new Set(done.map((d) => d.id));
  const season = seasonFor(today, s.season);
  const rec = recommendMission({ level: profile.level, topics: profile.topics, done: doneIds, season, seasonContent: s.season?.content !== false, due });
  const scene = getScene(rec?.route.scene);
  const hour = Number(new Intl.DateTimeFormat("en", { hour: "numeric", hour12: false, timeZone: profile.tz }).format(new Date()));
  const seed = Number(today.replace(/-/g, "")) + todayRow.xp;
  const first = profile.name.split(" ")[0] || undefined;
  const say = greetingSay({ name: first, hour, streak, todayXp: todayRow.xp, goal, due, doneYesterday: profile.lastGoalDay === addDays(today, -1), sessionsToday: todayRow.reviews, hasStarted: profile.xp > 0 }, seed);
  const hello = hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
  const missions = missionsFor(today, profile.goalMinutes);
  const lvl = levelFromXp(profile.xp);
  const learned = [...status.values()].filter((v) => v !== "suspended").length;
  const mastered = [...status.values()].filter((v) => v === "mastered").length;
  const achStats = { bestStreak: profile.bestStreak, reviews: totals.reviews, learned, mastered, roleplays: totals.roleplays, lessons: totals.lessons, recordings: totals.recordings, level: lvl.level, placement: s.placement ? 1 : 0 };
  const nextAch = ACHIEVEMENTS.filter((a) => a.value(achStats) < a.goal).sort((a, b) => b.value(achStats) / b.goal - a.value(achStats) / a.goal)[0];
  const themed = ROUTES.find((r) => r.id === (s.season?.content !== false ? seasonRoute(season) : null) && r.id !== rec?.route.id) ?? ROUTES.find((r) => r.id !== rec?.route.id && r.areas.some((a) => profile.topics.includes(a)));
  const hasWeek = week.some((d) => d.reviews > 0);
  const minutes = rec ? Math.max(profile.goalMinutes, rec.track.minutes) : profile.goalMinutes;

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold text-muted">{hello}</p>
          <h1 className="font-display text-4xl font-extrabold leading-none sm:text-5xl">{first ?? "Hola"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/progreso" className="flex h-11 items-center gap-1.5 rounded-full bg-fire-soft px-4 font-black text-fire" aria-label={`${streak} ${streak === 1 ? "día" : "días"} de racha`}>
            <Flame size={20} fill="currentColor" aria-hidden className={streak > 0 ? "flame" : ""} /> {streak}
          </Link>
          <Link href="/tienda" className="flex h-11 items-center gap-1.5 rounded-full bg-accent-soft px-4 font-black text-accent" aria-label={`${profile.gems} gemas. Abrir tienda`}>
            <Gem size={18} /> {profile.gems}
          </Link>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12 lg:gap-8">
        {/* Protagonista: la misión de hoy */}
        <section aria-labelledby="mision" className="hero-card p-5 sm:p-7 lg:col-span-8 3xl:col-span-9">
          <div className="grid items-center gap-5 md:grid-cols-[1fr_auto]">
            <div className="flex min-w-0 flex-col gap-4">
              <HeroCoach say={say} seed={seed} compact />
              <div>
                <p className="flex items-center gap-2 text-sm font-black text-brand-ink">
                  {rec ? <RouteIcon name={rec.route.icon} size={17} /> : <Sparkles size={17} aria-hidden />}
                  {rec ? `${rec.route.title_es} · ${rec.track.band}` : due > 0 ? "Repaso y expresiones nuevas" : "Tu sesión"}
                </p>
                <h2 id="mision" className={`mt-1 max-w-[30ch] font-display font-extrabold leading-[1.1] ${(rec?.track.objective_es.length ?? 0) > 70 ? "text-2xl sm:text-[1.9rem]" : "text-[1.9rem] sm:text-4xl"}`}>
                  {rec ? rec.track.objective_es : "Repasa lo que toca y aprende algo nuevo"}
                </h2>
                {rec && <p className="mt-2 max-w-prose text-muted">{rec.reason}</p>}
              </div>
              <ul className="flex flex-wrap gap-2 text-sm font-bold">
                <li className="flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1.5">
                  <Clock size={15} aria-hidden /> {minutes} min
                </li>
                {rec?.track.skills.map((k) => (
                  <li key={k} className="rounded-full bg-surface/80 px-3 py-1.5">
                    {SKILL[k] ?? k}
                  </li>
                ))}
                {due > 0 && (
                  <li className="flex items-center gap-1.5 rounded-full bg-surface/80 px-3 py-1.5">
                    <Layers size={15} aria-hidden /> {due} {due === 1 ? "repaso" : "repasos"}
                  </li>
                )}
              </ul>
              <StartButton href={rec ? `/sesion?mision=${rec.track.id}&min=${minutes}` : `/sesion?min=${profile.goalMinutes}`} />
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-extrabold">
                {due > 0 && (
                  <Link href="/repaso" className="text-brand-ink underline-offset-4 hover:underline">
                    Solo repasar ({due})
                  </Link>
                )}
                <Link href={`/sesion?min=${profile.goalMinutes}`} className="text-brand-ink underline-offset-4 hover:underline">
                  Sesión libre de {profile.goalMinutes} min
                </Link>
                <Link href="/rutas" className="text-brand-ink underline-offset-4 hover:underline">
                  Elegir otra misión
                </Link>
              </div>
            </div>
            {scene && (
              // eslint-disable-next-line @next/next/no-img-element -- SVG local pequeño, sin optimización necesaria
              <img src={scene.file} alt={scene.alt_es} width={400} height={240} loading="eager" className="hidden w-[min(22rem,32vw)] rounded-[var(--r-lg)] md:block" />
            )}
          </div>
        </section>

        {/* Progreso del día */}
        <aside className="flex flex-col gap-4 lg:col-span-4 3xl:col-span-3">
          <section className="module flex items-center gap-4 p-5">
            <Ring value={todayRow.xp} max={goal} size={104} stroke={12} color="var(--fire)">
              <div>
                <p className="text-xl font-black">{todayRow.xp}</p>
                <p className="text-[11px] font-bold text-muted">de {goal} XP</p>
              </div>
            </Ring>
            <div>
              <h2 className="font-black">{todayRow.xp >= goal ? "Meta cumplida" : "Meta de hoy"}</h2>
              <p className="text-sm text-muted">{todayRow.xp >= goal ? "Tu racha de hoy está a salvo." : todayRow.xp === 0 ? `${profile.goalMinutes} minutos bastan.` : `Te faltan ${goal - todayRow.xp} XP.`}</p>
              {profile.freezes > 0 && (
                <p className="mt-1 flex items-center gap-1 text-xs font-bold text-muted">
                  <Snowflake size={13} aria-hidden /> {profile.freezes} {profile.freezes === 1 ? "protector" : "protectores"} de racha
                </p>
              )}
            </div>
          </section>
          {mods.challenges && (
            <section className="module p-5">
              <h2 className="mb-3 flex items-center gap-2 font-black">
                <Target size={18} className="text-accent" aria-hidden /> Retos de hoy
              </h2>
              <ul className="flex flex-col gap-3">
                {missions.map((m) => {
                  const v = m.value(todayRow);
                  const ok = todayRow.missions.includes(m.id) || v >= m.target;
                  return (
                    <li key={m.id} className="flex items-center gap-3">
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${ok ? "bump bg-good text-white" : "bg-surface-2 text-muted"}`}>{ok ? <Check size={18} strokeWidth={3} aria-hidden /> : <Sparkles size={16} aria-hidden />}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold">{m.label}</p>
                        <Bar value={v} max={m.target} color={ok ? "var(--good)" : "var(--accent)"} className="mt-1 h-1.5" label={m.label} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 flex items-center gap-1 text-xs font-bold text-muted">
                <Gem size={13} /> +5 por reto · +10 por la meta
              </p>
            </section>
          )}
        </aside>
      </div>

      {!s.placement && (
        <Link href="/practicar/test" className="module flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <ClipboardCheck size={22} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-black">Mide tu nivel cuando quieras</span>
            <span className="block text-sm text-muted">Test opcional de ≈30 min. Hoy partes de {profile.level} (lo elegiste tú).</span>
          </span>
          <ChevronRight size={20} className="text-muted" aria-hidden />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
        {mods.week && (
          <section className="module p-5">
            <h2 className="mb-4 font-black">Esta semana</h2>
            <ol className="flex justify-between">
              {week.map((d) => {
                const ok = d.xp >= goal;
                const fz = frozen.has(d.day);
                const wd = new Date(d.day + "T12:00:00Z").getUTCDay();
                return (
                  <li key={d.day} className="flex flex-col items-center gap-1">
                    <span className={`grid h-9 w-9 place-items-center rounded-full text-sm font-black ${ok ? "bg-fire text-white" : fz ? "bg-[#dcecfa] text-[#0b6bb5]" : d.xp > 0 ? "bg-fire-soft text-fire" : "bg-surface-2 text-muted"} ${d.day === today ? "ring-2 ring-fire ring-offset-2 ring-offset-surface" : ""}`}>
                      {ok ? <Flame size={16} fill="currentColor" aria-hidden /> : fz ? <Snowflake size={15} aria-hidden /> : DAYS[wd]}
                    </span>
                    <span className="sr-only">
                      {d.day}: {fz ? "protegido con protector de racha (no estudiado)" : `${d.xp} XP`}
                    </span>
                  </li>
                );
              })}
            </ol>
            <p className="mt-4 text-sm text-muted">{hasWeek ? `Mejor racha: ${profile.bestStreak} ${profile.bestStreak === 1 ? "día" : "días"}.` : "Aún no hay actividad esta semana: tu primera sesión la estrena."}</p>
          </section>
        )}

        {mods.load && (
          <Link href="/repaso" className="module p-5">
            <h2 className="mb-3 font-black">Próximos repasos</h2>
            {load.some((d) => d.n > 0) ? (
              <div className="flex h-20 items-end gap-2" role="img" aria-label={`Repasos por día: ${load.map((d) => d.n).join(", ")}`}>
                {load.map((d, i) => {
                  const max = Math.max(1, ...load.map((x) => x.n));
                  return (
                    <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-muted">{d.n || ""}</span>
                      <div className="w-full rounded-t-md bg-accent" style={{ height: `${Math.max(3, (d.n / max) * 52)}px`, opacity: i === 0 ? 1 : 0.5 }} />
                      <span className="text-[10px] font-bold text-muted">{i === 0 ? "hoy" : DAYS[new Date(d.day + "T12:00:00Z").getUTCDay()]}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted">Sin repasos programados todavía. Aparecen cuando aprendes tus primeras expresiones.</p>
            )}
          </Link>
        )}

        {mods.challenges && (
          <section className="module p-5">
            <h2 className="mb-3 font-black">Retos de la semana</h2>
            <ul className="flex flex-col gap-3">
              {weekly.map((w) => (
                <li key={w.id}>
                  <p className="flex justify-between text-sm font-extrabold">
                    <span>{w.label}</span>
                    <span className="text-muted">{w.done ? <Check size={16} className="text-good" aria-label="cumplido" /> : `${Math.min(w.value, w.target)}/${w.target}`}</span>
                  </p>
                  <Bar value={w.value} max={w.target} color={w.done ? "var(--good)" : "var(--accent)"} className="mt-1 h-1.5" label={w.label} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {mods.goal && (
          <section className="module p-5">
            <h2 className="mb-1 font-black">Tu objetivo</h2>
            <p className="text-sm text-muted">{profile.goalMinutes} min al día · {profile.dailyNew} expresiones nuevas como máximo.</p>
            <p className="mt-3 text-sm font-bold">
              {learned} en estudio · {mastered} consolidadas
            </p>
            <Link href="/ajustes" className="mt-3 inline-block text-sm font-extrabold text-brand-ink underline-offset-4 hover:underline">
              Ajustar objetivo
            </Link>
          </section>
        )}

        {mods.achievement && nextAch && (
          <Link href="/progreso#logros" className="module flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-fire-soft text-fire">
              <Trophy size={22} aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-muted">Próximo logro</span>
              <span className="block font-black">{nextAch.title}</span>
              <Bar value={nextAch.value(achStats)} max={nextAch.goal} color="var(--fire)" className="mt-1.5 h-1.5" label={nextAch.desc} />
              <span className="mt-1 block text-xs text-muted">
                {nextAch.desc} · {Math.min(nextAch.value(achStats), nextAch.goal)}/{nextAch.goal}
              </span>
            </span>
          </Link>
        )}

        {mods.theme && themed && (
          <Link href={`/rutas/${themed.id}`} className="module flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
              <RouteIcon name={themed.icon} size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-muted">{themed.id === seasonRoute(season) ? `Para esta temporada (${seasonLabel(season).toLowerCase()})` : "También para ti"}</span>
              <span className="block font-black">{themed.title_es}</span>
              <span className="block text-sm text-muted">{trackFor(themed, profile.level).objective_es}</span>
            </span>
          </Link>
        )}
      </div>
    </div>
  );
}
