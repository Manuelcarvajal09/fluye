// Importa las correcciones de la pose feliz (entrega de Codex: correcciones-happy/).
// - <especie>/<capa>-<pieza>.png → public/armario/pets/<especie>/<capa>-<pieza>.webp (mitad de resolución, igual que el resto)
// - cajas.json: cajas nuevas de las capas recortadas y línea de pies de las imágenes completas nuevas
// - ink.json: cajas corregidas de piezas pequeñas (se combinan con las existentes)
// - layers/<pieza>.png → public/armario/layers/<pieza>.webp
// Después hay que recalibrar: node scripts/armario/calibrar-piezas.mjs
// Uso: node scripts/armario/import-happy.mjs <carpeta correcciones-happy>
import sharp from "sharp";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Falta la carpeta correcciones-happy");
const f = "src/lib/armario-data.json";
const D = JSON.parse(readFileSync(f, "utf8"));
const boxes = JSON.parse(readFileSync(join(src, "cajas.json"), "utf8"));
const ink = existsSync(join(src, "ink.json")) ? JSON.parse(readFileSync(join(src, "ink.json"), "utf8")) : {};
let n = 0;
const half = async (from, to) => {
  const img = sharp(from);
  const m = await img.metadata();
  await img.resize({ width: Math.max(1, Math.round(m.width / 2)) }).webp({ quality: 86, alphaQuality: 92, effort: 5 }).toFile(to);
  n++;
};

for (const pet of Object.keys(D.pets)) {
  const dir = join(src, pet);
  if (!existsSync(dir)) continue;
  const p = D.pets[pet];
  for (const file of readdirSync(dir).filter((x) => x.endsWith(".png"))) {
    const [, layer, piece] = file.match(/^(whole|lower|top|fabric|front|base)-?(.*)\.png$/) ?? [];
    if (!layer) { console.log("ignorado", pet, file); continue; }
    await half(join(dir, file), `public/armario/pets/${pet}/${file.replace(".png", ".webp")}`);
    if (layer === "whole" && !p.whole.includes(piece)) p.whole.push(piece);
  }
  const b = boxes[pet] ?? {};
  for (const layer of ["lower", "top", "fabric", "front"]) for (const [k, box] of Object.entries(b[layer] ?? {})) p[layer][k] = box;
  for (const [k, v] of Object.entries(b.feet ?? {})) D.feet[pet][k] = v;
  for (const [k, box] of Object.entries(ink[pet] ?? {})) p.ink[k] = box;
}
const lay = join(src, "layers");
if (existsSync(lay)) for (const file of readdirSync(lay).filter((x) => x.endsWith(".png"))) await half(join(lay, file), `public/armario/layers/${file.replace(".png", ".webp")}`);
writeFileSync(f, JSON.stringify(D));
console.log(`${n} imágenes importadas; cajas, pies e ink actualizados`);
