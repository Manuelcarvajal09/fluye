import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { isOwner } from "@/lib/access";
import { usageReport } from "@/lib/usage";
import { ERROR_LABEL, type ErrorCategory } from "@/lib/grading";
import { Bar } from "@/components/ui";

export const metadata = { title: "Datos de uso" };
const MODE: Record<string, string> = { recog: "Reconocer", prod: "Producir (escribir)", listen: "Escuchar", speak: "Hablar" };

/** Datos de uso de todos los miembros para mejorar la app. Solo propietario; para cualquier otra cuenta no existe. */
export default async function UsagePage({ searchParams }: PageProps<"/admin/datos">) {
  const profile = await requireProfile();
  if (!isOwner(profile.userId)) notFound();
  const sp = await searchParams;
  const days = [7, 30, 90].includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const r = await usageReport(days);
  const s = r.sessions;
  const hints: string[] = [];
  if (s && s.sessions >= 5 && s.finished / s.sessions < 0.7) hints.push(`Solo se termina el ${Math.round((s.finished / s.sessions) * 100)} % de las sesiones: conviene acortarlas o revisar en qué paso se abandonan.`);
  for (const m of r.byMinutes) if (m.median_min && m.sessions >= 3 && m.median_min > m.minutes * 1.3) hints.push(`Las sesiones de ${m.minutes} min duran en realidad ${m.median_min} min de mediana: hay que bajar pasos.`);
  for (const m of r.byMode) if (m.n >= 20 && m.accuracy < 65) hints.push(`«${MODE[m.mode] ?? m.mode}» tiene ${m.accuracy} % de acierto: es el tipo de ejercicio más difícil ahora mismo.`);
  if (r.errors[0]) hints.push(`El error más común es «${ERROR_LABEL[r.errors[0].category as ErrorCategory] ?? r.errors[0].category}» (${r.errors[0].n} veces, ${r.errors[0].people} personas): vale la pena reforzarlo con gramática o tutor.`);
  if (r.funnel && r.funnel.onboarded > r.funnel.studied) hints.push(`${r.funnel.onboarded - r.funnel.studied} cuenta(s) terminaron el registro pero nunca estudiaron: revisar el primer paso tras la bienvenida.`);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Administrar
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-extrabold">Datos de uso</h1>
          <p className="mt-1 max-w-prose text-muted">Lo que la app ya registra de todos los miembros, resumido para decidir qué mejorar. No incluye respuestas ni grabaciones de nadie.</p>
        </div>
        <div className="seg" role="group" aria-label="Periodo">
          {[7, 30, 90].map((n) => (
            <Link key={n} href={`/admin/datos?dias=${n}`} aria-current={n === days ? "true" : undefined} className={n === days ? "!bg-surface !text-text shadow-sm" : ""}>
              {n} días
            </Link>
          ))}
        </div>
      </header>

      {hints.length > 0 && (
        <section className="tip-card flex-col !gap-2" aria-labelledby="pistas">
          <h2 id="pistas" className="font-black">
            Qué mirar primero
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {hints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Sesiones", s?.sessions ?? 0, `${s?.finished ?? 0} terminadas`],
          ["Se completa", s?.avg_done_pct != null ? `${s.avg_done_pct} %` : "—", "de los pasos, en promedio"],
          ["Duración real", s?.median_min != null ? `${s.median_min} min` : "—", "mediana de las terminadas"],
          ["Cuentas", r.funnel?.onboarded ?? 0, `${r.funnel?.studied ?? 0} han estudiado · ${r.funnel?.week2 ?? 0} con 7+ días`],
        ].map(([k, v, t]) => (
          <div key={String(k)} className="module p-4">
            <p className="text-xs font-bold text-muted">{k}</p>
            <p className="font-display text-3xl font-extrabold">{v}</p>
            <p className="text-sm text-muted">{t}</p>
          </div>
        ))}
      </section>

      <section className="module p-5" aria-labelledby="duracion">
        <h2 id="duracion" className="mb-3 text-xl font-black">
          Sesiones por duración elegida
        </h2>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-1">Elegida</th>
              <th>Empezadas</th>
              <th>Terminadas</th>
              <th>Duración real (mediana)</th>
            </tr>
          </thead>
          <tbody>
            {r.byMinutes.map((m) => (
              <tr key={m.minutes} className="border-t border-line">
                <td className="py-1.5 font-bold">{m.minutes} min</td>
                <td>{m.sessions}</td>
                <td>
                  {m.finished} ({m.sessions ? Math.round((m.finished / m.sessions) * 100) : 0} %)
                </td>
                <td>{m.median_min != null ? `${m.median_min} min` : "—"}</td>
              </tr>
            ))}
            {r.byMinutes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-muted">
                  Sin sesiones en este periodo.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="module p-5" aria-labelledby="modos">
          <h2 id="modos" className="mb-3 text-xl font-black">
            Acierto por tipo de ejercicio
          </h2>
          <ul className="flex flex-col gap-3">
            {r.byMode.map((m) => (
              <li key={m.mode}>
                <p className="flex justify-between text-sm font-bold">
                  <span>{MODE[m.mode] ?? m.mode}</span>
                  <span className="text-muted">
                    {m.accuracy} % · {m.n} respuestas{m.avg_s ? ` · ${m.avg_s} s` : ""}
                  </span>
                </p>
                <Bar value={m.accuracy} max={100} color={m.accuracy < 65 ? "var(--bad)" : "var(--good)"} className="mt-1 h-2" label={`Acierto en ${MODE[m.mode] ?? m.mode}`} />
              </li>
            ))}
            {r.byMode.length === 0 && <li className="text-muted">Sin respuestas en este periodo.</li>}
          </ul>
        </section>
        <section className="module p-5" aria-labelledby="errores">
          <h2 id="errores" className="mb-3 text-xl font-black">
            Errores más comunes
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {r.errors.map((e) => (
              <li key={e.category} className="flex justify-between gap-3">
                <span className="font-bold">{ERROR_LABEL[e.category as ErrorCategory] ?? e.category}</span>
                <span className="text-muted">
                  {e.n} veces · {e.people} {e.people === 1 ? "persona" : "personas"}
                </span>
              </li>
            ))}
            {r.errors.length === 0 && <li className="text-muted">Sin errores clasificados en este periodo.</li>}
          </ul>
        </section>
      </div>

      <section className="module p-5" aria-labelledby="dificiles">
        <h2 id="dificiles" className="mb-1 text-xl font-black">
          Expresiones que más cuestan
        </h2>
        <p className="mb-3 text-sm text-muted">Con al menos 3 intentos y 2 fallos. Candidatas a mejor explicación, mejores ejemplos o a bajar de nivel.</p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {r.hardest.map((h) => (
            <li key={h.id}>
              <Link href={`/biblioteca/${h.id}`} className="flex items-center justify-between gap-3 rounded-[var(--r-md)] bg-surface-2 px-3 py-2">
                <span className="min-w-0">
                  <b className="block truncate" lang="en">
                    {h.term}
                  </b>
                  <span className="block truncate text-xs text-muted">
                    {h.level} · {h.es}
                  </span>
                </span>
                <span className="shrink-0 text-right text-sm font-black text-bad">
                  {h.failPct} %<span className="block text-xs font-bold text-muted">{h.n} intentos · {h.people} pers.</span>
                </span>
              </Link>
            </li>
          ))}
          {r.hardest.length === 0 && <li className="text-muted">Aún no hay suficientes intentos.</li>}
        </ul>
      </section>

      <section className="module overflow-x-auto p-5" aria-labelledby="miembros">
        <h2 id="miembros" className="mb-3 text-xl font-black">
          Por miembro
        </h2>
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="text-left text-xs text-muted">
            <tr>
              <th className="py-1">Nombre</th>
              <th>Nivel</th>
              <th>Días activos</th>
              <th>Sesiones</th>
              <th>Respuestas</th>
              <th>Acierto</th>
              <th>Minutos</th>
              <th>Racha</th>
              <th>Último día</th>
            </tr>
          </thead>
          <tbody>
            {r.members.map((m, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-1.5 font-bold">{m.name}</td>
                <td>{m.level}</td>
                <td>{m.days}</td>
                <td>
                  {m.finished}/{m.sessions}
                </td>
                <td>{m.reviews}</td>
                <td>{m.accuracy != null ? `${m.accuracy} %` : "—"}</td>
                <td>{m.minutes}</td>
                <td>{m.streak}</td>
                <td>{m.lastDay ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">
          Usan otras funciones: test de nivel {r.funnel?.placement ?? 0} · diario {r.funnel?.journal ?? 0} · lecturas {r.funnel?.readings ?? 0} · con amistades {r.funnel?.friends ?? 0}.
        </p>
      </section>
    </div>
  );
}
