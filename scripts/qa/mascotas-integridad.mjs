// Auditoría automática de recursos de mascotas y armario: existencia, decodificación, transparencia, píxeles en el borde
// (posible recorte), capas vacías y referencias sin archivo. Escribe docs/qa/mascotas-integridad.json.
// Uso: node scripts/qa/mascotas-integridad.mjs
import sharp from "sharp";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";

const D = JSON.parse(readFileSync("src/lib/armario-data.json", "utf8"));
const PETS = Object.keys(D.pets);
const MOODS = ["happy", "cheer", "think", "oops", "wow", "sleep", "encourage", "proud"];
const issues = [];
let checked = 0;
const add = (o) => issues.push(o);

async function inspect(path, ctx, { expectAlpha = true, edgeCheck = true } = {}) {
  checked++;
  if (!existsSync(path)) return add({ ...ctx, path, problem: "missing", detail: "El archivo no existe" });
  try {
    const img = sharp(path);
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    let opaque = 0, edge = 0, semi = 0;
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const a = data[(y * W + x) * 4 + 3];
        if (a > 16) {
          opaque++;
          if (a < 240) semi++;
          if (edgeCheck && (x === 0 || y === 0 || x === W - 1 || y === H - 1)) edge++;
        }
      }
    if (!opaque) add({ ...ctx, path, problem: "empty", detail: "Capa completamente transparente" });
    if (expectAlpha && opaque === W * H) add({ ...ctx, path, problem: "no-alpha", detail: "Sin transparencia (fondo opaco)" });
    if (edge > Math.max(3, (W + H) * 0.02)) add({ ...ctx, path, problem: "edge-cut", detail: `${edge} píxeles opacos tocan el borde (posible recorte)`, w: W, h: H });
    return { W, H, opaque };
  } catch (e) {
    add({ ...ctx, path, problem: "corrupt", detail: String(e.message ?? e) });
  }
}

for (const pet of PETS) {
  for (const mood of MOODS) await inspect(`public/mascots/${pet}-${mood}.webp`, { pet, kind: "pose", mood });
  const p = D.pets[pet];
  await inspect(`public/armario/pets/${pet}/base.webp`, { pet, kind: "base" });
  for (const k of p.whole) await inspect(`public/armario/pets/${pet}/whole-${k}.webp`, { pet, kind: "whole", piece: k });
  for (const layer of ["lower", "top", "fabric", "front"])
    for (const [k, box] of Object.entries(p[layer])) {
      // Las capas recortadas a su caja pueden tocar el borde por diseño; se revisa que la caja quepa en el lienzo.
      await inspect(`public/armario/pets/${pet}/${layer}-${k}.webp`, { pet, kind: layer, piece: k }, { edgeCheck: false });
      const [x, y, w, h] = box;
      if (x < 0 || y < 0 || x + w > 1024 || y + h > 1024) add({ pet, kind: layer, piece: k, problem: "box-out", detail: `Caja fuera del lienzo: ${box}` });
    }
  for (const [k, box] of Object.entries(p.ink)) {
    const [x, y, w, h] = box;
    if (x < 0 || y < 0 || x + w > 1024 || y + h > 1024) add({ pet, kind: "ink", piece: k, problem: "box-out", detail: `Caja fuera del lienzo: ${box}` });
  }
  for (const [k, box] of Object.entries(D.boxes?.[pet] ?? {})) {
    const [x, y, w, h] = box;
    if (x < 0 || y < 0 || x + w > 1024 || y + h > 1024) add({ pet, kind: "pose-box", piece: k, problem: "box-out", detail: `Caja fuera del lienzo: ${box}` });
  }
}
for (const k of D.layers) await inspect(`public/armario/layers/${k}.webp`, { kind: "layer", piece: k }, { edgeCheck: false });
// Miniaturas del catálogo: recortadas a su contenido a propósito (tocan el borde por diseño).
for (const f of readdirSync("public/armario/items")) await inspect(`public/armario/items/${f}`, { kind: "item", piece: f.replace(".webp", "") }, { edgeCheck: false });

mkdirSync("docs/qa", { recursive: true });
const summary = issues.reduce((a, i) => ((a[i.problem] = (a[i.problem] ?? 0) + 1), a), {});
writeFileSync("docs/qa/mascotas-integridad.json", JSON.stringify({ checked, summary, issues }, null, 2));
console.log(`revisados ${checked} archivos · problemas:`, summary);
