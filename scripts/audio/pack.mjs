// Empaqueta los clips generados en public/audio: archivos .bin (mp3 concatenados) + index.json.
// El cliente pide cada clip con una petición Range; así hay pocos archivos y los clips de una tarjeta quedan contiguos.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { collect, have, cachePath, clipKey, root, voices } from "./lib.mjs";

const out = join(root, "public", "audio");
if (existsSync(out)) for (const f of readdirSync(out)) rmSync(join(out, f));
mkdirSync(out, { recursive: true });

const PACK = 900_000;
const packs = [];
const clips = {};
const count = {};
let total = {};
const clipsAll = collect();
for (const c of clipsAll) total[c.voice] = (total[c.voice] ?? 0) + 1;

for (const v of voices.voices.map((x) => x.id)) {
  let buf = [], size = 0, n = 0;
  const flush = () => {
    if (!buf.length) return;
    const data = Buffer.concat(buf);
    const name = `${v}-${n}-${createHash("sha1").update(data).digest("hex").slice(0, 8)}.bin`;
    writeFileSync(join(out, name), data);
    packs.push(name);
    const idx = packs.length - 1;
    let off = 0;
    for (const [k, len] of buf.meta) { clips[k] = [idx, off, len]; off += len; }
    buf = []; size = 0; n++;
  };
  buf.meta = [];
  for (const c of clipsAll.filter((x) => x.voice === v && have(x))) {
    const b = readFileSync(cachePath(c.voice, c.text));
    if (size + b.length > PACK) { flush(); buf.meta = []; }
    buf.push(b); buf.meta.push([clipKey(v, c.text), b.length]); size += b.length;
    count[v] = (count[v] ?? 0) + 1;
  }
  flush();
}
const coverage = Object.fromEntries(voices.voices.map((v) => [v.id, { count: count[v.id] ?? 0, total: total[v.id] ?? 0, scope: v.scope }]));
writeFileSync(join(out, "index.json"), JSON.stringify({ v: 1, packs, coverage, clips }));
const bytes = packs.reduce((a, p) => a + readFileSync(join(out, p)).length, 0);
console.log(`${Object.keys(clips).length} clips en ${packs.length} paquetes (${(bytes / 1048576).toFixed(1)} MB). Cobertura:`, JSON.stringify(coverage));
