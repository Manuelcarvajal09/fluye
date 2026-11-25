import "server-only";
import { and, desc, eq, gte, inArray, isNull, isNotNull, or, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile } from "./user";
import { settingsOf } from "./user";
import { addDays, localDay, visibleStreak } from "./game";
import { weekStart } from "./challenges";
import { lookOf, wearOf } from "./look";
import { charge, credit, walletOf } from "./economy";
import { GIFT, LIVES } from "./wardrobe";

/**
 * Amistades y regalos entre miembros de Fluye.
 * - Se agrega con un código (no se expone correo ni id). La amistad queda pendiente hasta que la otra persona acepta.
 * - Las amistades ven: nombre, mascota, racha, XP de la semana y último día de estudio. Nunca respuestas ni grabaciones.
 * - Cada regalo se cobra al enviarlo y se entrega al abrirlo, una sola vez (claves únicas y UPDATE condicional).
 */
const F = schema.friendships;
const G = schema.gifts;
const P = schema.profiles;
const W = schema.walletEvents;
const pair = (a: string, b: string) => (a < b ? { userA: a, userB: b } : { userA: b, userB: a });
const ALPHA = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export async function ensureFriendCode(profile: Profile) {
  if (profile.friendCode) return profile.friendCode;
  for (let i = 0; i < 5; i++) {
    const code = Array.from(crypto.getRandomValues(new Uint8Array(6)), (b) => ALPHA[b % ALPHA.length]).join("");
    try {
      const [u] = await db().update(P).set({ friendCode: code }).where(and(eq(P.userId, profile.userId), isNull(P.friendCode))).returning({ c: P.friendCode });
      if (u?.c) return u.c;
      const [again] = await db().select({ c: P.friendCode }).from(P).where(eq(P.userId, profile.userId));
      if (again?.c) return again.c;
    } catch {
      // código repetido: se intenta otro
    }
  }
  throw new Error("No se pudo crear el código de amistad");
}

type Fail = { ok: false; error: string };

export async function addFriend(profile: Profile, rawCode: string): Promise<{ ok: true; status: "pending" | "accepted"; name: string; id: string } | Fail> {
  const code = rawCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const [other] = await db().select({ id: P.userId, name: P.name }).from(P).where(eq(P.friendCode, code));
  if (!other) return { ok: false, error: "No encontramos ese código. Revisa que esté bien escrito." };
  if (other.id === profile.userId) return { ok: false, error: "Ese es tu propio código." };
  const k = pair(profile.userId, other.id);
  const [row] = await db().select().from(F).where(and(eq(F.userA, k.userA), eq(F.userB, k.userB)));
  if (row?.status === "accepted") return { ok: true, status: "accepted", name: other.name, id: other.id };
  if (row && row.requestedBy !== profile.userId) {
    await db().update(F).set({ status: "accepted", acceptedAt: new Date() }).where(and(eq(F.userA, k.userA), eq(F.userB, k.userB)));
    return { ok: true, status: "accepted", name: other.name, id: other.id };
  }
  await db().insert(F).values({ ...k, requestedBy: profile.userId }).onConflictDoNothing();
  return { ok: true, status: "pending", name: other.name, id: other.id };
}

export async function respondFriend(profile: Profile, otherId: string, accept: boolean) {
  const k = pair(profile.userId, otherId);
  const where = and(eq(F.userA, k.userA), eq(F.userB, k.userB));
  if (accept) {
    const r = await db().update(F).set({ status: "accepted", acceptedAt: new Date() }).where(and(where, eq(F.status, "pending"), sql`${F.requestedBy} <> ${profile.userId}`)).returning({ s: F.status });
    return r.length > 0;
  }
  await db().delete(F).where(where);
  return true;
}

export async function areFriends(a: string, b: string) {
  const k = pair(a, b);
  const [r] = await db().select({ s: F.status }).from(F).where(and(eq(F.userA, k.userA), eq(F.userB, k.userB)));
  return r?.s === "accepted";
}

export type FriendCard = { id: string; name: string; species: string; wear: string[]; streak: number; weekXp: number; lastDay: string | null; status: "accepted" | "incoming" | "outgoing"; me?: boolean };

