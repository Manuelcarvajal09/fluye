import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { getCatalogEntry, getItem, ITEMS, scenesForItem } from "@/lib/content";
import { goalOf, INTENSITY_ES, maskExplicit, REGISTER_ES } from "@/lib/realtalk";
import { ItemGoal } from "@/components/ItemGoal";
import { fmtInterval, MASTERY_DAYS } from "@/lib/srs";
import { plain } from "@/lib/types";
import { AREA_LABEL } from "@/lib/areas";
import { AudioButton, Highlight, TypeChip } from "@/components/ui";
import { LearnButton } from "@/components/LearnButton";

const MODE_ES = { recog: "Reconocer", prod: "Producir", listen: "Escuchar", speak: "Hablar" } as Record<string, string>;
const STATE_ES = ["Nueva", "Aprendiendo", "Repaso", "Reaprendiendo"];

export async function generateMetadata({ params }: PageProps<"/biblioteca/[id]">) {
  const it = getItem((await params).id);
  return { title: it?.term ?? "Expresión" };
}

export default async function ItemPage({ params }: PageProps<"/biblioteca/[id]">) {
  const profile = await requireProfile();
  const id = (await params).id;
  const it = getItem(id) ?? getCatalogEntry(id);
  if (!it) notFound();
  const cat = getCatalogEntry(id);
  const cards = await db().select().from(schema.cards).where(and(eq(schema.cards.userId, profile.userId), eq(schema.cards.itemId, it.id)));
  const suspended = cards.filter((c) => c.mode === "recog" || c.mode === "listen").some((c) => c.suspended);
  const st = settingsOf(profile);
  const ex = st.explicit === true;
  const m = (t: string) => maskExplicit(t, ex);
  const scenes = scenesForItem(it.id);
  const SHOW: Record<string, string> = { "big-bang-theory": "The Big Bang Theory", himym: "How I Met Your Mother", "helluva-boss": "Helluva Boss", "hazbin-hotel": "Hazbin Hotel", suits: "Suits", "the-mentalist": "The Mentalist", "bojack-horseman": "BoJack Horseman", sitcoms: "Sitcoms" };
  // Componente de servidor: se renderiza por petición, la hora actual es intencional.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const related = ITEMS.filter((o) => o.id !== it.id && (o.term.split(" ")[0] === it.term.split(" ")[0] || (it.syn ?? []).includes(o.term))).slice(0, 8);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href="/biblioteca" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Biblioteca
      </Link>
      <article className="card flex flex-col gap-5 p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <AudioButton text={it.term} size="lg" />
          <div className="min-w-0">
            <h1 className="font-display text-4xl font-extrabold leading-tight" lang="en">
              {m(it.term)}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-muted">
              {it.ipa && <span className="font-mono text-lg">{it.ipa}</span>}
              <TypeChip type={it.type} />
              <span className="chip">{it.level}</span>
              {it.areas.map((a) => (
                <Link key={a} href={`/biblioteca?area=${a}`} className="chip hover:text-text">
                  {AREA_LABEL[a] ?? a}
                </Link>
              ))}
              {it.tags?.includes("tv") && <span className="chip bg-fire-soft text-fire">Frecuente en series</span>}
              {it.sep !== undefined && <span className="chip">{it.sep ? "Separable" : "Inseparable"}</span>}
            </p>
          </div>
        </div>
        {it.full && (
          <p className="rounded-2xl bg-accent-soft p-3 text-lg">
            Forma completa: <b lang="en">{it.full}</b>
          </p>
        )}
        <p className="text-3xl font-extrabold text-brand-ink">{m(it.es)}</p>
        {it.register && (
          <section className="grid gap-3 rounded-[var(--r-md)] border border-line p-4 sm:grid-cols-2" aria-label="Cómo y cuándo se usa">
            <p className="sm:col-span-2 flex flex-wrap gap-2 text-sm font-bold">
              <span className={`chip ${it.register === "offensive" || it.register === "vulgar" ? "bg-bad-soft text-bad" : "bg-accent-soft text-accent"}`}>{REGISTER_ES[it.register]}</span>
              {it.intensity !== undefined && <span className="chip">Intensidad: {INTENSITY_ES[it.intensity] ?? it.intensity}</span>}
              {it.confidence === "low" && <span className="chip bg-fire-soft text-fire">Sentido variable según región o grupo</span>}
            </p>
            {it.intent_es && <Info2 t="Qué quiere hacer quien lo dice" v={m(it.intent_es)} />}
            {it.tone_es && <Info2 t="Efecto en la relación" v={m(it.tone_es)} />}
            {it.situations_es && <Info2 t="Situaciones e interpretaciones" v={m(it.situations_es)} />}
            {it.softer && <Info2 t="Alternativa más suave" v={it.softer} en />}
          </section>
        )}
        {it.shows?.length ? (
          <p className="text-sm text-muted">
            Útil para ver: {it.shows.map((x) => SHOW[x] ?? x).join(", ")} (por el tipo de conversaciones; los ejemplos son originales, no citas).
          </p>
        ) : null}
        {scenes.map((sc) => (
          <figure key={sc.id} className="overflow-hidden rounded-[var(--r-md)] border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element -- SVG local */}
            <img src={sc.file} alt={sc.alt_es} width={400} height={240} loading="lazy" className="w-full" />
            <figcaption className="p-3 text-sm">
              <b lang="en">{sc.caption_en}</b> <span className="text-muted">— {sc.sense_es ?? sc.caption_es}</span>
              <details className="expand mt-1">
                <summary className="text-xs font-bold text-muted">Descripción detallada</summary>
                <p className="expand-body mt-1 text-xs text-muted">{sc.long_es}</p>
              </details>
            </figcaption>
          </figure>
        ))}
        <p className="text-lg text-muted" lang="en">
          {it.def}
        </p>
        <ul className="flex flex-col gap-3">
          {it.ex.map((e, n) => (
            <li key={n} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-4">
              <AudioButton text={plain(e.en)} size="sm" />
              <AudioButton text={plain(e.en)} size="sm" slow />
              <div>
                <p className="text-lg font-semibold" lang="en">
                  <Highlight text={m(e.en)} />
                </p>
                <p className="text-muted">{m(e.es)}</p>
              </div>
            </li>
          ))}
        </ul>
        {it.note && (
          <p className="flex gap-2 rounded-2xl bg-fire-soft p-4">
            <Lightbulb size={20} className="shrink-0 text-fire" aria-hidden /> {it.note}
          </p>
        )}
        {it.syn?.length ? <p className="text-sm text-muted">Parecidos: {it.syn.join(", ")}</p> : null}
        {cat && (
          <p className="rounded-[var(--r-md)] bg-surface-2 p-3 text-xs text-muted">
            Del catálogo: frecuencia #{cat.rank} (wordfreq 3.1.1) · significado de Wiktionary (CC BY-SA 4.0) · ejemplos de Tatoeba (CC BY 2.0 FR{cat.ex.some((e) => e.by) ? `; autores: ${[...new Set(cat.ex.map((e) => e.by).filter(Boolean))].join(", ")}` : ""}) · nivel {cat.level} estimado por frecuencia · revisión automática, sin revisión humana.
            {cat.status === "pending" ? " Ficha pendiente: falta traducción o ejemplo verificado, por eso aún no se puede estudiar." : ""}
          </p>
        )}
        {(!cat || cat.status === "complete") && <ItemGoal itemId={it.id} goal={goalOf(it, st.goals?.[it.id])} known={(st.known ?? []).includes(it.id)} suggestUnderstand={it.register === "offensive" || it.goal === "understand"} />}
        {(!cat || cat.status === "complete") && <LearnButton itemId={it.id} learning={cards.length > 0} suspended={suspended} />}
      </article>

      {cards.length > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-black">Tu memoria de esta expresión</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {cards.map((c) => (
              <li key={c.mode} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2">
                <span className="font-bold">{MODE_ES[c.mode]}</span>
                <span className="text-sm text-muted">
                  {STATE_ES[c.state]} · estabilidad {c.stability.toFixed(1)} d · {c.due.getTime() <= now ? "pendiente" : `en ${fmtInterval(c.due.getTime() - now)}`}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Se considera dominada cuando reconoces, produces y entiendes de oído con estabilidad de {MASTERY_DAYS}+ días.</p>
        </section>
      )}

      {related.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-black">Relacionadas</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <Link key={r.id} href={`/biblioteca/${r.id}`} className="chip !px-3 !py-1.5 !text-sm hover:text-text">
                {r.term}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info2({ t, v, en }: { t: string; v: string; en?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold text-muted">{t}</p>
      <p className="text-sm" lang={en ? "en" : undefined}>
        {v}
      </p>
    </div>
  );
}
