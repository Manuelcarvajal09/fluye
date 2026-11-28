import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { TENSES } from "@/lib/content";
import { GROUP_INFO, groupOf } from "@/lib/grammar";

export const metadata = { title: "Gramática" };

/** Gramática por bloques: tiempos verbales, estructuras, escritura y conversación (las dos últimas, pensadas para el IELTS). */
export default async function GrammarList() {
  const profile = await requireProfile();
  const done = new Map((await db().select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId))).map((r) => [r.lessonId, r.score]));
  return (
    <div className="flex flex-col gap-6">
      <Link href="/practicar" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Practicar
      </Link>
      <header>
        <h1 className="text-3xl font-black">Gramática</h1>
        <p className="max-w-prose text-muted">Explicada paso a paso, con errores típicos de hispanohablantes y práctica con la razón de cada respuesta. Los bloques de escritura y conversación preparan para el IELTS.</p>
      </header>
      <Link href="/practicar/ielts" className="hero-card flex items-center gap-4 p-5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface text-brand-ink">
          <GraduationCap size={26} aria-hidden />
        </span>
        <span className="min-w-0">
          <b className="block text-lg leading-tight">Guía del IELTS</b>
          <span className="block text-sm text-muted">Cómo es el examen, cómo se califica y qué practicar en Fluye para cada parte.</span>
        </span>
      </Link>
      {GROUP_INFO.map((g) => {
        const units = TENSES.filter((t) => groupOf(t) === g.id);
        if (!units.length) return null;
        return (
          <section key={g.id} className="flex flex-col gap-3" aria-labelledby={`g-${g.id}`}>
            <div>
              <h2 id={`g-${g.id}`} className="text-xl font-black">
                {g.title}
              </h2>
              <p className="text-sm text-muted">{g.text}</p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
              {units.map((t) => (
                <li key={t.id}>
                  <Link href={`/practicar/gramatica/${t.id}`} className="card flex h-full flex-col gap-1 p-4 transition-transform hover:-translate-y-0.5">
                    <span className="flex items-center justify-between gap-2 text-sm font-bold text-accent">
                      #{t.order} {t.level && <span className="chip text-xs">{t.level}</span>}
                    </span>
                    <span className="text-lg font-black" lang="en">
                      {t.name_en}
                    </span>
                    <span className="text-muted">{t.title_es}</span>
                    {done.has(t.id) && <span className="mt-auto pt-2 text-xs font-bold text-good">Practicado · {Math.round((done.get(t.id) ?? 0) * 100)}%</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
