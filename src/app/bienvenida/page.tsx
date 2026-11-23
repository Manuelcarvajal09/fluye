import { redirect } from "next/navigation";
import { requireProfile, settingsOf } from "@/lib/user";
import { lookOf } from "@/lib/look";
import { Onboarding } from "@/components/Onboarding";
import { ProfileProviders } from "@/components/ProfileProviders";

export const metadata = { title: "Bienvenida" };

export default async function Welcome() {
  const profile = await requireProfile({ allowNotOnboarded: true });
  if (profile.onboardedAt) redirect("/hoy");
  return (
    <ProfileProviders profile={profile}>
      <Onboarding name={profile.name} level={profile.level} areas={profile.topics?.length ? profile.topics : ["conversacion", "series", "canada"]} minutes={profile.goalMinutes} look={lookOf(settingsOf(profile).look)} />
    </ProfileProviders>
  );
}
