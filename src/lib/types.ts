// Tipos compartidos entre servidor y cliente (sin datos).

export type ItemType = "phrasal" | "collocation" | "idiom" | "vocab" | "phrase" | "contraction";
export type Level = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const LEVELS: Level[] = ["A1", "A2", "B1", "B2", "C1", "C2"];
export type Mode = "recog" | "prod" | "listen" | "speak";
export const MODES: Mode[] = ["recog", "prod", "listen", "speak"];

export interface Example {
  en: string; // con [corchetes] alrededor del término
  es: string;
  /** Catálogo: fuente (tatoeba:<en>-<es>) y autores, que la licencia CC BY exige citar. */
  src?: string;
  by?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  term: string;
  ipa?: string;
  level: Level;
  topic: string;
  freq: number;
  es: string;
  def: string;
  note?: string;
  sep?: boolean;
  syn?: string[];
  ex: Example[];
  /** Solo contracciones: forma completa. */
  full?: string;
  /** Áreas de interés (el build las completa desde topic si faltan). */
  areas: string[];
  tags?: string[];
}
export type ItemFull = Item & RealTalk;

export interface LessonLine {
  who?: string;
  en: string;
  es: string;
  item?: string;
}

export interface Lesson {
  id: string;
  level: Level;
  topic: string;
  order: number;
  title: string;
  title_es: string;
  intro_es: string;
  lines: LessonLine[];
  items: string[];
  questions: { q: string; options: string[]; answer: number; why_es: string }[];
}

export interface IpaWord {
  word: string;
  ipa: string;
}

export interface Sound {
  id: string;
  symbol: string;
  kind: "vowel" | "diphthong" | "consonant" | "ending";
  order: number;
  name_es: string;
  words: IpaWord[];
  how_es: string;
  vs_es: string;
  mistake_es: string;
  tip_es: string;
  pairs: { a: IpaWord; b: IpaWord }[];
  phrases: Example[];
}

export interface ProsodyLesson {
  id: string;
  kind: "stress" | "rhythm" | "intonation" | "linking" | "reduction";
  order: number;
  title_es: string;
  explain_es: string;
  drills: { en: string; mark: string; es: string; tip_es: string }[];
}

export const TYPE_LABEL: Record<ItemType, string> = {
  phrasal: "Phrasal verb",
  collocation: "Collocation",
  idiom: "Expresión idiomática",
  vocab: "Vocabulario",
  phrase: "Frase útil",
  contraction: "Contracción / habla real",
};

export interface Roleplay {
  id: string;
  area: string;
  level: Level;
  title: string;
  title_es: string;
  setting_es: string;
  npc: string;
  turns: { npc: string; npc_es: string; task_es: string; expect: string[][]; model: string[]; tips?: { wrong: string; fix: string; why_es: string }[] }[];
  useful: string[];
}

export interface CommonError {
  id: string;
  category: string;
  level: Level;
  wrong: string;
  right: string[];
  pattern?: string;
  why_es: string;
}

export interface PlacementQ {
  id: string;
  section: "grammar" | "vocab" | "reading" | "listening";
  level: Level;
  prompt: string;
  options: string[];
  answer: number;
  why_es?: string;
  passage?: string;
  audio?: string;
  group?: string;
}

export interface Tense {
  id: string;
  order: number;
  name_en: string;
  title_es: string;
  use_es: string;
  form: { aff: string; neg: string; q: string };
  signals?: string[];
  examples: Example[];
  mistakes_es?: string;
  practice: { q: string; options: string[]; answer: number }[];
}

export const TOPIC_LABEL: Record<string, string> = {
  daily: "Vida diaria",
  work: "Trabajo",
  tech: "Tecnología",
  travel: "Viajes",
  canada: "Canadá",
  interview: "Entrevistas",
  social: "Amistades",
  informal: "Informal",
  money: "Dinero",
  health: "Salud",
  feelings: "Emociones",
  study: "Estudio",
  home: "Casa",
  food: "Comida",
};

