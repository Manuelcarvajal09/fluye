"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, BarChart3, Play, Sun, UserRound } from "lucide-react";
import { MyMascot, useLook } from "./Coach";

/** Cuatro secciones y una sola acción principal (estudiar). Las rutas antiguas siguen funcionando dentro de cada sección. */
const SECTIONS = [
  { href: "/hoy", label: "Hoy", icon: Sun, match: ["/hoy"] },
  { href: "/explorar", label: "Explorar", icon: Compass, match: ["/explorar", "/rutas", "/biblioteca", "/practicar", "/sonidos", "/ritmo", "/repaso", "/musica"] },
  { href: "/progreso", label: "Progreso", icon: BarChart3, match: ["/progreso"] },
  { href: "/perfil", label: "Perfil", icon: UserRound, match: ["/perfil", "/ajustes", "/tienda", "/admin"] },
];

export function Nav({ due, gems }: { due: number; gems: number }) {
  const path = usePathname();
  const look = useLook();
  const active = (m: string[]) => m.some((h) => path === h || path.startsWith(h + "/"));
  const [hoy, explorar, progreso, perfil] = SECTIONS;
  return (
    <>
      {/* Escritorio / iPad horizontal: barra lateral */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur lg:flex 3xl:w-76">
        <Link href="/hoy" className="mb-7 flex items-center gap-2.5 px-2 font-display text-[1.7rem] font-extrabold tracking-tight">
          <Logo size={34} /> Fluye
        </Link>
        <Link href="/sesion" className="btn btn-primary mb-6 h-13 w-full justify-start gap-3 text-base">
          <Play size={20} fill="currentColor" aria-hidden /> Estudiar ahora
          {due > 0 && <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-black text-text">{due > 99 ? "99+" : due}</span>}
        </Link>
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {SECTIONS.map(({ href, label, icon: Icon, match }) => (
            <Link key={href} href={href} aria-current={active(match) ? "page" : undefined} className="nav-link">
              <Icon size={21} aria-hidden strokeWidth={active(match) ? 2.5 : 2} /> {label}
            </Link>
          ))}
        </nav>
        <Link href="/perfil" className="mt-auto flex items-center gap-3 rounded-[1.4rem] border border-line bg-surface p-2.5 pr-4 transition-colors hover:border-brand/40" aria-label={`${look.name}, tu compañero. Ver perfil`}>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft">
            <MyMascot size={50} animate="none" mood="happy" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-black">{look.name}</span>
            <span className="mt-0.5 flex items-center gap-1 text-sm font-bold text-muted">
              <Gem size={14} /> {gems} gemas
            </span>
          </span>
        </Link>
      </aside>

      {/* Móvil / iPad vertical: barra inferior con el botón de estudiar al centro */}
      <nav aria-label="Principal" className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/92 backdrop-blur-md lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-5 items-end px-2 pt-1.5">
          {[hoy, explorar].map((s) => (
            <TabLink key={s.href} {...s} on={active(s.match)} />
          ))}
          <li className="flex justify-center">
            <Link href="/sesion" aria-label={due > 0 ? `Estudiar ahora, ${due} repasos pendientes` : "Estudiar ahora"} className="study-fab relative -mt-6 grid h-16 w-16 place-items-center rounded-[1.6rem] bg-brand text-white">
              <Play size={28} fill="currentColor" aria-hidden className="translate-x-0.5" />
              {due > 0 && <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-surface bg-fire px-1 text-[11px] font-black">{due > 99 ? "99+" : due}</span>}
            </Link>
          </li>
          {[progreso, perfil].map((s) => (
            <TabLink key={s.href} {...s} on={active(s.match)} />
          ))}
        </ul>
      </nav>
    </>
  );
}

function TabLink({ href, label, icon: Icon, on }: { href: string; label: string; icon: typeof Sun; on: boolean }) {
  return (
    <li>
      <Link href={href} aria-current={on ? "page" : undefined} className={`tab-link ${on ? "text-brand-ink" : "text-muted"}`}>
        <span className={`grid h-8 w-14 place-items-center rounded-full transition-colors duration-200 ${on ? "bg-brand-soft" : ""}`}>
          <Icon size={22} aria-hidden strokeWidth={on ? 2.6 : 2} />
        </span>
        {label}
      </Link>
    </li>
  );
}

export function Gem({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M7 3h10l4 6-9 12L3 9z" fill="#7c6cf0" />
      <path d="M7 3l5 6 5-6M3 9h18M12 9v12" stroke="#fff" strokeOpacity=".55" strokeWidth="1.4" fill="none" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill="var(--brand)" />
      <path d="M14 38c6-10 12-10 18 0s12 10 18 0" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M14 24c6-10 12-10 18 0s12 10 18 0" stroke="#fff" strokeOpacity=".55" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
