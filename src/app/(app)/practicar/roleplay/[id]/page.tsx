import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { ERRORS, getRoleplay } from "@/lib/content";
import { AREA_LABEL } from "@/lib/areas";
import { RoleplayRunner } from "@/components/RoleplayRunner";

export async function generateMetadata({ params }: PageProps<"/practicar/roleplay/[id]">) {
  const { id } = await params;
  return { title: getRoleplay(id)?.title_es ?? "Roleplay" };
}

export default async function RoleplayPage({ params }: PageProps<"/practicar/roleplay/[id]">) {
  const profile = await requireProfile();
  const { id } = await params;
  const raw = getRoleplay(id);
  if (!raw) notFound();
  // Los personajes te llaman por tu nombre (el contenido usa el marcador {name}, nunca nombres reales).
  const first = profile.name.split(" ")[0] || "there";
  const rp = JSON.parse(JSON.stringify(raw).replaceAll("{name}", first.replace(/[^\p{L}\s.'-]/gu, ""))) as typeof raw;
  return (
    <div className="flex flex-col gap-5">
      <Link href="/practicar" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Practicar
      </Link>
      <header className="mx-auto w-full max-w-2xl">
        <p className="text-sm font-bold text-accent">
          {AREA_LABEL[rp.area]} · {rp.level}
        </p>
        <h1 className="text-3xl font-black">{rp.title_es}</h1>
        <p className="text-muted">{rp.setting_es}</p>
      </header>
      <RoleplayRunner rp={rp} bank={ERRORS} />
    </div>
  );
}
