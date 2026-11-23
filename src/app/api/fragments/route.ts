import { z } from "zod";
import { eq } from "drizzle-orm";
import { apiProfile, settingsOf } from "@/lib/user";
import { db, schema } from "@/db";

/** Fragmentos privados que la persona guarda (solo en su perfil; se exportan con sus datos). */
const Body = z.object({ fragments: z.array(z.object({ id: z.string().max(64), text: z.string().max(200), note: z.string().max(200) })).max(100) });

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  await db()
    .update(schema.profiles)
    .set({ settings: { ...settingsOf(profile), fragments: p.data.fragments } })
    .where(eq(schema.profiles.userId, profile.userId));
  return Response.json({ ok: true });
}
