import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { newsOf, recentNews, todayNews } from "@/lib/news";
import { vocabIn } from "@/lib/dictionary";
import { Reader } from "@/components/reading/Reader";
import { ReadingQuiz } from "@/components/reading/ReadingClient";

export const metadata = { title: "Noticia de Canadá" };
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

/** Preguntas de vocabulario a partir de palabras reales del texto (con distractores del mismo texto). */
function vocabQuiz(body: string[], level: number, seed: string) {
  const words = vocabIn(body, Math.max(1, level), 12);
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const pick = words.slice(0, 3);
  return pick.map((w, i) => {
    const others = words.filter((x) => x.term !== w.term && x.es !== w.es);
    const d1 = others[(h + i) % Math.max(1, others.length)]?.es ?? "una cosa";
    const d2 = others[(h + i + 3) % Math.max(1, others.length)]?.es ?? "un lugar";
    const opts = [w.es, d1, d2 === d1 ? "ninguna de las anteriores" : d2];
    const pos = (h + i) % 3;
    [opts[0], opts[pos]] = [opts[pos], opts[0]];
    return { q: `In this news, "${w.term}" means…`, options: opts, answer: pos, why_es: `«${w.term}» = ${w.es}.` };
  });
}

/** Noticia de Canadá del día (comunicados oficiales de canada.ca) con ayuda de lectura y preguntas de vocabulario. */
export default async function NewsPage({ searchParams }: PageProps<"/noticias">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const day = typeof sp.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) ? sp.dia : null;
  const [news, archive] = await Promise.all([day ? newsOf(day) : todayNews(), recentNews(14)]);
  if (!news)
    return (
      <div className="empty-state">
        <h1 className="font-display text-2xl font-extrabold">Aún no hay noticia</h1>
        <p className="max-w-sm text-muted">No pudimos traer la noticia de hoy. Inténtalo más tarde.</p>
      </div>
    );
  const id = `news:${news.day}`;
  const [done] = await db().select().from(schema.readingProgress).where(and(eq(schema.readingProgress.userId, profile.userId), eq(schema.readingProgress.readingId, id)));
  const quiz = vocabQuiz(news.body, LEVELS.indexOf(profile.level), news.day);

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <p className="eyebrow">Noticia de Canadá · {new Date(`${news.day}T12:00:00Z`).toLocaleDateString("es-MX", { day: "numeric", month: "long" })}</p>
        <h1 className="font-display text-3xl font-extrabold leading-tight" lang="en">
          {news.title}
        </h1>
        <p className="text-sm text-muted">
          {news.source}
          {"stale" in news && news.stale ? " · No pudimos traer la de hoy; esta es la más reciente." : ""}
        </p>
      </header>
      <Reader paragraphs={news.body} />
      <p className="rounded-[var(--r-md)] bg-surface-2 p-3 text-xs text-muted">
        «{news.title}», {news.source}. Copia de la versión publicada en{" "}
        <a href={news.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline">
          canada.ca <ExternalLink size={12} aria-hidden />
        </a>
        . Reproducida sin fines comerciales, según los términos de uso de canada.ca. Fluye no está afiliada al Gobierno de Canadá.
      </p>
      {quiz.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="vocab">
          <h2 id="vocab" className="text-xl font-black">
            Vocabulario de la noticia
          </h2>
          <ReadingQuiz id={id} questions={quiz} done={done ? { score: done.score, total: done.total } : undefined} />
        </section>
      )}
      {archive.length > 1 && (
        <section className="flex flex-col gap-2" aria-labelledby="anteriores">
          <h2 id="anteriores" className="text-lg font-black">
            Días anteriores
          </h2>
          <ul className="flex flex-col gap-1">
            {archive
              .filter((a) => a.day !== news.day)
              .map((a) => (
                <li key={a.day}>
                  <Link href={`/noticias?dia=${a.day}`} className="flex gap-2 rounded-[var(--r-md)] p-2 text-sm hover:bg-surface-2">
                    <span className="shrink-0 font-bold text-muted">{a.day.slice(5)}</span>
                    <span lang="en">{a.title}</span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </article>
  );
}