/** Paso de una sesión. Los pasos calificables llevan itemId + mode. */
export type Step =
  | { kind: "story"; lesson: Lesson }
  | { kind: "question"; lessonId: string; q: Lesson["questions"][number] }
  | { kind: "intro"; item: Item }
  | { kind: "recog"; item: Item; options: string[]; answer: number; isNew: boolean; alts?: Alt[] }
  /** format: choice (opciones) | typed (escribir la expresión) | build (construir la frase con fichas). */
  | { kind: "prod"; item: Item; ex: Example; options: string[] | null; answer: string; isNew: boolean; format?: "choice" | "typed" | "build"; tiles?: string[]; alts?: Alt[] }
  /** format: choice (¿qué expresión dice?) | dictation (escribir la frase completa que se oye). */
  | { kind: "listen"; item: Item; ex: Example; options: string[]; answer: number; isNew: boolean; format?: "choice" | "dictation"; alts?: Alt[] }
  /** Práctica de emparejar (no toca FSRS): expresiones con su significado. */
  | { kind: "match"; pairs: { id: string; en: string; es: string }[]; title: string }
  | { kind: "speak"; item: Item; ex: Example; isNew: boolean }
  | { kind: "repair"; phrases: RepairPhrase[] }
  | { kind: "task"; task: ProductionTask };

export type GradedStep = Extract<Step, { item: Item; isNew: boolean }>;

/** Qué es cada opción incorrecta (para explicar «¿por qué?» con datos reales del contenido). */
export type Alt = { term: string; es: string };

/** Microescena original de «Inglés de series». */
export interface SeriesScene {
  id: string;
  level: Level;
  genre: string;
  title: string;
  title_es: string;
  setting_es: string;
  features: string[];
  lines: { who: string; g: "f" | "m"; en: string; es: string }[];
  context: { q_es: string; options: string[]; answer: number; why_es: string };
  expressions: { text: string; es: string }[];
  decoys: string[];
  gap: { line: number; answer: string; options: string[] };
  intent: { q_es: string; options: string[]; answer: number; why_es: string };
  shadow: number;
  reply: { prompt_es: string; model: string[] };
}

/** Texto del ejemplo sin corchetes. */
export const plain = (s: string) => s.replace(/[\[\]]/g, "");
/** Lo que va entre corchetes. */
export const bracketed = (s: string) => s.match(/\[([^\]]+)\]/)?.[1] ?? "";

/** Tarea de producción abierta: se compara con grupos de palabras clave; si no se puede evaluar, se revisa sin penalizar. */
export interface ProductionTask {
  prompt_es: string;
  model: string[];
  expect: string[][];
}
export interface RepairPhrase {
  situation_es: string;
  en: string;
  es: string;
}
export type Band = "A1-A2" | "B1-B2" | "C1";
export interface RouteTrack {
  id: string;
  band: Band;
  level: Level;
  minutes: number;
  skills: string[];
  objective_es: string;
  items: string[];
  lesson: Lesson & { simulated?: boolean };
  production: ProductionTask[];
  repair: RepairPhrase[];
  roleplay: Roleplay;
}
export interface Route {
  id: string;
  title_es: string;
  icon: string;
  scene: string | null;
  areas: string[];
  season: string | null;
  objective_es: string;
  tracks: RouteTrack[];
}

export interface MusicExercise {
  id: string;
  style: "rap-battle" | "flirty-pop" | "pop-funk";
  skill: string;
  title_es: string;
  line: string;
  spoken: string;
  reductions?: { sung: string; full: string }[];
  explain_es: string;
  artistic_es?: string;
  transfer?: { prompt_es: string; model: string[] };
  confidence?: "low";
  explicit?: boolean;
  /** Fluye 1.0: traducción natural completa, literal opcional, desglose, sonido, intención, registro, uso y ejemplos. */
  es?: string;
  literal_es?: string;
  breakdown?: { text: string; es: string }[];
  linking_es?: string;
  intent_es?: string;
  register?: string;
  usage_es?: string;
  examples?: { en: string; es: string }[];
  genre?: string;
}

/** Campos extra de "inglés real" (slang, groserías, series). */
export interface RealTalk {
  register?: "informal" | "slang" | "vulgar" | "offensive";
  intensity?: number;
  explicit?: boolean;
  intent_es?: string;
  tone_es?: string;
  situations_es?: string;
  softer?: string;
  goal?: "understand" | "both";
  confidence?: "low";
  shows?: string[];
}
