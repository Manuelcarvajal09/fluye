import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { SOUNDS } from "@/lib/content";
import { AudioButton } from "@/components/ui";
import { SoundTrainer } from "@/components/SoundTrainer";

export async function generateMetadata({ params }: PageProps<"/sonidos/[id]">) {
  const { id } = await params;
  const s = SOUNDS.find((x) => x.id === id);
  return { title: s ? `/${s.symbol}/` : "Sonido" };
}

export default async function SoundPage({ params }: PageProps<"/sonidos/[id]">) {
  await requireProfile();
  const id = (await params).id;
  const s = SOUNDS.find((x) => x.id === id);
  if (!s) notFound();
  const idx = SOUNDS.indexOf(s);
  const next = SOUNDS[idx + 1];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <Link href="/sonidos" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Sonidos
      </Link>
      <header className="flex items-center gap-4">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-accent-soft font-mono text-3xl font-black text-accent">/{s.symbol}/</span>
        <div>
          <h1 className="text-3xl font-black">{s.name_es}</h1>
          <p className="text-muted">{s.pairs.length} pares mínimos · {s.words.length} palabras · {s.phrases.length} frases</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card flex flex-col gap-4 p-5">
          <Block title="Cómo se produce" text={s.how_es} />
          <Block title="Comparado con el español" text={s.vs_es} />
          <Block title="Error típico" text={s.mistake_es} tone="bad" />
          <Block title="Truco" text={s.tip_es} tone="fire" />
        </section>
        <section className="card flex flex-col gap-3 p-5">
          <h2 className="text-lg font-black">Palabras con este sonido</h2>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {s.words.map((w) => (
              <li key={w.word} className="flex items-center gap-3 rounded-xl bg-surface-2 p-2">
                <AudioButton text={w.word} size="sm" />
                <span className="font-bold" lang="en">
                  {w.word}
                </span>
                <span className="ml-auto font-mono text-sm text-muted">{w.ipa}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <SoundTrainer sound={s} />

      {next && (
        <Link href={`/sonidos/${next.id}`} className="btn btn-ghost self-end">
          Siguiente: /{next.symbol}/ {next.name_es} →
        </Link>
      )}
    </div>
  );
}

function Block({ title, text, tone }: { title: string; text: string; tone?: "bad" | "fire" }) {
  return (
    <div className={tone === "bad" ? "rounded-2xl bg-bad-soft p-3" : tone === "fire" ? "rounded-2xl bg-fire-soft p-3" : ""}>
      <h2 className="text-sm font-black uppercase tracking-wide text-muted">{title}</h2>
      <p className="mt-1 text-[1.05rem] leading-relaxed">{text}</p>
    </div>
  );
}
