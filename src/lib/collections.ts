import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

/** Una colección de la persona con los ids de sus entradas (null si no existe o no es suya). */
export async function collectionOf(userId: string, id: string) {
  const d = db();
  const [c] = await d.select().from(schema.collections).where(and(eq(schema.collections.id, id), eq(schema.collections.userId, userId)));
  if (!c) return null;
  const rows = await d.select({ itemId: schema.collectionItems.itemId }).from(schema.collectionItems).where(eq(schema.collectionItems.collectionId, id)).orderBy(desc(schema.collectionItems.addedAt));
  return { ...c, items: rows.map((r) => r.itemId) };
}

/** Colecciones de la persona con conteo de entradas, cuántas están activas y cuántas vencen ya. */
export async function collectionsOf(userId: string) {
  return db()
    .select({
      id: schema.collections.id,
      name: schema.collections.name,
      color: schema.collections.color,
      note: schema.collections.note,
      n: sql<number>`(select count(*)::int from collection_items ci where ci.collection_id = ${schema.collections.id})`,
      active: sql<number>`(select count(distinct c.item_id)::int from collection_items ci join cards c on c.user_id = ci.user_id and c.item_id = ci.item_id where ci.collection_id = ${schema.collections.id})`,
      due: sql<number>`(select count(*)::int from collection_items ci join cards c on c.user_id = ci.user_id and c.item_id = ci.item_id where ci.collection_id = ${schema.collections.id} and c.suspended = 0 and c.due <= now())`,
    })
    .from(schema.collections)
    .where(eq(schema.collections.userId, userId))
    .orderBy(desc(schema.collections.updatedAt));
}
