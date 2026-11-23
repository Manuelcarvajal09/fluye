import { requireProfile, settingsOf } from "@/lib/user";
import { PLACEMENT } from "@/lib/content";
import { PlacementTest, type PublicQ } from "@/components/PlacementTest";

export const metadata = { title: "Test de nivel" };

const ORDER = ["grammar", "vocab", "reading", "listening"] as const;

export default async function TestPage() {
  const profile = await requireProfile();
  // Sin respuestas ni explicaciones: se califica en el servidor.
  const qs: PublicQ[] = [...PLACEMENT]
    .sort((a, b) => ORDER.indexOf(a.section) - ORDER.indexOf(b.section) || (a.group ?? a.id).localeCompare(b.group ?? b.id) || a.id.localeCompare(b.id))
    .map(({ id, section, level, prompt, options, passage, audio, group }) => ({ id, section, level, prompt, options, passage, audio, group }));
  return <PlacementTest questions={qs} previous={settingsOf(profile).placement ?? null} currentLevel={profile.level} />;
}
