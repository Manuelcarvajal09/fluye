import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { TENSES } from "@/lib/content";

export const metadata = { title: "Gramática" };

export default async function GrammarList() {
  const profile = await requireProfile();
  const done = new Map((await db().select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId))).map((r) => [r.lessonId, r.score]));
  return (
    <div className="flex flex-col gap-5">
      <Link href="/practicar" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Practicar
      </Link>
      <header>
        <h1 className="text-3xl font-black">Tiempos verbales y estructuras</h1>
        <p className="text-muted">Ordenados por utilidad práctica para comunicarte cuanto antes (no por frecuencia estadística).</p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
        {TENSES.map((t) => (
          <li key={t.id}>
            <Link href={`/practicar/gramatica/${t.id}`} className="card flex h-full flex-col gap-1 p-4 transition-transform hover:-translate-y-0.5">
              <span className="text-sm font-bold text-accent">#{t.order}</span>
              <span className="text-lg font-black" lang="en">
                {t.name_en}
              </span>
              <span className="text-muted">{t.title_es}</span>
              {done.has(t.id) && <span className="mt-auto pt-2 text-xs font-bold text-good">Practicado · {Math.round((done.get(t.id) ?? 0) * 100)}%</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
