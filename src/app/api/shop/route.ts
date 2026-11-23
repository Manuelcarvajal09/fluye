import { z } from "zod";
import { eq } from "drizzle-orm";
import { apiProfile, settingsOf } from "@/lib/user";
import { buy, ownedItems } from "@/lib/rewards";
import { lookOf, ownsLook, type Look } from "@/lib/look";
import { db, schema } from "@/db";

/** Compra o equipa cosméticos. Todo validado en el servidor (precio, saldo, propiedad). */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("buy"), itemId: z.string().max(40) }),
  z.object({ action: z.literal("equip"), look: z.object({ accessory: z.string().max(20).optional(), outfit: z.string().max(20).optional(), color: z.string().max(9).optional() }) }),
]);

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  if (p.data.action === "buy") {
    const r = await buy(profile, p.data.itemId);
    return Response.json(r, { status: r.ok ? 200 : 409 });
  }
  const s = settingsOf(profile);
  const next = lookOf({ ...s.look, ...(p.data.look as Partial<Look>) });
  if (!ownsLook(next, await ownedItems(profile.userId))) return Response.json({ ok: false, error: "Aún no tienes ese objeto." }, { status: 403 });
  await db()
    .update(schema.profiles)
    .set({ settings: { ...s, look: next } })
    .where(eq(schema.profiles.userId, profile.userId));
  return Response.json({ ok: true, look: next });
}
