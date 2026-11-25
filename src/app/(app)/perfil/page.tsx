import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Settings, ShieldCheck, ChevronRight, Download, Shirt, Users } from "lucide-react";
import { IcoCoin, IcoGem, IcoHeart, IcoIce } from "@/components/Icons";
import { UserButton } from "@clerk/nextjs";
import { requireProfile, settingsOf } from "@/lib/user";
import { isOwner } from "@/lib/access";
import { rankOf } from "@/lib/challenges";
import { levelFromXp, levelTitle, localDay, visibleStreak } from "@/lib/game";
import { MyMascot } from "@/components/Coach";
import { Bar } from "@/components/ui";
import { AREA_LABEL } from "@/lib/areas";
import { db, schema } from "@/db";
import { ITEMS } from "@/lib/content";
import { LanguageBar, MotionToggle, StudyStats } from "@/components/ProfileStats";

export const metadata = { title: "Perfil" };
const LEVELS = ["A1", "A2", "B1", "B2", "C1"];

export default async function ProfilePage() {
  const profile = await requireProfile();
  const rank = rankOf(profile.xp);
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
        <MyMascot size={140} mood="happy" />
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-4xl font-extrabold">{profile.name || "Tu perfil"}</h1>
          <p className="text-muted">
            Inglés {profile.level} (orientativo) · {(profile.topics ?? []).slice(0, 3).map((t) => AREA_LABEL[t] ?? t).join(", ")}
            {(profile.topics?.length ?? 0) > 3 ? "…" : ""}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[var(--r-md)] bg-surface/80 p-3">
              <p className="text-xs font-bold text-muted">Rango de juego</p>
              <p className="font-black" style={{ color: rank.color }}>
                {rank.label}
              </p>
              <Bar value={rank.into} max={rank.span} color={rank.color} className="mt-1 h-1.5" label="Progreso de rango" />
              <p className="mt-1 text-[11px] text-muted">{rank.next ? `${rank.next.min - profile.xp} XP para ${rank.next.label}` : "Rango máximo"}</p>
            </div>
            <div className="rounded-[var(--r-md)] bg-surface/80 p-3">
              <p className="text-xs font-bold text-muted">Nivel de juego</p>
              <p className="font-black">
                {lvl.level} · {levelTitle(lvl.level)}
              </p>
              <Bar value={lvl.into} max={lvl.span} color="var(--accent)" className="mt-1 h-1.5" label="Progreso de nivel" />
              <p className="mt-1 text-[11px] text-muted">No es tu nivel de inglés.</p>
            </div>
            <div className="flex flex-col gap-1 rounded-[var(--r-md)] bg-surface/80 p-3 text-sm font-black">
              <span className="flex items-center gap-1.5">
                <IcoCoin size={18} /> {profile.coins} monedas
              </span>
              <span className="flex items-center gap-1.5">
                <IcoGem size={18} /> {profile.gems} gemas
              </span>
              <span className="flex items-center gap-1.5">
                <IcoHeart size={18} /> {profile.lives} vidas · <IcoIce size={16} /> {profile.freezes}/2
              </span>
            </div>
          </div>
        </div>
      </header>

      <LanguageBar levels={levels} />
      <StudyStats days={days} today={today} streak={visibleStreak(profile.streak, profile.lastGoalDay, today)} bestStreak={profile.bestStreak} totalXp={profile.xp} />

      <ul className="grid gap-3 sm:grid-cols-2">
        <Row href="/tienda" icon={<Shirt size={22} />} title="Armario" text="Mascotas, ropa, accesorios, cofres y vidas." />
        <Row href="/amigos" icon={<Users size={22} />} title="Amigos" text="Clasificación semanal, regalos y buzón." />
        <Row href="/progreso" icon={<ChevronRight size={22} />} title="Progreso detallado" text="Retención, errores frecuentes, pronunciación y carga de repasos." />
        <Row href="/ajustes" icon={<Settings size={22} />} title="Ajustes" text="Meta diaria, voz, temporadas, sonidos, lenguaje explícito, privacidad." />
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
