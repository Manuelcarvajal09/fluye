// Genera el audio que falte (reanudable). Uso:
//   node scripts/audio/generate.mjs [--workers 2] [--voices af_heart,am_adam] [--limit N]
import { fork } from "node:child_process";
import { writeFileSync, mkdirSync, statSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collect, have, cacheDir, voices } from "./lib.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const workers = Number(arg("workers", 2));
const only = arg("voices", voices.voices.map((v) => v.id).join(",")).split(",");
const limit = Number(arg("limit", Infinity));

mkdirSync(cacheDir, { recursive: true });
const all = collect(only);
const missing = all.filter((c) => !have(c));
const todo = missing.slice(0, limit);
console.log(`${all.length} clips en total · ${all.length - missing.length} listos · ${todo.length} por generar con ${workers} procesos`);
if (!todo.length) process.exit(0);

const dir = join(tmpdir(), "fluye-audio");
mkdirSync(dir, { recursive: true });
const listFile = join(dir, "todo.json");
const progress = join(dir, "progress.txt");
for (const f of [progress, progress + ".err"]) if (existsSync(f)) rmSync(f);
writeFileSync(listFile, JSON.stringify(todo));
writeFileSync(progress, "");

const t0 = Date.now();
let alive = workers;
for (let s = 0; s < workers; s++) {
  const p = fork(new URL("./worker.mjs", import.meta.url), [listFile, String(s), String(workers), progress], { stdio: ["ignore", "ignore", "ignore", "ipc"], env: { ...process.env, ORT_THREADS: String(Math.max(1, Math.floor(6 / workers))) } });
  p.on("exit", () => { alive--; });
}
const tick = setInterval(() => {
  const done = statSync(progress).size;
  const rate = done / ((Date.now() - t0) / 1000);
  const eta = rate ? Math.round((todo.length - done) / rate / 60) : "?";
  console.log(`${done}/${todo.length} (${((100 * done) / todo.length).toFixed(1)} %) · ${(rate * 60).toFixed(0)} clips/min · quedan ~${eta} min`);
  if (!alive) { clearInterval(tick); const e = existsSync(progress + ".err") ? " · hubo errores, ver " + progress + ".err" : ""; console.log("terminado" + e); }
}, 60_000);
