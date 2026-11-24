import Link from "next/link";
import { eq } from "drizzle-orm";
import { Search, ChevronRight } from "lucide-react";
import { IcoBook, IcoCards, IcoChat, IcoMap, IcoMic, IcoMusic, IcoPencil, IcoPepper, IcoPuzzle, IcoStar, IcoTv } from "@/components/Icons";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { ITEMS, ROUTES, MUSIC, ROLEPLAYS, SOUNDS, getScene } from "@/lib/content";
import { dueCount } from "@/lib/stats";
import { trackFor } from "@/lib/recommend";
import { RouteIcon } from "@/components/RouteIcon";

export const metadata = { title: "Explorar" };

export default async function Explore() {
  const profile = await requireProfile();
  const [due, done] = await Promise.all([dueCount(profile.userId), db().select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId))]);
  const doneIds = new Set(done.map((d) => d.id));
  const mine = new Set(profile.topics);
  const routes = [...ROUTES].sort((a, b) => Number(b.areas.some((x) => mine.has(x))) - Number(a.areas.some((x) => mine.has(x))));
  const real = ITEMS.filter((i) => i.register || i.tags?.includes("slang")).length;
  const shows = ITEMS.filter((i) => i.shows?.length).length;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-4">
        <h1 className="font-display text-4xl font-extrabold">Explorar</h1>
        <form action="/biblioteca" className="relative max-w-xl">
          <Search size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <label htmlFor="q" className="sr-only">
            Buscar en la biblioteca
          </label>
          <input id="q" name="q" placeholder="Busca una palabra o expresión: give up, I'm down…" className="h-13 w-full rounded-full border border-line bg-surface pl-12 pr-4 font-bold outline-none focus:border-accent" />
        </form>
      </header>

      <nav aria-label="Accesos directos" className="-mt-3 flex max-w-full flex-wrap gap-2">
        <Link href="/repaso" className="chip-btn">
          <IcoCards size={20} /> Repaso {due > 0 && <span className="count">{due > 99 ? "99+" : due}</span>}
        </Link>
        <Link href="/biblioteca" className="chip-btn">
          <IcoBook size={20} /> Biblioteca
        </Link>
        <Link href="/biblioteca/colecciones" className="chip-btn">
          <IcoStar size={20} /> Mis colecciones
        </Link>
        <Link href="/practicar" className="chip-btn">
          <IcoChat size={20} /> Conversaciones
        </Link>
        <Link href="/sonidos" className="chip-btn">
          <IcoMic size={20} /> Pronunciación
        </Link>
      </nav>

      <section aria-labelledby="misiones">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="misiones" className="flex items-center gap-2 font-display text-2xl font-extrabold">
            <IcoMap size={28} />
            Misiones por tema
          </h2>
          <Link href="/rutas" className="text-sm font-extrabold text-brand-ink">
            Ver todas
          </Link>
        </div>
        {routes.length ? (
          <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
            {routes.map((r, idx) => {
              const t = trackFor(r, profile.level);
              const sc = getScene(r.scene);
              const finished = r.tracks.filter((x) => doneIds.has(x.lesson.id)).length;
              const featured = idx === 0;
              return (
                <li key={r.id} className={`min-w-0 ${featured ? "md:col-span-2 2xl:col-span-3" : ""}`}>
                  <Link href={`/rutas/${r.id}`} className={`module flex h-full min-w-0 items-stretch gap-3 overflow-hidden p-3 ${featured ? "sm:gap-5 sm:p-4" : ""}`}>
                    <span className={`relative shrink-0 overflow-hidden rounded-[var(--r-md)] bg-brand-soft ${featured ? "w-28 sm:w-56" : "w-24"}`}>
                      {sc ? (
                        // eslint-disable-next-line @next/next/no-img-element -- ilustración local
                        <img src={sc.file} alt="" width={400} height={240} loading={featured ? "eager" : "lazy"} className="h-full w-full object-cover" />
                      ) : (
                        <span className="grid h-full min-h-20 place-items-center text-brand-ink">
                          <RouteIcon name={r.icon} size={32} />
                        </span>
                      )}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1 py-0.5">
                      {featured && <span className="text-xs font-black text-accent">Sugerida para ti</span>}
                      <span className={`flex items-center gap-2 font-black ${featured ? "font-display text-xl sm:text-2xl" : ""}`}>
                        <RouteIcon name={r.icon} size={16} className="shrink-0 text-brand-ink" /> <span className="truncate">{r.title_es}</span>
                      </span>
                      <span className={`text-sm text-muted ${featured ? "line-clamp-3" : "line-clamp-2"}`}>{t.objective_es}</span>
                      <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs font-bold text-muted">
                        <span>{t.minutes} min</span>
                        <span>{t.band}</span>
                        <span className="flex items-center gap-1" aria-label={`${finished} de ${r.tracks.length} misiones hechas`}>
                          {r.tracks.map((x) => (
                            <span key={x.id} className={`h-1.5 w-5 rounded-full ${doneIds.has(x.lesson.id) ? "bg-good" : "bg-line"}`} />
                          ))}
                        </span>
                      </span>
                    </span>
                    <ChevronRight size={18} className="shrink-0 self-center text-muted" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="module-quiet p-5 text-muted">Las misiones temáticas aparecerán aquí.</p>
        )}
      </section>

      <section aria-labelledby="libre">
        <h2 id="libre" className="mb-3 font-display text-2xl font-extrabold">
          Práctica libre
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
          <Tile href="/repaso" icon={<IcoCards size={34} />} title="Repaso de tarjetas" text={due ? `${due} pendientes ahora` : "Al día"} />
          <Tile href="/practicar" icon={<IcoChat size={34} />} title="Conversaciones" text={`${ROLEPLAYS.length} situaciones guiadas`} />
          <Tile href="/sonidos" icon={<IcoMic size={34} />} title="Pronunciación" text={`${SOUNDS.length} sonidos, pares mínimos y ritmo`} />
          <Tile href="/practicar/corrige" icon={<IcoPencil size={34} />} title="Corrige la frase" text="Errores típicos de hispanohablantes" />
          <Tile href="/practicar/gramatica" icon={<IcoPuzzle size={34} />} title="Gramática" text="Tiempos y estructuras en contexto" />
          <Tile href="/musica" icon={<IcoMusic size={34} />} title="Música y rap" text={`${MUSIC.length} ejercicios de reducciones, juegos de palabras y doble sentido`} />
          <Tile href="/biblioteca?tag=real" icon={<IcoPepper size={34} />} title="Inglés real" text={`${real} expresiones de slang, groserías y sarcasmo`} />
          <Tile href="/biblioteca?tag=shows" icon={<IcoTv size={34} />} title="Para tus series" text={`${shows} expresiones para ver series en inglés`} />
          <Tile href="/biblioteca" icon={<IcoBook size={34} />} title="Biblioteca" text={`${ITEMS.length.toLocaleString("es-MX")} expresiones y el catálogo de palabras`} />
        </ul>
      </section>
    </div>
  );
}

function Tile({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <li>
      <Link href={href} className="module tile-ico-wrap flex h-full items-center gap-4 p-4">
        <span className="tile-ico grid h-13 w-13 shrink-0 place-items-center rounded-2xl bg-surface-2" aria-hidden>
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
