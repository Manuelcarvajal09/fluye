import "server-only";
import { and, desc, eq, gt, gte, sql } from "drizzle-orm";
import { studyGemsFor } from "./economy-rules";
import { perksOf } from "./perks";
import { THEME_PRICE, bgKey, bgOf, bgPrice, ownsBackground, themeKey, themeOf } from "./themes";
import { db, schema } from "@/db";
import type { Profile } from "./user";
import { localDay } from "./game";
import { AWARDS, BOOST, CHESTS, LIVES, chestPool, dupRefund, ownsPet, ownsPiece, petKey, petOf, petPrice, pieceKey, pieceOf, TIERS, type Tier } from "./wardrobe";

/**
 * Economía del armario. Reglas:
 * - Cada movimiento lleva una clave única en wallet_events: repetir una petición (red, doble clic) no cobra ni paga dos veces.
 * - Los cargos usan UPDATE condicional (saldo suficiente): el saldo nunca queda negativo.
 * - Nada de esto toca FSRS, el XP de estudio ni la racha.
 */
const P = schema.profiles;
const W = schema.walletEvents;
type Currency = "gems" | "lives" | "shield" | "boosts";
const COL = { gems: P.gems, lives: P.lives, shield: P.shield, boosts: P.boosts } as const;

export type Wallet = { gems: number; lives: number; shield: number; boosts: number; boostUntil: string | null };
export const walletOf = (p: Profile): Wallet => ({ gems: p.gems, lives: p.lives, shield: p.shield, boosts: p.boosts, boostUntil: p.boostUntil && p.boostUntil > new Date() ? p.boostUntil.toISOString() : null });

async function reload(userId: string) {
  const [p] = await db().select().from(P).where(eq(P.userId, userId));
  return p;
}

/** Abono idempotente. `cap` limita el saldo final (vidas). Devuelve lo abonado (0 si la clave ya existía). */
export async function credit(userId: string, key: string, currency: Currency, amount: number, reason: string, cap?: number) {
  const d = db();
  const ins = await d.insert(W).values({ userId, key, currency, amount, reason }).onConflictDoNothing().returning({ key: W.key });
  if (!ins.length) return 0;
  const col = COL[currency];
  const next = cap === undefined ? sql`${col} + ${amount}` : sql`least(${col} + ${amount}, greatest(${col}, ${cap}))`;
  await d.update(P).set({ [currency]: next }).where(eq(P.userId, userId));
  return amount;
}

/**
 * Cargo idempotente: primero reserva la clave, luego descuenta solo si alcanza.
 * Si no alcanza, libera la clave. "dup" = esa misma operación ya se había hecho.
 */
export async function charge(userId: string, key: string, currency: Currency, amount: number, reason: string): Promise<"ok" | "dup" | "short"> {
  const d = db();
  const ins = await d.insert(W).values({ userId, key, currency, amount: -amount, reason }).onConflictDoNothing().returning({ key: W.key });
  if (!ins.length) return "dup";
  const col = COL[currency];
  const paid = await d.update(P).set({ [currency]: sql`${col} - ${amount}` }).where(and(eq(P.userId, userId), gte(col, amount))).returning({ id: P.userId });
  if (paid.length) return "ok";
  await d.delete(W).where(and(eq(W.userId, userId), eq(W.key, key)));
  return "short";
}

export async function ownedSet(userId: string) {
  const rows = await db().select({ id: schema.inventory.itemId }).from(schema.inventory).where(eq(schema.inventory.userId, userId));
  return new Set(rows.map((r) => r.id));
}

const grant = async (userId: string, itemId: string) =>
  (await db().insert(schema.inventory).values({ userId, itemId }).onConflictDoNothing().returning({ id: schema.inventory.itemId })).length > 0;

type Fail = { ok: false; error: string };
export type BuyResult = { ok: true; wallet: Wallet; spent: number } | Fail;

