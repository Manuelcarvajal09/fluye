import "server-only";
import { and, asc, eq, lte, max } from "drizzle-orm";
import { db, schema } from "@/db";
import { ITEMS, LESSONS, getItem, getTrack, levelIndex } from "./content";
import { localDay } from "./game";
import { settingsOf, type Profile } from "./user";
import { goalOf } from "./realtalk";
import { bracketed, type Item, type ItemFull, type Mode, type Step } from "./types";

const shuffle = <T,>(a: T[]) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

const byType = new Map<string, Item[]>();
for (const it of ITEMS) byType.set(it.type, [...(byType.get(it.type) ?? []), it]);

/** Tres distractores del mismo tipo, cercanos en nivel, que no sean sinónimos ni significados iguales. */
export function distractors(item: Item, n = 3): Item[] {
  const syn = new Set((item.syn ?? []).map((s) => s.toLowerCase()));
  const pool = (byType.get(item.type) ?? ITEMS).filter(
    (o) => o.id !== item.id && o.term !== item.term && o.es !== item.es && !syn.has(o.term.toLowerCase()) && !(o.syn ?? []).includes(item.term),
  );
  const near = pool.filter((o) => Math.abs(levelIndex(o.level) - levelIndex(item.level)) <= 1);
  return shuffle(near.length >= n ? near : pool).slice(0, n);
}

const pickEx = (item: Item) => item.ex[Math.floor(Math.random() * item.ex.length)];

function choice<T>(correct: T, wrong: T[]) {
  const options = shuffle([correct, ...wrong]);
  return { options, answer: options.indexOf(correct) };
}

export function stepFor(item: Item, mode: Mode, isNew: boolean, state = 0): Step {
  if (mode === "recog") {
    const { options, answer } = choice(item.es, distractors(item).map((d) => d.es));
    return { kind: "recog", item, options, answer, isNew };
  }
  if (mode === "listen") {
    const { options, answer } = choice(item.term, distractors(item).map((d) => d.term));
    return { kind: "listen", item, ex: pickEx(item), options, answer, isNew };
  }
  if (mode === "speak") return { kind: "speak", item, ex: pickEx(item), isNew };
  const ex = pickEx(item);
  const answer = bracketed(ex.en);
  // Producción: con opciones mientras se aprende; escrita cuando ya está en repaso.
  const typed = state === 2;
  const options = typed ? null : shuffle([answer, ...distractors(item).map((d) => bracketed(d.ex[0].en))]);
  return { kind: "prod", item, ex, options, answer, isNew };
}

export type SessionKind = "daily" | "mission" | "return";
/** Días sin estudiar a partir de los cuales la sesión se vuelve "de regreso": más repaso, menos nuevo. */
export const RETURN_AFTER_DAYS = 4;

