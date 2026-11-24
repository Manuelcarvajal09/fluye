import { z } from "zod";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { apiProfile, settingsOf } from "@/lib/user";
import { getItem } from "@/lib/content";
import { ensureCards } from "@/lib/cards";
import { recordProgress } from "@/lib/progress";
import { goalOf } from "@/lib/realtalk";

/**
 * Colecciones personales. Todo se filtra por la persona de la sesión: nadie ve ni toca colecciones ajenas.
 * Las colecciones agrupan entradas canónicas; el progreso FSRS vive en `cards` y no se duplica.
 */
const MAX_COLLECTIONS = 60;
const MAX_ITEMS = 2000;
const Ids = z.array(z.string().max(100)).min(1).max(200);
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), name: z.string().trim().min(1).max(60), color: z.string().max(20).optional(), items: Ids.optional() }),
  z.object({ action: z.literal("rename"), id: z.string().max(40), name: z.string().trim().min(1).max(60), note: z.string().max(200).optional(), color: z.string().max(20).optional() }),
  z.object({ action: z.literal("delete"), id: z.string().max(40) }),
  z.object({ action: z.literal("add"), id: z.string().max(40), items: Ids }),
  z.object({ action: z.literal("remove"), id: z.string().max(40), items: Ids }),
  // Activar (crear tarjetas), pausar o reanudar varias entradas a la vez, estén o no en una colección.
  z.object({ action: z.enum(["activate", "suspend", "resume"]), items: Ids }),
  z.object({ action: z.literal("import"), data: z.object({ app: z.literal("fluye-coleccion"), name: z.string().trim().min(1).max(60), items: z.array(z.string().max(100)).max(MAX_ITEMS) }) }),
]);

const newId = () => `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export async function GET(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const d = db();
  const exportId = new URL(req.url).searchParams.get("export");
  if (exportId) {
    const [c] = await d.select().from(schema.collections).where(and(eq(schema.collections.id, exportId), eq(schema.collections.userId, profile.userId)));
    if (!c) return Response.json({ error: "no existe" }, { status: 404 });
    const items = await d.select({ itemId: schema.collectionItems.itemId }).from(schema.collectionItems).where(eq(schema.collectionItems.collectionId, c.id));
    // Solo nombre e ids de entradas públicas del contenido: sin progreso ni datos personales.
    return new Response(JSON.stringify({ app: "fluye-coleccion", version: 1, name: c.name, items: items.map((i) => i.itemId) }, null, 1), {
      headers: { "content-type": "application/json", "content-disposition": `attachment; filename="coleccion-${c.name.replace(/[^\p{L}\p{N}]+/gu, "-").toLowerCase()}.json"` },
    });
  }
  const rows = await d
    .select({ id: schema.collections.id, name: schema.collections.name, color: schema.collections.color, note: schema.collections.note, n: sql<number>`(select count(*)::int from collection_items ci where ci.collection_id = ${schema.collections.id})` })
    .from(schema.collections)
    .where(eq(schema.collections.userId, profile.userId))
    .orderBy(desc(schema.collections.updatedAt));
  return Response.json({ collections: rows });
}

export async function POST(req: Request) {
  const profile = await apiProfile();
  if (!profile) return Response.json({ error: "no autorizado" }, { status: 401 });
  const p = Body.safeParse(await req.json().catch(() => null));
  if (!p.success) return Response.json({ error: "datos inválidos" }, { status: 400 });
  const b = p.data;
  const d = db();
  const u = profile.userId;
  const valid = (ids: string[]) => [...new Set(ids)].filter((id) => getItem(id));
  const mine = async (id: string) => (await d.select().from(schema.collections).where(and(eq(schema.collections.id, id), eq(schema.collections.userId, u))))[0];
  const touch = (id: string) => d.update(schema.collections).set({ updatedAt: new Date() }).where(eq(schema.collections.id, id));
  const addItems = async (id: string, ids: string[]) => {
    const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.collectionItems).where(eq(schema.collectionItems.collectionId, id));
    const room = ids.slice(0, Math.max(0, MAX_ITEMS - n));
    if (!room.length) return 0;
    const ins = await d.insert(schema.collectionItems).values(room.map((itemId) => ({ collectionId: id, userId: u, itemId }))).onConflictDoNothing().returning({ id: schema.collectionItems.itemId });
    await touch(id);
    return ins.length;
  };

  switch (b.action) {
    case "create":
    case "import": {
      const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.collections).where(eq(schema.collections.userId, u));
      if (n >= MAX_COLLECTIONS) return Response.json({ error: `Máximo ${MAX_COLLECTIONS} colecciones.` }, { status: 409 });
      const id = newId();
      const name = b.action === "create" ? b.name : b.data.name;
      const raw = b.action === "create" ? (b.items ?? []) : b.data.items;
      await d.insert(schema.collections).values({ id, userId: u, name, color: b.action === "create" ? (b.color ?? "esmeralda") : "esmeralda" });
      const ok = valid(raw);
      const added = ok.length ? await addItems(id, ok) : 0;
      return Response.json({ ok: true, id, added, skipped: raw.length - ok.length });
    }
    case "rename": {
      if (!(await mine(b.id))) return Response.json({ error: "no existe" }, { status: 404 });
      await d.update(schema.collections).set({ name: b.name, ...(b.note !== undefined ? { note: b.note } : {}), ...(b.color ? { color: b.color } : {}), updatedAt: new Date() }).where(eq(schema.collections.id, b.id));
      return Response.json({ ok: true });
    }
    case "delete": {
      if (!(await mine(b.id))) return Response.json({ error: "no existe" }, { status: 404 });
      // Borra solo la agrupación: las tarjetas y su historial se conservan.
      await d.delete(schema.collectionItems).where(eq(schema.collectionItems.collectionId, b.id));
      await d.delete(schema.collections).where(eq(schema.collections.id, b.id));
      return Response.json({ ok: true });
    }
    case "add": {
      if (!(await mine(b.id))) return Response.json({ error: "no existe" }, { status: 404 });
      return Response.json({ ok: true, added: await addItems(b.id, valid(b.items)) });
    }
    case "remove": {
      if (!(await mine(b.id))) return Response.json({ error: "no existe" }, { status: 404 });
      await d.delete(schema.collectionItems).where(and(eq(schema.collectionItems.collectionId, b.id), inArray(schema.collectionItems.itemId, b.items)));
      await touch(b.id);
      return Response.json({ ok: true });
    }
    case "activate": {
      const s = settingsOf(profile);
      let added = 0;
      for (const id of valid(b.items).slice(0, 60)) {
        const it = getItem(id)!;
        if (await ensureCards(u, id, new Date(), s.retention, goalOf(it, s.goals?.[id]) === "understand")) added++;
      }
      if (added) await recordProgress(profile, { newItems: added });
      return Response.json({ ok: true, added });
    }
    case "suspend":
    case "resume": {
      await d
        .update(schema.cards)
        .set({ suspended: b.action === "suspend" ? 1 : 0 })
        .where(and(eq(schema.cards.userId, u), inArray(schema.cards.itemId, b.items)));
      return Response.json({ ok: true });
    }
  }
}