/** Compra directa de una pieza o mascota con gemas (la única moneda de la app). */
export async function buyItem(profile: Profile, kind: "piece" | "pet" | "theme" | "bg", id: string, clientKey: string): Promise<BuyResult> {
  const owned = await ownedSet(profile.userId);
  let price = 0;
  let label = "";
  let inv = "";
  if (kind === "piece") {
    const p = pieceOf(id);
    if (!p || p.source !== "shop") return { ok: false, error: p?.source === "award" ? "Esta pieza solo se gana con su logro." : "No existe esa pieza." };
    if (ownsPiece(id, owned)) return { ok: false, error: "Ya la tienes." };
    price = p.price;
    label = p.name;
    inv = pieceKey(id);
  } else if (kind === "theme") {
    const t = themeOf(id);
    if (!t) return { ok: false, error: "No existe esa temática." };
    if (owned.has(themeKey(id)) || (await perksOf(profile.userId)).allThemes) return { ok: false, error: "Ya la tienes." };
    price = THEME_PRICE;
    label = `Temática ${t.name}`;
    inv = themeKey(id);
  } else if (kind === "bg") {
    const b = bgOf(id);
    if (!b) return { ok: false, error: "No existe ese fondo." };
    if (ownsBackground(b.id, owned)) return { ok: false, error: "Ya lo tienes." };
    price = bgPrice(id);
    label = `Fondo ${b.name}`;
    inv = bgKey(b.id);
  } else {
    const p = petOf(id);
    if (!p || p.free) return { ok: false, error: "Esa mascota no se compra." };
    if (ownsPet(id, owned)) return { ok: false, error: "Ya la tienes." };
    price = petPrice(id);
    label = p.label;
    inv = petKey(id);
  }
  const r = await charge(profile.userId, `buy:${clientKey}`, "gems", price, `Compra: ${label}`);
  if (r === "short") return { ok: false, error: `Te faltan ${price - profile.gems} gemas.` };
  if (r === "ok" && !(await grant(profile.userId, inv))) await credit(profile.userId, `refund:${clientKey}`, "gems", price, `Devolución: ${label} ya era tuyo`);
  return { ok: true, wallet: walletOf(await reload(profile.userId)), spent: r === "ok" ? price : 0 };
}

export type ChestOutcome = { outcome: "empty" | "new" | "dup"; tier: Tier | null; type?: "piece" | "pet"; id?: string; name?: string; refund: number };
export type ChestResult = ({ ok: true; wallet: Wallet; spent: number } & ChestOutcome) | Fail;

/** Tira el resultado de un cofre según sus probabilidades (vacío + 4 rarezas). */
export function rollChest(odds: readonly number[], rnd: () => number = Math.random): { tier: Tier | null } {
  let r = rnd() * odds.reduce((a, b) => a + b, 0);
  for (let i = 0; i < odds.length; i++) {
    r -= odds[i];
    if (r < 0) return { tier: i === 0 ? null : ((i - 1) as Tier) };
  }
  return { tier: null };
}

/**
 * Abre un cofre. Con `gift` (p. ej. el cofre de una sección del mapa) no se cobra y la clave es fija: solo se abre una vez.
 */
export async function openChest(profile: Profile, chestId: string, clientKey: string, gift?: { key: string; reason: string }): Promise<ChestResult> {
  const chest = CHESTS.find((c) => c.id === chestId);
  if (!chest) return { ok: false, error: "No existe ese cofre." };
  const key = gift ? gift.key : `chest:${clientKey}`;
  const price = gift ? 0 : chest.price;
  const r = await charge(profile.userId, key, "gems", price, gift ? gift.reason : `${chest.name}`);
  if (r === "short") return { ok: false, error: `Te faltan ${chest.price - profile.gems} gemas.` };
  if (r === "dup") return { ok: false, error: "Ese cofre ya se abrió." };
  // Un cofre de regalo nunca sale vacío: como mínimo, una pieza común.
  const rolled = rollChest(chest.odds).tier;
  const tier = gift && rolled === null ? (0 as Tier) : rolled;
  const wallet = async () => walletOf(await reload(profile.userId));
  if (tier === null) {
    await recordChest(profile.userId, key, "empty", null, "");
    return { ok: true, outcome: "empty", tier: null, refund: 0, spent: price, wallet: await wallet() };
  }
  const pool = chestPool(tier);
  const pick = pool[Math.floor(Math.random() * pool.length)];
  const name = pick.type === "pet" ? petOf(pick.id)!.label : pieceOf(pick.id)!.name;
  // Repetido: si ya lo tenía (por compra, cofre, inventario anterior o por ser inicial) se queda una sola copia y vuelve la mitad del precio del cofre.
  const before = await ownedSet(profile.userId);
  const had = pick.type === "pet" ? ownsPet(pick.id, before) : ownsPiece(pick.id, before);
  const dup = had || !(await grant(profile.userId, pick.type === "pet" ? petKey(pick.id) : pieceKey(pick.id)));
  const refund = dup ? await credit(profile.userId, `${key}:dup`, "gems", dupRefund(chest), `Repetido en ${chest.name}: ${name}`) : 0;
  await recordChest(profile.userId, key, dup ? "dup" : "new", tier, pick.id);
  return { ok: true, outcome: dup ? "dup" : "new", tier, type: pick.type, id: pick.id, name, refund, spent: price, wallet: await wallet() };
}
async function recordChest(userId: string, key: string, outcome: string, tier: Tier | null, id: string) {
  await db()
    .update(W)
    .set({ reason: sql`${W.reason} || ${` → ${outcome === "empty" ? "vacío" : `${outcome === "dup" ? "repetido" : "nuevo"} ${TIERS[tier ?? 0]} (${id})`}`}` })
    .where(and(eq(W.userId, userId), eq(W.key, key)));
}