export async function buildSession(profile: Profile, minutes: number, opts: { trackId?: string } = {}, now = new Date()) {
  const d = db();
  const budget = Math.max(12, Math.round(minutes * 4));
  const userLevel = levelIndex(profile.level);
  const mission = opts.trackId ? getTrack(opts.trackId) : undefined;
  const st = settingsOf(profile);
  const understandOnly = (it: Item) => goalOf(it as ItemFull, st.goals?.[it.id]) === "understand";

  const [due, known, doneLessons, todayRow, [last]] = await Promise.all([
    d
      .select()
      .from(schema.cards)
      .where(and(eq(schema.cards.userId, profile.userId), eq(schema.cards.suspended, 0), lte(schema.cards.due, now)))
      .orderBy(asc(schema.cards.due))
      .limit(400),
    d.selectDistinct({ itemId: schema.cards.itemId }).from(schema.cards).where(eq(schema.cards.userId, profile.userId)),
    d.select({ id: schema.lessonProgress.lessonId }).from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, profile.userId)),
    d
      .select()
      .from(schema.dailyStats)
      .where(and(eq(schema.dailyStats.userId, profile.userId), eq(schema.dailyStats.day, localDay(profile.tz)))),
    d.select({ at: max(schema.reviewLogs.reviewedAt) }).from(schema.reviewLogs).where(eq(schema.reviewLogs.userId, profile.userId)),
  ]);
  const away = last?.at ? (now.getTime() - new Date(last.at).getTime()) / 86_400_000 : 0;
  const kind: SessionKind = mission ? "mission" : away >= RETURN_AFTER_DAYS ? "return" : "daily";

  const knownIds = new Set(known.map((k) => k.itemId));
  const doneIds = new Set(doneLessons.map((l) => l.id));
  const dueSteps: Step[] = [];
  const seenModes = new Set<string>();
  for (const c of due) {
    if (dueSteps.length >= Math.round(budget * (kind === "mission" ? 0.4 : kind === "return" ? 0.85 : 0.75))) break;
    const item = getItem(c.itemId);
    // Una sola modalidad por expresión y sesión: así reconocerla no "regala" la respuesta al producirla o escucharla.
    if (!item || seenModes.has(c.itemId)) continue;
    seenModes.add(c.itemId);
    dueSteps.push(stepFor(item, c.mode as Mode, false, c.state));
  }

  // Cuántas nuevas: lo que quede del límite diario, sin pasarse del tiempo de la sesión.
  const newLeft = Math.max(0, profile.dailyNew - (todayRow[0]?.newItems ?? 0));
  const room = Math.max(0, Math.floor((budget - dueSteps.length) / 3));
  let newCount = Math.min(newLeft, room, kind === "return" ? 2 : 99);

  const steps: Step[] = [];
  const fresh: Item[] = [];
  let lessonId: string | undefined;

  if (mission) {
    // Misión útil: la escena (diálogo), sus expresiones (las ya conocidas no se duplican: entran como repaso normal), producción y reparación.
    const { track } = mission;
    lessonId = track.lesson.id;
    steps.push({ kind: "story", lesson: track.lesson });
    for (const q of track.lesson.questions) steps.push({ kind: "question", lessonId: track.lesson.id, q });
    const cap = Math.max(3, Math.min(track.items.length, Math.max(newLeft, 4), Math.floor(budget / 3)));
    for (const id of track.items) {
      const it = getItem(id);
      if (it && !knownIds.has(id) && fresh.length < cap) fresh.push(it);
    }
    for (const it of fresh) {
      steps.push({ kind: "intro", item: it });
      steps.push(stepFor(it, "recog", true));
    }
    steps.push(...shuffle(dueSteps));
    if (track.repair.length) steps.push({ kind: "repair", phrases: track.repair });
    for (const it of shuffle(fresh)) if (!understandOnly(it)) steps.push(stepFor(it, "prod", true));
    for (const task of track.production.slice(0, minutes >= 15 ? 3 : 2)) steps.push({ kind: "task", task });
    return { steps, lessonId, newCount: fresh.length, dueCount: due.length, kind, away: Math.floor(away) };
  }

  const lesson = kind === "return" ? undefined : LESSONS.find((l) => !doneIds.has(l.id) && levelIndex(l.level) <= userLevel + 1);
  if (lesson && (newCount > 0 || dueSteps.length < 6)) {
    lessonId = lesson.id;
    steps.push({ kind: "story", lesson });
    for (const q of lesson.questions) steps.push({ kind: "question", lessonId: lesson.id, q });
    for (const id of lesson.items) {
      const it = getItem(id);
      if (it && !knownIds.has(id)) fresh.push(it);
    }
    newCount = Math.max(0, newCount - fresh.length);
  }

  if (newCount > 0) {
    // Áreas elegidas por la persona (en profile.topics). Lo de sus áreas va primero; luego lo más frecuente.
    const areas = new Set(profile.topics ?? []);
    const score = (i: (typeof ITEMS)[number]) => {
      const inArea = i.areas.some((a) => areas.has(a)) ? 2 : 0;
      const tv = areas.has("series") && i.tvRank ? Math.max(0, 1 - i.tvRank / 600) : 0;
      return inArea + tv + i.freq / 5;
    };
    // Groserías e insultos solo entran solos si activaste «lenguaje explícito»; nunca se imponen.
    const declared = new Set(st.known ?? []);
    const pool = ITEMS.filter((i) => !knownIds.has(i.id) && !declared.has(i.id) && !fresh.includes(i) && levelIndex(i.level) <= userLevel && (st.explicit === true || (!i.explicit && i.register !== "vulgar" && i.register !== "offensive"))).sort(
      (a, b) => score(b) - score(a) || levelIndex(a.level) - levelIndex(b.level) || a.id.localeCompare(b.id),
    );
    // Mezcla tipos para que una sesión no sea solo phrasal verbs.
    const seenTypes = new Map<string, number>();
    for (const it of pool) {
      if (fresh.length >= (lessonId ? fresh.length + newCount : newCount)) break;
      const n = seenTypes.get(it.type) ?? 0;
      if (n >= Math.ceil(newCount / 2)) continue;
      seenTypes.set(it.type, n + 1);
      fresh.push(it);
    }
  }

  for (const it of fresh) {
    steps.push({ kind: "intro", item: it });
    steps.push(stepFor(it, "recog", true));
  }
  steps.push(...shuffle(dueSteps));
  for (const it of shuffle(fresh)) if (!understandOnly(it)) steps.push(stepFor(it, "prod", true));

  return { steps, lessonId, newCount: fresh.length, dueCount: due.length, kind, away: Math.floor(away) };
}
