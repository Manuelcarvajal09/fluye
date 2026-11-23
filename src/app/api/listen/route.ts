import { z } from "zod";
import { apiProfile } from "@/lib/user";
import { getLesson } from "@/lib/content";
import { db, schema } from "@/db";

const Body = z.object({ lessonId: z.string().max(100), kind: z.enum(["transcript", "subtitles", "translation", "line"]) });

/** Registra que la persona consultó el texto/subtítulos/traducción en una escucha. */
export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success || !getLesson(p.data.lessonId)) return Response.json({ error: "datos inválidos" }, { status: 400 });
  await db().insert(schema.listenEvents).values({ userId: profile.userId, lessonId: p.data.lessonId, kind: p.data.kind });
  return Response.json({ ok: true });
}
