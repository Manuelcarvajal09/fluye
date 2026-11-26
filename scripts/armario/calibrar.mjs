// Calibra, por especie, la escala y el desplazamiento que hacen coincidir la composición por capas (base del armario)
// con la ilustración de la pose feliz. Escribe `fit` en src/lib/armario-data.json. Uso: node scripts/armario/calibrar.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
const f = "src/lib/armario-data.json";
const D = JSON.parse(readFileSync(f, "utf8"));
async function bbox(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 60) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const k = 1024 / info.width;
  return [x0 * k, y0 * k, (x1 + 1) * k, (y1 + 1) * k];
}
D.fit = {};
for (const pet of Object.keys(D.pets)) {
  const pose = await bbox(`public/mascots/${pet}-happy.webp`);
  const b = await bbox(`public/armario/pets/${pet}/base.webp`);
  // Dónde queda la base en el lienzo según la composición del probador (escala 880/1024, pies en 964).
  const sc = 880 / 1024, base = D.feet[pet].base;
  const map = ([x, y]) => [72 + x * sc, 964 + (y - base) * sc];
  const [bx0, by0] = map([b[0], b[1]]), [bx1, by1] = map([b[2], b[3]]);
  // Escala por altura (las poses comparten pies y cabeza) y alineación por pies y centro horizontal.
  const s = (pose[3] - pose[1]) / (by1 - by0);
  const dx = (pose[0] + pose[2]) / 2 - ((bx0 + bx1) / 2) * s;
  const dy = pose[3] - by1 * s;
  D.fit[pet] = { s: +s.toFixed(4), dx: +dx.toFixed(1), dy: +dy.toFixed(1) };
  console.log(pet, D.fit[pet], "anchos pose/base", Math.round(pose[2] - pose[0]), Math.round((bx1 - bx0) * s));
}
writeFileSync(f, JSON.stringify(D));
