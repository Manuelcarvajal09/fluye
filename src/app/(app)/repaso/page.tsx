import Link from "next/link";
import { and, asc, eq, gt, inArray, lte } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireProfile, settingsOf } from "@/lib/user";
import { getItem } from "@/lib/content";
import { previewLabels, fmtInterval } from "@/lib/srs";
import { collectionOf, collectionsOf } from "@/lib/collections";
import { FlashReview, type Flash } from "@/components/FlashReview";
import { EmptyArt } from "@/components/ux/EmptyArt";
import type { Mode } from "@/lib/types";
import { SectionHeader } from "@/components/ux/SectionHeader";

export const metadata = { title: "Repaso" };

const MODES: { id: Mode | ""; label: string }[] = [
  { id: "", label: "Todo" },
  { id: "recog", label: "Reconocer" },
  { id: "prod", label: "Producir" },
  { id: "listen", label: "Escuchar" },
  { id: "speak", label: "Hablar" },
];

/** Repaso manual tipo Anki: filtra por colección y modalidad, y permite adelantar tarjetas que aún no vencen. */
export default async function Review({ searchParams }: PageProps<"/repaso">) {
  const profile = await requireProfile();
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const mode = (["recog", "prod", "listen", "speak"].includes(str("modo")) ? str("modo") : "") as Mode | "";
  const early = str("adelantar") === "1";
  const [col, cols] = await Promise.all([str("coleccion") ? collectionOf(profile.userId, str("coleccion")) : null, collectionsOf(profile.userId)]);
  const now = new Date();
  const retention = settingsOf(profile).retention;
  const base = and(
    eq(schema.cards.userId, profile.userId),
    eq(schema.cards.suspended, 0),
    ...(mode ? [eq(schema.cards.mode, mode)] : []),
    ...(col ? [inArray(schema.cards.itemId, col.items.length ? col.items : ["-"])] : []),
  );
  const due = await db()
    .select()
    .from(schema.cards)
    .where(early ? base : and(base, lte(schema.cards.due, now)))
    .orderBy(asc(schema.cards.due))
    .limit(60);

  const cards: Flash[] = [];
  for (const c of due) {
    const item = getItem(c.itemId);
    if (!item) continue;
    const ex = item.ex[(c.reps + c.itemId.length) % item.ex.length];
    cards.push({ item, mode: c.mode as Mode, ex, intervals: await previewLabels(c.fsrs, now, retention) });
  }
  const link = (patch: Record<string, string>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ coleccion: col?.id ?? "", modo: mode, adelantar: early ? "1" : "", ...patch })) if (v) u.set(k, v);
    return `/repaso${u.size ? `?${u}` : ""}`;
  };

  const filters = (
    <div className="flex flex-col gap-3">
      <nav aria-label="Modalidad" className="seg self-start">
        {MODES.map((m) => (
          <Link key={m.id} href={link({ modo: m.id })} aria-current={mode === m.id ? "page" : undefined} className="grid place-items-center">
            {m.label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
        <Link href={link({ coleccion: "" })} className={`chip-btn ${!col ? "is-on" : ""}`}>
          Todas mis tarjetas
        </Link>
        {cols.map((c) => (
          <Link key={c.id} href={link({ coleccion: c.id })} className={`chip-btn ${col?.id === c.id ? "is-on" : ""}`}>
            {c.name}
            {c.due > 0 && <span className="count">{c.due}</span>}
          </Link>
        ))}
        <Link href={link({ adelantar: early ? "" : "1" })} className={`chip-btn ${early ? "is-on" : ""}`} aria-current={early ? "true" : undefined}>
          Adelantar las que aún no vencen
        </Link>
      </div>
    </div>
  );

  if (!cards.length) {
    const [next] = await db().select({ due: schema.cards.due }).from(schema.cards).where(and(base, gt(schema.cards.due, now))).orderBy(asc(schema.cards.due)).limit(1);
    return (
      <div className="flex flex-col gap-6">
        <SectionHeader art="repaso" title="Repaso" />
        {filters}
        <div className="empty-state">
          <EmptyArt kind={col && !col.items.length ? "vacio-colecciones" : "vacio-repasos"} mood={col && !col.items.length ? "think" : "cheer"} />
          <h2 className="font-display text-2xl font-extrabold">{col && !col.items.length ? "Esta colección está vacía" : "Aquí estás al día"}</h2>
          <p className="max-w-sm text-muted">
            {next ? `La siguiente tarjeta de este filtro vence en ${fmtInterval(next.due.getTime() - now.getTime())}. Si quieres practicar ya, usa «Adelantar».` : col ? "Aún no activas entradas de esta colección. Estúdiala para crear sus tarjetas." : "Todavía no tienes tarjetas con este filtro."}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {col && (
              <Link href={`/sesion?coleccion=${col.id}`} className="btn btn-primary">
                Estudiar «{col.name}»
              </Link>
            )}
            <Link href={col ? `/biblioteca/colecciones/${col.id}` : "/biblioteca"} className="btn btn-ghost">
              {col ? "Ver la colección" : "Ir a la biblioteca"}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader art="repaso" title={`Repaso${col ? ` · ${col.name}` : ""}`}>
        <p className="text-muted">
          Intenta recordar, voltea y califica con honestidad. Cada botón muestra en cuánto volverá la tarjeta. {cards.length} {cards.length === 1 ? "tarjeta" : "tarjetas"}
          {early ? " (incluye adelantadas)" : " pendientes"}.
        </p>
      </SectionHeader>
      {filters}
      <FlashReview cards={cards} />
    </div>
  );
}
