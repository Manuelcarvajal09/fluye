import cfg from "../../../content/voices.json";

export type HdVoice = { id: string; label: string; desc: string; gender: "f" | "m" };
export const HD_VOICES = cfg.voices as HdVoice[];
export const DEFAULT_HD = cfg.default;
export const SPEAKER_GENDER = cfg.speakers as Record<string, "f" | "m">;

const byGender = (g: "f" | "m") => HD_VOICES.find((v) => v.gender === g)?.id ?? DEFAULT_HD;
export const genderOf = (voice: string) => HD_VOICES.find((v) => v.id === voice)?.gender ?? "f";

/** Voz de un personaje con nombre (Maya, Leo…) o, sin nombre, la del interlocutor (género opuesto al de la voz principal). */
export function resolveVoice(opts: { main: string; speaker?: string; partner?: boolean; gender?: "f" | "m" }) {
  if (opts.gender) return byGender(opts.gender);
  if (opts.speaker) return byGender(SPEAKER_GENDER[opts.speaker] ?? "f");
  if (opts.partner) return byGender(genderOf(opts.main) === "f" ? "m" : "f");
  return opts.main;
}
