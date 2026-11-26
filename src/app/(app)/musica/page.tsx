import { requireProfile, settingsOf } from "@/lib/user";
import { MUSIC } from "@/lib/content";
import { MusicPractice } from "@/components/MusicPractice";

export const metadata = { title: "Música" };

export default async function MusicPage() {
  const profile = await requireProfile();
  const s = settingsOf(profile);
  const explicit = s.explicit === true;
  const list = MUSIC.filter((m) => explicit || !m.explicit);
  return <MusicPractice exercises={list} hiddenExplicit={MUSIC.length - list.length} initialFragments={s.fragments ?? []} />;
}
