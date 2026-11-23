// Debe coincidir con scripts/audio/lib.mjs (clipText / clipKey).

/** Texto tal como se narra: sin corchetes, espacios colapsados. */
export const clipText = (s: string) => s.replace(/[\[\]]/g, "").replace(/\s+/g, " ").trim();

export async function clipKey(voice: string, text: string) {
  const d = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(`${voice}|${clipText(text)}`));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 12);
}
