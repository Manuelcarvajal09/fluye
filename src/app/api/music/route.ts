import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { apiProfile } from "@/lib/user";
import { db, schema } from "@/db";
import { MUSIC } from "@/lib/content";

/** Marca un ejercicio de música como hecho (o lo desmarca). Se guarda en settings.musicDone con una sola actualización atómica. */
const Body = z.object({ id: z.string().max(64), done: z.boolean() });

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success || !MUSIC.some((m) => m.id === p.data.id)) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const P = schema.profiles;
  const list = sql`coalesce(${P.settings}->'musicDone', '[]'::jsonb)`;
  const next = p.data.done
    ? sql`case when ${list} ? ${p.data.id} then ${list} else ${list} || to_jsonb(${p.data.id}::text) end`
    : sql`(select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements_text(${list}) x where x <> ${p.data.id})`;
  await db()
    .update(P)
    .set({ settings: sql`jsonb_set(coalesce(${P.settings}, '{}'::jsonb), '{musicDone}', ${next})` })
    .where(eq(P.userId, profile.userId));
  return Response.json({ ok: true });
}
