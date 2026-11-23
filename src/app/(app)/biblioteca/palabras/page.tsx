import Link from "next/link";
import { eq } from "drizzle-orm";
import { Search, Info } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { CATALOG } from "@/lib/content";
import { normalize } from "@/lib/answer";
import { maskExplicit } from "@/lib/realtalk";
import { CatalogBatch } from "@/components/CatalogBatch";

export const metadata = { title: "Catálogo de palabras" };
const PER = 60;
const BANDS = ["1k", "2k", "3k", "4k", "5k", "6k", "7k", "8k", "9k", "10k", "10k+"];
const POS: Record<string, string> = { noun: "Sustantivo", verb: "Verbo", adj: "Adjetivo", adv: "Adverbio", pron: "Pronombre", det: "Determinante", prep: "Preposición", conj: "Conjunción", interj: "Interjección", num: "Número", aux: "Auxiliar", other: "Otro" };

export default async function Words({ searchParams }: PageProps<"/biblioteca/palabras">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const q = normalize(str("q"));
  const band = str("band");
  const pos = str("pos");
  const st = str("st");
  const page = Math.max(1, Number(str("page")) || 1);
  const have = new Set((await db().selectDistinct({ id: schema.cards.itemId }).from(schema.cards).where(eq(schema.cards.userId, profile.userId))).map((r) => r.id));
  const s = settingsOf(profile);
  const known = new Set(s.known ?? []);
  const state = (id: string, dup?: string) => (have.has(dup ?? id) ? "study" : known.has(id) ? "known" : "none");
  const list = CATALOG.filter(
    (c) =>
      (!band || c.band === band) &&
      (!pos || c.pos === pos) &&
      (!st || (st === "pending" ? c.status === "pending" : st === "study" ? state(c.id, c.dupOf) === "study" : st === "known" ? state(c.id) === "known" : st === "new" ? state(c.id, c.dupOf) === "none" && c.status === "complete" : true)) &&
      (!q || normalize(c.term).startsWith(q) || normalize(c.es).includes(q)),
  ).sort((a, b) => (q ? Number(normalize(b.term) === q) - Number(normalize(a.term) === q) : 0) || a.rank - b.rank);
  const pages = Math.max(1, Math.ceil(list.length / PER));
  const shown = list.slice((page - 1) * PER, page * PER);
  const complete = CATALOG.filter((c) => c.status === "complete").length;
  const lemmas = new Set(CATALOG.map((c) => c.term)).size;
  const link = (p: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: str("q"), band, pos, st })) if (v) u.set(k, v);
    if (p > 1) u.set("page", String(p));
    return `/biblioteca/palabras${u.size ? `?${u}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-5">
      <header>
        <Link href="/biblioteca" className="text-sm font-extrabold text-muted hover:text-text">
          Biblioteca
        </Link>
        <h1 className="font-display text-4xl font-extrabold">Catálogo de palabras</h1>
        <p className="mt-1 max-w-prose text-muted">
          {lemmas.toLocaleString("es-MX")} lemas en {CATALOG.length.toLocaleString("es-MX")} entradas (palabra + categoría) · {complete.toLocaleString("es-MX")} listas para estudiar. Ordenadas por frecuencia de uso.
        </p>
      </header>

      <CatalogBatch />

      <form className="module grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5" role="search">
        <label className="relative sm:col-span-2">
          <span className="sr-only">Buscar palabra</span>
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={str("q")} placeholder="Palabra en inglés o español…" className="h-12 w-full rounded-[var(--r-md)] border border-line bg-surface pl-10 pr-3 font-semibold outline-none focus:border-accent" />
        </label>
        <Sel name="band" value={band} label="Frecuencia" options={BANDS.map((b) => [b, b === "10k+" ? "Más allá de 10 000" : `Hasta ${b.replace("k", " 000")}`])} />
        <Sel name="pos" value={pos} label="Categoría" options={Object.entries(POS)} />
        <Sel name="st" value={st} label="Estado" options={[["new", "Sin estudiar"], ["study", "En estudio"], ["known", "Declaré que la conozco"], ["pending", "Ficha pendiente"]]} />
        <button className="btn btn-primary sm:col-span-2 lg:col-span-5 lg:justify-self-start">Filtrar</button>
      </form>

      <p className="text-sm font-bold text-muted">{list.length.toLocaleString("es-MX")} resultados</p>
      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
        {shown.map((c) => {
          const stt = state(c.id, c.dupOf);
          return (
            <li key={c.id}>
              <Link href={`/biblioteca/${c.dupOf ?? c.id}`} className="module flex h-full flex-col gap-1 p-3">
                <span className="flex items-center gap-2 text-xs font-bold text-muted">
                  <span className="chip">{POS[c.pos] ?? c.pos}</span>
                  <span>#{c.rank}</span>
                  {c.status === "pending" && <span className="chip bg-fire-soft text-fire">Pendiente</span>}
                  {stt === "study" && <span className="chip bg-accent-soft text-accent">En estudio</span>}
                  {stt === "known" && <span className="chip">La conozco</span>}
                </span>
                <span className="text-lg font-black" lang="en">
                  {maskExplicit(c.term, s.explicit === true)}
                </span>
                <span className="text-sm text-muted">{c.es || "Sin traducción verificada todavía"}</span>
              </Link>
            </li>
          );
        })}
      </ul>
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
      <p className="flex items-start gap-2 text-xs text-muted">
        <Info size={14} className="mt-0.5 shrink-0" aria-hidden /> Frecuencia: wordfreq 3.1.1 (mezcla de corpus; no es un ranking canadiense). Significados: Wiktionary (CC BY-SA 4.0). Ejemplos: Tatoeba (CC BY 2.0 FR). El nivel es una estimación por frecuencia y las fichas tienen revisión automática, no de hablantes nativos.
      </p>
    </div>
  );
}

function Sel({ name, value, label, options }: { name: string; value: string; label: string; options: [string, string][] }) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select name={name} defaultValue={value} className="h-12 w-full rounded-[var(--r-md)] border border-line bg-surface px-3 font-semibold outline-none focus:border-accent">
        <option value="">{label}: todas</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
