// Verifica la cobertura REAL del audio HD: para cada clip requerido comprueba que está en el índice empaquetado
// y que sus bytes son un MP3 válido (cabecera de trama MPEG o ID3), con duración razonable y sin ser casi silencio.
// No basta con que exista la entrada en index.json. Escribe docs/v1/audio-cobertura.json.
// Uso: node scripts/audio/verify.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { collect, clipKey, root, voices } from "./lib.mjs";

const dir = join(root, "public", "audio");
const index = JSON.parse(readFileSync(join(dir, "index.json"), "utf8"));
const packs = index.packs.map((p) => readFileSync(join(dir, p)));
const BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]; // MPEG-1 capa III
const BITRATES2 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160]; // MPEG-2 y 2.5 capa III

/** Recorre las tramas MPEG-1 capa III: devuelve duración (s), nº de tramas y energía media aproximada de los datos. */
function mp3Info(b) {
  let i = 0;
  if (b[0] === 0x49 && b[1] === 0x44 && b[2] === 0x33) i = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]);
  let frames = 0, seconds = 0, bad = 0, distinct = new Set();
  while (i + 4 < b.length) {
    if (b[i] !== 0xff || (b[i + 1] & 0xe0) !== 0xe0) { i++; bad++; if (bad > 4096) break; continue; }
    const version = (b[i + 1] >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    const br = (version === 3 ? BITRATES : BITRATES2)[(b[i + 2] >> 4) & 15];
    const srIdx = (b[i + 2] >> 2) & 3;
    const sr = [[11025, 12000, 8000], null, [22050, 24000, 16000], [44100, 48000, 32000]][version]?.[srIdx];
    if (!br || !sr) { i++; bad++; continue; }
    const pad = (b[i + 2] >> 1) & 1;
    const spf = version === 3 ? 1152 : 576;
    const len = Math.floor(((spf / 8) * br * 1000) / sr) + pad;
    if (len < 24) { i++; continue; }
    for (let k = i + 36; k < Math.min(i + len, b.length); k += 7) distinct.add(b[k]);
    frames++;
    seconds += spf / sr;
    i += len;
  }
  return { frames, seconds, variety: distinct.size };
}

const required = collect();
const rows = [];
const by = {};
for (const c of required) {
  const k = clipKey(c.voice, c.text);
  const e = index.clips[k];
  const g = (by[`${c.voice}|${c.group}`] ??= { voice: c.voice, group: c.group, required: 0, ok: 0, missing: 0, invalid: 0 });
  g.required++;
  if (!e) { g.missing++; rows.push({ ...c, problem: "missing" }); continue; }
  const [p, off, len] = e;
  const info = mp3Info(packs[p].subarray(off, off + len));
  const words = c.text.split(/\s+/).length;
  // Silencio o truncado: sin tramas, muy pocos bytes distintos (silencio comprimido) o demasiado corto para su texto.
  const problem = !info.frames ? "not-mp3" : info.variety < 20 ? "silent" : info.seconds < 0.13 * Math.min(words, 8) ? "too-short" : info.seconds > 2.5 + words * 1.2 ? "too-long" : null;
  if (problem) { g.invalid++; rows.push({ ...c, problem, seconds: +info.seconds.toFixed(2) }); } else g.ok++;
}
const groups = Object.values(by).sort((a, b) => a.voice.localeCompare(b.voice) || a.group.localeCompare(b.group));
const total = { required: required.length, ok: groups.reduce((a, g) => a + g.ok, 0) };
mkdirSync(join(root, "docs", "v1"), { recursive: true });
writeFileSync(join(root, "docs", "v1", "audio-cobertura.json"), JSON.stringify({ date: new Date().toISOString().slice(0, 10), voices: voices.voices.map((v) => ({ id: v.id, scope: v.scope, desc: v.desc })), total, groups, problems: rows.slice(0, 2000) }, null, 2));
for (const g of groups) console.log(`${g.voice.padEnd(9)} ${g.group.padEnd(16)} ${String(g.ok).padStart(6)}/${String(g.required).padEnd(6)} faltan ${g.missing} · inválidos ${g.invalid}`);
console.log(`TOTAL ${total.ok}/${total.required} (${((100 * total.ok) / total.required).toFixed(2)} %) · problemas: ${rows.length}`);
const kinds = rows.reduce((a, r) => ((a[r.problem] = (a[r.problem] ?? 0) + 1), a), {});
console.log(kinds);
