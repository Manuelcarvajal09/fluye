import { and, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile } from "@/lib/user";

/** Sirve una foto del diario solo a su dueño (privada: nunca en caché compartida). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await apiProfile();
  if (!profile) return new Response("no autorizado", { status: 401 });
  const { id } = await params;
  const [p] = await db()
    .select({ data: schema.journalPhotos.data, mime: schema.journalPhotos.mime })
    .from(schema.journalPhotos)
    .where(and(eq(schema.journalPhotos.id, id), eq(schema.journalPhotos.userId, profile.userId)));
  if (!p) return new Response("no encontrado", { status: 404 });
  return new Response(new Uint8Array(p.data), { headers: { "content-type": p.mime, "cache-control": "private, max-age=86400", "x-content-type-options": "nosniff" } });
}
