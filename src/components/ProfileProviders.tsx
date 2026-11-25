import type { ReactNode } from "react";
import { settingsOf, type Profile } from "@/lib/user";
import { lookOf } from "@/lib/look";
import { LookProvider } from "./Coach";
import { Prefs } from "./Prefs";
import { VoiceNotice } from "./VoiceNotice";

/** Aplica preferencias (voz, tema, sonidos, color) y comparte el aspecto de la mascota con los componentes de cliente. */
export function ProfileProviders({ profile, children }: { profile: Profile; children: ReactNode }) {
  const s = settingsOf(profile);
  const look = lookOf(s.look);
  return (
    <LookProvider look={{ ...look }} celebrations={s.celebrations !== false}>
      <Prefs theme={s.theme} voice={s.voice} rate={s.rate} accent={s.accent} autoplay={s.autoplay} tz={profile.tz} engine={s.engine} hdVoice={s.hdVoice} sfx={s.sfx} colorAccent={look.accent} motion={s.motion} />
      <VoiceNotice />
      {children}
    </LookProvider>
  );
}
