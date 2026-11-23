// Inglés real: groserías, insultos y meta de aprendizaje por expresión (entenderla / usarla / ambas).
import type { ItemFull } from "./types";

const SWEARS = /\b(fuck\w*|motherfuck\w*|shit\w*|bullshit|bitch\w*|ass(hole|hat|es)?|dumbass|badass|kiss-ass|damn\w*|goddamn\w*|hell|crap\w*|piss\w*|dick\w*|cock\w*|bastard\w*|screw(ed)?|prick|douche\w*|wtf)\b/gi;

/** Con «lenguaje explícito» desactivado se enmascaran las groserías (f***); activado, se muestran completas. */
export function maskExplicit(text: string, explicit: boolean) {
  if (explicit) return text;
  return text.replace(SWEARS, (w) => w[0] + "*".repeat(Math.max(2, w.length - 1)));
}

export type LearnGoal = "understand" | "use" | "both";

/**
 * Meta efectiva: lo que eligió la persona, o lo que sugiere el contenido
 * (insultos y lenguaje ofensivo: solo entenderlo por defecto; nunca se obliga a producirlos).
 */
export function goalOf(item: Partial<Pick<ItemFull, "goal" | "register">> & object, chosen?: LearnGoal): LearnGoal {
  if (chosen) return chosen;
  if (item.goal === "understand" || item.register === "offensive") return "understand";
  return "both";
}

/** Modos que se practican según la meta: "entenderla" no produce ni habla. */
export const productionModes = new Set(["prod", "speak"]);

export const REGISTER_ES: Record<string, string> = { informal: "Informal", slang: "Slang", vulgar: "Vulgar", offensive: "Ofensiva" };
export const INTENSITY_ES = ["Neutra", "Suave", "Fuerte", "Muy fuerte"];
