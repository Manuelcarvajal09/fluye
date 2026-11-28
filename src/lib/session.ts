import "server-only";
import { allowsNewItem, lessonMin } from "./levels";
import { and, asc, eq, lte, max } from "drizzle-orm";
import { db, schema } from "@/db";
import { ITEMS, LESSONS, getItem, getTrack, levelIndex } from "./content";
import { localDay } from "./game";
import { settingsOf, type Profile } from "./user";
import { goalOf } from "./realtalk";
import { bracketed, plain, type Alt, type Item, type ItemFull, type Mode, type Step } from "./types";

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

/** Opciones mezcladas con la información de cada una (para explicar por qué una incorrecta no encaja). */
function withAlts(item: Item, ds: Item[], pick: (i: Item) => string) {
  const all = [item, ...ds];
  const options = shuffle(all.map(pick));
  const alts: Alt[] = options.map((o) => {
    const it = all.find((x) => pick(x) === o)!;
    return { term: it.term, es: it.es };
  });
  return { options, answer: options.indexOf(pick(item)), alts };
}

const tokens = (s: string) => plain(s).replace(/[.!?,;:"]+/g, "").split(/\s+/).filter(Boolean);

/** Fichas para construir la frase: sus palabras mezcladas + 2 palabras de distracción que no estén en ella. */
function tilesFor(item: Item, ex: Item["ex"][number]) {
  const t = tokens(ex.en);
  const lower = new Set(t.map((w) => w.toLowerCase()));
  const extra = shuffle(distractors(item, 4).flatMap((d) => tokens(d.ex[0].en)).filter((w) => !lower.has(w.toLowerCase()) && w.length > 2)).slice(0, 2);
  return shuffle([...t, ...extra]);
}

/**
 * Paso para (ítem, modalidad). El formato varía según la memoria (state FSRS) y el nivel (lv = índice CEFR):
 * mientras se aprende hay más apoyo (opciones, fichas); en repaso y en niveles altos, más producción libre.
 * La modalidad acreditada no cambia: el formato solo cambia cómo se pide la misma habilidad.
 */
export function stepFor(item: Item, mode: Mode, isNew: boolean, state = 0, lv = 2, rnd: () => number = Math.random): Step {
  if (mode === "recog") {
    const { options, answer, alts } = withAlts(item, distractors(item), (i) => i.es);
    return { kind: "recog", item, options, answer, isNew, alts };
  }
  if (mode === "listen") {
    const ex = pickEx(item);
    const n = tokens(ex.en).length;
    if (state === 2 && n >= 4 && n <= 14 && rnd() < (lv >= 3 ? 0.6 : 0.45)) return { kind: "listen", item, ex, options: [], answer: -1, isNew, format: "dictation" };
    const { options, answer, alts } = withAlts(item, distractors(item), (i) => i.term);
    return { kind: "listen", item, ex, options, answer, isNew, format: "choice", alts };
  }
  if (mode === "speak") return { kind: "speak", item, ex: pickEx(item), isNew };
  const ex = pickEx(item);
  const answer = bracketed(ex.en);
  const n = tokens(ex.en).length;
  const canBuild = n >= 4 && n <= 12;
  const r = rnd();
  // Aprendiendo: opciones (A1–A2) u opciones/fichas (B1+). En repaso: escribir o construir; en C1+ casi siempre escribir.
  const format: "choice" | "typed" | "build" =
    state === 2 ? (canBuild && r < (lv >= 4 ? 0.25 : 0.5) ? "build" : "typed") : lv >= 2 && canBuild && r < 0.5 ? "build" : "choice";
  if (format === "choice") {
    const ds = distractors(item);
    const options = shuffle([answer, ...ds.map((d) => bracketed(d.ex[0].en))]);
    const alts: Alt[] = options.map((o) => (o === answer ? { term: item.term, es: item.es } : (() => { const d = ds.find((x) => bracketed(x.ex[0].en) === o)!; return { term: d.term, es: d.es }; })()));
    return { kind: "prod", item, ex, options, answer, isNew, format, alts };
  }
  if (format === "build") return { kind: "prod", item, ex, options: null, answer, isNew, format, tiles: tilesFor(item, ex) };
  return { kind: "prod", item, ex, options: null, answer, isNew, format: "typed" };
}

export type SessionKind = "daily" | "mission" | "return";
/** Días sin estudiar a partir de los cuales la sesión se vuelve "de regreso": más repaso, menos nuevo. */
export const RETURN_AFTER_DAYS = 4;

/** noNew: sin vidas (y sin vidas ilimitadas) solo hay repaso y práctica, nada nuevo. */
export async function buildSession(profile: Profile, minutes: number, opts: { trackId?: string; only?: string[]; qaFormat?: "build"; noNew?: boolean; lessonId?: string } = {}, now = new Date()) {
  // Solo pruebas (FLUYE_QA=1): fuerza el banco de palabras para poder probarlo de punta a punta.
  const qaRnd = opts.qaFormat === "build" ? () => 0 : undefined;
  const d = db();
  // Pasos por sesión: ~25 s por paso contando leer, escuchar y la corrección. Antes eran 4 por minuto y las sesiones
  // duraban casi el doble de lo prometido (20 min = 80 pasos). Ahora: 5 min ≈ 12, 10 ≈ 24, 15 ≈ 36, 20 ≈ 48.
  const budget = Math.max(10, Math.round(minutes * 2.4));
  const userLevel = levelIndex(profile.level);
  const mission = opts.trackId && !opts.noNew ? getTrack(opts.trackId) : undefined;
  // Estudiar una colección: solo sus entradas (repasos vencidos + las que aún no activas), con el mismo motor FSRS.
  const only = opts.only ? new Set(opts.only) : null;
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
    if (!item || seenModes.has(c.itemId) || (only && !only.has(c.itemId))) continue;
    seenModes.add(c.itemId);
    dueSteps.push(stepFor(item, c.mode as Mode, false, c.state, userLevel, qaRnd));
  }

  // Cuántas nuevas: lo que quede del límite diario, sin pasarse del tiempo de la sesión.
  const newLeft = Math.max(0, profile.dailyNew - (todayRow[0]?.newItems ?? 0));
  const room = Math.max(0, Math.floor((budget - dueSteps.length) / 3));
  let newCount = opts.noNew ? 0 : Math.min(newLeft, room, kind === "return" ? 2 : 99);

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
      steps.push(stepFor(it, "recog", true, 0, userLevel, qaRnd));
    }
    steps.push(...shuffle(dueSteps));
    if (track.repair.length) steps.push({ kind: "repair", phrases: track.repair });
    for (const it of shuffle(fresh)) if (!understandOnly(it)) steps.push(stepFor(it, "prod", true, 0, userLevel, qaRnd));
    for (const task of track.production.slice(0, minutes >= 15 ? 3 : 2)) steps.push({ kind: "task", task });
    return { steps, lessonId, newCount: fresh.length, dueCount: due.length, kind, away: Math.floor(away) };
  }

  if (only) {
    const cap = opts.noNew ? 0 : Math.max(3, Math.min(Math.floor((budget - dueSteps.length) / 3), 10));
    for (const id of only) {
      const it = getItem(id);
      if (it && !knownIds.has(id) && fresh.length < cap) fresh.push(it);
    }
    for (const it of fresh) {
      steps.push({ kind: "intro", item: it });
      steps.push(stepFor(it, "recog", true, 0, userLevel, qaRnd));
    }
    steps.push(...shuffle(dueSteps));
    for (const it of shuffle(fresh)) if (!understandOnly(it)) steps.push(stepFor(it, "prod", true, 0, userLevel, qaRnd));
    return { steps, lessonId, newCount: fresh.length, dueCount: dueSteps.length, kind: "daily" as SessionKind, away: Math.floor(away) };
  }

  // Lección del día dentro de tu franja: desde B1 no se proponen lecciones A1/A2 (lo básico se da por sabido).
  // Desde el mapa («Tu viaje») se puede pedir una lección concreta de cualquier nivel, aunque ya esté hecha (para repasarla).
  const chosen = opts.lessonId && !opts.noNew ? LESSONS.find((l) => l.id === opts.lessonId) : undefined;
  // En la práctica rápida (5 min) no entra la lección del día: sería media sesión solo de lectura.
  const lesson = chosen ?? (kind === "return" || opts.qaFormat || opts.noNew || minutes <= 5 ? undefined : LESSONS.find((l) => !doneIds.has(l.id) && levelIndex(l.level) >= lessonMin(userLevel) && levelIndex(l.level) <= userLevel + 1));
  if (lesson && (chosen || newCount > 0 || dueSteps.length < 6)) {
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
    // Franja de nivel (src/lib/levels.ts): desde B1 nada de A1/A2 salvo el habla real.
    const inLevel = (i: Item) => allowsNewItem(userLevel, i);
    const near = (i: Item) => Math.abs(levelIndex(i.level) - userLevel) + (levelIndex(i.level) > userLevel ? 0.5 : 0);
    const pool = ITEMS.filter((i) => !knownIds.has(i.id) && !declared.has(i.id) && !fresh.includes(i) && inLevel(i) && (st.explicit === true || (!i.explicit && i.register !== "vulgar" && i.register !== "offensive"))).sort(
      (a, b) => near(a) - near(b) || score(b) - score(a) || a.id.localeCompare(b.id),
    );
    // Mezcla tipos para que una sesión no sea solo phrasal verbs.
    const seenTypes = new Map<string, number>();
    const target = fresh.length + newCount; // lo de la lección ya cuenta; solo se añaden las que faltan
    for (const it of pool) {
      if (fresh.length >= target) break;
      const n = seenTypes.get(it.type) ?? 0;
      if (n >= Math.ceil(newCount / 2)) continue;
      seenTypes.set(it.type, n + 1);
      fresh.push(it);
    }
  }

  for (const it of fresh) {
    steps.push({ kind: "intro", item: it });
    steps.push(stepFor(it, "recog", true, 0, userLevel, qaRnd));
  }
  steps.push(...shuffle(dueSteps));
  for (const it of shuffle(fresh)) if (!understandOnly(it)) steps.push(stepFor(it, "prod", true, 0, userLevel, qaRnd));

  return { steps, lessonId, newCount: fresh.length, dueCount: due.length, kind, away: Math.floor(away) };
}