/** Protección con gemas: el siguiente error en una lección no quita vida. */
export async function activateShield(profile: Profile, clientKey: string) {
  if (profile.shield > 0) return { ok: false as const, error: "Ya tienes una protección activa." };
  const r = await charge(profile.userId, `shield:${clientKey}`, "gems", LIVES.shieldGems, "Protección de vida");
  if (r === "short") return { ok: false as const, error: `Necesitas ${LIVES.shieldGems} gemas.` };
  if (r === "ok") await db().update(P).set({ shield: 1 }).where(eq(P.userId, profile.userId));
  return { ok: true as const, wallet: walletOf(await reload(profile.userId)) };
}

export async function buyBoost(profile: Profile, clientKey: string) {
  const r = await charge(profile.userId, `boost:${clientKey}`, "gems", BOOST.price, `Potenciador: ${BOOST.label}`);
  if (r === "short") return { ok: false as const, error: `Te faltan ${BOOST.price - profile.gems} gemas.` };
  if (r === "ok") await db().update(P).set({ boosts: sql`${P.boosts} + 1` }).where(eq(P.userId, profile.userId));
  return { ok: true as const, wallet: walletOf(await reload(profile.userId)) };
}

/** Activa un potenciador guardado: suma 15 minutos de doble XP (si ya había uno activo, se encadena). */
export async function activateBoost(profile: Profile, clientKey: string) {
  const r = await charge(profile.userId, `useboost:${clientKey}`, "boosts", 1, `Activó ${BOOST.label}`);
  if (r === "short") return { ok: false as const, error: "No tienes potenciadores." };
  if (r === "ok")
    await db()
      .update(P)
      .set({ boostUntil: sql`greatest(coalesce(${P.boostUntil}, now()), now()) + make_interval(mins => ${BOOST.minutes})` })
      .where(eq(P.userId, profile.userId));
  return { ok: true as const, wallet: walletOf(await reload(profile.userId)) };
}

/** Vida extra diaria (una por día local, puede pasar del máximo normal hasta el tope de bonificación). */
export async function dailyLife(profile: Profile): Promise<Profile> {
  const today = localDay(profile.tz);
  if (profile.livesDay === today) return profile;
  const [upd] = await db()
    .update(P)
    .set({ livesDay: today, lives: sql`least(${P.lives} + 1, greatest(${P.lives}, ${LIVES.bonusCap}))` })
    .where(and(eq(P.userId, profile.userId), sql`${P.livesDay} is distinct from ${today}`))
    .returning();
  if (!upd) return profile;
  await db().insert(W).values({ userId: profile.userId, key: `life-day:${today}`, currency: "lives", amount: 1, reason: "Vida extra del día" }).onConflictDoNothing();
  return upd;
}

export type LifeChange = { lives: number; shield: number; change: "lost" | "shielded" | "gained" | "none"; reason?: string };

/** Error en una lección: consume la protección si hay, si no resta una vida (nunca baja de 0 ni bloquea). */
export async function loseLife(userId: string, attemptKey: string): Promise<LifeChange> {
  const d = db();
  if ((await perksOf(userId)).unlimitedLives) {
    const cur = await reload(userId);
    return { lives: cur.lives, shield: cur.shield, change: "none" };
  }
  const used = await d.update(P).set({ shield: 0 }).where(and(eq(P.userId, userId), gt(P.shield, 0))).returning({ lives: P.lives });
  if (used.length) {
    await d.insert(W).values({ userId, key: `shield-use:${attemptKey}`, currency: "shield", amount: -1, reason: "La protección evitó perder una vida" }).onConflictDoNothing();
    return { lives: used[0].lives, shield: 0, change: "shielded", reason: "Tu protección se consumió y conservaste la vida." };
  }
  const ins = await d.insert(W).values({ userId, key: `life-lost:${attemptKey}`, currency: "lives", amount: -1, reason: "Error en una lección" }).onConflictDoNothing().returning({ key: W.key });
  const lost = ins.length ? await d.update(P).set({ lives: sql`${P.lives} - 1` }).where(and(eq(P.userId, userId), gt(P.lives, 0))).returning({ lives: P.lives }) : [];
  const now = lost[0] ?? (await reload(userId));
  return { lives: now.lives, shield: 0, change: lost.length ? "lost" : "none" };
}

