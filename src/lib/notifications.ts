import "server-only";
import { and, eq, gte, isNull, ne, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { localDay } from "./game";
import { LEAGUES, addWeeks, leagueWeek, weekEnd } from "./league-rules";
import { clubReading } from "./readings";
import type { Profile } from "./user";

export type Notice = { id: string; kind: "gift" | "friend" | "league" | "journal" | "reading" | "reaction" | "streak"; title: string; text: string; href: string };

/**
 * Avisos dentro de la app. Se calculan al vuelo con lo que ya existe (buzón, amistades, liga, diario, club de lectura
 * y reacciones): no hay tabla nueva ni avisos fuera de la app. Lo que requiere acción va primero.
 */
export async function noticesOf(profile: Profile): Promise<Notice[]> {
  const d = db();
  const me = profile.userId;
  const today = localDay(profile.tz);
  const week = leagueWeek();
  const club = clubReading(week);
  const since = new Date(Date.now() - 3 * 86_400_000);
  const [gifts, requests, lastLeague, journal, clubDone, reactions, todayRow] = await Promise.all([
    d.select({ n: sql<number>`count(*)::int` }).from(schema.gifts).where(and(eq(schema.gifts.toUser, me), isNull(schema.gifts.openedAt))),
    d
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.friendships)
      .where(and(eq(schema.friendships.status, "pending"), ne(schema.friendships.requestedBy, me), or(eq(schema.friendships.userA, me), eq(schema.friendships.userB, me)))),
    d.select().from(schema.leagueMembers).where(and(eq(schema.leagueMembers.userId, me), eq(schema.leagueMembers.week, addWeeks(week, -1)))),
    d.select({ day: schema.journalEntries.day }).from(schema.journalEntries).where(and(eq(schema.journalEntries.userId, me), eq(schema.journalEntries.day, today))),
    club ? d.select({ id: schema.readingProgress.readingId }).from(schema.readingProgress).where(and(eq(schema.readingProgress.userId, me), eq(schema.readingProgress.readingId, club.id))) : Promise.resolve([]),
    d.select({ n: sql<number>`count(*)::int` }).from(schema.socialReactions).where(and(eq(schema.socialReactions.toUser, me), ne(schema.socialReactions.fromUser, me), gte(schema.socialReactions.createdAt, since))),
    d.select({ xp: schema.dailyStats.xp }).from(schema.dailyStats).where(and(eq(schema.dailyStats.userId, me), eq(schema.dailyStats.day, today))),
  ]);
  const out: Notice[] = [];
  const g = gifts[0]?.n ?? 0;
  if (g > 0) out.push({ id: "gift", kind: "gift", title: g === 1 ? "Tienes un regalo en tu buzón" : `Tienes ${g} regalos en tu buzón`, text: "Ábrelo y da las gracias.", href: "/amigos" });
  const r = requests[0]?.n ?? 0;
  if (r > 0) out.push({ id: "friend", kind: "friend", title: r === 1 ? "Nueva solicitud de amistad" : `${r} solicitudes de amistad`, text: "Acéptala para estudiar acompañado.", href: "/amigos" });
  const ll = lastLeague[0];
  if (ll?.result && !ll.seen) {
    const now = LEAGUES[Math.max(0, Math.min(LEAGUES.length - 1, ll.tier + (ll.result === "up" ? 1 : ll.result === "down" ? -1 : 0)))];
    out.push({ id: "league", kind: "league", title: ll.result === "up" ? `¡Subiste a la liga ${now}!` : ll.result === "down" ? `Bajaste a la liga ${now}` : `Sigues en la liga ${now}`, text: "Mira la tabla de esta semana.", href: "/amigos" });
  }
  // Últimos dos días de la semana de liga: recordatorio para sumar XP.
  const daysLeft = Math.round((new Date(weekEnd(week) + "T12:00:00Z").getTime() - new Date(today + "T12:00:00Z").getTime()) / 86_400_000);
  if (daysLeft >= 0 && daysLeft <= 1) out.push({ id: `league-end:${week}`, kind: "league", title: daysLeft === 0 ? "Hoy cierra la liga de la semana" : "Mañana cierra la liga", text: "Suma XP para subir o no bajar.", href: "/amigos" });
  if (!(todayRow[0]?.xp ?? 0) && profile.streak > 0) out.push({ id: `streak:${today}`, kind: "streak", title: `Cuida tu racha de ${profile.streak} ${profile.streak === 1 ? "día" : "días"}`, text: "Aún no estudias hoy: una sesión corta basta.", href: "/sesion?min=5" });
  if (!journal.length) out.push({ id: `journal:${today}`, kind: "journal", title: "Registra tu día", text: "Un minuto: cómo te sentiste y una frase en inglés.", href: "/diario" });
  if (club && !clubDone.length) out.push({ id: `club:${club.id}`, kind: "reading", title: "Lectura del club de esta semana", text: club.title_es, href: `/lecturas/${club.id}` });
  const rc = reactions[0]?.n ?? 0;
  if (rc > 0) out.push({ id: `reactions:${today}`, kind: "reaction", title: rc === 1 ? "Reaccionaron a tu avance" : `${rc} reacciones a tu avance`, text: "Mira quién te animó.", href: "/amigos" });
  return out;
}
