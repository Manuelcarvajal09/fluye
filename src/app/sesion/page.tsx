import Link from "next/link";
import { requireProfile, settingsOf } from "@/lib/user";
import { buildSession } from "@/lib/session";
import { goalXp, localDay, visibleStreak } from "@/lib/game";
import { lastDays } from "@/lib/stats";
import { lookOf } from "@/lib/look";
import { getTrack, LESSONS } from "@/lib/content";
import { collectionOf } from "@/lib/collections";
import { SessionRunner } from "@/components/session/SessionRunner";
import { ProfileProviders } from "@/components/ProfileProviders";
import { MyMascot } from "@/components/Coach";
import { perksOf } from "@/lib/perks";
import { grantDailyBoost } from "@/lib/economy";
import { BOOST, LIVES } from "@/lib/wardrobe";

export const metadata = { title: "Sesión" };

export default async function SessionPage({ searchParams }: PageProps<"/sesion">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const min = [5, 10, 15, 20].includes(Number(sp.min)) ? Number(sp.min) : profile.goalMinutes;
  const trackId = typeof sp.mision === "string" && getTrack(sp.mision) ? sp.mision : undefined;
  const resume = sp.reanudar === "1";
  const lessonPick = typeof sp.leccion === "string" && LESSONS.some((l) => l.id === sp.leccion) ? sp.leccion : undefined;
  const col = typeof sp.coleccion === "string" ? await collectionOf(profile.userId, sp.coleccion) : null;
  // Sin vidas (y sin vidas ilimitadas): nada nuevo hasta recuperarlas; el repaso y la práctica siguen abiertos.
  const perks = await perksOf(profile.userId);
  const noLives = profile.lives <= 0 && !perks.unlimitedLives;
  if (noLives && sp.repaso !== "1" && !resume) return <NoLives profile={profile} min={min} />;
  const [{ steps, lessonId, kind, away }, [today]] = await Promise.all([buildSession(profile, min, { trackId, lessonId: lessonPick, only: col?.items, noNew: noLives, qaFormat: process.env.FLUYE_QA === "1" && sp.formato === "build" ? "build" : undefined }), lastDays(profile, 1)]);
  // Bono del día: quien empieza su primera sesión del día recibe 15 minutos de doble XP (incentivo por jugar; no se acumula).
  const boosted = !!profile.boostUntil && profile.boostUntil > new Date();
  let dailyBonus = false;
  if (!resume && !noLives && steps.length > 0 && today.reviews === 0 && !boosted) {
    profile.boostUntil = await grantDailyBoost(profile.userId, localDay(profile.tz));
    dailyBonus = !!profile.boostUntil;
  }
  const look = lookOf(settingsOf(profile).look);
  const t = trackId ? getTrack(trackId) : undefined;

  if (!steps.length && !resume)
    return (
      <ProfileProviders profile={profile}>
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
          <MyMascot mood="cheer" size={150} />
          <h1 className="text-3xl font-black">Todo al día</h1>
          <p className="text-muted">
            {col ? `${look.name} dice: en «${col.name}» no hay nada pendiente ahora. Puedes practicarla de todos modos en modo tarjetas.` : `${look.name} dice: no hay repasos pendientes y ya llegaste a tu límite de expresiones nuevas por hoy. Elige una misión temática o practica pronunciación y conversaciones.`}
          </p>
          <div className="flex gap-3">
            <Link href="/explorar" className="btn btn-primary">
              Explorar
            </Link>
            <Link href="/hoy" className="btn btn-ghost">
              Volver
            </Link>
          </div>
        </main>
      </ProfileProviders>
    );

  // Componente de servidor (por petición): la hora actual solo da un id único a la sesión.
  // eslint-disable-next-line react-hooks/purity
  const id = `${localDay(profile.tz)}-${kind}-${trackId ?? min}-${Date.now().toString(36)}`;
  return (
    <ProfileProviders profile={profile}>
      <SessionRunner
        initial={steps}
        lessonId={lessonId}
        streak={visibleStreak(profile.streak, profile.lastGoalDay, localDay(profile.tz))}
        goal={goalXp(profile.goalMinutes)}
        dayXp={today.xp}
        totalXp={profile.xp}
        name={profile.name}
        lives={profile.lives}
        unlimited={perks.unlimitedLives}
        practice={noLives}
        shield={profile.shield}
        boostUntil={profile.boostUntil && profile.boostUntil > new Date() ? profile.boostUntil.toISOString() : null}
        resume={resume}
        meta={{
          id,
          kind,
          minutes: min,
          trackId,
          roleplayId: t?.track.roleplay.id,
          title: col ? `Colección · ${col.name}` : t ? `${t.route.title_es} · ${t.track.band}` : kind === "return" ? "Sesión de regreso" : undefined,
          reason: kind === "return" ? `Llevas ${away} días sin estudiar: hoy repasamos más y metemos poco nuevo.` : dailyBonus && !t ? `Bono del día: doble XP durante ${BOOST.minutes} minutos por empezar tu primera sesión de hoy.` : t?.track.objective_es,
        }}
      />
    </ProfileProviders>
  );
}

/** Pantalla al quedarse sin vidas: explica qué pasa y ofrece cómo seguir estudiando y recuperarlas. */
function NoLives({ profile, min }: { profile: Awaited<ReturnType<typeof requireProfile>>; min: number }) {
  return (
    <ProfileProviders profile={profile}>
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
        <MyMascot mood="encourage" size={150} />
        <h1 className="text-3xl font-black">Te quedaste sin vidas</h1>
        <p className="text-muted">Hoy ya no hay lecciones ni expresiones nuevas, pero puedes seguir estudiando: en el repaso, cada {LIVES.practiceGoal} aciertos recuperas una vida (hasta {LIVES.practicePerDay} al día). Mañana recibes una vida más.</p>
        <div className="flex w-full flex-col gap-2">
          <Link href={`/sesion?min=${min}&repaso=1`} className="btn btn-primary">
            Repasar y recuperar vidas
          </Link>
          <Link href="/sonidos" className="btn btn-ghost">
            Practicar pronunciación
          </Link>
          <Link href="/tienda?tab=vidas" className="btn btn-ghost">
            Protección y regalos de amigos
          </Link>
          <Link href="/hoy" className="text-sm font-bold text-muted underline underline-offset-4">
            Volver a Hoy
          </Link>
        </div>
      </main>
    </ProfileProviders>
  );
}
