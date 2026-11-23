import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Look } from "./look";
import { accessFor } from "./access";
import type { SeasonPrefs } from "./seasons";

export type Profile = typeof schema.profiles.$inferSelect;

/** Devuelve el perfil (lo crea la primera vez). Redirige a login o al onboarding cuando toca. */
export async function requireProfile(opts: { allowNotOnboarded?: boolean } = {}): Promise<Profile> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  if ((await accessFor(userId)) === "denied") redirect("/sin-acceso");
  const profile = await getOrCreateProfile(userId);
  if (!profile.onboardedAt && !opts.allowNotOnboarded) redirect("/bienvenida");
  return profile;
}

/** Para route handlers: null si no hay sesión o la cuenta no tiene acceso (invitación/miembro activo). */
export async function apiProfile(): Promise<Profile | null> {
  const { userId } = await auth();
  if (!userId) return null;
  if ((await accessFor(userId)) === "denied") return null;
  return getOrCreateProfile(userId);
}

async function getOrCreateProfile(userId: string) {
  const [found] = await db().select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  if (found) return found;
  const u = await currentUser();
  const preset = presetFor(u?.emailAddresses.map((e) => e.emailAddress) ?? []);
  const [created] = await db()
    .insert(schema.profiles)
    .values({ userId, name: preset?.name ?? u?.firstName ?? "", ...(preset?.level ? { level: preset.level } : {}), ...(preset?.topics ? { topics: preset.topics } : {}), ...(preset?.goalMinutes ? { goalMinutes: preset.goalMinutes } : {}), ...(preset?.dailyNew ? { dailyNew: preset.dailyNew } : {}) })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const [again] = await db().select().from(schema.profiles).where(eq(schema.profiles.userId, userId));
  return again;
}

type Preset = { name?: string; level?: string; topics?: string[]; goalMinutes?: number; dailyNew?: number };

/**
 * Configuración inicial por correo, definida en la variable de entorno PROFILE_PRESETS
 * (JSON {"correo": {...}}). Así los correos no quedan en el código.
 */
function presetFor(emails: string[]): Preset | null {
  try {
    const all = JSON.parse(process.env.PROFILE_PRESETS ?? "{}") as Record<string, Preset>;
    for (const e of emails) {
      const p = all[e.toLowerCase()];
      if (p) return p;
    }
  } catch {}
  return null;
}

export type Settings = {
  theme?: "system" | "light" | "dark";
  voice?: string;
  rate?: number;
  accent?: "en-US" | "en-CA";
  retention?: number;
  reminder?: string;
  autoplay?: boolean;
  sfx?: boolean;
  engine?: "hd" | "device";
  hdVoice?: string;
  look?: Partial<Look>;
  placement?: PlacementResult;
  season?: SeasonPrefs;
  /** Celebraciones y confeti al acertar/terminar (se pueden apagar). */
  celebrations?: boolean;
  /** Retos privados con amistades (desactivado por defecto; nada es público). */
  social?: boolean;
  /** Lenguaje explícito: muestra groserías completas (sin asteriscos). */
  explicit?: boolean;
  /** Módulos visibles en Hoy. */
  hoy?: Partial<Record<"week" | "load" | "goal" | "achievement" | "theme" | "challenges", boolean>>;
  /** Por expresión: "understand" (solo entenderla) | "use" | "both". */
  goals?: Record<string, "understand" | "use" | "both">;
  /** Fragmentos privados guardados por la persona (música, series). */
  /** Ítems que la persona declaró como "ya la conozco" (declaración, no dominio). */
  known?: string[];
  fragments?: { id: string; text: string; note: string }[];
};

export type PlacementResult = {
  date: string;
  level: string;
  score: number;
  total: number;
  bySection: Record<string, { right: number; total: number }>;
  byLevel: Record<string, { right: number; total: number }>;
};

export const settingsOf = (p: Profile) => (p.settings ?? {}) as Settings;
