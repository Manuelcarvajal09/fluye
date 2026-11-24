"use client";
import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Play } from "lucide-react";
import { MyMascot, useLook } from "./Coach";
import { IcoBook, IcoCards, IcoChart, IcoCompass, IcoGem, IcoHome, IcoMic, IcoShop } from "./Icons";

type Ico = ComponentType<{ size?: number; className?: string }>;
type Section = { href: string; label: string; icon: Ico; match: string[] };

/** Escritorio: cada sección con su icono ilustrado. La acción principal sigue siendo una sola: Estudiar. */
const SIDE: Section[] = [
  { href: "/hoy", label: "Hoy", icon: IcoHome, match: ["/hoy"] },
  { href: "/explorar", label: "Explorar", icon: IcoCompass, match: ["/explorar", "/rutas", "/practicar", "/musica"] },
  { href: "/repaso", label: "Repaso", icon: IcoCards, match: ["/repaso"] },
  { href: "/biblioteca", label: "Biblioteca", icon: IcoBook, match: ["/biblioteca"] },
  { href: "/sonidos", label: "Pronunciación", icon: IcoMic, match: ["/sonidos", "/ritmo"] },
  { href: "/progreso", label: "Progreso", icon: IcoChart, match: ["/progreso"] },
  { href: "/tienda", label: "Tienda", icon: IcoShop, match: ["/tienda"] },
];
/** Móvil: cuatro destinos + Estudiar al centro. Lo demás vive dentro de Explorar y Perfil. */
const TABS: Section[] = [
  { href: "/hoy", label: "Hoy", icon: IcoHome, match: ["/hoy"] },
  { href: "/explorar", label: "Explorar", icon: IcoCompass, match: ["/explorar", "/rutas", "/biblioteca", "/practicar", "/sonidos", "/ritmo", "/repaso", "/musica"] },
  { href: "/progreso", label: "Progreso", icon: IcoChart, match: ["/progreso"] },
];

export function Nav({ due, gems }: { due: number; gems: number }) {
  const path = usePathname();
  const look = useLook();
  const active = (m: string[]) => m.some((h) => path === h || path.startsWith(h + "/"));
  const perfilOn = active(["/perfil", "/ajustes", "/admin"]);
  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-surface/70 px-4 py-6 backdrop-blur lg:flex 3xl:w-76">
        <Link href="/hoy" className="mb-6 flex items-center gap-2.5 px-2 font-display text-[1.7rem] font-extrabold tracking-tight">
          <Logo size={34} /> Fluye
        </Link>
        <Link href="/sesion" className="btn btn-primary mb-5 h-13 w-full justify-start gap-3 text-base">
          <Play size={20} fill="currentColor" aria-hidden /> Estudiar ahora
          {due > 0 && <span className="ml-auto rounded-full bg-surface px-2 py-0.5 text-xs font-black text-text">{due > 99 ? "99+" : due}</span>}
        </Link>
        <nav aria-label="Principal" className="flex flex-col gap-0.5">
          {SIDE.map(({ href, label, icon: Icon, match }) => (
            <Link key={href} href={href} aria-current={active(match) ? "page" : undefined} className="nav-link">
              <Icon size={28} /> {label}
            </Link>
          ))}
        </nav>
        <Link href="/perfil" aria-current={perfilOn ? "page" : undefined} className={`mt-auto flex items-center gap-3 rounded-[1.4rem] border p-2.5 pr-4 transition-colors ${perfilOn ? "border-brand/50 bg-brand-soft" : "border-line bg-surface hover:border-brand/40"}`} aria-label={`${look.name}, tu compañero. Ver perfil`}>
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft">
            <MyMascot size={52} animate="none" mood="happy" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-black">{look.name}</span>
            <span className="mt-0.5 flex items-center gap-1 text-sm font-bold text-muted">
              <IcoGem size={16} /> {gems} gemas
            </span>
          </span>
        </Link>
      </aside>

      <nav aria-label="Principal" className="tabbar lg:hidden">
        <ul>
          {TABS.slice(0, 2).map((s) => (
            <Tab key={s.href} s={s} on={active(s.match)} />
          ))}
          <li>
            <Link href="/sesion" className="study" aria-label={due > 0 ? `Estudiar ahora, ${due} repasos pendientes` : "Estudiar ahora"}>
              <span className="ico">
                <Play size={19} fill="currentColor" aria-hidden />
                {due > 0 && <span className="badge">{due > 99 ? "99+" : due}</span>}
              </span>
              Estudiar
            </Link>
          </li>
          <Tab s={TABS[2]} on={active(TABS[2].match)} />
          <li>
            <Link href="/perfil" aria-current={active(["/perfil", "/ajustes", "/tienda", "/admin"]) ? "page" : undefined}>
              <span className="ico">
                <MyMascot size={30} animate="none" mood="happy" />
              </span>
              Perfil
            </Link>
          </li>
        </ul>
      </nav>
    </>
  );
}

function Tab({ s, on }: { s: Section; on: boolean }) {
  const Icon = s.icon;
  return (
    <li>
      <Link href={s.href} aria-current={on ? "page" : undefined}>
        <span className="ico">
          <Icon size={26} />
        </span>
        {s.label}
      </Link>
    </li>
  );
}

/** Compatibilidad: el icono de gema ilustrado. */
export const Gem = IcoGem;

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <rect width="64" height="64" rx="18" fill="var(--brand)" />
      <path d="M14 38c6-10 12-10 18 0s12 10 18 0" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M14 24c6-10 12-10 18 0s12 10 18 0" stroke="#fff" strokeOpacity=".55" strokeWidth="6" fill="none" strokeLinecap="round" />
    </svg>
  );
}
