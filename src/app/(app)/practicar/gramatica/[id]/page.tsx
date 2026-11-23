import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lightbulb } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { TENSES } from "@/lib/content";
import { AudioButton } from "@/components/ui";
import { GrammarPractice } from "@/components/GrammarPractice";

export async function generateMetadata({ params }: PageProps<"/practicar/gramatica/[id]">) {
  const { id } = await params;
  return { title: TENSES.find((t) => t.id === id)?.name_en ?? "Gramática" };
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
        <h1 className="text-3xl font-black" lang="en">
          {t.name_en}
        </h1>
        <p className="text-lg text-muted">{t.title_es}</p>
      </header>
      <section className="card flex flex-col gap-4 p-5">
        <p className="text-[1.05rem] leading-relaxed">{t.use_es}</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            ["Afirmativa", t.form.aff],
            ["Negativa", t.form.neg],
            ["Pregunta", t.form.q],
          ] as const).map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-surface-2 p-3">
              <p className="text-xs font-black uppercase text-muted">{k}</p>
              <p className="font-bold" lang="en">
                {v}
              </p>
            </div>
          ))}
        </div>
        {t.signals?.length ? (
          <p className="text-sm">
            <b>Palabras pista:</b> <span lang="en">{t.signals.join(" · ")}</span>
          </p>
        ) : null}
        <ul className="flex flex-col gap-2">
          {t.examples.map((e) => (
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
        {t.mistakes_es && (
          <p className="flex gap-2 rounded-2xl bg-fire-soft p-3 text-sm">
            <Lightbulb size={18} className="shrink-0 text-fire" aria-hidden /> {t.mistakes_es}
          </p>
        )}
      </section>
      <GrammarPractice id={t.id} practice={t.practice} />
      {next && (
        <Link href={`/practicar/gramatica/${next.id}`} className="btn btn-ghost self-end">
          Siguiente: {next.name_en} →
        </Link>
      )}
    </div>
  );
}