/** Amistades (aceptadas y pendientes) con su actividad, y la clasificación semanal por XP de estudio. */
export async function friendsOf(profile: Profile) {
  const rows = await db().select().from(F).where(or(eq(F.userA, profile.userId), eq(F.userB, profile.userId)));
  const others = rows.map((r) => (r.userA === profile.userId ? r.userB : r.userA));
  const ids = [profile.userId, ...others];
  const today = localDay(profile.tz);
  const start = weekStart(today);
  const people = await db().select().from(P).where(inArray(P.userId, ids));
  const week = await db()
    .select({ id: schema.dailyStats.userId, xp: sql<number>`coalesce(sum(${schema.dailyStats.xp}), 0)::int`, last: sql<string | null>`max(case when ${schema.dailyStats.reviews} > 0 then ${schema.dailyStats.day} end)` })
    .from(schema.dailyStats)
    .where(and(inArray(schema.dailyStats.userId, ids), gte(schema.dailyStats.day, addDays(start, -60))))
    .groupBy(schema.dailyStats.userId);
  const weekOnly = await db()
    .select({ id: schema.dailyStats.userId, xp: sql<number>`coalesce(sum(${schema.dailyStats.xp}), 0)::int` })
    .from(schema.dailyStats)
    .where(and(inArray(schema.dailyStats.userId, ids), gte(schema.dailyStats.day, start)))
    .groupBy(schema.dailyStats.userId);
  const card = (p: Profile, status: FriendCard["status"], me = false): FriendCard => {
    const look = lookOf(settingsOf(p).look);
    return {
      id: p.userId,
      name: (p.name || look.name).split(" ")[0],
      species: look.species,
      wear: wearOf(look),
      streak: visibleStreak(p.streak, p.lastGoalDay, localDay(p.tz)),
      weekXp: weekOnly.find((w) => w.id === p.userId)?.xp ?? 0,
      lastDay: week.find((w) => w.id === p.userId)?.last ?? null,
      status,
      me,
    };
  };
  const list: FriendCard[] = [];
  for (const r of rows) {
    const id = r.userA === profile.userId ? r.userB : r.userA;
    const p = people.find((x) => x.userId === id);
    if (!p) continue;
    list.push(card(p, r.status === "accepted" ? "accepted" : r.requestedBy === profile.userId ? "outgoing" : "incoming"));
  }
  const meCard = card(people.find((x) => x.userId === profile.userId) ?? profile, "accepted", true);
  const ranking = [meCard, ...list.filter((f) => f.status === "accepted")].sort((a, b) => b.weekXp - a.weekXp);
  return { friends: list, ranking, weekStart: start };
}

// ---------- Regalos ----------

export type GiftKind = "letter" | "gems" | "boost";

export async function sendGift(profile: Profile, input: { to: string; kind: GiftKind; amount: number; message: string; key: string }) {
  if (!(await areFriends(profile.userId, input.to))) return { ok: false as const, error: "Solo puedes enviar regalos a tus amistades." };
  const amount = input.kind === "gems" ? Math.max(1, Math.min(GIFT.maxGems, Math.round(input.amount))) : input.kind === "boost" ? 1 : 0;
  const message = input.message.trim().slice(0, 280);
  if (input.kind === "letter" && !message) return { ok: false as const, error: "Escribe algo en la carta." };
  const id = crypto.randomUUID();
  const d = db();
  const ins = await d.insert(G).values({ id, fromUser: profile.userId, toUser: input.to, kind: input.kind, amount, message, clientKey: input.key }).onConflictDoNothing().returning({ id: G.id });
  if (!ins.length) {
    // Misma petición repetida: ya se envió, no se cobra otra vez.
    const [prev] = await d.select().from(G).where(and(eq(G.fromUser, profile.userId), eq(G.clientKey, input.key)));
    return { ok: true as const, id: prev?.id ?? id, duplicate: true, wallet: walletOf(profile) };
  }
  const undo = async () => void (await d.delete(G).where(eq(G.id, id)));
  const today = localDay(profile.tz);
  const [cnt] = await d
    .insert(W)
    .values({ userId: profile.userId, key: `gifts-sent:${today}`, currency: "gifts", amount: 1, reason: "Regalos enviados hoy" })
    .onConflictDoUpdate({ target: [W.userId, W.key], set: { amount: sql`${W.amount} + 1` } })
    .returning({ n: W.amount });
  const uncount = () => d.update(W).set({ amount: sql`${W.amount} - 1` }).where(and(eq(W.userId, profile.userId), eq(W.key, `gifts-sent:${today}`)));
  if (cnt.n > GIFT.perDay) {
    await undo();
    await uncount();
    return { ok: false as const, error: `Puedes enviar hasta ${GIFT.perDay} regalos al día.` };
  }
  if (input.kind !== "letter") {
    const r = await charge(profile.userId, `gift:${id}`, input.kind === "gems" ? "gems" : "boosts", amount, input.kind === "gems" ? `Regalaste ${amount} gemas` : "Regalaste un potenciador");
    if (r !== "ok") {
      await undo();
      await uncount();
      return { ok: false as const, error: input.kind === "gems" ? "No tienes suficientes gemas." : "No tienes potenciadores para regalar. Cómpralos en Vidas y extras." };
    }
  }
  const [fresh] = await d.select().from(P).where(eq(P.userId, profile.userId));
  return { ok: true as const, id, duplicate: false, wallet: walletOf(fresh) };
}

