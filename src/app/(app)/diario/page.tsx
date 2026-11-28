import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db, schema } from "@/db";
import { requireProfile } from "@/lib/user";
import { localDay } from "@/lib/game";
import { entryOf, monthOf } from "@/lib/journal";
import { promptsForDay } from "@/lib/journal-prompts";
import { quoteOfDay } from "@/lib/quotes";
import { JournalToday, MOOD_FACE } from "@/components/journal/JournalToday";

export const metadata = { title: "Diario" };

const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const shiftMonth = (m: string, n: number) => {
  const [y, mo] = m.split("-").map(Number);
  const d = new Date(Date.UTC(y, mo - 1 + n, 1));
  return d.toISOString().slice(0, 7);
};

/** Diario: el día en menos de un minuto (ánimo, inglés, preguntas opcionales y fotos) y el mes en una cuadrícula de ánimo. */
export default async function JournalPage({ searchParams }: PageProps<"/diario">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const today = localDay(profile.tz);
  const day = typeof sp.dia === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.dia) && sp.dia <= today ? sp.dia : today;
  const month = typeof sp.mes === "string" && /^\d{4}-\d{2}$/.test(sp.mes) ? sp.mes : day.slice(0, 7);
  const [entry, days, [stats]] = await Promise.all([
    entryOf(profile.userId, day),
    monthOf(profile.userId, month),
    db().select().from(schema.dailyStats).where(and(eq(schema.dailyStats.userId, profile.userId), eq(schema.dailyStats.day, day))),
  ]);
  const quote = quoteOfDay(day);
  const studied = stats
    ? `${day === today ? "Hoy" : "Ese día"}: ${Math.round((stats.seconds ?? 0) / 60)} min de estudio · ${stats.reviews} ejercicios · ${stats.newItems} expresiones nuevas · ${stats.xp} XP`
    : `${day === today ? "Hoy aún no" : "Ese día no"} hay estudio registrado.`;

  // Cuadrícula del mes (lunes primero).
  const [y, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;
  const count = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const byDay = new Map(days.map((d) => [d.day, d]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="font-display text-4xl font-extrabold">Diario</h1>
        <p className="text-muted">Un minuto al día para ver cómo vas con tu inglés y con tu vida.</p>
      </header>

      <figure className="hero-card flex flex-col gap-1 p-5">
        <blockquote lang="en" className="font-display text-xl font-extrabold leading-snug">
          “{quote.en}”
        </blockquote>
        <figcaption className="text-sm text-muted">{quote.es}</figcaption>
      </figure>

      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-xl font-black">{day === today ? "Hoy" : new Date(`${day}T12:00:00Z`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" })}</h2>
        {day !== today && (
          <Link href="/diario" className="text-sm font-extrabold text-brand-ink underline-offset-4 hover:underline">
            Volver a hoy
          </Link>
        )}
      </div>
      <JournalToday key={day} initial={entry} prompts={promptsForDay(day, 3)} studied={studied} />

      <section className="module flex flex-col gap-3 p-5" aria-labelledby="mes">
        <div className="flex items-center justify-between">
          <Link href={`/diario?mes=${shiftMonth(month, -1)}&dia=${day}`} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2" aria-label="Mes anterior">
            <ChevronLeft size={20} aria-hidden />
          </Link>
          <h2 id="mes" className="text-lg font-black capitalize">
            {MONTHS[m - 1]} {y}
          </h2>
          {month < today.slice(0, 7) ? (
            <Link href={`/diario?mes=${shiftMonth(month, 1)}&dia=${day}`} className="grid h-10 w-10 place-items-center rounded-full bg-surface-2" aria-label="Mes siguiente">
              <ChevronRight size={20} aria-hidden />
            </Link>
          ) : (
            <span className="h-10 w-10" />
          )}
        </div>
        <ol className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold">
          {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
            <li key={`h${i}`} className="text-muted" aria-hidden>
              {d}
            </li>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <li key={`e${i}`} aria-hidden />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const dd = `${month}-${String(i + 1).padStart(2, "0")}`;
            const info = byDay.get(dd);
            const future = dd > today;
            return (
              <li key={dd}>
                {future ? (
                  <span className="grid aspect-square place-items-center rounded-[var(--r-sm)] text-muted/50">{i + 1}</span>
                ) : (
                  <Link href={`/diario?dia=${dd}&mes=${month}`} aria-label={`${i + 1}${info?.mood ? `, ánimo ${info.mood} de 5` : ""}${info?.photos ? `, ${info.photos} fotos` : ""}`} className={`relative grid aspect-square place-items-center rounded-[var(--r-sm)] ${dd === day ? "ring-2 ring-brand" : ""} ${info ? "bg-brand-soft" : "bg-surface-2"}`}>
                    {info?.mood ? <span className="text-lg" aria-hidden>{MOOD_FACE[info.mood]}</span> : <span>{i + 1}</span>}
                    {info?.photos ? <span className="absolute bottom-0.5 right-1 text-[9px]" aria-hidden>📷</span> : null}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
