import Link from "next/link";
import { Search } from "lucide-react";
import { requireProfile, settingsOf } from "@/lib/user";
import { maskExplicit, REGISTER_ES } from "@/lib/realtalk";
import { ITEMS, levelIndex } from "@/lib/content";
import { itemStatus } from "@/lib/stats";
import { LEVELS, TYPE_LABEL, type ItemType } from "@/lib/types";
import { LibraryGrid } from "@/components/LibraryGrid";
import { collectionsOf } from "@/lib/collections";
import { normalize } from "@/lib/answer";
import { AREAS } from "@/lib/areas";

export const metadata = { title: "Biblioteca" };
const PER = 48;

const STATUS_LABEL = { new: "Sin empezar", learning: "Aprendiendo", mastered: "Dominado", suspended: "Suspendido" } as const;

export default async function Library({ searchParams }: PageProps<"/biblioteca">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = normalize(str("q"));
  const type = str("type");
  const level = str("level");
  const topic = str("topic");
  const status = str("status");
  const area = str("area");
  const tag = str("tag");
  const page = Math.max(1, Number(str("page")) || 1);
  const show = str("show");
  const [statuses, cols] = await Promise.all([itemStatus(profile.userId), collectionsOf(profile.userId)]);
  const explicit = settingsOf(profile).explicit === true;
  const tagOk = (i: (typeof ITEMS)[number]) => !tag || (tag === "real" ? !!i.register || (i.tags ?? []).includes("slang") : tag === "shows" ? !!i.shows?.length : (i.tags ?? []).includes(tag));

  const filtered = ITEMS.filter(
    (i) =>
      (!type || i.type === type) &&
      (!level || i.level === level) &&
      (!topic || i.topic === topic) &&
      (!area || i.areas.includes(area)) &&
      tagOk(i) &&
      (!show || (i.shows ?? []).includes(show)) &&
      (!status || (statuses.get(i.id) ?? "new") === status) &&
      (!q || normalize(i.term).includes(q) || normalize(i.es).includes(q) || i.ex.some((e) => normalize(e.en).includes(q))),
  ).sort((a, b) => (tag === "tv" && !q ? (a.tvRank ?? 9999) - (b.tvRank ?? 9999) : 0) || (q ? Number(!normalize(b.term).startsWith(q)) - Number(!normalize(a.term).startsWith(q)) : 0) || levelIndex(a.level) - levelIndex(b.level) || b.freq - a.freq || a.term.localeCompare(b.term));

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const shown = filtered.slice((page - 1) * PER, page * PER);
  const counts = { total: ITEMS.length, learning: [...statuses.values()].filter((s) => s === "learning").length, mastered: [...statuses.values()].filter((s) => s === "mastered").length };
  const link = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: str("q"), type, level, topic, status, area, tag, show })) if (v) u.set(k, v);
    if (p > 1) u.set("page", String(p));
    return `/biblioteca${u.size ? `?${u}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-4xl font-extrabold">Biblioteca</h1>
        <p className="text-muted">
          {counts.total} expresiones · {counts.learning} aprendiendo · {counts.mastered} dominadas
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/biblioteca/colecciones" className="module flex items-center justify-between gap-3 p-4">
          <span>
            <span className="block font-black">Mis colecciones</span>
            <span className="block text-sm text-muted">{cols.length ? `${cols.length} ${cols.length === 1 ? "colección" : "colecciones"} · estudia solo lo que tú elijas` : "Agrupa palabras para una entrevista, una serie o un viaje."}</span>
          </span>
          <span className="chip bg-brand-soft text-brand-ink">Abrir</span>
        </Link>
        <Link href="/biblioteca/palabras" className="module flex items-center justify-between gap-3 p-4">
          <span>
            <span className="block font-black">Catálogo de palabras</span>
            <span className="block text-sm text-muted">12 000 palabras por frecuencia, con ejemplos y traducción.</span>
          </span>
          <span className="chip bg-brand-soft text-brand-ink">Abrir</span>
        </Link>
      </div>

      <form className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7" role="search">
        {topic && <input type="hidden" name="topic" value={topic} />}
        <label className="relative sm:col-span-2 lg:col-span-2">
          <span className="sr-only">Buscar</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={str("q")} placeholder="Buscar en inglés o español…" className="h-12 w-full rounded-xl border-2 border-line bg-surface pl-10 pr-3 font-semibold outline-none focus:border-accent" />
        </label>
        <Select name="type" value={type} label="Tipo" options={Object.entries(TYPE_LABEL) as [ItemType, string][]} />
        <Select name="level" value={level} label="Nivel" options={LEVELS.map((l) => [l, l])} />
        <Select name="area" value={area} label="Área" options={AREAS.map((a) => [a.id, a.label])} />
        <Select name="tag" value={tag} label="Etiqueta" options={[["real", "Inglés real (slang, groserías)"], ["shows", "Para ver series"], ["tv", "Frecuente en series"], ["ca", "Propio de Canadá"], ["informal", "Informal"], ["slang", "Slang"]]} />
        {tag === "shows" && <Select name="show" value={show} label="Serie" options={[["big-bang-theory", "The Big Bang Theory"], ["himym", "How I Met Your Mother"], ["helluva-boss", "Helluva Boss"], ["hazbin-hotel", "Hazbin Hotel"], ["suits", "Suits"], ["the-mentalist", "The Mentalist"], ["bojack-horseman", "BoJack Horseman"], ["sitcoms", "Sitcoms en general"]]} />}
        <Select name="status" value={status} label="Estado" options={Object.entries(STATUS_LABEL)} />
        <button className="btn btn-primary">Filtrar</button>
      </form>

      <p className="text-sm font-bold text-muted">{filtered.length} resultados</p>
      <LibraryGrid
        collections={cols.map((c) => ({ id: c.id, name: c.name, n: c.n }))}
        items={shown.map((i) => ({
          id: i.id,
          term: maskExplicit(i.term, explicit),
          es: (i.full ? `= ${i.full} · ` : "") + maskExplicit(i.es, explicit),
          chips: [TYPE_LABEL[i.type], i.level, ...(i.tvRank ? [`TV #${i.tvRank}`] : []), ...(i.register ? [REGISTER_ES[i.register]] : [])],
          tone: i.register === "offensive" || i.register === "vulgar" ? ("bad" as const) : undefined,
          status: statuses.get(i.id) ?? "new",
        }))}
      />
      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Páginas">
          {page > 1 && (
            <Link className="btn btn-ghost" href={link(page - 1)}>
              Anterior
            </Link>
          )}
          <span className="font-bold text-muted">
            {page} / {pages}
          </span>
          {page < pages && (
            <Link className="btn btn-ghost" href={link(page + 1)}>
              Siguiente
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}

function Select({ name, value, label, options }: { name: string; value: string; label: string; options: [string, string][] }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value} className="h-12 w-full rounded-xl border-2 border-line bg-surface px-3 font-semibold outline-none focus:border-accent">
        <option value="">{label}: todos</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