/** Abre un regalo: lo entrega una sola vez. El primero abierto cada día da una vida extra. */
export async function openGift(profile: Profile, id: string) {
  const d = db();
  const [g] = await d.update(G).set({ openedAt: new Date() }).where(and(eq(G.id, id), eq(G.toUser, profile.userId), isNull(G.openedAt))).returning();
  const gift = g ?? (await d.select().from(G).where(and(eq(G.id, id), eq(G.toUser, profile.userId))))[0];
  if (!gift) return { ok: false as const, error: "Ese regalo no existe." };
  let life = 0;
  if (g) {
    if (g.kind === "gems") await credit(profile.userId, `gift-in:${id}`, "gems", g.amount, "Gemas de un regalo");
    if (g.kind === "boost") await credit(profile.userId, `gift-in:${id}`, "boosts", 1, "Potenciador de un regalo");
    life = await credit(profile.userId, `life-gift:${localDay(profile.tz)}`, "lives", 1, "Vida extra por el primer regalo del día", LIVES.bonusCap);
  }
  const [fresh] = await d.select().from(P).where(eq(P.userId, profile.userId));
  return { ok: true as const, first: !!g, life, gift: { id: gift.id, kind: gift.kind, amount: gift.amount, message: gift.message }, wallet: walletOf(fresh) };
}

export const THANKS = { gracias: "¡Gracias!", corazon: "Te quiero mucho", abrazo: "Un abrazo", estrella: "Eres una estrella", fiesta: "¡Me encantó!" } as const;
export type Thanks = keyof typeof THANKS;

export async function thankGift(profile: Profile, id: string, thanks: Thanks) {
  const r = await db()
    .update(G)
    .set({ thanks, thankedAt: new Date() })
    .where(and(eq(G.id, id), eq(G.toUser, profile.userId), isNotNull(G.openedAt), isNull(G.thanks)))
    .returning({ id: G.id });
  return r.length > 0;
}

export type MailItem = { id: string; kind: GiftKind; amount: number; message: string; sentAt: string; openedAt: string | null; thanks: string | null; other: { id: string; name: string; species: string; wear: string[] } };

/** Buzón (recibidos) y enviados, con el nombre y la mascota de la otra persona. */
export async function mailbox(profile: Profile) {
  const d = db();
  const inbox = await d.select().from(G).where(eq(G.toUser, profile.userId)).orderBy(desc(G.sentAt)).limit(40);
  const sent = await d.select().from(G).where(eq(G.fromUser, profile.userId)).orderBy(desc(G.sentAt)).limit(40);
  const ids = [...new Set([...inbox.map((g) => g.fromUser), ...sent.map((g) => g.toUser)])];
  const people = ids.length ? await d.select().from(P).where(inArray(P.userId, ids)) : [];
  const who = (id: string) => {
    const p = people.find((x) => x.userId === id);
    const look = lookOf(p ? settingsOf(p).look : undefined);
    return { id, name: (p?.name || look.name).split(" ")[0], species: look.species, wear: wearOf(look) };
  };
  const map = (g: typeof inbox[number], other: string): MailItem => ({ id: g.id, kind: g.kind as GiftKind, amount: g.amount, message: g.message, sentAt: g.sentAt.toISOString(), openedAt: g.openedAt?.toISOString() ?? null, thanks: g.thanks, other: who(other) });
  return { inbox: inbox.map((g) => map(g, g.fromUser)), sent: sent.map((g) => map(g, g.toUser)) };
}