/** Práctica y repaso devuelven vidas: una por cada 8 aciertos, hasta 3 al día y sin pasar del máximo. */
export async function practiceCorrect(profile: Profile): Promise<LifeChange | null> {
  const today = localDay(profile.tz);
  const d = db();
  const [row] = await d
    .insert(W)
    .values({ userId: profile.userId, key: `practice:${today}`, currency: "practice", amount: 1, reason: "Aciertos de práctica del día" })
    .onConflictDoUpdate({ target: [W.userId, W.key], set: { amount: sql`${W.amount} + 1` } })
    .returning({ n: W.amount });
  const n = row.n;
  if (n % LIVES.practiceGoal !== 0 || n / LIVES.practiceGoal > LIVES.practicePerDay) return null;
  const [cur] = await d.select({ lives: P.lives }).from(P).where(eq(P.userId, profile.userId));
  if (cur.lives >= LIVES.max) return null;
  const got = await credit(profile.userId, `life-practice:${today}:${n / LIVES.practiceGoal}`, "lives", 1, `Recuperaste una vida practicando (${n} aciertos)`, LIVES.max);
  if (!got) return null;
  return { lives: Math.min(cur.lives + 1, LIVES.max), shield: profile.shield, change: "gained", reason: "¡Recuperaste una vida practicando!" };
}

/**
 * Gemas por estudiar, sobre el XP TOTAL del día (studyGemsFor: 1 por cada 12 XP, tope diario). Un solo movimiento por día:
 * se sube hasta el objetivo y se acredita solo la diferencia. Nunca resta (si ya se pagó más con la regla anterior, se queda).
 */
export async function studyGems(userId: string, day: string, dayXp: number) {
  const target = studyGemsFor(dayXp);
  if (target <= 0) return 0;
  const key = `study-gems:${day}`;
  const d = db();
  const [cur] = await d.select({ amount: W.amount }).from(W).where(and(eq(W.userId, userId), eq(W.key, key)));
  const before = cur?.amount ?? 0;
  if (target <= before) return 0;
  // Sube solo si sigue por debajo (condición en el UPDATE): dos respuestas a la vez no pagan dos veces la misma diferencia.
  const [up] = cur
    ? await d.update(W).set({ amount: target }).where(and(eq(W.userId, userId), eq(W.key, key), eq(W.amount, before))).returning({ amount: W.amount })
    : await d.insert(W).values({ userId, key, currency: "gems", amount: target, reason: "Gemas por estudiar" }).onConflictDoNothing().returning({ amount: W.amount });
  if (!up) return 0;
  const delta = target - before;
  await d.update(P).set({ gems: sql`${P.gems} + ${delta}` }).where(eq(P.userId, userId));
  return delta;
}

/** Doble XP si hay un potenciador activo. */
export const boostActive = (p: Profile) => !!p.boostUntil && p.boostUntil > new Date();

/** Entrega los accesorios de logro que correspondan (una sola vez cada uno). Devuelve los nuevos. */
export async function settleAwards(profile: Profile): Promise<string[]> {
  const d = db();
  const best = Math.max(profile.bestStreak, profile.streak);
  const [rev] = await d.select({ one: sql<number>`1` }).from(schema.reviewLogs).where(eq(schema.reviewLogs.userId, profile.userId)).limit(1);
  const [fr] = await d
    .select({ one: sql<number>`1` })
    .from(schema.friendships)
    .where(and(eq(schema.friendships.status, "accepted"), sql`(${schema.friendships.userA} = ${profile.userId} or ${schema.friendships.userB} = ${profile.userId})`))
    .limit(1);
  const due = AWARDS.filter((a) => (a.rule === "streak" ? best >= a.n : a.rule === "review" ? !!rev : !!fr)).map((a) => ({ userId: profile.userId, itemId: pieceKey(a.id) }));
  if (!due.length) return [];
  const ins = await d.insert(schema.inventory).values(due).onConflictDoNothing().returning({ id: schema.inventory.itemId });
  return ins.map((r) => r.id.slice(3));
}

/** Últimos movimientos: monedero (compras, vidas, regalos, estudio) y premios del libro de gemas (meta, retos, logros, ligas). */
export async function recentMoves(userId: string, limit = 20) {
  const G = schema.gemLedger;
  const [wallet, ledger] = await Promise.all([
    db()
      .select({ key: W.key, currency: W.currency, amount: W.amount, reason: W.reason, at: W.createdAt })
      .from(W)
      .where(and(eq(W.userId, userId), sql`${W.currency} <> 'practice'`))
      .orderBy(desc(W.createdAt))
      .limit(limit),
    db()
      .select({ key: G.key, currency: sql<string>`'gems'`, amount: G.amount, reason: G.reason, at: G.createdAt })
      .from(G)
      .where(eq(G.userId, userId))
      .orderBy(desc(G.createdAt))
      .limit(limit),
  ]);
  return [...wallet, ...ledger].sort((a, b) => +b.at - +a.at).slice(0, limit);
}
