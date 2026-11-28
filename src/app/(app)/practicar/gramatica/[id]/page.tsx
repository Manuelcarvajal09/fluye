import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GraduationCap, Lightbulb } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { TENSES } from "@/lib/content";
import { AudioButton } from "@/components/ui";
import { GrammarPractice } from "@/components/GrammarPractice";
import type { Example } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/practicar/gramatica/[id]">) {
  const { id } = await params;
  return { title: TENSES.find((t) => t.id === id)?.name_en ?? "Gramática" };
}

function Examples({ list }: { list: Example[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {list.map((e) => (
        <li key={e.en} className="flex items-start gap-3 rounded-2xl bg-surface-2 p-3">
          <AudioButton text={e.en} size="sm" />
          <div>
            <p className="font-semibold" lang="en">
              {e.en}
            </p>
            <p className="text-muted">{e.es}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function TensePage({ params }: PageProps<"/practicar/gramatica/[id]">) {
  await requireProfile();
  const { id } = await params;
  const t = TENSES.find((x) => x.id === id);
  if (!t) notFound();
  const next = TENSES[TENSES.indexOf(t) + 1];
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Link href="/practicar/gramatica" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Gramática
      </Link>
      <header>
        <h1 className="flex flex-wrap items-center gap-2 text-3xl font-black">
          <span lang="en">{t.name_en}</span> {t.level && <span className="chip text-xs">{t.level}</span>}
        </h1>
        <p className="text-lg text-muted">{t.title_es}</p>
      </header>
      <section className="card flex flex-col gap-4 p-5">
        <p className="text-[1.05rem] leading-relaxed">{t.use_es}</p>
        {t.form && (
          <div className="grid gap-2 sm:grid-cols-3">
            {(
              [
                ["Afirmativa", t.form.aff],
                ["Negativa", t.form.neg],
                ["Pregunta", t.form.q],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface-2 p-3">
                <p className="text-xs font-black uppercase text-muted">{k}</p>
                <p className="font-bold" lang="en">
                  {v}
                </p>
              </div>
            ))}
          </div>
        )}
        {t.signals?.length ? (
          <p className="text-sm">
            <b>Palabras pista:</b> <span lang="en">{t.signals.join(" · ")}</span>
          </p>
        ) : null}
        {!t.steps?.length && <Examples list={t.examples} />}
      </section>

      {/* Explicación paso a paso: una idea por paso, con sus ejemplos. */}
      {t.steps?.map((s, i) => (
        <section key={s.title_es} className="card flex flex-col gap-3 p-5" aria-labelledby={`paso-${i}`}>
          <h2 id={`paso-${i}`} className="flex items-baseline gap-2 text-lg font-black">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-sm text-brand-ink">{i + 1}</span>
            {s.title_es}
          </h2>
          <p className="leading-relaxed">{s.body_es}</p>
          {s.table?.length ? (
            <table className="w-full overflow-hidden rounded-2xl text-sm">
              <tbody>
                {s.table.map(([a, b]) => (
                  <tr key={a} className="odd:bg-surface-2">
                    <td className="p-2.5 font-bold" lang="en">
                      {a}
                    </td>
                    <td className="p-2.5 text-muted">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          {s.examples?.length ? <Examples list={s.examples} /> : null}
        </section>
      ))}
      {t.steps?.length ? (
        <section className="card flex flex-col gap-3 p-5" aria-labelledby="mas-ejemplos">
          <h2 id="mas-ejemplos" className="text-lg font-black">
            Más ejemplos
          </h2>
          <Examples list={t.examples} />
        </section>
      ) : null}

      {t.mistakes_es && (
        <p className="flex gap-2 rounded-2xl bg-fire-soft p-4 text-sm">
          <Lightbulb size={18} className="shrink-0 text-fire" aria-hidden /> {t.mistakes_es}
        </p>
      )}
      {t.ielts_es && (
        <p className="flex gap-2 rounded-2xl bg-sky-soft p-4 text-sm">
          <GraduationCap size={18} className="shrink-0 text-sky" aria-hidden />
          <span>
            <b>En el IELTS:</b> {t.ielts_es}
          </span>
        </p>
      )}
      <GrammarPractice id={t.id} practice={t.practice} />
      {next && (
        <Link href={`/practicar/gramatica/${next.id}`} className="btn btn-ghost self-end">
          Siguiente: {next.name_en} →
        </Link>
      )}
    </div>
  );
}
