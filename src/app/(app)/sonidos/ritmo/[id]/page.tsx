import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { PROSODY } from "@/lib/content";
import { ProsodyDrills } from "@/components/ProsodyDrills";

export async function generateMetadata({ params }: PageProps<"/sonidos/ritmo/[id]">) {
  const { id } = await params;
  const p = PROSODY.find((x) => x.id === id);
  return { title: p?.title_es ?? "Ritmo" };
}

export default async function ProsodyPage({ params }: PageProps<"/sonidos/ritmo/[id]">) {
  await requireProfile();
  const id = (await params).id;
  const p = PROSODY.find((x) => x.id === id);
  if (!p) notFound();
  const next = PROSODY[PROSODY.indexOf(p) + 1];
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/sonidos" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Sonidos
      </Link>
      <header>
        <h1 className="text-3xl font-black">{p.title_es}</h1>
        <p className="mt-3 max-w-3xl text-[1.05rem] leading-relaxed">{p.explain_es}</p>
        <p className="mt-3 text-sm text-muted">
          Guía visual: <b>MAYÚSCULAS</b> = sílaba fuerte · <b>‿</b> o guion = se enlaza · <b>↗ ↘</b> = la voz sube o baja al final.
        </p>
      </header>
      <ProsodyDrills lesson={p} />
      {next && (
        <Link href={`/sonidos/ritmo/${next.id}`} className="btn btn-ghost self-end">
          Siguiente: {next.title_es} →
        </Link>
      )}
    </div>
  );
}
