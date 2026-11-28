// Integra la entrega de Codex de la Fase 3 (docs/ux/CODEX-FASE3.md):
//  - Lote 1: capas front-<gorro> «solo gorro» de la pose feliz y cajas inkWithHat (adorno de cabello con sombrero).
//  - Lote 2: cuatro mascotas nuevas (ilustraciones, pose feliz del probador y siete poses con vestuario).
//  - Lote 3: ocho piezas navideñas para todas las mascotas y poses, y el sombrero de mago corregido del unicornio.
// Las imágenes se pasan a WebP a la mitad de resolución (igual que el resto del arte); las cajas siguen en el lienzo 1024.
// Después: node scripts/armario/calibrar-piezas.mjs (escala por pieza de las imágenes «whole» nuevas).
// Uso: node scripts/armario/import-fase3.mjs <lote1> <lote2> <lote3>   (carpetas extraídas de los ZIP)
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [L1, L2, L3] = process.argv.slice(2);
if (!L3) throw new Error("Uso: import-fase3.mjs <lote1> <lote2> <lote3>");
const DF = "src/lib/armario-data.json";
const PF = "src/lib/armario-poses.json";
const D = JSON.parse(readFileSync(DF, "utf8"));
const P = JSON.parse(readFileSync(PF, "utf8"));
const MOODS = ["happy", "cheer", "think", "oops", "wow", "sleep", "encourage", "proud"];
const LAYERS = ["lower", "top", "fabric", "front", "ink", "badges"];
const read = (f) => JSON.parse(readFileSync(f, "utf8"));
let n = 0;

async function webp(from, to, scale = 0.5) {
  mkdirSync(join(to, ".."), { recursive: true });
  const img = sharp(from);
  const m = await img.metadata();
  await img.resize({ width: Math.max(1, Math.round(m.width * scale)) }).webp({ quality: 86, alphaQuality: 92, effort: 5 }).toFile(to);
  n++;
}
const outDir = (pet, mood) => (mood === "happy" ? `public/armario/pets/${pet}` : `public/armario/poses/${pet}/${mood}`);
/** Copia todos los PNG de una pose (base, whole-, lower-, top-, fabric-, front-). */
async function copyPose(dir, pet, mood) {
  if (!existsSync(dir)) return;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".png"))) await webp(join(dir, f), join(outDir(pet, mood), f.replace(/\.png$/, ".webp")));
}
/** Une los datos de una pose: listas «whole» sin repetir, cajas por clave, pies y cajas inkWithHat por sombrero. */
function merge(target, src) {
  target.whole = [...new Set([...(target.whole ?? []), ...(src.whole ?? [])])];
  for (const k of LAYERS) target[k] = { ...(target[k] ?? {}), ...(src[k] ?? {}) };
  if (src.feet) target.feet = { ...(target.feet ?? {}), ...src.feet };
  if (src.inkWithHat) {
    target.inkWithHat ??= {};
    for (const [hat, m] of Object.entries(src.inkWithHat)) target.inkWithHat[hat] = { ...(target.inkWithHat[hat] ?? {}), ...m };
  }
  if (src.fit && !target.fit) target.fit = src.fit;
  return target;
}
/** Pose feliz: los pies viven aparte (D.feet) y el ajuste en D.fit. */
function mergeHappy(pet, src) {
  const { feet, fit, ...rest } = src;
  D.pets[pet] = merge(D.pets[pet] ?? { whole: [], lower: {}, top: {}, fabric: {}, front: {}, ink: {}, badges: {} }, rest);
  D.feet[pet] = { ...(D.feet[pet] ?? {}), ...(feet ?? {}) };
  if (fit && !D.fit?.[pet]) (D.fit ??= {})[pet] = fit;
}

// ---------- Lote 2: mascotas nuevas ----------
const M2 = read(join(L2, "manifest.json"));
for (const pet of Object.keys(M2.pets)) {
  for (const mood of MOODS) {
    const src = M2.poses[pet]?.[mood];
    if (!src) throw new Error(`Lote 2: falta ${pet}/${mood}`);
    await copyPose(join(L2, "mascotas", pet, mood), pet, mood);
    if (mood === "happy") mergeHappy(pet, src);
    else (P[pet] ??= {})[mood] = merge(P[pet]?.[mood] ?? {}, src);
    await webp(join(L2, "mascotas", "ilustraciones", `${pet}-${mood}.png`), `public/mascots/${pet}-${mood}.webp`, 1);
  }
  D.boxes[pet] = { ...(D.boxes[pet] ?? {}), ...(M2.boxes[pet] ?? {}) };
  console.log("lote 2", pet, n);
}

// ---------- Lote 1: capas frontales y adornos con sombrero (pose feliz) ----------
const M1 = read(join(L1, "manifest.json"));
for (const [pet, moods] of Object.entries(M1.poses)) {
  const src = moods.happy;
  if (!src) continue;
  await copyPose(join(L1, "mascotas", pet, "happy"), pet, "happy");
  mergeHappy(pet, src);
}
console.log("lote 1", n);

// ---------- Lote 3: colección navideña ----------
const M3 = read(join(L3, "manifest.json"));
for (const [pet, moods] of Object.entries(M3.poses)) {
  if (!D.pets[pet]) throw new Error(`Lote 3: especie desconocida ${pet}`);
  for (const [mood, src] of Object.entries(moods)) {
    await copyPose(join(L3, "mascotas", pet, mood), pet, mood);
    if (mood === "happy") mergeHappy(pet, src);
    else (P[pet] ??= {})[mood] = merge(P[pet]?.[mood] ?? {}, src);
  }
  D.boxes[pet] = { ...(D.boxes[pet] ?? {}), ...(M3.boxes?.[pet] ?? {}) };
}
for (const [slot, ids] of Object.entries(M3.groups ?? {})) D.groups[slot] = [...new Set([...(D.groups[slot] ?? []), ...ids])];
for (const [id, it] of Object.entries(M3.items ?? {})) {
  D.names[id] = { name: it.name, kind: it.kind };
  // Pieza suelta (lentes, pines, adornos y respaldo para otras poses) y miniatura del catálogo: ya vienen a su tamaño final.
  await webp(join(L3, "piezas", "layers", `${id}.png`), `public/armario/layers/${id}.webp`, 1);
  await webp(join(L3, "piezas", "items", `${id}.png`), `public/armario/items/${id}.webp`, 1);
  if (!D.layers.includes(id)) D.layers.push(id);
}
console.log("lote 3", n);

writeFileSync(DF, JSON.stringify(D));
writeFileSync(PF, JSON.stringify(P));
console.log(`listo: ${n} imágenes; ${DF} y ${PF} actualizados`);
