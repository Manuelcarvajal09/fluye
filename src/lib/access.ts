import "server-only";
import { cache } from "react";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { and, eq, inArray, lt } from "drizzle-orm";
import { db, schema } from "@/db";

export type Access = "owner" | "member" | "denied";

import { isOwner } from "./owner";
export { isOwner };

/**
 * Comprueba en el servidor, en cada petición, si la cuenta puede usar la app.
 * - Propietario: siempre.
 * - Miembro activo: sí. Desactivado, revocado o expirado: no (aunque tenga una sesión abierta).
 * - Primer acceso de alguien invitado: se vincula por su correo VERIFICADO si la invitación sigue vigente.
 */
export const accessFor = cache(async (userId: string): Promise<Access> => {
  if (isOwner(userId)) return "owner";
  const d = db();
  const [m] = await d.select().from(schema.members).where(eq(schema.members.userId, userId));
  if (m) return m.status === "active" ? "member" : "denied";

  // Si la sesión no trae el usuario (fallo puntual), se consulta directo a Clerk por id.
  const u = (await currentUser().catch(() => null)) ?? (await (await clerkClient()).users.getUser(userId).catch(() => null));
  const emails = (u?.emailAddresses ?? []).filter((e) => e.verification?.status === "verified").map((e) => e.emailAddress.toLowerCase());
  if (!emails.length) return "denied";
  const [inv] = await d
    .select()
    .from(schema.members)
    .where(and(inArray(schema.members.email, emails), eq(schema.members.status, "invited")));
  if (!inv || inv.userId) return "denied";
  if (inv.expiresAt && inv.expiresAt.getTime() < Date.now()) {
    // Condicional: si la invitación se renovó mientras tanto, no se marca como caducada.
    await d.update(schema.members).set({ status: "expired" }).where(and(eq(schema.members.email, inv.email), eq(schema.members.status, "invited"), lt(schema.members.expiresAt, new Date())));
    return "denied";
  }
  const [linked] = await d
    .update(schema.members)
    .set({ userId, status: "active", activatedAt: new Date() })
    .where(and(eq(schema.members.email, inv.email), eq(schema.members.status, "invited")))
    .returning();
  if (linked) return "member";
  // Otra petición simultánea pudo vincularla primero: se vuelve a leer por id.
  const [again] = await d.select().from(schema.members).where(eq(schema.members.userId, userId));
  return again?.status === "active" ? "member" : "denied";
});
