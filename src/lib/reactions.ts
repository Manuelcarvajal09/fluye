/** Emojis permitidos para reaccionar a la lectura del club o al resultado de liga de una amistad. */
export const EMOJIS = ["👏", "🔥", "💪", "❤️", "😂"] as const;
export type Emoji = (typeof EMOJIS)[number];
