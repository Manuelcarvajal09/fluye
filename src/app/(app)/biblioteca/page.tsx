import Link from "next/link";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { requireProfile, settingsOf } from "@/lib/user";
import { maskExplicit, REGISTER_ES } from "@/lib/realtalk";
import { ITEMS, levelIndex } from "@/lib/content";
import { itemStatus } from "@/lib/stats";
import { LEVELS, TYPE_LABEL, type ItemType } from "@/lib/types";
import { LibraryGrid } from "@/components/LibraryGrid";
import { collectionsOf } from "@/lib/collections";
import { normalize } from "@/lib/answer";
import { AREAS } from "@/lib/areas";
import { EmptyArt } from "@/components/ux/EmptyArt";
import { SectionHeader } from "@/components/ux/SectionHeader";

export const metadata = { title: "Biblioteca" };
const PER = 48;

const STATUS_LABEL = { new: "Sin empezar", learning: "Aprendiendo", mastered: "Dominado", suspended: "Suspendido" } as const;

export default async function Library({ searchParams }: PageProps<"/biblioteca">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = normalize(str("q"));
  const type = str("type");
  // Sin ningún filtro (primera visita), la lista empieza en tu nivel; «todos» los muestra todos.
  const fresh = Object.keys(sp).length === 0;
  const levelParam = fresh ? profile.level : str("level");
  const level = levelParam === "todos" ? "" : levelParam;
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
    for (const [k, v] of Object.entries({ q: str("q"), type, level: levelParam, topic, status, area, tag, show })) if (v) u.set(k, v);
    if (p > 1) u.set("page", String(p));
    return `/biblioteca${u.size ? `?${u}` : ""}`;
  };
  // Chips rápidos: cada uno activa o quita su filtro conservando los demás.
  const toggle = (k: string, v: string) => {
    const cur: Record<string, string> = { q: str("q"), type, level: levelParam || "todos", topic, status, area, tag, show };
    cur[k] = cur[k] === v ? (k === "level" ? "todos" : "") : v;
    const u = new URLSearchParams();
    for (const [kk, vv] of Object.entries(cur)) if (vv) u.set(kk, vv);
    return `/biblioteca?${u}`;
  };
  const QUICK: [string, string, string][] = [
    ["level", profile.level, `Mi nivel (${profile.level})`],
    ["status", "learning", "Aprendiendo"],
    ["type", "phrasal", "Phrasal verbs"],
    ["tag", "tv", "De series"],
    ["area", "hogar", "Vida diaria"],
  ];
  const active = [type, level, area, tag, status, show].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader art="biblioteca" title="Biblioteca">
        <p className="text-muted">
          {counts.total} expresiones · {counts.learning} aprendiendo · {counts.mastered} dominadas
        </p>
      </SectionHeader>

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

      {/* Buscador y un botón «Filtros (n)»: los selectores viven en una hoja (popover nativo, se cierra con Esc o tocando fuera). */}
      <form id="lib-form" className="flex gap-2" role="search">
        {topic && <input type="hidden" name="topic" value={topic} />}
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Buscar</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={str("q")} placeholder="Inglés o español…" className="h-12 w-full rounded-xl border-2 border-line bg-surface pl-10 pr-3 font-semibold outline-none focus:border-accent" />
        </label>
        <button type="button" popoverTarget="filtros" className="btn btn-ghost h-12 min-h-12 shrink-0 px-3" aria-label={`Filtros${active ? ` (${active} activos)` : ""}`}>
          <SlidersHorizontal size={18} aria-hidden /> <span className="max-sm:sr-only">Filtros</span>
          {active > 0 && <span className="chip bg-brand text-xs text-white">{active}</span>}
        </button>
        <button className="btn btn-primary h-12 min-h-12 shrink-0 px-4">Buscar</button>
        <div id="filtros" popover="auto" className="filter-sheet" aria-label="Filtros">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-black">Filtros</h2>
            <button type="button" popoverTarget="filtros" popoverTargetAction="hide" className="btn btn-ghost h-10 w-10 min-h-10 !p-0" aria-label="Cerrar filtros">
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select form="lib-form" name="type" value={type} label="Tipo" options={Object.entries(TYPE_LABEL) as [ItemType, string][]} />
            <Select form="lib-form" name="level" value={levelParam || "todos"} label="Nivel" allValue="todos" options={LEVELS.map((l) => [l, l])} />
            <Select form="lib-form" name="area" value={area} label="Área" options={AREAS.map((a) => [a.id, a.label])} />
            <Select form="lib-form" name="tag" value={tag} label="Etiqueta" options={[["real", "Inglés real (slang, groserías)"], ["shows", "Para ver series"], ["tv", "Frecuente en series"], ["ca", "Propio de Canadá"], ["informal", "Informal"], ["slang", "Slang"]]} />
            {tag === "shows" && <Select form="lib-form" name="show" value={show} label="Serie" options={[["big-bang-theory", "The Big Bang Theory"], ["himym", "How I Met Your Mother"], ["helluva-boss", "Helluva Boss"], ["hazbin-hotel", "Hazbin Hotel"], ["suits", "Suits"], ["the-mentalist", "The Mentalist"], ["bojack-horseman", "BoJack Horseman"], ["sitcoms", "Sitcoms en general"]]} />}
            <Select form="lib-form" name="status" value={status} label="Estado" options={Object.entries(STATUS_LABEL)} />
          </div>
          <div className="flex gap-2">
            <button form="lib-form" className="btn btn-primary flex-1">
              Ver resultados
            </button>
            <Link href="/biblioteca?level=todos" className="btn btn-ghost">
              Quitar todos
            </Link>
          </div>
        </div>
      </form>
      <nav aria-label="Filtros rápidos" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {QUICK.map(([k, v, label]) => {
          const on = (k === "level" ? level : k === "status" ? status : k === "type" ? type : k === "tag" ? tag : area) === v;
          return (
            <Link key={k} href={toggle(k, v)} aria-current={on ? "true" : undefined} className={`chip-btn shrink-0 whitespace-nowrap ${on ? "is-on" : ""}`}>
              {label}
            </Link>
          );
        })}
      </nav>

      <p className="text-sm font-bold text-muted">{filtered.length} resultados</p>
      {filtered.length === 0 && (
        <div className="empty-state">
          <EmptyArt kind="vacio-busqueda" mood="think" />
          <h2 className="font-display text-2xl font-extrabold">Nada con estos filtros</h2>
          <p className="max-w-sm text-muted">Prueba otra palabra, en inglés o en español, o quita algún filtro.</p>
          <Link href="/biblioteca" className="btn btn-ghost">
            Quitar filtros
          </Link>
        </div>
      )}
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

function Select({ name, value, label, options, form, allValue = "" }: { name: string; value: string; label: string; options: [string, string][]; form?: string; allValue?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-bold text-muted">
      {label}
      <select form={form} name={name} defaultValue={value} className="h-12 w-full rounded-xl border-2 border-line bg-surface px-3 font-semibold text-text outline-none focus:border-accent">
        <option value={allValue}>Todos</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
