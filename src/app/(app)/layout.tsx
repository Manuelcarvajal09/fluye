import { requireProfile, settingsOf } from "@/lib/user";
import { dueCount } from "@/lib/stats";
import { Nav } from "@/components/Nav";
import { ProfileProviders } from "@/components/ProfileProviders";
import { ActivityTracker } from "@/components/ActivityTracker";
import { DayWatch } from "@/components/DayWatch";
import { applyFreezes } from "@/lib/rewards";
import { dailyLife, walletOf } from "@/lib/economy";
import { seasonFor } from "@/lib/seasons";
import { localDay, visibleStreak } from "@/lib/game";
import { StatBar } from "@/components/StatBar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await dailyLife(await applyFreezes(await requireProfile()));
  const due = await dueCount(profile.userId);
  const sp = settingsOf(profile).season;
  const today = localDay(profile.tz);
  const season = seasonFor(today, sp);
  return (
    <ProfileProviders profile={profile}>
      <ActivityTracker />
      <DayWatch />
      <div className="flex min-h-dvh" data-season-palette={sp?.palette === false ? undefined : season}>
        <Nav due={due} gems={profile.gems} />
        <div className="min-w-0 flex-1 pb-[calc(4.6rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-8 sm:px-6 lg:px-10 lg:pt-6 3xl:max-w-[100rem]">
            <StatBar wallet={{ ...walletOf(profile), streak: visibleStreak(profile.streak, profile.lastGoalDay, today) }} />
            {children}
          </div>
        </div>
      </div>
    </ProfileProviders>
  );
}
