import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Settings, ShieldCheck, ChevronRight, Download, Shirt, Users } from "lucide-react";
import { IcoGem, IcoHeart, IcoIce, IcoTrophy } from "@/components/Icons";
import { UserButton } from "@clerk/nextjs";
import { requireProfile, settingsOf } from "@/lib/user";
import { isOwner } from "@/lib/access";
import { ensureLeague } from "@/lib/league";
import { perksOf } from "@/lib/perks";
import { bgImage } from "@/lib/themes";
import { FREEZE } from "@/lib/wardrobe";
import { LEAGUES } from "@/lib/league-rules";
import { LEAGUE_TINT } from "@/components/amigos/LeaguePanel";
import { levelFromXp, levelTitle, localDay, visibleStreak } from "@/lib/game";
import { MyMascot } from "@/components/Coach";
import { AREA_LABEL } from "@/lib/areas";
import { db, schema } from "@/db";
import { ITEMS } from "@/lib/content";
import { LanguageBar, MotionToggle, StudyStats } from "@/components/ProfileStats";

export const metadata = { title: "Perfil" };
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

export default async function ProfilePage() {
  const profile = await requireProfile();
  const [league, perks] = await Promise.all([ensureLeague(profile), perksOf(profile.userId)]);
  const lvl = levelFromXp(profile.xp);
  const owner = isOwner(profile.userId);
  const today = localDay(profile.tz);
  const [days, cards] = await Promise.all([
    db()
      .select({ day: schema.dailyStats.day, xp: schema.dailyStats.xp, reviews: schema.dailyStats.reviews, correct: schema.dailyStats.correct, seconds: schema.dailyStats.seconds })
      .from(schema.dailyStats)
      .where(eq(schema.dailyStats.userId, profile.userId))
      .orderBy(asc(schema.dailyStats.day)),
    db().select({ itemId: schema.cards.itemId, state: schema.cards.state, stability: schema.cards.stability, reps: schema.cards.reps }).from(schema.cards).where(eq(schema.cards.userId, profile.userId)),
  ]);
  // Por ítem: estudiado si alguna tarjeta tuvo repasos; consolidado si todas están en repaso con estabilidad alta.
  const byItem = new Map<string, { studied: boolean; mastered: boolean }>();
  for (const c of cards) {
    const v = byItem.get(c.itemId) ?? { studied: false, mastered: true };
    v.studied ||= c.reps > 0;
    v.mastered &&= c.state === 2 && c.stability >= 21;
    byItem.set(c.itemId, v);
  }
  const levels = LEVELS.map((level) => {
    const its = ITEMS.filter((i) => i.level === level);
    return { level, total: its.length, studied: its.filter((i) => byItem.get(i.id)?.studied).length, mastered: its.filter((i) => byItem.get(i.id)?.studied && byItem.get(i.id)?.mastered).length };
  }).filter((l) => l.total > 0);

  return (
    <div className="flex flex-col gap-6">
      <header className="hero-card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
        {settingsOf(profile).background ? (
          <span className="grid shrink-0 place-items-end overflow-hidden rounded-[var(--r-lg)] bg-cover bg-center px-4 pt-3" style={{ backgroundImage: `url(${bgImage(settingsOf(profile).background, "square")})` }}>
            <MyMascot size={140} mood="happy" />
          </span>
        ) : (
          <MyMascot size={140} mood="happy" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl font-extrabold">{profile.name || "Tu perfil"}</h1>
          <p className="text-muted">
            {(profile.topics ?? []).slice(0, 3).map((t) => AREA_LABEL[t] ?? t).join(", ")}
            {(profile.topics?.length ?? 0) > 3 ? "…" : ""}
          </p>
          {/* Tres datos del mismo tamaño y forma: liga, nivel de inglés y monedero. */}
          <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
            <Link href="/amigos" className="profile-stat" aria-label={`Liga ${LEAGUES[league.tier]}, ${league.tier + 1} de ${LEAGUES.length}. Ver la tabla`}>
              <span className="profile-stat-ico" style={{ color: LEAGUE_TINT[league.tier], background: `color-mix(in oklab, ${LEAGUE_TINT[league.tier]} 16%, var(--surface))` }}>
                <IcoTrophy size={22} />
              </span>
              <b className="profile-stat-val">{LEAGUES[league.tier]}</b>
              <span className="profile-stat-lbl">
                Liga {league.tier + 1} de {LEAGUES.length}
              </span>
            </Link>
            <Link href="/mapa" className="profile-stat" aria-label={`Nivel de inglés ${profile.level}. Ver tu viaje`}>
              <span className="profile-stat-ico bg-brand-soft text-brand-ink font-display text-sm font-black">{profile.level}</span>
              <b className="profile-stat-val">Inglés {profile.level}</b>
              <span className="profile-stat-lbl">{settingsOf(profile).placement ? "Según tu test" : "Lo elegiste tú"}</span>
            </Link>
            <Link href="/tienda?tab=vidas" className="profile-stat" aria-label={`${profile.gems} gemas. Ver vidas y extras`}>
              <span className="profile-stat-ico bg-accent-soft">
                <IcoGem size={22} />
              </span>
              <b className="profile-stat-val">{profile.gems}</b>
              <span className="profile-stat-lbl flex items-center justify-center gap-1">
                <IcoHeart size={13} /> {perks.unlimitedLives ? "∞" : profile.lives} · <IcoIce size={13} /> {profile.freezes}/{FREEZE.max}
              </span>
            </Link>
          </div>
          <p className="mt-2 text-xs text-muted">
            Nivel de juego {lvl.level} · {levelTitle(lvl.level)}
          </p>
        </div>
      </header>

      <LanguageBar levels={levels} />
      <StudyStats days={days} today={today} streak={visibleStreak(profile.streak, profile.lastGoalDay, today)} bestStreak={profile.bestStreak} totalXp={profile.xp} />

      <ul className="grid gap-3 sm:grid-cols-2">
        <Row href="/tienda" icon={<Shirt size={22} />} title="Armario y tu estilo" text="Mascotas, ropa, colores, temáticas, fondos, cofres y vidas." />
        <Row href="/amigos" icon={<Users size={22} />} title="Amigos" text="Clasificación semanal, regalos y buzón." />
        <Row href="/progreso" icon={<ChevronRight size={22} />} title="Progreso detallado" text="Retención, errores frecuentes, pronunciación y carga de repasos." />
        <Row href="/ajustes" icon={<Settings size={22} />} title="Ajustes" text="Meta diaria, nivel, voz, sonidos, recordatorio y privacidad." />
        <Row href="/hoy?tour=1" icon={<ChevronRight size={22} />} title="Ver el recorrido de bienvenida" text="Cómo funciona Fluye en cinco tarjetas." />
        <Row href="/api/data" icon={<Download size={22} />} title="Exportar mis datos" text="Descarga un respaldo completo (JSON) de tu progreso." download />
        {owner && <Row href="/admin" icon={<ShieldCheck size={22} />} title="Administrar acceso" text="Invitaciones y miembros (solo propietario)." />}
      </ul>

      <MotionToggle initial={settingsOf(profile).motion ?? "auto"} />

      <div className="module flex items-center justify-between gap-3 p-4">
        <span className="font-bold">Cuenta</span>
        <UserButton />
      </div>
    </div>
  );
}

function Row({ href, icon, title, text, download }: { href: string; icon: React.ReactNode; title: string; text: string; download?: boolean }) {
  return (
    <li>
      <Link href={href} className="module flex h-full items-center gap-4 p-4" {...(download ? { prefetch: false, download: "fluye-respaldo.json" } : {})}>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink" aria-hidden>
          {icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-black">{title}</span>
          <span className="block text-sm text-muted">{text}</span>
        </span>
        <ChevronRight size={18} className="text-muted" aria-hidden />
      </Link>
    </li>
  );
}
