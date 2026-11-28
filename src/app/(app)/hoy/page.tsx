import Link from "next/link";
import { Suspense } from "react";
import { and, eq, gte } from "drizzle-orm";
import { Sparkles, Check, ChevronRight, MapIcon } from "lucide-react";
import { mapOf } from "@/lib/map";
import { pct } from "@/lib/map-rules";
import { IcoBook, IcoCards, IcoChart, IcoClock, IcoFlame, IcoIce, IcoJournal, IcoTarget, IcoTrophy, IcoTv } from "@/components/Icons";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { dueCount, lastDays, forecast, achievementTotals, itemStatus } from "@/lib/stats";
import { goalXp, levelFromXp, localDay, missionsFor, visibleStreak, addDays } from "@/lib/game";
import { greetingSay } from "@/lib/motivation";
import { CoachTip, HeroCoach } from "@/components/HeroCoach";
import { CATALOG, getScene, ROUTES, SERIES, levelIndex } from "@/lib/content";
import { collectionsOf } from "@/lib/collections";
import { Bar } from "@/components/ui";
import { Gem } from "@/components/Nav";
import { StartButton } from "@/components/StartButton";
import { recommendMission, trackFor } from "@/lib/recommend";
import { seasonFor, seasonLabel, seasonRoute } from "@/lib/seasons";
import { settleAchievements, settleWeekly } from "@/lib/rewards";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { tutorTips } from "@/lib/tutor";
import { RouteIcon } from "@/components/RouteIcon";
import { petOf, pieceOf } from "@/lib/wardrobe";
import { ensureLeague } from "@/lib/league";
import { todayNews } from "@/lib/news";
import { quoteOfDay } from "@/lib/quotes";
import { ThemeCorner } from "@/components/theme/ThemeDecor";
import { LEAGUES, PROMOTE_GEMS, addWeeks } from "@/lib/league-rules";

export const metadata = { title: "Hoy" };

const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const SKILL: Record<string, string> = { listen: "Escuchar", read: "Leer", speak: "Hablar", write: "Escribir" };

