import { z } from "zod";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { and, desc, eq, gt, lt, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { isOwner } from "@/lib/access";

/**
 * Administración de invitaciones (solo propietario, verificado en el servidor en cada llamada).
 * El propietario ve correo, estado y fechas; nunca respuestas, grabaciones ni progreso privado de otras personas.
 */
const EXPIRES_DAYS = 7;
const MAX_INVITES_PER_DAY = 10;
const MAX_SENDS = 5;
const RESEND_COOLDOWN_MS = 60 * 60 * 1000;

async function owner() {
  const { userId } = await auth();
  return isOwner(userId) ? userId : null;
}

function appUrl(req: Request) {
  return (process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin).replace(/\/$/, "");
}

export async function GET() {
  if (!(await owner())) return Response.json({ error: "no encontrado" }, { status: 404 });
  const rows = await db().select().from(schema.members).orderBy(desc(schema.members.invitedAt));
  // Vencimiento perezoso: una invitación sin aceptar pasada su fecha se marca como expirada.
  const now = Date.now();
  for (const r of rows) {
    if (r.status === "invited" && r.expiresAt && r.expiresAt.getTime() < now) {
      r.status = "expired";
      await db().update(schema.members).set({ status: "expired" }).where(and(eq(schema.members.email, r.email), eq(schema.members.status, "invited"), lt(schema.members.expiresAt, new Date())));
    }
  }
  return Response.json({
    members: rows.map((r) => ({ email: r.email, status: r.status, role: r.role, sends: r.sends, invitedAt: r.invitedAt, expiresAt: r.expiresAt, activatedAt: r.activatedAt, disabledAt: r.disabledAt, lastSentAt: r.lastSentAt, linked: !!r.userId })),
  });
}

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("invite"), email: z.email().max(200) }),
  z.object({ action: z.enum(["resend", "revoke", "disable", "enable"]), email: z.email().max(200) }),
]);

export async function POST(req: Request) {
  const me = await owner();
  if (!me) return Response.json({ error: "no encontrado" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Correo inválido" }, { status: 400 });
  const email = parsed.data.email.trim().toLowerCase();
  const d = db();
  const clerk = await clerkClient();
  const [m] = await d.select().from(schema.members).where(eq(schema.members.email, email));

  async function send() {
    const inv = await clerk.invitations.createInvitation({ emailAddress: email, redirectUrl: `${appUrl(req)}/sign-up`, expiresInDays: EXPIRES_DAYS, notify: true, ignoreExisting: true });
    return { invitationId: inv.id, expiresAt: new Date(Date.now() + EXPIRES_DAYS * 86_400_000), lastSentAt: new Date() };
  }

  switch (parsed.data.action) {
    case "invite": {
      if (m && (m.status === "active" || m.status === "invited")) return Response.json({ error: m.status === "active" ? "Ya es miembro." : "Ya tiene una invitación vigente." }, { status: 409 });
      if (m?.status === "disabled") return Response.json({ error: "Está desactivado: reactívalo en lugar de invitar de nuevo." }, { status: 409 });
      const [{ n }] = await d.select({ n: sql<number>`count(*)::int` }).from(schema.members).where(gt(schema.members.lastSentAt, new Date(Date.now() - 86_400_000)));
      if (n >= MAX_INVITES_PER_DAY) return Response.json({ error: "Límite diario de invitaciones alcanzado." }, { status: 429 });
      const s = await send();
      await d
        .insert(schema.members)
        .values({ email, status: "invited", sends: 1, invitedAt: new Date(), ...s })
        .onConflictDoUpdate({ target: schema.members.email, set: { status: "invited", sends: sql`${schema.members.sends} + 1`, invitedAt: new Date(), userId: null, ...s } });
      return Response.json({ ok: true });
    }
    case "resend": {
      if (!m || (m.status !== "invited" && m.status !== "expired")) return Response.json({ error: "No hay invitación pendiente." }, { status: 409 });
      if (m.sends >= MAX_SENDS) return Response.json({ error: "Se alcanzó el máximo de reenvíos." }, { status: 429 });
      if (m.lastSentAt && Date.now() - m.lastSentAt.getTime() < RESEND_COOLDOWN_MS) return Response.json({ error: "Espera una hora antes de reenviar." }, { status: 429 });
      if (m.invitationId) await clerk.invitations.revokeInvitation(m.invitationId).catch(() => {});
      const s = await send();
      await d.update(schema.members).set({ status: "invited", sends: m.sends + 1, ...s }).where(eq(schema.members.email, email));
      return Response.json({ ok: true });
    }
    case "revoke": {
      if (!m || m.status !== "invited") return Response.json({ error: "Solo se revocan invitaciones pendientes." }, { status: 409 });
      if (m.invitationId) await clerk.invitations.revokeInvitation(m.invitationId).catch(() => {});
      await d.update(schema.members).set({ status: "revoked" }).where(and(eq(schema.members.email, email), eq(schema.members.status, "invited")));
      return Response.json({ ok: true });
    }
    case "disable": {
      if (!m || m.status !== "active" || !m.userId) return Response.json({ error: "Solo se desactivan miembros activos." }, { status: 409 });
      if (isOwner(m.userId)) return Response.json({ error: "No puedes desactivar a un propietario." }, { status: 409 });
      // Conserva todo su historial. El bloqueo de Clerk cierra sus sesiones abiertas.
      await d.update(schema.members).set({ status: "disabled", disabledAt: new Date() }).where(eq(schema.members.email, email));
      await clerk.users.banUser(m.userId).catch(() => {});
      return Response.json({ ok: true });
    }
    case "enable": {
      if (!m || m.status !== "disabled" || !m.userId) return Response.json({ error: "Solo se reactivan miembros desactivados." }, { status: 409 });
      await clerk.users.unbanUser(m.userId).catch(() => {});
      await d.update(schema.members).set({ status: "active", disabledAt: null }).where(eq(schema.members.email, email));
      return Response.json({ ok: true });
    }
  }
}
