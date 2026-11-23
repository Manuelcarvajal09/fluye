// Mensajes de ánimo de la mascota. Puro: sin hooks ni datos, fácil de probar.
import type { Mood } from "@/components/Mascot";

export type Say = { text: string; mood: Mood };

const pick = <T,>(a: T[], n: number) => a[Math.abs(Math.floor(n)) % a.length];
const fill = (s: string, v: { name?: string; n?: number }) => s.replace("{name}", v.name || "campeón").replace("{n}", String(v.n ?? ""));

const OK = ["¡Eso es!", "¡Muy bien!", "¡Perfecto!", "¡Así se hace!", "¡Excelente!", "¡Lo tienes!", "¡Qué bien suena!", "¡Correcto!", "¡Bravo, {name}!"];
const OK_STREAK = ["¡{n} seguidas! Imparable", "¡Vas en racha, {name}!", "¡{n} aciertos sin parar!", "¡Esto ya es costumbre!"];
const OK_BIG = ["¡{n} seguidas! Increíble", "¡{n} sin fallar! Eres una máquina", "¡Estás on fire, {name}! ({n})"];
const OK_HARD = ["¡Casi perfecto! Revisa la ortografía", "¡Muy cerca! Un detalle y es perfecta"];
const WRONG = [
  "Casi. ¡Tú puedes!",
  "No pasa nada, así se aprende",
  "¡Inténtalo otra vez, vas bien!",
  "Los errores te acercan al inglés real",
  "Esta volverá al final: la vas a dominar",
  "Respira, la próxima te sale",
  "Equivocarse es parte del juego, {name}",
  "¡Sigue así! Cada error cuenta como práctica",
];
const WRONG_MANY = ["Va costando, pero estás aprendiendo. ¡No te rindas!", "Aunque cueste, estás creciendo, {name}", "Un descanso corto y vuelves más fuerte"];
const DONE_TOP = ["¡Sesión impecable, {name}!", "¡Qué nivel! Se nota el esfuerzo", "¡Casi perfecta! Estás volando"];
const DONE_GOOD = ["¡Muy buen trabajo, {name}!", "Así se construye el hábito. ¡Sigue así!", "¡Gran sesión! Mañana, más"];
const DONE_OK = ["Buen esfuerzo. Mañana te saldrá mejor", "Lo importante es que viniste. ¡Eso suma!", "Cada sesión te acerca a Edmonton"];
const DONE_LOW = ["Hoy costó, y aun así lo hiciste. ¡Eso es de campeones!", "Los días difíciles también cuentan. ¡Mañana volvemos!"];

export const correctSay = (streak: number, name: string | undefined, seed: number, close = false): Say => {
  if (close) return { text: fill(pick(OK_HARD, seed), { name }), mood: "happy" };
  if (streak >= 10) return { text: fill(pick(OK_BIG, seed), { name, n: streak }), mood: "cheer" };
  if (streak >= 5) return { text: fill(pick(OK_STREAK, seed), { name, n: streak }), mood: "cheer" };
  if (streak >= 3) return { text: fill(pick(OK_STREAK, seed), { name, n: streak }), mood: "happy" };
  return { text: fill(pick(OK, seed), { name }), mood: "happy" };
};

export const wrongSay = (wrongInRow: number, name: string | undefined, seed: number): Say =>
  wrongInRow >= 3 ? { text: fill(pick(WRONG_MANY, seed), { name }), mood: "oops" } : { text: fill(pick(WRONG, seed), { name }), mood: "oops" };

export const doneSay = (accuracy: number, name: string | undefined, seed: number): Say => {
  const pool = accuracy >= 0.9 ? DONE_TOP : accuracy >= 0.7 ? DONE_GOOD : accuracy >= 0.4 ? DONE_OK : DONE_LOW;
  return { text: fill(pick(pool, seed), { name }), mood: accuracy >= 0.4 ? "cheer" : "happy" };
};

export type GreetCtx = { name?: string; hour: number; streak: number; todayXp: number; goal: number; due: number; doneYesterday: boolean; sessionsToday: number; hasStarted: boolean };

/** Saludo de la pantalla Hoy según el momento: nunca regaña, siempre invita. */
export function greetingSay(c: GreetCtx, seed: number): Say {
  const name = c.name;
  if (c.todayXp >= c.goal) return { text: fill(pick(["¡Meta de hoy cumplida, {name}! Todo lo que hagas ahora es extra.", "¡Lo lograste hoy! Tu racha está a salvo.", "¡Misión cumplida! Puedes seguir o descansar con la cabeza en alto."], seed), { name }), mood: "cheer" };
  if (!c.hasStarted) return { text: fill("¡Hola, {name}! Soy tu compañero. Empecemos con una sesión corta.", { name }), mood: "happy" };
  if (c.streak >= 2 && c.todayXp === 0 && c.doneYesterday) return { text: fill(pick(["Llevas {n} días seguidos. ¡Hoy un ratito y la racha sigue!", "{n} días de racha, {name}. ¡No la sueltes!", "Tu racha de {n} días te espera. Con 5 minutos basta."], seed), { name, n: c.streak }), mood: "think" };
  if (c.todayXp > 0) return { text: fill(pick(["Ya vas a la mitad, {name}. ¡Un empujón más!", "Buen arranque hoy. ¡Sigamos!", "Cada ejercicio cuenta. ¡Tú puedes!"], seed), { name }), mood: "happy" };
  if (c.due > 20) return { text: fill("Tienes {n} repasos esperando. Empieza por unos pocos, sin prisa.", { n: c.due }), mood: "think" };
  if (c.hour < 6) return { text: fill("¿Todavía despierto, {name}? Una sesión corta y a dormir.", { name }), mood: "sleep" };
  if (c.hour < 12) return { text: fill(pick(["¡Buenos días, {name}! Un café y un poco de inglés.", "Mañana perfecta para practicar. ¿Empezamos?"], seed), { name }), mood: "happy" };
  if (c.hour < 19) return { text: fill(pick(["¡Buenas tardes, {name}! ¿Un rato de inglés?", "Un descanso con inglés te sienta bien. ¿Vamos?"], seed), { name }), mood: "happy" };
  return { text: fill(pick(["¡Buenas noches, {name}! Cierra el día con una sesión corta.", "Antes de dormir, 5 minutos de inglés. ¡Tú puedes!"], seed), { name }), mood: "happy" };
}

/** Frase corta cuando se toca a la mascota. */
const TIPS = [
  "¿Sabías que en Canadá se dice «washroom» en vez de «restroom»?",
  "Tip: «gonna» y «wanna» se dicen mucho, pero no se escriben en un correo formal.",
  "Escuchar la frase tres veces y repetirla en voz alta vale más que leerla diez.",
  "Un toque de nieve y ya hablamos de «wind chill»: la sensación térmica.",
  "Los phrasal verbs se entienden mejor dentro de una frase completa.",
  "Equivocarte en voz alta es mejor que acertar en silencio.",
  "«Eh?» es muy canadiense: significa «¿cierto?» o «¿perdón?».",
  "Repasar un poco cada día gana a estudiar mucho una vez a la semana.",
];
export const tipSay = (seed: number): Say => ({ text: pick(TIPS, seed), mood: "think" });
