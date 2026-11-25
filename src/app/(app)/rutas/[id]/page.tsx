import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, Check, ChevronDown, Clock, MessagesSquare, Play } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { getItem, getRoute, getScene } from "@/lib/content";
import { bandFor } from "@/lib/recommend";
import { RouteIcon } from "@/components/RouteIcon";
import { AudioButton } from "@/components/ui";

const SKILL: Record<string, string> = { listen: "Escuchar", read: "Leer", speak: "Hablar", write: "Escribir" };
const BAND_LABEL: Record<string, string> = { "A1-A2": "Básica", "B1-B2": "Intermedia", C1: "Avanzada" };

export async function generateMetadata({ params }: PageProps<"/rutas/[id]">) {
  return { title: getRoute((await params).id)?.title_es ?? "Misión" };
}

export default async function RoutePage({ params }: PageProps<"/rutas/[id]">) {
  const profile = await requireProfile();
  const route = getRoute((await params).id);
  if (!route) notFound();
  const done = new Set((await db().select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId))).map((r) => r.id));
  const mine = bandFor(profile.level);
  const scene = getScene(route.scene);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/rutas" className="flex items-center gap-2 text-sm font-extrabold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Misiones por tema
      </Link>
      <header className="hero-card grid items-center gap-5 p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="flex items-center gap-2 font-black text-brand-ink">
            <RouteIcon name={route.icon} size={18} /> Misión temática
          </p>
          <h1 className="font-display text-4xl font-extrabold">{route.title_es}</h1>
          <p className="mt-2 max-w-prose text-muted">{route.objective_es}</p>
        </div>
        {scene && (
          // eslint-disable-next-line @next/next/no-img-element -- SVG local
          <img src={scene.file} alt={scene.alt_es} width={400} height={250} className="w-full max-w-sm rounded-[var(--r-lg)]" />
        )}
      </header>

      <ul className="grid gap-4 lg:grid-cols-2 3xl:grid-cols-3">
        {route.tracks.map((t) => {
          const items = t.items.map(getItem).filter((x) => !!x);
          const isMine = t.band === mine;
          return (
            <li key={t.id} className={`module flex flex-col gap-4 p-5 ${isMine ? "ring-2 ring-accent" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-accent">
                    {BAND_LABEL[t.band]} · {t.band}
                    {isMine ? " · tu nivel" : ""}
                  </p>
                  <h2 className="text-xl font-black">{t.objective_es}</h2>
                </div>
                {done.has(t.lesson.id) && (
                  <span className="chip bg-good-soft text-good">
                    <Check size={14} aria-hidden /> Hecha
                  </span>
                )}
              </div>
              <p className="flex flex-wrap gap-2 text-sm font-bold text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={15} aria-hidden /> {t.minutes} min
                </span>
                {t.skills.map((k) => (
                  <span key={k}>· {SKILL[k] ?? k}</span>
                ))}
                <span>· {items.length} expresiones</span>
              </p>
              <details className="expand rounded-[var(--r-md)] bg-surface-2 p-3">
                <summary className="flex items-center justify-between text-sm font-extrabold">
                  Lo que vas a usar <ChevronDown size={16} className="chev" aria-hidden />
                </summary>
                <div className="expand-body">
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {items.map((it) => (
                      <li key={it.id}>
                        <Link href={`/biblioteca/${it.id}`} className="chip bg-surface">
                          {it.term}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {t.repair.length > 0 && (
                    <ul className="mt-3 flex flex-col gap-2">
                      {t.repair.map((p) => (
                        <li key={p.en} className="flex items-center gap-2 text-sm">
                          <AudioButton text={p.en} size="sm" /> <b>{p.en}</b> <span className="text-muted">— {p.situation_es}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </details>
              <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                <Link href={`/sesion?mision=${t.id}&min=${Math.min(20, Math.max(10, Math.round(t.minutes / 5) * 5))}`} className="btn btn-primary grow">
                  <Play size={18} fill="currentColor" aria-hidden /> Empezar misión
                </Link>
                <Link href={`/practicar/roleplay/${t.roleplay.id}`} className="btn btn-ghost">
                  <MessagesSquare size={18} aria-hidden /> Solo la conversación
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
