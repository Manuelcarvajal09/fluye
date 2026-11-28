import { and, eq, sql } from "drizzle-orm";
import { requireProfile, settingsOf } from "@/lib/user";
import { lookOf } from "@/lib/look";
import { ownedSet, recentMoves, settleAwards, walletOf } from "@/lib/economy";
import { localDay } from "@/lib/game";
import { db, schema } from "@/db";
import { LIVES } from "@/lib/wardrobe";
import { Armario } from "@/components/armario/Armario";
import { perksOf } from "@/lib/perks";
import { seasonFor } from "@/lib/seasons";

export const metadata = { title: "Armario y tienda" };

const TABS = ["armario", "mascotas", "temas", "cofres", "vidas", "movimientos"] as const;
type Tab = (typeof TABS)[number];

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const profile = await requireProfile();
  const newly = await settleAwards(profile);
  const [owned, moves, practice, perks] = await Promise.all([
    ownedSet(profile.userId),
    recentMoves(profile.userId, 30),
    db()
      .select({ n: schema.walletEvents.amount })
      .from(schema.walletEvents)
      .where(and(eq(schema.walletEvents.userId, profile.userId), eq(schema.walletEvents.key, `practice:${localDay(profile.tz)}`))),
    perksOf(profile.userId),
  ]);
  const [hasFriend] = await db()
    .select({ one: sql<number>`1` })
    .from(schema.friendships)
    .where(and(eq(schema.friendships.status, "accepted"), sql`(${schema.friendships.userA} = ${profile.userId} or ${schema.friendships.userB} = ${profile.userId})`))
    .limit(1);
  const [hasReview] = await db().select({ one: sql<number>`1` }).from(schema.reviewLogs).where(eq(schema.reviewLogs.userId, profile.userId)).limit(1);
  const tab = (TABS as readonly string[]).includes((await searchParams).tab ?? "") ? ((await searchParams).tab as Tab) : "armario";
  const n = practice[0]?.n ?? 0;
  return (
    <Armario
      tab={tab}
      owned={[...owned]}
      look={lookOf(settingsOf(profile).look)}
      wallet={walletOf(profile)}
      freezes={profile.freezes}
      newAwards={newly}
      progress={{ streak: Math.max(profile.bestStreak, profile.streak), review: hasReview ? 1 : 0, friend: hasFriend ? 1 : 0 }}
      practice={{ today: n % LIVES.practiceGoal, earned: Math.min(LIVES.practicePerDay, Math.floor(n / LIVES.practiceGoal)) }}
      moves={moves.map((m) => ({ ...m, at: m.at.toISOString() }))}
      appearance={{ allThemes: perks.allThemes, themePack: settingsOf(profile).themePack ?? null, background: settingsOf(profile).background ?? null }}
      style={{ mode: (settingsOf(profile).theme as "system" | "light" | "dark" | undefined) ?? "system", season: settingsOf(profile).season, currentSeason: seasonFor(localDay(profile.tz), settingsOf(profile).season) }}
    />
  );
}
