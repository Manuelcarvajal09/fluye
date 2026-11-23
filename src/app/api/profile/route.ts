import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile, settingsOf } from "@/lib/user";
import { AREA_IDS } from "@/lib/areas";
import { ACCENT_IDS, ACCESSORY_IDS, OUTFIT_IDS, SPECIES_IDS, lookOf, ownsLook } from "@/lib/look";
import { ownedItems } from "@/lib/rewards";

const MD = z.string().regex(/^d{2}-d{2}$/);
const SEASON = z.enum(["navidad", "invierno", "primavera", "verano", "otono", "neutral"]);

const Body = z.object({
  name: z.string().trim().max(40).optional(),
  level: z.enum(["A1", "A2", "B1", "B2", "C1"]).optional(),
  goalMinutes: z.union([z.literal(5), z.literal(10), z.literal(15), z.literal(20)]).optional(),
  dailyNew: z.number().int().min(0).max(40).optional(),
  topics: z.array(z.enum(AREA_IDS as [string, ...string[]])).max(AREA_IDS.length).optional(),
  tz: z.string().max(60).optional(),
  onboarded: z.boolean().optional(),
  settings: z
    .object({
      theme: z.enum(["system", "light", "dark"]).optional(),
      voice: z.string().max(120).optional(),
      rate: z.number().min(0.5).max(1.5).optional(),
      accent: z.enum(["en-US", "en-CA"]).optional(),
      retention: z.number().min(0.8).max(0.97).optional(),
      reminder: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      autoplay: z.boolean().optional(),
      sfx: z.boolean().optional(),
      engine: z.enum(["hd", "device"]).optional(),
      hdVoice: z.string().max(40).optional(),
      look: z
        .object({
          accent: z.enum(ACCENT_IDS as [string, ...string[]]).optional(),
          species: z.enum(SPECIES_IDS as [string, ...string[]]).optional(),
          name: z.string().trim().max(16).optional(),
          color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
          accessory: z.enum(ACCESSORY_IDS as [string, ...string[]]).optional(),
          outfit: z.enum(OUTFIT_IDS as [string, ...string[]]).optional(),
        })
        .optional(),
      season: z
        .object({
          mode: z.enum(["auto", "manual", "off"]).optional(),
          manual: SEASON.optional(),
          region: z.enum(["CA", "US", "MX"]).optional(),
          holidays: z.boolean().optional(),
          palette: z.boolean().optional(),
          decor: z.boolean().optional(),
          content: z.boolean().optional(),
          ranges: z.record(SEASON, z.object({ start: MD, end: MD })).optional(),
          simDate: z.union([z.string().regex(/^d{4}-d{2}-d{2}$/), z.literal("")]).optional(),
        })
        .optional(),
      celebrations: z.boolean().optional(),
      social: z.boolean().optional(),
      explicit: z.boolean().optional(),
      hoy: z.record(z.enum(["week", "load", "goal", "achievement", "theme", "challenges"]), z.boolean()).optional(),
      goals: z.record(z.string().max(100), z.enum(["understand", "use", "both"])).optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const { onboarded, settings, tz, ...rest } = parsed.data;
  if (tz) {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
    } catch {
      return Response.json({ error: "zona horaria inválida" }, { status: 400 });
    }
  }
  // Lo cosmético de tienda solo se puede equipar si se compró (validado aquí, no en el cliente).
  if (settings?.look) {
    const next = lookOf({ ...settingsOf(profile).look, ...settings.look } as never);
    if (!ownsLook(next, await ownedItems(profile.userId))) return Response.json({ error: "Aún no tienes ese objeto." }, { status: 403 });
  }
  const prev = settingsOf(profile);
  const patch = {
      ...rest,
      ...(tz ? { tz } : {}),
      ...(settings
        ? {
            settings: {
              ...prev,
              ...settings,
              look: { ...prev.look, ...settings.look },
              season: { ...prev.season, ...settings.season },
              hoy: { ...prev.hoy, ...settings.hoy },
              goals: { ...prev.goals, ...settings.goals },
            },
          }
        : {}),
      ...(onboarded && !profile.onboardedAt ? { onboardedAt: new Date() } : {}),
  };
  // Nada que cambiar (p. ej. "onboarded" repetido): no es un error.
  if (Object.keys(patch).length) await db().update(schema.profiles).set(patch).where(eq(schema.profiles.userId, profile.userId));
  return Response.json({ ok: true });
}
