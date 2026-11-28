import "server-only";
import { cache } from "react";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { isOwner } from "./owner";

export type Perks = { unlimitedLives: boolean; allThemes: boolean };
const ALL: Perks = { unlimitedLives: true, allThemes: true };

/** Permisos especiales de una cuenta: los propietarios los tienen todos; el resto, lo que conceda el propietario en Administrar. */
export const perksOf = cache(async (userId: string): Promise<Perks> => {
  if (isOwner(userId)) return ALL;
  const [r] = await db().select().from(schema.memberPerks).where(eq(schema.memberPerks.userId, userId));
  return { unlimitedLives: !!r?.unlimitedLives, allThemes: !!r?.allThemes };
});
