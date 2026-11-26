import Link from "next/link";
import { and, eq, like } from "drizzle-orm";
import { requireProfile } from "@/lib/user";
import { SERIES, levelIndex } from "@/lib/content";
import { db, schema } from "@/db";
import { IcoTv } from "@/components/Icons";

export const metadata = { title: "Inglés de series" };

const GENRE_ES: Record<string, string> = { sitcom: "Comedia", drama: "Drama", policial: "Policial", medica: "Médica", oficina: "Oficina", romance: "Romance", scifi: "Ciencia ficción", thriller: "Thriller", amigos: "Amigos", noticias: "Noticias", juzgado: "Juzgado" };
const GOAL: Record<string, string> = {
  B1: "Entender la idea general de la escena.",
  B2: "Seguir una conversación natural a velocidad real.",
  C1: "Captar matices, sarcasmo y lo que no se dice.",
  C2: "Interpretar ambigüedad, juegos de palabras y referencias culturales.",
};

/** Itinerario de «Inglés de series»: escenas originales por nivel, con la comprensión medida en cada una. */
export default async function SeriesPage() {
  const profile = await requireProfile();
  const done = await db()
    .select({ id: schema.lessonProgress.lessonId, score: schema.lessonProgress.score })
    .from(schema.lessonProgress)
    .where(and(eq(schema.lessonProgress.userId, profile.userId), like(schema.lessonProgress.lessonId, "ser-%")));
  const best = new Map(done.map((d) => [d.id, d.score]));
  const levels = ["B1", "B2", "C1", "C2"] as const;
  const mine = Math.max(2, levelIndex(profile.level));
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="eyebrow">Escuchar sin subtítulos</p>
        <h1 className="flex items-center gap-3 font-display text-4xl font-extrabold">
          <IcoTv size={40} /> Inglés de series
        </h1>
        <p className="mt-1 max-w-2xl text-muted">Escenas originales escritas para Fluye. Primero las escuchas sin texto, luego la ayuda se va abriendo: contexto, expresiones, subtítulos, intención, shadowing y tu respuesta.</p>
      </header>
      {SERIES.length === 0 && <p className="module p-5 text-muted">Todavía no hay escenas publicadas.</p>}
      {levels.map((lv) => {
        const list = SERIES.filter((s) => s.level === lv);
        if (!list.length) return null;
        const avg = list.filter((s) => best.has(s.id));
        return (
          <section key={lv} className="flex flex-col gap-3" aria-labelledby={`lv-${lv}`}>
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id={`lv-${lv}`} className="font-display text-2xl font-black">
                  {lv} {levelIndex(lv) === mine && <span className="chip ml-1 bg-accent-soft text-accent">Tu nivel</span>}
                </h2>
                <p className="text-sm text-muted">{GOAL[lv]}</p>
              </div>
              {avg.length > 0 && (
                <p className="text-sm font-bold text-muted">
                  {avg.length}/{list.length} hechas · comprensión media {Math.round((avg.reduce((a, s) => a + (best.get(s.id) ?? 0), 0) / avg.length) * 100)} %
                </p>
              )}
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((s) => {
                const sc = best.get(s.id);
                return (
                  <li key={s.id}>
                    <Link href={`/series/${s.id}`} className="module flex h-full flex-col gap-1 p-4">
                      <span className="text-xs font-black uppercase tracking-wide text-muted">{GENRE_ES[s.genre] ?? s.genre}</span>
                      <span className="font-display text-xl font-black" lang="en">
                        {s.title}
                      </span>
                      <span className="text-sm text-muted">{s.setting_es}</span>
                      <span className={`mt-auto pt-2 text-sm font-black ${sc === undefined ? "text-accent" : sc >= 0.75 ? "text-good" : "text-fire"}`}>{sc === undefined ? "Empezar" : `Comprensión ${Math.round(sc * 100)} %`}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
