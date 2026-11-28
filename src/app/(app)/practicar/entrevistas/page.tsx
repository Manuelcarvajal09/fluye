import Link from "next/link";
import { eq } from "drizzle-orm";
import { ArrowLeft, Check, MessagesSquare, Play } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { ROUTES, getScene } from "@/lib/content";
import { bandFor } from "@/lib/recommend";

export const metadata = { title: "Entrevistas de trabajo" };

/** Puestos agrupados por área. El id es el de la ruta en content/routes/. */
const GROUPS: { title: string; text: string; routes: string[] }[] = [
  { title: "Tecnología y sistemas", text: "Soporte, implementación, CRM, análisis y desarrollo.", routes: ["entrevista-soporte-ti", "entrevista-implementacion", "entrevista-desarrollo"] },
  { title: "Marketing y clientes", text: "Coordinación de marketing, onboarding de clientes, soporte y proyectos.", routes: ["entrevista-marketing", "entrevista-clientes"] },
  { title: "Ciencia y campo", text: "Asistente de laboratorio y técnico ambiental de campo.", routes: ["entrevista-biologia"] },
  { title: "Operaciones", text: "Control de inventarios y almacén.", routes: ["entrevista-inventarios"] },
  { title: "Para cualquier puesto", text: "Preguntas generales, respuestas STAR y negociación.", routes: ["entrevistas"] },
];
const LEVEL: Record<string, { label: string; text: string }> = {
  "A1-A2": { label: "Sencilla", text: "Respuestas cortas y claras" },
  "B1-B2": { label: "STAR", text: "Cuenta situaciones con resultados" },
  C1: { label: "Detallada", text: "Preguntas técnicas, objeciones y salario" },
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Simulador de entrevistas: elige el puesto y la dificultad; cada nivel es una misión con su conversación final. */
export default async function InterviewsPage() {
  const profile = await requireProfile();
  const done = new Set((await db().select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId))).map((r) => r.id));
  const mine = bandFor(profile.level);
  const byId = new Map(ROUTES.map((r) => [r.id, r]));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/practicar" className="flex items-center gap-2 text-sm font-extrabold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Practicar
      </Link>
      <header>
        <h1 className="font-display text-4xl font-extrabold">Entrevistas de trabajo</h1>
        <p className="mt-1 max-w-prose text-muted">
          Simulaciones de entrevistas en Edmonton por puesto, de una entrevista sencilla a una detallada con preguntas técnicas y negociación. Tu nivel sugerido está marcado.
        </p>
      </header>
      {GROUPS.map((g) => {
        const routes = g.routes.map((id) => byId.get(id)).filter((r) => !!r);
        if (!routes.length) return null;
        return (
          <section key={g.title} className="flex flex-col gap-3">
            <div>
              <h2 className="text-xl font-black">{g.title}</h2>
              <p className="text-sm text-muted">{g.text}</p>
            </div>
            <ul className="grid gap-4 lg:grid-cols-2">
              {routes.map((r) => {
                const scene = getScene(r.scene);
                return (
                <li key={r.id} className="module flex flex-col gap-3 overflow-hidden p-5">
                  {scene && (
                    // eslint-disable-next-line @next/next/no-img-element -- escena local ya optimizada (WebP 960 × 600)
                    <img src={scene.file} alt={scene.alt_es} width={960} height={600} loading="lazy" className="-mx-5 -mt-5 aspect-[16/10] w-[calc(100%+2.5rem)] max-w-none object-cover" />
                  )}
                  <div>
                    <h3 className="font-black">{cap(r.title_es.replace(/^Entrevista:\s*/i, ""))}</h3>
                    <p className="text-sm text-muted">{r.objective_es}</p>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {r.tracks.map((t) => {
                      const lv = LEVEL[t.band] ?? { label: t.band, text: "" };
                      const finished = done.has(t.lesson.id);
                      return (
                        <li key={t.id} className={`flex flex-wrap items-center gap-2 rounded-[var(--r-md)] p-2.5 ${t.band === mine ? "bg-brand-soft" : "bg-surface-2"}`}>
                          <span className="min-w-0 flex-1">
                            <b className="flex items-center gap-1.5">
                              {lv.label} <span className="text-xs font-bold text-muted">· {t.level} · {t.minutes} min</span>
                              {finished && <Check size={16} className="text-good" aria-label="hecha" />}
                            </b>
                            <span className="block text-xs text-muted">{lv.text}</span>
                          </span>
                          <Link href={`/sesion?mision=${t.id}&min=${Math.min(20, Math.max(10, Math.round(t.minutes / 5) * 5))}`} className="btn btn-primary h-10 min-h-10 px-3 text-sm" aria-label={`Empezar entrevista ${lv.label} de ${r.title_es}`}>
                            <Play size={16} fill="currentColor" aria-hidden /> Practicar
                          </Link>
                          <Link href={`/practicar/roleplay/${t.roleplay.id}`} className="btn btn-ghost h-10 min-h-10 px-3 text-sm" aria-label={`Solo la entrevista ${lv.label} de ${r.title_es}`}>
                            <MessagesSquare size={16} aria-hidden /> Solo la entrevista
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
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
