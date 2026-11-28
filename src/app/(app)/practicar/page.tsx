import Link from "next/link";
import { eq } from "drizzle-orm";
import { Briefcase, ClipboardCheck, MessagesSquare, PenLine, BookMarked, Tv, Quote, GraduationCap } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { ITEMS, ROLEPLAYS, ROUTES, TENSES, ERRORS, PLACEMENT } from "@/lib/content";
import { AREA_LABEL } from "@/lib/areas";

export const metadata = { title: "Practicar" };

export default async function Practice() {
  const profile = await requireProfile();
  const done = new Map((await db().select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId))).map((r) => [r.lessonId, r.score]));
  const placement = settingsOf(profile).placement;
  const mine = new Set(profile.topics ?? []);
  const roleplays = [...ROLEPLAYS].sort((a, b) => Number(mine.has(b.area)) - Number(mine.has(a.area)) || a.level.localeCompare(b.level));
  const tvCount = ITEMS.filter((i) => i.tags?.includes("tv")).length;
  const conCount = ITEMS.filter((i) => i.type === "contraction").length;
  const interviewRoutes = ROUTES.filter((r) => r.id.startsWith("entrevista-")).length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-black">Practicar</h1>
        <p className="text-muted">Usar el inglés de verdad: conversaciones, corrección de errores y gramática en contexto.</p>
      </header>

      <div className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-5">
        <Tile href="/practicar/entrevistas" icon={<Briefcase size={24} aria-hidden />} title="Entrevistas de trabajo" text={`${interviewRoutes} puestos (soporte TI, implementación, desarrollo, marketing, clientes, laboratorio, inventarios) en 3 dificultades`} highlight />
        <Tile href="/practicar/test" icon={<ClipboardCheck size={24} aria-hidden />} title="Test de nivel completo" text={placement ? `Último: ${placement.level} (${Math.round((placement.score / placement.total) * 100)}%). Repítelo cuando quieras.` : `${PLACEMENT.length} preguntas · ≈30 min · A1–C1`} highlight={!placement} />
        <Tile href="/practicar/corrige" icon={<PenLine size={24} aria-hidden />} title="Corrige la frase" text={`${ERRORS.length} errores típicos de hispanohablantes`} />
        <Tile href="/practicar/gramatica" icon={<BookMarked size={24} aria-hidden />} title="Gramática" text={`${TENSES.length} unidades: tiempos, estructuras, escritura y conversación`} />
        <Tile href="/practicar/ielts" icon={<GraduationCap size={24} aria-hidden />} title="Guía del IELTS" text="Cómo es el examen, cómo se califica y qué practicar para cada parte" />
        <Tile href="/biblioteca?type=contraction" icon={<Quote size={24} aria-hidden />} title="Contracciones" text={`${conCount} formas como wanna, gonna, gotta: qué significan y cuándo usarlas`} />
        <Tile href="/biblioteca?tag=tv" icon={<Tv size={24} aria-hidden />} title="Phrasal verbs de series" text={`${tvCount} de los más frecuentes en series y películas`} />
      </div>

      <section>
        <h2 className="mb-1 flex items-center gap-2 text-xl font-black">
          <MessagesSquare size={22} className="text-accent" aria-hidden /> Conversaciones guiadas
        </h2>
        <p className="mb-3 text-sm text-muted">El personaje te habla; respondes hablando o escribiendo. Recibes corrección, versión natural y un resumen. Evaluación por reglas (no es un chat con IA).</p>
        <ul className="stagger grid gap-3 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
          {roleplays.map((r) => (
            <li key={r.id}>
              <Link href={`/practicar/roleplay/${r.id}`} className="card flex h-full flex-col gap-1 p-4 transition-transform hover:-translate-y-0.5">
                <span className="flex items-center gap-2 text-xs font-bold">
                  <span className={`chip ${mine.has(r.area) ? "bg-accent-soft text-accent" : ""}`}>{AREA_LABEL[r.area] ?? r.area}</span>
                  <span className="chip">{r.level}</span>
                  {done.has(r.id) && <span className="ml-auto text-good">✓ {Math.round((done.get(r.id) ?? 0) * 100)}%</span>}
                </span>
                <span className="text-lg font-black">{r.title_es}</span>
                <span className="text-sm text-muted">{r.turns.length} turnos</span>
              </Link>
            </li>
          ))}
        </ul>
        {!roleplays.length && <p className="text-muted">Las conversaciones se están preparando.</p>}
      </section>
    </div>
  );
}

function Tile({ href, icon, title, text, highlight }: { href: string; icon: React.ReactNode; title: string; text: string; highlight?: boolean }) {
  return (
    <Link href={href} className={`card flex items-start gap-4 p-4 transition-transform hover:-translate-y-0.5 ${highlight ? "ring-2 ring-accent" : ""}`}>
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-ink">{icon}</span>
      <span>
        <span className="block font-black">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </Link>
  );
}
