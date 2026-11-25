// Exporta el arte de la entrega de Fluye (prototipo fluye-movimiento.html + ilustraciones) a WebP para la app.
// Las capas del armario conservan sus cajas en el espacio 1024 del prototipo; las imágenes se reducen a la mitad
// (las cajas se usan como porcentajes, así que la reducción no cambia la composición).
// Uso: node scripts/armario/export.mjs <carpeta-entrega-extraida>
import sharp from "sharp";
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const src = process.argv[2];
if (!src) throw new Error("Falta la carpeta de la entrega");
const html = readFileSync(join(src, "fluye-movimiento.html"), "utf8");
const a = html.indexOf('id="art"');
const st = html.indexOf(">", a) + 1;
const art = JSON.parse(html.slice(st, html.indexOf("</script>", st)));

const OUT = "public/armario";
const dir = (p) => (mkdirSync(p, { recursive: true }), p);
let n = 0;
async function save(dataUrl, file, scale = 0.5, q = 86) {
  const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
  const img = sharp(buf);
  const m = await img.metadata();
  const w = Math.max(1, Math.round(m.width * scale));
  await img.resize({ width: w }).webp({ quality: q, alphaQuality: 92, effort: 5 }).toFile(file);
  n++;
}

const PETS = Object.keys(art.paint.pets);
const data = { feet: art.feet, groups: art.paint.groups, pets: {} };
for (const pet of PETS) {
  const p = art.paint.pets[pet];
  const d = dir(`${OUT}/pets/${pet}`);
  await save(p.base, `${d}/base.webp`);
  const out = { whole: Object.keys(p.whole), lower: {}, top: {}, fabric: {}, front: {}, ink: p.ink, badges: p.badges };
  for (const [k, url] of Object.entries(p.whole)) await save(url, `${d}/whole-${k}.webp`);
  for (const layer of ["lower", "top", "fabric", "front"])
    for (const [k, [url, box]] of Object.entries(p[layer])) {
      await save(url, `${d}/${layer}-${k}.webp`);
      out[layer][k] = box;
    }
  data.pets[pet] = out;
  console.log(pet, n);
}

// Capas sueltas (lentes, pines, flores): se colocan con las cajas `ink` de cada especie.
const ld = dir(`${OUT}/layers`);
for (const [k, url] of Object.entries(art.fit.layers)) await save(url, `${ld}/${k}.webp`);
data.layers = Object.keys(art.fit.layers);
// Cajas para poner piezas de cabeza y cara sobre las demás poses (medidas sobre la ilustración de cada especie).
data.boxes = art.fit.boxes;

// Miniaturas del catálogo (pieza sola).
const id = dir(`${OUT}/items`);
const names = {};
for (const [k, url] of Object.entries(art.accessories)) await save(url, `${id}/${k}.webp`, 0.25);
for (const group of ["collection", "clothes", "outfits", "awards"]) {
  const g = group === "outfits" || group === "awards" ? art.fit[group] : art[group];
  for (const [k, [name, kind, url]] of Object.entries(g)) {
    names[k] = { name, kind };
    await save(url, `${id}/${k}.webp`, 0.25);
  }
}
data.names = names;

// Mascotas por estado (12 especies × 8 estados), desde los PNG 1024 originales (el prototipo las trae reducidas).
const md = dir("public/mascots");
for (const d of [join(src, "ilustraciones/mascots"), join(src, "armario/nuevas-mascotas")])
  for (const f of readdirSync(d).filter((f) => f.endsWith(".png"))) {
    await sharp(join(d, f)).resize({ width: 512 }).webp({ quality: 88, alphaQuality: 92, effort: 5 }).toFile(`${md}/${f.replace(".png", ".webp")}`);
    n++;
  }

// Escenas (1536×960 → 960×600).
const sd = join(src, "ilustraciones/scenes");
for (const f of readdirSync(sd).filter((f) => f.endsWith(".png"))) {
  await sharp(join(sd, f)).resize({ width: 960 }).webp({ quality: 82, effort: 5 }).toFile(`public/scenes/${f.replace(".png", ".webp")}`);
  n++;
}

writeFileSync("src/lib/armario-data.json", JSON.stringify(data));
console.log("listo:", n, "imágenes");
