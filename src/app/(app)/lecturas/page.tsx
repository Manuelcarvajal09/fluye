import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { Check, Users } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { READINGS, clubReading } from "@/lib/readings";
import { leagueWeek } from "@/lib/league-rules";
import { friendsOf } from "@/lib/social";
import { lookOf, wearOf } from "@/lib/look";
import { Mascot } from "@/components/Mascot";
import { ReactButtons } from "@/components/reading/ReadingClient";

export const metadata = { title: "Lecturas" };
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Lecturas graduadas con ayuda (glosario y diccionario al tocar) y el club de lectura de la semana entre amistades. */
export default async function ReadingsPage() {
  const profile = await requireProfile();
  const club = clubReading(leagueWeek());
  const social = await friendsOf(profile);
  const friends = social.friends.filter((f) => f.status === "accepted");
  const ids = [profile.userId, ...friends.map((f) => f.id)];
  const [done, clubRows, reactions, people] = await Promise.all([
    db().select().from(schema.readingProgress).where(eq(schema.readingProgress.userId, profile.userId)),
    club ? db().select().from(schema.readingProgress).where(and(eq(schema.readingProgress.readingId, club.id), inArray(schema.readingProgress.userId, ids))) : Promise.resolve([]),
    club ? db().select().from(schema.socialReactions).where(and(eq(schema.socialReactions.target, `reading:${club?.id}`), inArray(schema.socialReactions.toUser, ids))) : Promise.resolve([]),
    db().select().from(schema.profiles).where(inArray(schema.profiles.userId, ids)),
  ]);
  const doneMap = new Map(done.map((d) => [d.readingId, d]));
  const person = (id: string) => {
    const p = people.find((x) => x.userId === id);
    const look = lookOf(p ? settingsOf(p).look : undefined);
    return { name: (p?.name || look.name).split(" ")[0], species: look.species, wear: wearOf(look) };
  };
  const mine = LEVELS.indexOf(profile.level);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold">Lecturas</h1>
        <p className="mt-1 max-w-prose text-muted">Textos sobre la vida y el trabajo en Canadá. Toca cualquier palabra para ver qué significa; las del glosario van resaltadas.</p>
      </header>

      {club && (
        <section className="hero-card flex flex-col gap-3 p-5" aria-labelledby="club">
          <p className="eyebrow flex items-center gap-1.5">
            <Users size={14} aria-hidden /> Club de lectura de la semana
          </p>
          <h2 id="club" className="font-display text-2xl font-extrabold">
            {club.title_es}
          </h2>
          <p className="text-sm text-muted">
            {club.level} · {club.minutes} min · La misma lectura para ti y tus amistades. Al terminar, deja una reflexión corta.
          </p>
          <Link href={`/lecturas/${club.id}`} className="btn btn-primary self-start">
            {doneMap.has(club.id) ? "Volver a leer" : "Leer ahora"}
          </Link>
          {clubRows.length > 0 && (
            <ul className="flex flex-col gap-2">
              {clubRows.map((r) => {
                const p = person(r.userId);
                const me = r.userId === profile.userId;
                const got = reactions.filter((x) => x.toUser === r.userId);
                const myReaction = reactions.find((x) => x.toUser === r.userId && x.fromUser === profile.userId)?.emoji ?? null;
                return (
                  <li key={r.userId} className="flex flex-col gap-2 rounded-[var(--r-md)] bg-surface/80 p-3">
                    <div className="flex items-center gap-3">
                      <Mascot species={p.species} wear={p.wear} size={40} decorative />
                      <span className="min-w-0 flex-1">
                        <b className="block">{me ? `${p.name} (tú)` : p.name}</b>
                        <span className="text-xs text-muted">
                          {r.score} de {r.total} · {got.map((x) => x.emoji).join(" ")}
                        </span>
                      </span>
                    </div>
                    {r.reflection && <p className="text-sm">“{r.reflection}”</p>}
                    {!me && <ReactButtons to={r.userId} target={`reading:${club.id}`} mine={myReaction} />}
                  </li>
                );
              })}
            </ul>
          )}
          {friends.length === 0 && <p className="text-xs text-muted">Agrega amistades en Amigos para leer juntos.</p>}
        </section>
      )}

      {LEVELS.filter((l) => READINGS.some((r) => r.level === l)).map((l) => (
        <section key={l} className="flex flex-col gap-3">
          <h2 className="flex items-center gap-2 text-xl font-black">
            {l} {LEVELS.indexOf(l) === mine && <span className="chip bg-accent-soft text-accent">Tu nivel</span>}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {READINGS.filter((r) => r.level === l).map((r) => {
              const d = doneMap.get(r.id);
              return (
                <li key={r.id}>
                  <Link href={`/lecturas/${r.id}`} className="module flex h-full flex-col gap-1 p-4">
                    <span className="flex items-center justify-between gap-2 text-xs font-bold text-muted">
                      {r.minutes} min · {r.words} palabras {d && <Check size={16} className="text-good" aria-label="leída" />}
                    </span>
                    <span className="font-black">{r.title_es}</span>
                    <span className="text-sm text-muted" lang="en">
                      {r.title}
                    </span>
                    {d && <span className="text-xs font-bold text-good">{d.score} de {d.total}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
