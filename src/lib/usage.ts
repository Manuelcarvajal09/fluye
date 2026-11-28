import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { getItem } from "./content";

/**
 * Datos de uso de todos los miembros (solo para el propietario, en /admin/datos): sirven para ver qué cuesta más,
 * dónde se abandonan las sesiones y qué mejorar. Todo sale de lo que la app ya registra (repasos, errores, sesiones y
 * estadísticas diarias); no se añade seguimiento nuevo ni sale nada a servicios externos.
 */
export async function usageReport(days = 30) {
  const d = db();
  const since = sql`now() - make_interval(days => ${days})`;
  const rows = async <T>(q: ReturnType<typeof sql>): Promise<T[]> => {
    const r = (await d.execute(q)) as unknown as { rows?: T[] } | T[];
    return Array.isArray(r) ? r : (r.rows ?? []);
  };
  const [members, sessions, byMode, hardest, errors, byMinutes, funnel] = await Promise.all([
    rows<{ user_id: string; name: string; level: string; streak: number; days: number; reviews: number; correct: number; seconds: number; last_day: string | null; sessions: number; finished: number }>(sql`
      select p.user_id, p.name, p.level, p.streak,
        coalesce(s.days, 0)::int as days, coalesce(s.reviews, 0)::int as reviews, coalesce(s.correct, 0)::int as correct, coalesce(s.seconds, 0)::int as seconds, s.last_day::text as last_day,
        coalesce(ss.sessions, 0)::int as sessions, coalesce(ss.finished, 0)::int as finished
      from profiles p
      left join (select user_id, count(*) filter (where reviews > 0) as days, sum(reviews) as reviews, sum(correct) as correct, sum(seconds) as seconds, max(day) filter (where reviews > 0) as last_day
                 from daily_stats where day >= (${since})::date group by user_id) s on s.user_id = p.user_id
      left join (select user_id, count(*) as sessions, count(finished_at) as finished from study_sessions where started_at >= ${since} group by user_id) ss on ss.user_id = p.user_id
      where p.onboarded_at is not null
      order by coalesce(s.reviews, 0) desc`),
    rows<{ sessions: number; finished: number; avg_done_pct: number | null; median_min: number | null }>(sql`
      select count(*)::int as sessions, count(finished_at)::int as finished,
        round(avg(case when steps > 0 then least(1, done::numeric / steps) end) * 100)::int as avg_done_pct,
        round((percentile_cont(0.5) within group (order by extract(epoch from (finished_at - started_at)) / 60) filter (where finished_at is not null and finished_at - started_at < interval '2 hours'))::numeric, 1)::float as median_min
      from study_sessions where started_at >= ${since}`),
    rows<{ mode: string; n: number; ok: number; avg_s: number | null }>(sql`
      select mode, count(*)::int as n, count(*) filter (where rating > 1)::int as ok, round((avg(duration_ms) filter (where duration_ms between 500 and 120000) / 1000)::numeric, 1)::float as avg_s
      from review_logs where reviewed_at >= ${since} and first_try is not false group by mode order by n desc`),
    rows<{ item_id: string; n: number; fails: number; people: number }>(sql`
      select item_id, count(*)::int as n, count(*) filter (where rating = 1)::int as fails, count(distinct user_id)::int as people
      from review_logs where reviewed_at >= ${since} group by item_id having count(*) >= 3 and count(*) filter (where rating = 1) >= 2
      order by (count(*) filter (where rating = 1))::numeric / count(*) desc, count(*) desc limit 20`),
    rows<{ category: string; n: number; people: number }>(sql`
      select category, count(*)::int as n, count(distinct user_id)::int as people from error_events where created_at >= ${since} group by category order by n desc`),
    rows<{ minutes: number; sessions: number; finished: number; median_min: number | null }>(sql`
      select minutes::int as minutes, count(*)::int as sessions, count(finished_at)::int as finished,
        round((percentile_cont(0.5) within group (order by extract(epoch from (finished_at - started_at)) / 60) filter (where finished_at is not null and finished_at - started_at < interval '2 hours'))::numeric, 1)::float as median_min
      from study_sessions where started_at >= ${since} group by minutes order by minutes`),
    rows<{ onboarded: number; studied: number; week2: number; placement: number; journal: number; readings: number; friends: number }>(sql`
      select (select count(*) from profiles where onboarded_at is not null)::int as onboarded,
        (select count(distinct user_id) from review_logs)::int as studied,
        (select count(*) from (select user_id from daily_stats where reviews > 0 group by user_id having count(*) >= 7) x)::int as week2,
        (select count(*) from profiles where settings ? 'placement')::int as placement,
        (select count(distinct user_id) from journal_entries)::int as journal,
        (select count(distinct user_id) from reading_progress)::int as readings,
        (select count(distinct u) from (select user_a as u from friendships where status = 'accepted' union select user_b from friendships where status = 'accepted') f)::int as friends`),
  ]);
  return {
    days,
    members: members.map((m) => ({ name: (m.name || "Sin nombre").split(" ")[0], level: m.level, streak: m.streak, days: m.days, reviews: m.reviews, accuracy: m.reviews ? Math.round((m.correct / m.reviews) * 100) : null, minutes: Math.round(m.seconds / 60), lastDay: m.last_day, sessions: m.sessions, finished: m.finished })),
    sessions: sessions[0],
    byMinutes,
    byMode: byMode.map((m) => ({ ...m, accuracy: m.n ? Math.round((m.ok / m.n) * 100) : 0 })),
    hardest: hardest.map((h) => {
      const it = getItem(h.item_id);
      return { id: h.item_id, term: it?.term ?? h.item_id, es: it?.es ?? "", level: it?.level ?? "", n: h.n, failPct: Math.round((h.fails / h.n) * 100), people: h.people };
    }),
    errors,
    funnel: funnel[0],
  };
}
