import Link from "next/link";
import { and, asc, eq, gt, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { getItem } from "@/lib/content";
import { previewLabels, fmtInterval } from "@/lib/srs";
import { FlashReview, type Flash } from "@/components/FlashReview";
import type { Mode } from "@/lib/types";

export const metadata = { title: "Repaso" };

export default async function Review() {
  const profile = await requireProfile();
  const now = new Date();
  const retention = settingsOf(profile).retention;
  const base = and(eq(schema.cards.userId, profile.userId), eq(schema.cards.suspended, 0));
  const due = await db().select().from(schema.cards).where(and(base, lte(schema.cards.due, now))).orderBy(asc(schema.cards.due)).limit(60);

  const cards: Flash[] = [];
  for (const c of due) {
    const item = getItem(c.itemId);
    if (!item) continue;
    const ex = item.ex[(c.reps + c.itemId.length) % item.ex.length];
    cards.push({ item, mode: c.mode as Mode, ex, intervals: await previewLabels(c.fsrs, now, retention) });
  }

  if (!cards.length) {
    const [next] = await db().select({ due: schema.cards.due }).from(schema.cards).where(and(base, gt(schema.cards.due, now))).orderBy(asc(schema.cards.due)).limit(1);
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
        <p className="text-6xl" aria-hidden>
          ✅
        </p>
        <h1 className="text-3xl font-black">Estás al día</h1>
        <p className="text-muted">{next ? `El próximo repaso vence en ${fmtInterval(next.due.getTime() - now.getTime())}.` : "Todavía no tienes tarjetas. Empieza una sesión para aprender tus primeras expresiones."}</p>
        <Link href="/sesion" className="btn btn-primary">
          Aprender algo nuevo
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-3xl font-black">Repaso</h1>
        <p className="text-muted">
          Modo tarjetas: intenta recordar, voltea y califica con honestidad. {cards.length} {cards.length === 1 ? "pendiente" : "pendientes"}.
        </p>
      </header>
      <FlashReview cards={cards} />
    </div>
  );
}
