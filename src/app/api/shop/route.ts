import { z } from "zod";
import { eq } from "drizzle-orm";
import { apiProfile, settingsOf } from "@/lib/user";
import { buyFreeze } from "@/lib/rewards";
import { activateBoost, activateShield, buyBoost, buyItem, openChest, ownedSet, walletOf } from "@/lib/economy";
import { lookOf } from "@/lib/look";
import { missingFor, sanitizeWear, PET_IDS } from "@/lib/wardrobe";
import { db, schema } from "@/db";

/** Tienda y armario. Todo se valida en el servidor (precio, saldo, propiedad). `key` hace idempotente cada operación. */
const KEY = z.string().min(8).max(64);
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("buy"), kind: z.enum(["piece", "pet"]), id: z.string().max(40), key: KEY }),
  z.object({ action: z.literal("chest"), chest: z.string().max(20), key: KEY }),
  z.object({ action: z.literal("boost-buy"), key: KEY }),
  z.object({ action: z.literal("boost-use"), key: KEY }),
  z.object({ action: z.literal("shield"), key: KEY }),
  z.object({ action: z.literal("freeze") }),
  z.object({ action: z.literal("equip"), species: z.enum(PET_IDS as [string, ...string[]]), wear: z.array(z.string().max(40)).max(8) }),
]);

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = p.data;
  const out = (r: unknown) => Response.json(r, { status: (r as { ok: boolean }).ok ? 200 : 409 });
  switch (b.action) {
    case "buy":
      return out(await buyItem(profile, b.kind, b.id, b.key));
    case "chest":
      return out(await openChest(profile, b.chest, b.key));
    case "boost-buy":
      return out(await buyBoost(profile, b.key));
    case "boost-use":
      return out(await activateBoost(profile, b.key));
    case "shield":
      return out(await activateShield(profile, b.key));
    case "freeze": {
      const r = await buyFreeze(profile);
      return out(r.ok ? { ...r, wallet: { ...walletOf(profile), gems: r.gems } } : r);
    }
    case "equip": {
      const s = settingsOf(profile);
      const prev = lookOf(s.look);
      const next = { ...prev, species: b.species as typeof prev.species, sets: { ...prev.sets, [b.species]: sanitizeWear(b.wear) } };
      const missing = missingFor(next, await ownedSet(profile.userId));
      if (missing) return Response.json({ ok: false, error: `Aún no tienes: ${missing}.` }, { status: 403 });
      await db()
        .update(schema.profiles)
        .set({ settings: { ...s, look: next } })
        .where(eq(schema.profiles.userId, profile.userId));
      return Response.json({ ok: true, look: next });
    }
  }
}
