import { z } from "zod";
import { eq } from "drizzle-orm";
import { apiProfile } from "@/lib/user";
import { addFriend, respondFriend } from "@/lib/social";
import { settleAwards } from "@/lib/economy";
import { db, schema } from "@/db";
import type { Profile } from "@/lib/user";

/** Amistades: agregar por código, aceptar o rechazar, quitar. */
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("add"), code: z.string().min(4).max(20) }),
  z.object({ action: z.literal("respond"), id: z.string().min(3).max(80), accept: z.boolean() }),
  z.object({ action: z.literal("remove"), id: z.string().min(3).max(80) }),
]);

/** Al quedar aceptada una amistad, las dos personas reciben su logro (una sola vez cada una). */
async function settleBoth(me: Profile, otherId: string) {
  const [other] = await db().select().from(schema.profiles).where(eq(schema.profiles.userId, otherId));
  const [mine] = await Promise.all([settleAwards(me), other ? settleAwards(other) : Promise.resolve([])]);
  return mine;
}

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = p.data;
  if (b.action === "add") {
    const r = await addFriend(profile, b.code);
    const awards = r.ok && r.status === "accepted" ? await settleBoth(profile, r.id) : [];
    return Response.json({ ...r, awards }, { status: r.ok ? 200 : 404 });
  }
  if (b.action === "respond") {
    const ok = await respondFriend(profile, b.id, b.accept);
    const awards = ok && b.accept ? await settleBoth(profile, b.id) : [];
    return Response.json({ ok, awards });
  }
  await respondFriend(profile, b.id, false);
  return Response.json({ ok: true });
}
