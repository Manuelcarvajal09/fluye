// Comparación tolerante de respuestas escritas y de lo que reconoce el micrófono.

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
}

/** exact = igual; close = un error de dedo (cuenta como acierto difícil); wrong. */
export function checkTyped(input: string, expected: string): "exact" | "close" | "wrong" {
  const a = normalize(input);
  const b = normalize(expected);
  if (!a) return "wrong";
  if (a === b) return "exact";
  const tol = b.length >= 10 ? 2 : b.length >= 5 ? 1 : 0;
  return levenshtein(a, b) <= tol ? "close" : "wrong";
}

const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "it's": "it is", "that's": "that is",
  "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "cannot", "won't": "will not", "isn't": "is not",
  "aren't": "are not", "i'll": "i will", "you'll": "you will", "i've": "i have", "let's": "let us", "gonna": "going to", "wanna": "want to",
};

export const words = (s: string) =>
  normalize(s)
    .split(" ")
    .flatMap((w) => (CONTRACTIONS[w] ?? w).split(" "))
    .filter(Boolean);

/**
 * Coincidencia por palabras entre la frase objetivo y la transcripción del reconocedor.
 * Ojo: mide si el reconocedor entendió las palabras, NO la calidad fonética.
 */
export function wordMatch(target: string, heard: string) {
  const t = words(target);
  const h = words(heard);
  const pool = [...h];
  const marks = t.map((w) => {
    const i = pool.findIndex((x) => x === w || (w.length > 4 && levenshtein(x, w) <= 1));
    if (i >= 0) pool.splice(i, 1);
    return { word: w, ok: i >= 0 };
  });
  const ratio = t.length ? marks.filter((m) => m.ok).length / t.length : 0;
  return { marks, ratio };
}
