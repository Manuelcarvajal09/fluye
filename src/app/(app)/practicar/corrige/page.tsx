import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { ERRORS, levelIndex } from "@/lib/content";
import { localDay } from "@/lib/game";
import { FixDrill } from "@/components/FixDrill";

export const metadata = { title: "Corrige la frase" };

/** Ronda nueva en cada visita (página dinámica por petición). */
function pickRandom<T>(arr: T[], n: number) {
  return [...arr].sort(() => Math.random() - 0.5).slice(0, n);
}

export default async function FixPage() {
  const profile = await requireProfile();
  const max = levelIndex(profile.level) + 1;
  const pool = ERRORS.filter((e) => levelIndex(e.level) <= max);
  const items = pickRandom(pool, 10);
  return (
    <div className="flex flex-col gap-5">
      <Link href="/practicar" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Practicar
      </Link>
      <h1 className="mx-auto w-full max-w-2xl text-3xl font-black">Corrige la frase</h1>
      <FixDrill items={items} dayId={`fix-${localDay(profile.tz)}`} />
    </div>
  );
}
