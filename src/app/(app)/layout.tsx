import { Suspense } from "react";
import { Notices } from "@/components/Notices";
import { noticesOf } from "@/lib/notifications";
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
import { ThemeGarland, ThemeParticles } from "@/components/theme/ThemeDecor";
import { perksOf } from "@/lib/perks";

async function NoticeBell({ profile }: { profile: Awaited<ReturnType<typeof requireProfile>> }) {
  const items = await noticesOf(profile).catch(() => []);
  return <Notices items={items} />;
}

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const base = await requireProfile();
  // Los repasos pendientes no dependen de protectores ni vidas: se piden a la vez.
  const [profile, due, perks] = await Promise.all([applyFreezes(base).then(dailyLife), dueCount(base.userId), perksOf(base.userId)]);
  const sp = settingsOf(profile).season;
  const today = localDay(profile.tz);
  const season = seasonFor(today, sp);
  return (
    <ProfileProviders profile={profile}>
      <ActivityTracker />
      <DayWatch />
      <div className="flex min-h-dvh" data-season-palette={sp?.palette === false || settingsOf(profile).themePack ? undefined : season}>
        <ThemeParticles />
        <Nav due={due} gems={profile.gems} />
        <div className="relative z-10 min-w-0 flex-1 pb-[calc(5.6rem+env(safe-area-inset-bottom))] lg:pb-0">
          <div className="mx-auto w-full max-w-6xl px-4 pt-[max(env(safe-area-inset-top),1.25rem)] pb-8 sm:px-6 lg:px-10 lg:pt-6 3xl:max-w-[100rem]">
            <StatBar wallet={{ ...walletOf(profile), streak: visibleStreak(profile.streak, profile.lastGoalDay, today) }} unlimited={perks.unlimitedLives}>
              {/* La campana llega por partes: no retrasa la página. */}
              <Suspense fallback={null}>
                <NoticeBell profile={profile} />
              </Suspense>
            </StatBar>
            <ThemeGarland />
            {children}
          </div>
        </div>
      </div>
    </ProfileProviders>
  );
}
