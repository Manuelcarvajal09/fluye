import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { ArrowLeft } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { clubReading, getReading } from "@/lib/readings";
import { leagueWeek } from "@/lib/league-rules";
import { Reader } from "@/components/reading/Reader";
import { ReadingQuiz } from "@/components/reading/ReadingClient";

export async function generateMetadata({ params }: PageProps<"/lecturas/[id]">) {
  return { title: getReading((await params).id)?.title_es ?? "Lectura" };
}

export default async function ReadingPage({ params }: PageProps<"/lecturas/[id]">) {
  const profile = await requireProfile();
  const r = getReading((await params).id);
  if (!r) notFound();
  const [done] = await db().select().from(schema.readingProgress).where(and(eq(schema.readingProgress.userId, profile.userId), eq(schema.readingProgress.readingId, r.id)));
  const isClub = clubReading(leagueWeek())?.id === r.id;

  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-5">
      <Link href="/lecturas" className="flex items-center gap-2 text-sm font-extrabold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Lecturas
      </Link>
      <header className="flex flex-col gap-1">
        <p className="eyebrow">
          {r.level} · {r.minutes} min{isClub ? " · Club de la semana" : ""}
        </p>
        <h1 className="font-display text-3xl font-extrabold" lang="en">
          {r.title}
        </h1>
        <p className="text-muted">{r.intro_es}</p>
      </header>
      <Reader paragraphs={r.paragraphs} glossary={r.glossary} />
      <details className="module p-4">
        <summary className="cursor-pointer font-black">Glosario ({r.glossary.length})</summary>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {r.glossary.map((g) => (
            <div key={g.term} className="rounded-[var(--r-md)] bg-surface-2 p-2">
              <dt className="font-black" lang="en">
                {g.term}
              </dt>
              <dd className="text-sm">{g.es}</dd>
            </div>
          ))}
        </dl>
      </details>
      <section className="flex flex-col gap-3" aria-labelledby="preguntas">
        <h2 id="preguntas" className="text-xl font-black">
          ¿Lo entendiste?
        </h2>
        <ReadingQuiz id={r.id} questions={[r.main_idea, ...r.questions]} club={isClub} done={done ? { score: done.score, total: done.total } : undefined} />
      </section>
    </article>
  );
}
