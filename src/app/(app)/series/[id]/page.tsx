import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/user";
import { getSeries } from "@/lib/content";
import { SeriesPlayer } from "@/components/series/SeriesPlayer";

export const metadata = { title: "Inglés de series" };

export default async function SeriesScenePage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const scene = getSeries((await params).id);
  if (!scene) notFound();
  return <SeriesPlayer scene={scene} />;
}
