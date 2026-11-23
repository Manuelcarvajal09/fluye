import { requireProfile, settingsOf } from "@/lib/user";
import { lookOf } from "@/lib/look";
import { SettingsForm } from "@/components/SettingsForm";
import { ExtraSettings } from "@/components/ExtraSettings";
import { seasonFor } from "@/lib/seasons";
import { localDay } from "@/lib/game";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const profile = await requireProfile();
  const s = settingsOf(profile);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <h1 className="font-display text-4xl font-extrabold">Ajustes</h1>
      <SettingsForm
        initial={{
          name: profile.name,
          level: profile.level,
          goalMinutes: profile.goalMinutes,
          dailyNew: profile.dailyNew,
          topics: profile.topics ?? [],
          ...s,
          look: lookOf(s.look),
        }}
      />
      <ExtraSettings initial={{ season: s.season, celebrations: s.celebrations, social: s.social, explicit: s.explicit, hoy: s.hoy, currentSeason: seasonFor(localDay(profile.tz), s.season) }} />
    </div>
  );
}
