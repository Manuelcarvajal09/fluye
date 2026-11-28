import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Palette } from "lucide-react";
import { requireProfile, settingsOf } from "@/lib/user";
import { lookOf } from "@/lib/look";
import { ownedSet } from "@/lib/economy";
import { PETS, ownsPet } from "@/lib/wardrobe";
import { SettingsForm } from "@/components/SettingsForm";
import { ExtraSettings } from "@/components/ExtraSettings";
import { seasonFor } from "@/lib/seasons";
import { localDay } from "@/lib/game";
import { SettingsTabs } from "@/components/SettingsTabs";
import { SETTINGS_TABS, type SettingsTab } from "@/lib/settings-tabs";

export const metadata = { title: "Ajustes" };

/** Ajustes solo para lo funcional (estudio, voz, experiencia y cuenta). El aspecto vive en el Armario → Estilo. */
export default async function SettingsPage({ searchParams }: PageProps<"/ajustes">) {
  const sp = await searchParams;
  // La pestaña Apariencia se mudó al Armario: los enlaces viejos llegan allí.
  if (sp.tab === "apariencia") redirect("/tienda?tab=temas");
  const profile = await requireProfile();
  const tab = (SETTINGS_TABS.find((t) => t.id === sp.tab)?.id ?? "estudio") as SettingsTab;
  const s = settingsOf(profile);
  const owned = await ownedSet(profile.userId);
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header>
        <h1 className="font-display text-4xl font-extrabold">Ajustes</h1>
        <p className="mt-1 text-muted">Se guardan solos al cambiar algo.</p>
      </header>
      <Link href="/tienda?tab=temas" className="module flex items-center gap-4 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
          <Palette size={22} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <b className="block">Tu estilo</b>
          <span className="block text-sm text-muted">Mascota, colores, modo claro u oscuro, temáticas y fondos están en el Armario.</span>
        </span>
        <ChevronRight size={20} className="text-muted" aria-hidden />
      </Link>
      <SettingsTabs initial={tab}>
        <SettingsForm
          initial={{
            name: profile.name,
            level: profile.level,
            goalMinutes: profile.goalMinutes,
            dailyNew: profile.dailyNew,
            topics: profile.topics ?? [],
            ...s,
            look: lookOf(s.look),
            ownedPets: PETS.filter((p) => ownsPet(p.id, owned)).map((p) => p.id),
          }}
        />
        <ExtraSettings
          initial={{
            season: s.season,
            celebrations: s.celebrations,
            social: s.social,
            explicit: s.explicit,
            hoy: s.hoy,
            currentSeason: seasonFor(localDay(profile.tz), s.season),
          }}
        />
      </SettingsTabs>
    </div>
  );
}
