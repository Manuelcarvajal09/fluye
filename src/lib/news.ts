import "server-only";
import { desc, eq, gte } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Noticia de Canadá del día: comunicados de canada.ca (Gobierno de Canadá). Sus términos permiten reproducirlos
 * sin fines comerciales indicando título, autor y que es copia de la versión publicada en la URL original.
 * Se descarga una sola vez por día (la primera visita) y se guarda; si falla, se muestra la del día anterior.
 */
const FEED = (since: string) =>
  `https://api.io.canada.ca/io-server/gc/news/en/v2?sort=publishedDate&orderBy=desc&publishedDate%3E=${since}&pick=60&format=atom&atomtitle=National%20News`;
const TZ = "America/Edmonton";

export type News = typeof schema.dailyNews.$inferSelect & { stale?: boolean };

const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
const tag = (xml: string, t: string) => decode(xml.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1] ?? "");

type Entry = { title: string; summary: string; author: string; category: string; url: string; updated: string };
function parse(xml: string): Entry[] {
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
    title: tag(e, "title"),
    summary: tag(e, "summary"),
    author: tag(e, "name"),
    category: e.match(/<category term="([^"]+)"/)?.[1] ?? "",
    url: e.match(/<link href="([^"]+)"/)?.[1] ?? "",
    updated: tag(e, "updated"),
  }));
}

/** Preferencia: comunicados (no avisos a medios), inmigración, empleo, Alberta/Edmonton y vida diaria. */
function score(e: Entry) {
  const t = `${e.title} ${e.summary}`.toLowerCase();
  let s = 0;
  if (e.category === "news releases") s += 3;
  if (e.category === "media advisories") s -= 6;
  if (/tribunal|anti-dumping|dumping|notice of|order in council/i.test(e.title)) s -= 6;
  if (/immigration|citizenship|newcomer|refugee/i.test(`${e.author} ${t}`)) s += 4;
  if (/employment|jobs|workers|skills|labour/i.test(t)) s += 3;
  if (/alberta|edmonton|calgary/i.test(t)) s += 4;
  if (/winter|health|housing|weather|park|family|students/i.test(t)) s += 1;
  if (e.summary.length > 100) s += 1;
  return s;
}

/** Párrafos principales del comunicado (máx. ~650 palabras), sin contactos ni menús. */
async function articleBody(url: string): Promise<string[]> {
  if (!/^https:\/\/www\.canada\.ca\//.test(url)) return [];
  const html = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "user-agent": "Fluye/1.0 (lectura diaria)" } }).then((r) => (r.ok ? r.text() : ""));
  const main = html.match(/<main[\s\S]*?<\/main>/)?.[0] ?? html;
  const out: string[] = [];
  let words = 0;
  for (const [, p] of main.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)) {
    const text = decode(p);
    if (text.length < 40 || /^(from:|contacts?|media relations|for more information|follow|stay connected|date modified|news release)/i.test(text) || /@|\(\d{3}\)\s?\d{3}/.test(text)) continue;
    out.push(text);
    words += text.split(/\s+/).length;
    if (words > 650 || out.length >= 10) break;
  }
  return out;
}

async function fetchToday(day: string, recent: Set<string>) {
  const since = new Date(Date.now() - 10 * 86_400_000).toISOString().slice(0, 10);
  const xml = await fetch(FEED(since), { signal: AbortSignal.timeout(8000) }).then((r) => (r.ok ? r.text() : ""));
  const entries = parse(xml).filter((e) => e.url && e.title && !recent.has(e.url));
  if (!entries.length) return null;
  const best = entries.sort((a, b) => score(b) - score(a))[0];
  const body = await articleBody(best.url).catch(() => []);
  return { day, title: best.title, summary: best.summary, body: body.length ? body : [best.summary], url: best.url, source: best.author || "Government of Canada", category: best.category, publishedAt: best.updated ? new Date(best.updated) : null };
}

/** La noticia de hoy (la descarga y guarda si aún no existe); si no se puede, la más reciente guardada. */
export async function todayNews(): Promise<News | null> {
  const day = today();
  const d = db();
  const [row] = await d.select().from(schema.dailyNews).where(eq(schema.dailyNews.day, day));
  if (row) return row;
  const recentRows = await d.select({ url: schema.dailyNews.url }).from(schema.dailyNews).where(gte(schema.dailyNews.day, new Date(Date.now() - 20 * 86_400_000).toISOString().slice(0, 10)));
  const fresh = await fetchToday(day, new Set(recentRows.map((r) => r.url))).catch(() => null);
  if (fresh) {
    const [ins] = await d.insert(schema.dailyNews).values(fresh).onConflictDoNothing().returning();
    return ins ?? (await d.select().from(schema.dailyNews).where(eq(schema.dailyNews.day, day)))[0] ?? null;
  }
  const [last] = await d.select().from(schema.dailyNews).orderBy(desc(schema.dailyNews.day)).limit(1);
  return last ? { ...last, stale: true } : null;
}

export async function newsOf(day: string) {
  const [row] = await db().select().from(schema.dailyNews).where(eq(schema.dailyNews.day, day));
  return row ?? null;
}

export async function recentNews(limit = 14) {
  return db().select({ day: schema.dailyNews.day, title: schema.dailyNews.title, source: schema.dailyNews.source }).from(schema.dailyNews).orderBy(desc(schema.dailyNews.day)).limit(limit);
}
