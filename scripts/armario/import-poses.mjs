// Importa las capas de vestuario por pose (entrega de Codex, ver docs/qa/mascotas-regeneracion-codex.md).
// Formato esperado: <carpeta>/manifest.json + <carpeta>/<especie>/<estado>/{base,whole-*,lower-*,top-*,fabric-*,front-*}.png
// Escribe public/armario/poses/<especie>/<estado>/*.webp y src/lib/armario-poses.json, y calibra cada pose contra su ilustración.
// Uso: node scripts/armario/import-poses.mjs <carpeta-extraida> [--check]  (--check solo valida, no escribe)
import sharp from "sharp";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
const check = process.argv.includes("--check");
if (!src) throw new Error("Falta la carpeta de la entrega");
const M = JSON.parse(readFileSync(join(src, "manifest.json"), "utf8"));
const D = JSON.parse(readFileSync("src/lib/armario-data.json", "utf8"));
const out = existsSync("src/lib/armario-poses.json") ? JSON.parse(readFileSync("src/lib/armario-poses.json", "utf8")) : {};
const MOODS = ["cheer", "think", "oops", "wow", "sleep", "encourage", "proud"];
const errors = [];
let files = 0;

async function bbox(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, edge = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > 60) {
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) edge++;
      }
  const k = 1024 / info.width;
  return { box: [x0 * k, y0 * k, (x1 + 1) * k, (y1 + 1) * k], edge, w: info.width, h: info.height, empty: x1 < 0 };
}

for (const [pet, moods] of Object.entries(M.poses ?? {})) {
  if (!D.pets[pet]) { errors.push(`${pet}: especie desconocida`); continue; }
  for (const [mood, p] of Object.entries(moods)) {
    if (!MOODS.includes(mood)) { errors.push(`${pet}/${mood}: estado desconocido`); continue; }
    const dir = join(src, pet, mood);
    const need = [["base", "base"], ...p.whole.map((k) => ["whole", k]), ...Object.keys(p.lower ?? {}).map((k) => ["lower", k]), ...Object.keys(p.top ?? {}).map((k) => ["top", k]), ...Object.keys(p.fabric ?? {}).map((k) => ["fabric", k]), ...Object.keys(p.front ?? {}).map((k) => ["front", k])];
    for (const [layer, k] of need) {
      const f = join(dir, layer === "base" ? "base.png" : `${layer}-${k}.png`);
      if (!existsSync(f)) { errors.push(`${pet}/${mood}: falta ${f}`); continue; }
      const b = await bbox(f);
      if (b.empty) errors.push(`${pet}/${mood}: ${layer}-${k} vacío`);
      if ((layer === "base" || layer === "whole") && (b.w !== 1024 || b.h !== 1024)) errors.push(`${pet}/${mood}: ${layer}-${k} mide ${b.w}×${b.h} (debe ser 1024×1024)`);
      if ((layer === "base" || layer === "whole") && b.edge > 4) errors.push(`${pet}/${mood}: ${layer}-${k} toca el borde (recorte)`);
      const box = layer === "base" || layer === "whole" ? null : p[layer][k];
      if (box && (box[0] < 0 || box[1] < 0 || box[0] + box[2] > 1024 || box[1] + box[3] > 1024)) errors.push(`${pet}/${mood}: caja de ${layer}-${k} fuera del lienzo`);
      if (!check) {
        const o = join("public/armario/poses", pet, mood);
        mkdirSync(o, { recursive: true });
        const img = sharp(f);
        const meta = await img.metadata();
        await img.resize({ width: Math.max(1, Math.round(meta.width / 2)) }).webp({ quality: 86, alphaQuality: 92, effort: 5 }).toFile(join(o, layer === "base" ? "base.webp" : `${layer}-${k}.webp`));
      }
      files++;
    }
    // Calibración: la base de la pose debe coincidir con su ilustración (public/mascots/<especie>-<estado>.webp).
    const pose = (await bbox(`public/mascots/${pet}-${mood}.webp`)).box;
    const b = existsSync(join(dir, "base.png")) ? (await bbox(join(dir, "base.png"))).box : null;
    if (!b) continue;
    const sc = 880 / 1024, feet = p.feet?.base ?? 964;
    const y0 = 964 + (b[1] - feet) * sc, y1 = 964 + (b[3] - feet) * sc, x0 = 72 + b[0] * sc, x1 = 72 + b[2] * sc;
    const s = (pose[3] - pose[1]) / (y1 - y0);
    const fit = { s: +s.toFixed(4), dx: +((pose[0] + pose[2]) / 2 - ((x0 + x1) / 2) * s).toFixed(1), dy: +(pose[3] - y1 * s).toFixed(1) };
    const widthDiff = Math.abs(pose[2] - pose[0] - (x1 - x0) * s) / (pose[2] - pose[0]);
    if (widthDiff > 0.04) errors.push(`${pet}/${mood}: la base no coincide con la ilustración de la pose (${(widthDiff * 100).toFixed(1)} % de diferencia de ancho)`);
    (out[pet] ??= {})[mood] = { feet: p.feet, whole: p.whole, lower: p.lower ?? {}, top: p.top ?? {}, fabric: p.fabric ?? {}, front: p.front ?? {}, ink: p.ink ?? {}, badges: p.badges ?? {}, fit };
  }
}
console.log(`${files} archivos revisados · ${errors.length} problemas`);
for (const e of errors.slice(0, 80)) console.log(" -", e);
if (!check) {
  writeFileSync("src/lib/armario-poses.json", JSON.stringify(out));
  console.log("escrito src/lib/armario-poses.json");
}
if (errors.length) process.exitCode = 1;
