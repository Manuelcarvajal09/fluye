import Link from "next/link";
import { Settings, ShoppingBag, ShieldCheck, ChevronRight, Download } from "lucide-react";
import { IcoIce } from "@/components/Icons";
import { UserButton } from "@clerk/nextjs";
import { requireProfile } from "@/lib/user";
import { isOwner } from "@/lib/access";
import { rankOf } from "@/lib/challenges";
import { levelFromXp, levelTitle } from "@/lib/game";
import { MyMascot } from "@/components/Coach";
import { Gem } from "@/components/Nav";
import { Bar } from "@/components/ui";
import { AREA_LABEL } from "@/lib/areas";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const profile = await requireProfile();
  const rank = rankOf(profile.xp);
  const lvl = levelFromXp(profile.xp);
  const owner = isOwner(profile.userId);
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
              <p className="text-[11px] text-muted">No es tu nivel de inglés.</p>
            </div>
            <div className="rounded-[var(--r-md)] bg-surface/80 p-3">
              <p className="text-xs font-bold text-muted">Tus gemas</p>
              <p className="flex items-center gap-1 font-black text-accent">
                <Gem size={16} /> {profile.gems}
              </p>
              <p className="flex items-center gap-1 text-[11px] text-muted">
                <IcoIce size={16} /> {profile.freezes}/2 protectores
              </p>
            </div>
          </div>
        </div>
      </header>

      <ul className="grid gap-3 sm:grid-cols-2">
        <Row href="/tienda" icon={<ShoppingBag size={22} />} title="Tienda e inventario" text="Accesorios, atuendos y colores para tu compañero. Solo decoración." />
        <Row href="/ajustes" icon={<Settings size={22} />} title="Ajustes" text="Meta diaria, voz, temporadas, sonidos, lenguaje explícito, privacidad." />
        <Row href="/api/data" icon={<Download size={22} />} title="Exportar mis datos" text="Descarga un respaldo completo (JSON) de tu progreso." download />
        {owner && <Row href="/admin" icon={<ShieldCheck size={22} />} title="Administrar acceso" text="Invitaciones y miembros (solo propietario)." />}
      </ul>

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