export default async function Today() {
  const profile = await requireProfile();
  const s = settingsOf(profile);
  const mods = { week: true, load: true, goal: true, achievement: true, theme: true, challenges: true, ...s.hoy };
  const today = localDay(profile.tz);
  // Lo secundario (columna lateral y módulos de abajo) se pide ya, pero no bloquea: llega por partes.
  const extra = loadExtra(profile, today);
  extra.catch(() => {}); // el error real lo recibe el bloque que lo espera
  const [due, week, done, cols, islands] = await Promise.all([
    dueCount(profile.userId),
    lastDays(profile, 7),
    db().select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId)),
    collectionsOf(profile.userId),
    mapOf(profile.userId),
  ]);
  const isl = islands.find((i) => i.level === profile.level) ?? islands[0];
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
  const themed = ROUTES.find((r) => r.id === (s.season?.content !== false ? seasonRoute(season) : null) && r.id !== rec?.route.id) ?? ROUTES.find((r) => r.id !== rec?.route.id && r.areas.some((a) => profile.topics.includes(a)));
  const minutes = rec ? Math.max(profile.goalMinutes, rec.track.minutes) : profile.goalMinutes;

  // Componente de servidor (por petición): el regalo de bienvenida se muestra las dos primeras semanas.
  // eslint-disable-next-line react-hooks/purity
  const showGift = !!s.welcomeGift && Date.now() - new Date(profile.createdAt).getTime() < 14 * 86_400_000;
  const left = Math.max(0, goal - todayRow.xp);
  const goalDone = todayRow.xp >= goal;

  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      <header className="relative">
        <ThemeCorner />
        <h1 className="text-[1.9rem] font-black leading-tight lg:text-4xl">{first ? `¡Hola, ${first}!` : `¡${hello}!`}</h1>
        <p className="mt-1 text-muted">{rec ? "Tu misión de hoy te espera." : "Elige cómo quieres estudiar hoy."}</p>
      </header>

      {showGift && s.welcomeGift && (
        <Link href="/tienda" className="module flex items-center gap-4 p-4 ring-2 ring-accent/40">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <Sparkles size={24} aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-black">Tu regalo de bienvenida</span>
            <span className="block text-sm text-muted">
              {petOf(s.welcomeGift.pet)?.label ?? "Una mascota"}, {pieceOf(s.welcomeGift.piece)?.name ?? "una pieza"}, {pieceOf(s.welcomeGift.xmas)?.name ?? "una pieza navideña"} y la temática Navidad. Ya están en tu armario.
            </span>
          </span>
        </Link>
      )}
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-8 3xl:col-span-9">
          {/* Estado del día primero: meta, racha y repasos (tocables). Debajo, la misión con el botón grande. */}
          <section aria-labelledby="meta" className="goal-card max-lg:order-1">
            <div className="min-w-0 flex-1">
              <p id="meta" className="eyebrow text-brand-ink">Tu meta de hoy</p>
              <p className="mt-1 text-2xl font-black leading-tight sm:text-[1.7rem]">
                {Math.min(todayRow.xp, goal)} de {goal} XP
              </p>
              <Bar value={todayRow.xp} max={goal} color="var(--brand)" className="mt-3 h-2.5 max-w-md" label="Meta diaria" />
              <p className="mt-3 text-sm font-semibold text-brand-ink">{goalDone ? "¡Meta cumplida! Tu racha de hoy está a salvo." : todayRow.xp === 0 ? `${profile.goalMinutes} minutos bastan para cumplirla.` : `¡Solo faltan ${left} XP!`}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-black">
                <Link href="/progreso" className="flex items-center gap-1 rounded-full bg-fire-soft px-3 py-1 text-fire">
                  <IcoFlame size={18} /> {streak} {streak === 1 ? "día" : "días"} de racha
                </Link>
                <Link href="/repaso" className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-text">
                  <IcoCards size={18} /> {due} {due === 1 ? "repaso" : "repasos"}
                </Link>
                {profile.freezes > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-surface px-3 py-1 text-muted">
                    <IcoIce size={16} /> {profile.freezes} {profile.freezes === 1 ? "protector" : "protectores"}
                  </span>
                )}
              </div>
            </div>
            <HeroCoach say={say} />
          </section>

          {/* Protagonista: la misión de hoy */}
          <section aria-labelledby="mision" className="mission-card max-lg:order-2">
            {scene && (
              <div className="mission-art" style={{ background: "linear-gradient(140deg, var(--hero-from), var(--hero-to))" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- SVG local pequeño, sin optimización necesaria */}
                <img src={scene.file} alt={scene.alt_es} width={400} height={250} loading="eager" />
                <span className="chip absolute left-4 top-4 bg-surface font-black text-accent shadow-card">Misión recomendada</span>
              </div>
            )}
            <div className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
              <div>
                <p className="eyebrow flex items-center gap-2 text-brand-ink">
                  {rec ? <RouteIcon name={rec.route.icon} size={15} /> : <Sparkles size={16} aria-hidden />}
                  {rec ? "Inglés para la vida real" : due > 0 ? "Repaso y expresiones nuevas" : "Tu sesión"}
                </p>
                <h2 id="mision" className="mt-1 text-[1.6rem] font-black leading-tight sm:text-3xl">
                  {rec ? rec.route.title_es : "Repasa lo que toca y aprende algo nuevo"}
                </h2>
                {rec && <p className="mt-2 max-w-prose text-muted">{rec.track.objective_es}</p>}
                {rec && <p className="mt-1 max-w-prose text-sm text-muted">{rec.reason}</p>}
              </div>
              <ul className="flex flex-wrap gap-2 text-sm font-bold">
                <li className="flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-brand-ink">
                  <IcoClock size={18} /> {minutes} min
                </li>
                {rec && <li className="rounded-full bg-surface-2 px-3 py-1.5">{rec.track.band}</li>}
                {rec && rec.track.skills.length > 0 && <li className="rounded-full bg-accent-soft px-3 py-1.5 text-accent">{rec.track.skills.map((k) => SKILL[k] ?? k).join(" + ")}</li>}
              </ul>
              <StartButton href={rec ? `/sesion?mision=${rec.track.id}&min=${minutes}` : `/sesion?min=${profile.goalMinutes}`} />
              <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Elegir cuánto tiempo">
                <span className="mr-auto text-sm font-bold text-muted">Tiempo disponible</span>
                {[5, 10, 15, 20].map((m) => (
                  <Link key={m} href={rec ? `/sesion?mision=${rec.track.id}&min=${m}` : `/sesion?min=${m}`} className={`chip-btn ${m === minutes ? "is-on" : ""}`}>
                    {m} min
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-extrabold">
                <Link href={`/sesion?min=${profile.goalMinutes}`} className="text-brand-ink underline-offset-4 hover:underline">
                  Sesión libre de {profile.goalMinutes} min
                </Link>
                <Link href="/rutas" className="text-brand-ink underline-offset-4 hover:underline">
                  Elegir otra misión
                </Link>
              </div>
            </div>
          </section>

          {/* Accesos rápidos (los repasos y las colecciones ya están arriba y abajo: sin duplicados). */}
          <div className="grid grid-cols-2 gap-4 max-lg:order-3 sm:grid-cols-4">
            <Link href="/mapa" className="module col-span-2 flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <MapIcon size={26} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-muted">Tu viaje · de A1 a C2</span>
                <span className="block font-black">
                  {isl.level} · {isl.name}: {pct(isl.done, isl.total)} %
                </span>
                <span className="mt-1 flex gap-1" aria-hidden>
                  {islands.map((i) => (
                    <span key={i.level} className="flex-1 text-center text-xs font-bold text-muted">
                      <span className="mb-0.5 block h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <span className="block h-full rounded-full bg-brand" style={{ width: `${pct(i.done, i.total)}%` }} />
                      </span>
                      {i.level}
                    </span>
                  ))}
                </span>
              </span>
            </Link>
            <Link href="/sesion?min=5" className="module tile-ico-wrap flex flex-col gap-1 p-5">
              <span className="tile-ico w-fit">
                <IcoClock size={34} />
              </span>
              <span className="mt-1 text-3xl font-black leading-none">5</span>
              <span className="font-black leading-tight">Práctica rápida</span>
              <span className="text-sm text-muted">Minutos para no perder el ritmo</span>
            </Link>
            {levelIndex(profile.level) >= 2 && (
              <Link href="/series" className="module tile-ico-wrap flex flex-col gap-1 p-5">
                <span className="tile-ico w-fit">
                  <IcoTv size={34} />
                </span>
                <span className="mt-1 text-3xl font-black leading-none">{SERIES.filter((x) => x.level === profile.level || (profile.level === "C1" && x.level === "C2")).length}</span>
                <span className="font-black leading-tight">Inglés de series</span>
                <span className="text-sm text-muted">Escenas sin subtítulos para tu nivel</span>
              </Link>
            )}
          </div>
        </div>

        {/* Columna lateral: semana, retos, consejo y logro (llega por partes) */}
        <Suspense fallback={<AsideSkeleton />}>
          <HoyAside extra={extra} profile={profile} mods={mods} week={week} goal={goal} today={today} streak={streak} seed={seed} say={say} />
        </Suspense>
      </div>

      <Suspense fallback={<MoreSkeleton />}>
        <HoyMore extra={extra} profile={profile} mods={mods} cols={cols} themed={themed} season={season} />
      </Suspense>
    </div>
  );
}

type Profile = Awaited<ReturnType<typeof requireProfile>>;
type Mods = Partial<Record<"week" | "load" | "goal" | "achievement" | "theme" | "challenges", boolean>>;

/** Datos de los módulos secundarios de Hoy (se piden en paralelo con lo principal). */
async function loadExtra(profile: Profile, today: string) {
  const [tips, load, totals, status, weekly, frozenRows] = await Promise.all([
    tutorTips(profile).catch(() => []),
    forecast(profile, 7),
    achievementTotals(profile.userId),
    itemStatus(profile.userId),
    settleWeekly(profile),
    db()
      .select({ day: schema.dailyStats.day })
      .from(schema.dailyStats)
      .where(and(eq(schema.dailyStats.userId, profile.userId), eq(schema.dailyStats.frozen, 1), gte(schema.dailyStats.day, addDays(today, -6)))),
  ]);
  const news = await todayNews().catch(() => null);
  // Liga: alta de la semana (y cierre perezoso de la anterior) y aviso del resultado si aún no lo vio.
  const lg = await ensureLeague(profile);
  const [lastLeague] = await db().select().from(schema.leagueMembers).where(and(eq(schema.leagueMembers.userId, profile.userId), eq(schema.leagueMembers.week, addWeeks(lg.week, -1))));
  const leagueNews = lastLeague?.result && !lastLeague.seen ? { from: lastLeague.tier, result: lastLeague.result as "up" | "stay" | "down", now: lg.tier } : null;
  return { tips: tips.map(({ text, href, cta }) => ({ text, href, cta })), load, totals, status, weekly, frozenRows, leagueNews, news: news ? { title: news.title, source: news.source } : null };
}
type Extra = ReturnType<typeof loadExtra>;

function AsideSkeleton() {
  return (
    <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4 3xl:col-span-3" aria-hidden>
      <div className="skel h-44" />
      <div className="skel h-52" />
      <div className="skel h-32" />
    </aside>
  );
}
function MoreSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4" aria-hidden>
      <div className="skel h-36" />
      <div className="skel h-36" />
      <div className="skel h-36" />
    </div>
  );
}

