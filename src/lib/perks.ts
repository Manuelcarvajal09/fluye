import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { isOwner } from "./owner";

export type Perks = { unlimitedLives: boolean; allThemes: boolean };

/**
 * Permisos especiales de una cuenta. Los propietarios tienen todas las temáticas; las vidas ilimitadas ya no son
 * automáticas para nadie (quitan la tensión de equivocarse): solo si se activan a mano en Administrar.
 */
export const perksOf = cache(async (userId: string): Promise<Perks> => {
  const [r] = await db().select().from(schema.memberPerks).where(eq(schema.memberPerks.userId, userId));
  return { unlimitedLives: !!r?.unlimitedLives, allThemes: isOwner(userId) || !!r?.allThemes };
});
