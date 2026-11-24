import Link from "next/link";
import { requireProfile, settingsOf } from "@/lib/user";
import { buildSession } from "@/lib/session";
import { goalXp, localDay, visibleStreak } from "@/lib/game";
import { lastDays } from "@/lib/stats";
import { lookOf } from "@/lib/look";
import { getTrack } from "@/lib/content";
import { collectionOf } from "@/lib/collections";
import { SessionRunner } from "@/components/session/SessionRunner";
import { ProfileProviders } from "@/components/ProfileProviders";
import { MyMascot } from "@/components/Coach";

export const metadata = { title: "Sesión" };

export default async function SessionPage({ searchParams }: PageProps<"/sesion">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const min = [5, 10, 15, 20].includes(Number(sp.min)) ? Number(sp.min) : profile.goalMinutes;
  const trackId = typeof sp.mision === "string" && getTrack(sp.mision) ? sp.mision : undefined;
  const resume = sp.reanudar === "1";
  const col = typeof sp.coleccion === "string" ? await collectionOf(profile.userId, sp.coleccion) : null;
  const [{ steps, lessonId, kind, away }, [today]] = await Promise.all([buildSession(profile, min, { trackId, only: col?.items }), lastDays(profile, 1)]);
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
        resume={resume}
        meta={{
          id,
          kind,
          minutes: min,
          trackId,
          roleplayId: t?.track.roleplay.id,
          title: col ? `Colección · ${col.name}` : t ? `${t.route.title_es} · ${t.track.band}` : kind === "return" ? "Sesión de regreso" : undefined,
          reason: kind === "return" ? `Llevas ${away} días sin estudiar: hoy repasamos más y metemos poco nuevo.` : t?.track.objective_es,
        }}
      />
    </ProfileProviders>
  );
}
