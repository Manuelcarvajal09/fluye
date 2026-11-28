import Link from "next/link";
import { eq } from "drizzle-orm";
import { Check } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { ROUTES } from "@/lib/content";
import { bandFor } from "@/lib/recommend";
import { RouteIcon } from "@/components/RouteIcon";

export const metadata = { title: "Misiones por tema" };

export default async function Routes() {
  const profile = await requireProfile();
  const done = new Set((await db().select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId))).map((d) => d.id));
  const band = bandFor(profile.level);
  // Las entrevistas por puesto viven agrupadas en /practicar/entrevistas (aquí, una sola tarjeta).
  const interviews = ROUTES.filter((r) => r.id.startsWith("entrevista-"));
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold">Misiones por tema</h1>
        <p className="mt-1 max-w-prose text-muted">Cada tema tiene una pista básica (A1–A2), una intermedia (B1–B2) y, en varios, una avanzada (C1). Todas usan tus mismas tarjetas: lo que ya sabes no se repite como nuevo.</p>
      </header>
      <ul className="grid gap-4 md:grid-cols-2 3xl:grid-cols-3">
        <li>
          <Link href="/practicar/entrevistas" className="module flex h-full gap-4 p-5 ring-2 ring-accent/40">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
              <RouteIcon name="briefcase" size={26} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-black">Entrevistas por puesto</span>
              <span className="block text-sm text-muted">{interviews.length} puestos en Edmonton, de una entrevista sencilla a una detallada con preguntas técnicas y negociación.</span>
            </span>
          </Link>
        </li>
        {ROUTES.filter((r) => !r.id.startsWith("entrevista-")).map((r) => (
          <li key={r.id}>
            <Link href={`/rutas/${r.id}`} className="module flex h-full gap-4 p-5">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">
                <RouteIcon name={r.icon} size={26} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-black">{r.title_es}</span>
                <span className="block text-sm text-muted">{r.objective_es}</span>
                <span className="mt-3 flex flex-wrap gap-2">
                  {r.tracks.map((t) => (
                    <span key={t.id} className={`chip ${t.band === band ? "bg-accent-soft text-accent" : ""}`}>
                      {done.has(t.lesson.id) && <Check size={13} aria-label="hecha" />} {t.band} · {t.minutes} min
                    </span>
                  ))}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {!ROUTES.length && <p className="text-muted">Aún no hay misiones.</p>}
    </div>
  );
}
