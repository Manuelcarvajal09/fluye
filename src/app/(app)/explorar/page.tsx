import Link from "next/link";
import { eq } from "drizzle-orm";
import { Search, Layers, MessagesSquare, PenLine, BookMarked, AudioLines, Music2, Flame as Spicy, Tv, BookOpenText, ChevronRight } from "lucide-react";
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

      <section aria-labelledby="misiones">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="misiones" className="font-display text-2xl font-extrabold">
            Misiones por tema
          </h2>
          <Link href="/rutas" className="text-sm font-extrabold text-brand-ink">
            Ver todas
          </Link>
        </div>
        {routes.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
            {routes.slice(0, 8).map((r) => {
              const t = trackFor(r, profile.level);
              const sc = getScene(r.scene);
              const finished = r.tracks.filter((x) => doneIds.has(x.lesson.id)).length;
              return (
                <li key={r.id}>
                  <Link href={`/rutas/${r.id}`} className="module flex h-full flex-col overflow-hidden">
                    {sc ? (
                      // eslint-disable-next-line @next/next/no-img-element -- SVG local
                      <img src={sc.file} alt="" width={400} height={240} loading="lazy" className="aspect-[5/3] w-full bg-surface-2 object-cover" />
                    ) : (
                      <span className="grid aspect-[5/3] place-items-center bg-brand-soft text-brand-ink">
                        <RouteIcon name={r.icon} size={44} />
                      </span>
                    )}
                    <span className="flex flex-1 flex-col gap-1 p-4">
                      <span className="flex items-center gap-2 font-black">
                        <RouteIcon name={r.icon} size={17} className="text-brand-ink" /> {r.title_es}
                      </span>
                      <span className="text-sm text-muted">{t.objective_es}</span>
                      <span className="mt-auto pt-2 text-xs font-bold text-muted">
                        {t.minutes} min · {r.tracks.map((x) => x.band).join(" / ")}
                        {finished ? ` · ${finished}/${r.tracks.length} hechas` : ""}
                      </span>
                    </span>
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
          <Tile href="/repaso" icon={<Layers size={22} />} title="Repaso de tarjetas" text={due ? `${due} pendientes ahora` : "Al día"} />
          <Tile href="/practicar" icon={<MessagesSquare size={22} />} title="Conversaciones" text={`${ROLEPLAYS.length} situaciones guiadas`} />
          <Tile href="/sonidos" icon={<AudioLines size={22} />} title="Pronunciación" text={`${SOUNDS.length} sonidos, pares mínimos y ritmo`} />
          <Tile href="/practicar/corrige" icon={<PenLine size={22} />} title="Corrige la frase" text="Errores típicos de hispanohablantes" />
          <Tile href="/practicar/gramatica" icon={<BookMarked size={22} />} title="Gramática" text="Tiempos y estructuras en contexto" />
          <Tile href="/musica" icon={<Music2 size={22} />} title="Música y rap" text={`${MUSIC.length} ejercicios de reducciones, juegos de palabras y doble sentido`} />
          <Tile href="/biblioteca?tag=real" icon={<Spicy size={22} />} title="Inglés real" text={`${real} expresiones de slang, groserías y sarcasmo`} />
          <Tile href="/biblioteca?tag=shows" icon={<Tv size={22} />} title="Para tus series" text={`${shows} expresiones para ver series en inglés`} />
          <Tile href="/biblioteca" icon={<BookOpenText size={22} />} title="Biblioteca" text={`${ITEMS.length.toLocaleString("es-MX")} expresiones y el catálogo de palabras`} />
        </ul>
      </section>
    </div>
  );
}

function Tile({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <li>
      <Link href={href} className="module flex h-full items-center gap-4 p-4">
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
