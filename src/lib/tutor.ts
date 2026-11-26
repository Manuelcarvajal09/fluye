import "server-only";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Profile } from "./user";
import { getItem, levelIndex } from "./content";
import type { Say } from "./motivation";

export type Tip = Say & { href?: string; cta?: string; why: string };

const MODE_ES: Record<string, string> = { recog: "reconocer el significado", prod: "usar las expresiones", listen: "entenderlas al oído", speak: "decirlas en voz alta" };

/**
 * Consejos de la mascota tutora, calculados con datos reales de la persona (sin servicios externos).
 * Cada consejo dice de qué dato sale (`why`). Sin culpas ni exageraciones; si no hay datos suficientes, no se inventa nada.
 */
export async function tutorTips(profile: Profile, now = new Date()): Promise<Tip[]> {
  const d = db();
  const since = new Date(now.getTime() - 21 * 86_400_000);
  const [byMode, dueListen, confusions, informal] = await Promise.all([
    d
      .select({ mode: schema.reviewLogs.mode, n: sql<number>`count(*)::int`, fails: sql<number>`count(*) filter (where ${schema.reviewLogs.rating} = 1)::int` })
      .from(schema.reviewLogs)
      .where(and(eq(schema.reviewLogs.userId, profile.userId), gte(schema.reviewLogs.reviewedAt, since)))
      .groupBy(schema.reviewLogs.mode),
    d
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.cards)
      .where(and(eq(schema.cards.userId, profile.userId), eq(schema.cards.mode, "listen"), eq(schema.cards.suspended, 0), lte(schema.cards.due, now))),
    d
      .select({ expected: schema.errorEvents.expected, given: schema.errorEvents.given, n: sql<number>`count(*)::int` })
      .from(schema.errorEvents)
      .where(and(eq(schema.errorEvents.userId, profile.userId), gte(schema.errorEvents.createdAt, since), sql`${schema.errorEvents.given} is not null`))
      .groupBy(schema.errorEvents.expected, schema.errorEvents.given)
      .orderBy(desc(sql`count(*)`))
      .limit(5),
    d
      .select({ itemId: schema.reviewLogs.itemId })
      .from(schema.reviewLogs)
      .where(and(eq(schema.reviewLogs.userId, profile.userId), gte(schema.reviewLogs.reviewedAt, new Date(now.getTime() - 3 * 86_400_000))))
      .orderBy(desc(schema.reviewLogs.reviewedAt))
      .limit(60),
  ]);
  const tips: Tip[] = [];

  // Habilidad más débil vs. más fuerte (mínimo 15 intentos por modalidad para no sacar conclusiones con poco).
  const rated = byMode.filter((m) => m.n >= 15).map((m) => ({ ...m, rate: m.fails / m.n }));
  if (rated.length >= 2) {
    const weak = rated.reduce((a, b) => (b.rate > a.rate ? b : a));
    const strong = rated.reduce((a, b) => (b.rate < a.rate ? b : a));
    if (weak.rate - strong.rate >= 0.12)
      tips.push({ text: `Has mejorado en ${MODE_ES[strong.mode]}, pero todavía te cuesta ${MODE_ES[weak.mode]}. Hoy le damos más práctica a eso.`, mood: "encourage", href: "/sesion", cta: "Practicar", why: `fallos 21 días: ${weak.mode} ${Math.round(weak.rate * 100)} % vs ${strong.mode} ${Math.round(strong.rate * 100)} %` });
  }

  const listen = dueListen[0]?.n ?? 0;
  if (listen >= 5) tips.push({ text: `Hoy tienes ${listen} repasos de escucha pendientes. Con audífonos se aprovechan mejor.`, mood: "think", href: "/sesion", cta: "Empezar", why: "tarjetas listen vencidas" });

  // Confusiones reales: lo esperado vs. lo que escribiste, cuando lo escrito es otra expresión del contenido.
  for (const c of confusions) {
    if (!c.expected || !c.given || c.n < 2) continue;
    const g = c.given.trim().toLowerCase();
    const e = c.expected.trim().toLowerCase();
    if (g === e || g.length > 40) continue;
    tips.push({ text: `Sueles confundir «${e}» con «${g}». Vamos a practicar sus diferencias.`, mood: "think", href: "/repaso", cta: "Repasar", why: `${c.n} veces en 21 días` });
    break;
  }

  if (levelIndex(profile.level) >= 2) tips.push({ text: "¿Probamos expresiones de series sin subtítulos? Escucha primero y luego revisa el texto.", mood: "wow", href: "/biblioteca?tag=tv", cta: "Ver series", why: "nivel B1 o superior" });

  // Registro: si repasaste hace poco algo muy informal o vulgar, recordarlo con tacto.
  for (const r of informal) {
    const it = getItem(r.itemId) as (ReturnType<typeof getItem> & { register?: string }) | undefined;
    if (it && (it.register === "vulgar" || it.tags?.includes("slang"))) {
      tips.push({ text: `«${it.term}» es muy informal: perfecto con amistades, pero evítalo en una entrevista o en un correo de trabajo.`, mood: "think", why: "repasaste un ítem de registro informal" });
      break;
    }
  }
  return tips.slice(0, 4);
}
