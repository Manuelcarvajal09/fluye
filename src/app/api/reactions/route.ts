import { z } from "zod";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";
import { areFriends } from "@/lib/social";
import { EMOJIS } from "@/lib/reactions";

/** Reacción (emoji) a la lectura del club o al resultado de liga de una amistad. Una por persona y objetivo. */
const Body = z.object({ to: z.string().max(80), target: z.string().regex(/^(reading:lectura-[a-z0-9-]+|league:\d{4}-\d{2}-\d{2})$/), emoji: z.enum(EMOJIS) });

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const { to, target, emoji } = parsed.data;
  if (to === profile.userId || !(await areFriends(profile.userId, to))) return Response.json({ error: "Solo entre amistades." }, { status: 403 });
  await db()
    .insert(schema.socialReactions)
    .values({ fromUser: profile.userId, toUser: to, target, emoji })
    .onConflictDoUpdate({ target: [schema.socialReactions.fromUser, schema.socialReactions.toUser, schema.socialReactions.target], set: { emoji, createdAt: new Date() } });
  return Response.json({ ok: true });
}