async function HoyAside({ extra, profile, mods, week, goal, today, streak, seed, say }: { extra: Extra; profile: Profile; mods: Mods; week: Awaited<ReturnType<typeof lastDays>>; goal: number; today: string; streak: number; seed: number; say: ReturnType<typeof greetingSay> }) {
  const { tips, totals, status, frozenRows, leagueNews, weekly } = await extra;
  const s = settingsOf(profile);
  const frozen = new Set(frozenRows.map((r) => r.day));
  const todayRow = week[week.length - 1];
  const missions = missionsFor(today, profile.goalMinutes);
  const lvl = levelFromXp(profile.xp);
  const learned = [...status.values()].filter((v) => v !== "suspended").length;
  const mastered = [...status.values()].filter((v) => v === "mastered").length;
  const achStats = { bestStreak: profile.bestStreak, reviews: totals.reviews, learned, mastered, roleplays: totals.roleplays, lessons: totals.lessons, recordings: totals.recordings, level: lvl.level, placement: s.placement ? 1 : 0 };
  const nextAch = ACHIEVEMENTS.filter((a) => a.value(achStats) < a.goal).sort((a, b) => b.value(achStats) / b.goal - a.value(achStats) / a.goal)[0];
  // Los logros alcanzados se pagan una sola vez (clave idempotente en el libro de gemas).
  await settleAchievements(profile.userId, ACHIEVEMENTS.filter((a) => a.value(achStats) >= a.goal));
  const hasWeek = week.some((d) => d.reviews > 0);
  return (
        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4 3xl:col-span-3">
          {leagueNews && (
            <Link href="/amigos" className={`module flex items-center gap-3 p-4 ${leagueNews.result === "up" ? "ring-2 ring-good/40" : ""}`}>
              <IcoTrophy size={32} />
              <span className="min-w-0 flex-1">
                <b className="block">{leagueNews.result === "up" ? `¡Subiste a la liga ${LEAGUES[leagueNews.now]}!` : leagueNews.result === "down" ? `Bajaste a la liga ${LEAGUES[leagueNews.now]}` : `Sigues en la liga ${LEAGUES[leagueNews.now]}`}</b>
                <span className="text-sm text-muted">{leagueNews.result === "up" ? `+${PROMOTE_GEMS[leagueNews.now]} gemas. Mira la nueva tabla.` : "Esta semana es otra oportunidad. Ver la tabla."}</span>
              </span>
            </Link>
          )}
          {mods.week && (
            <section className="module p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="text-xl font-black">Tu semana</h2>
                <Link href="/progreso" className="flex items-center gap-1 rounded-full bg-fire-soft px-3 py-1 text-sm font-black text-fire">
                  <IcoFlame size={18} /> {streak} {streak === 1 ? "día" : "días"}
                </Link>
              </div>
              <ol className="flex justify-between">
                {week.map((d) => {
                  const ok = d.xp >= goal;
                  const fz = frozen.has(d.day);
                  const wd = new Date(d.day + "T12:00:00Z").getUTCDay();
                  const isToday = d.day === today;
                  return (
                    <li key={d.day} className="flex flex-col items-center gap-1.5">
                      <span className={`text-[11px] font-bold ${isToday ? "text-text" : "text-muted"}`} aria-hidden>
                        {DAYS[wd]}
                      </span>
                      <span className={`day-dot ${ok ? "is-done" : fz ? "is-frozen" : d.xp > 0 ? "is-part" : ""} ${isToday ? "is-today" : ""}`}>
                        {ok ? <Check size={18} strokeWidth={3.5} aria-hidden /> : fz ? <IcoIce size={18} /> : d.xp > 0 ? "•" : "–"}
                      </span>
                      <span className="sr-only">
                        {d.day}: {fz ? "protegido con protector de racha (no estudiado)" : `${d.xp} XP`}
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-sm text-muted">{hasWeek ? `La constancia vale más que la perfección. Mejor racha: ${profile.bestStreak} ${profile.bestStreak === 1 ? "día" : "días"}.` : "Aún no hay actividad esta semana: tu primera sesión la estrena."}</p>
            </section>
          )}
          {mods.challenges && (
            <section className="module p-5">
              <h2 className="mb-3 flex items-center justify-between gap-2 text-xl font-black">
                Retos <IcoTrophy size={26} />
              </h2>
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-muted">Hoy</p>
              <ul className="flex flex-col gap-3.5">
                {missions.map((m) => {
                  const v = m.value(todayRow);
                  const ok = todayRow.missions.includes(m.id) || v >= m.target;
                  return (
                    <li key={m.id}>
                      <p className="flex items-center justify-between gap-2 text-sm font-extrabold">
                        <span>{m.label}</span>
                        <span className={ok ? "text-good" : "text-muted"}>{ok ? <Check size={18} strokeWidth={3} aria-label="cumplido" /> : `${Math.min(v, m.target)}/${m.target}`}</span>
                      </p>
                      <Bar value={v} max={m.target} color={ok ? "var(--good)" : "var(--brand)"} className="mt-1.5 h-1.5" label={m.label} />
                    </li>
                  );
                })}
              </ul>
              <p className="mb-2 mt-5 text-xs font-black uppercase tracking-wide text-muted">Esta semana</p>
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
              <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-black text-accent">
                <Gem size={16} /> +5 gemas por reto · +10 por la meta
              </p>
            </section>
          )}
          <CoachTip seed={seed} say={say} tips={tips} />
          {mods.achievement && nextAch && (
            <Link href="/progreso#logros" className="module block p-5">
              <span className="mb-2 flex items-center justify-between gap-2 text-xl font-black">
                Próximo logro <IcoTrophy size={26} />
              </span>
              <span className="block font-black">{nextAch.title}</span>
              <span className="block text-sm text-muted">{nextAch.desc}</span>
              <Bar value={nextAch.value(achStats)} max={nextAch.goal} color="var(--brand)" className="mt-3 h-2" label={nextAch.desc} />
              <span className="mt-2 block text-xs font-bold text-muted">
                {Math.min(nextAch.value(achStats), nextAch.goal)} de {nextAch.goal}
              </span>
            </Link>
          )}
        </aside>
  );
}

async function HoyMore({ extra, profile, mods, cols, themed, season }: { extra: Extra; profile: Profile; mods: Mods; cols: Awaited<ReturnType<typeof collectionsOf>>; themed: (typeof ROUTES)[number] | undefined; season: ReturnType<typeof seasonFor> }) {
  const { load, status, news } = await extra;
  const quote = quoteOfDay(localDay(profile.tz));
  const s = settingsOf(profile);
  const learned = [...status.values()].filter((v) => v !== "suspended").length;
  const mastered = [...status.values()].filter((v) => v === "mastered").length;
  // Palabra sugerida: la más frecuente del catálogo que aún no estudias ni declaraste conocer, desde tu nivel.
  const knownSet = new Set(s.known ?? []);
  const lv = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const word = CATALOG.find((c) => c.status === "complete" && !c.dupOf && lv.indexOf(c.level) >= lv.indexOf(profile.level) && c.pos !== "det" && c.pos !== "pron" && !status.has(c.id) && !knownSet.has(c.id) && (s.explicit === true || !c.register));
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/diario" className="module flex flex-col gap-1 p-5">
          <span className="flex items-center gap-2 text-xs font-bold text-muted">
            <IcoJournal size={20} /> Tu diario de hoy
          </span>
          <span className="font-display text-lg font-extrabold leading-snug" lang="en">
            “{quote.en}”
          </span>
          <span className="text-sm text-muted">{quote.es}</span>
        </Link>
        {news && (
          <Link href="/noticias" className="module flex flex-col gap-1 p-5">
            <span className="text-xs font-bold text-muted">Noticia de Canadá del día</span>
            <span className="font-black leading-snug" lang="en">
              {news.title}
            </span>
            <span className="text-sm text-muted">{news.source} · léela con ayuda</span>
          </Link>
        )}
        <Link href="/lecturas" className="module flex flex-col gap-1 p-5">
          <span className="text-xs font-bold text-muted">Club de lectura</span>
          <span className="font-black">Lecturas sobre la vida en Canadá</span>
          <span className="text-sm text-muted">Toca cualquier palabra para ver su significado.</span>
        </Link>
      </div>
      {!s.placement && (
        <Link href="/practicar/test" className="module flex items-center gap-4 p-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <IcoTarget size={28} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-black">Mide tu nivel cuando quieras</span>
            <span className="block text-sm text-muted">Test opcional de ≈30 min. Hoy partes de {profile.level} (lo elegiste tú).</span>
          </span>
          <ChevronRight size={20} className="text-muted" aria-hidden />
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
        {mods.load && (
          <Link href="/repaso" className="module p-5">
            <h2 className="mb-3 flex items-center gap-2 font-black">
              <IcoCards size={22} /> Próximos repasos
            </h2>
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

        {mods.goal && (
          <section className="module p-5">
            <h2 className="mb-1 flex items-center gap-2 font-black">
              <IcoChart size={22} /> Tu objetivo
            </h2>
            <p className="text-sm text-muted">{profile.goalMinutes} min al día · {profile.dailyNew} expresiones nuevas como máximo.</p>
            <p className="mt-3 text-sm font-bold">
              {learned} en estudio · {mastered} consolidadas
            </p>
            <Link href="/ajustes" className="mt-3 inline-block text-sm font-extrabold text-brand-ink underline-offset-4 hover:underline">
              Ajustar objetivo
            </Link>
          </section>
        )}

        <section className="module p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="flex items-center gap-2 font-black">
              <IcoBook size={22} /> Mis colecciones
            </h2>
            <Link href="/biblioteca/colecciones" className="text-sm font-extrabold text-brand-ink">
              {cols.length ? "Ver todas" : "Crear"}
            </Link>
          </div>
          {cols.length ? (
            <ul className="flex flex-col gap-2">
              {cols.slice(0, 3).map((c) => (
                <li key={c.id}>
                  <Link href={`/sesion?coleccion=${c.id}`} className="flex items-center justify-between gap-3 rounded-[var(--r-md)] bg-surface-2 px-3 py-2.5 font-bold">
                    <span className="truncate">{c.name}</span>
                    <span className="shrink-0 text-sm text-muted">{c.due ? `${c.due} listos` : `${c.n} entradas`}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">Guarda palabras de una canción, una serie o una entrevista y estudia solo esas.</p>
          )}
        </section>

        {word && (
          <Link href={`/biblioteca/${word.id}`} className="module flex flex-col gap-1 p-5">
            <span className="text-xs font-bold text-muted">Palabra frecuente de tu nivel que aún no estudias</span>
            <span className="font-display text-2xl font-extrabold" lang="en">
              {word.term}
            </span>
            <span className="text-sm text-muted">{word.es}</span>
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
    </>
  );
}
