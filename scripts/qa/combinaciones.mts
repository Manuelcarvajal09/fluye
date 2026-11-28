// Control automático de combinaciones de ropa (npx tsx scripts/qa/combinaciones.mts [--pet zorro] [--umbral N para forzar uno solo]).
// Compone cada conjunto con la MISMA función que la app (dressLayers + máscara de layerStyle), rasteriza las capas
// reales en un lienzo de 512 px y mide qué parte de cada pieza pequeña (lentes, cabello, pines) queda tapada por
// las capas posteriores o por la máscara del sombrero. Escribe docs/qa/combinaciones.csv y un resumen.
import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { MOODS, PETS, PIECES, dressLayers, poseCovers, type Layer } from "../../src/lib/wardrobe";

const ROOT = join(import.meta.dirname, "..", "..");
const PUB = join(ROOT, "public");
const S = 512; // lado del lienzo de medición
const args = process.argv.slice(2);
const only = args.includes("--pet") ? args[args.indexOf("--pet") + 1] : undefined;
// Umbral por tipo de pieza (calibrado a ojo con render-look.mts): el ala del sombrero tapa ~14 % del lente de forma natural
// y un adorno de cabello puede quedar "metido" bajo el gorro; los pines del pecho no deberían taparse.
const UMBRAL: Record<string, number> = { face: 25, hair: 60, chest: 8 };
const extra = args.includes("--umbral") ? Number(args[args.indexOf("--umbral") + 1]) : undefined;

type Raster = { x: number; y: number; w: number; h: number; a: Uint8Array };
const cache = new Map<string, Promise<Raster | null>>();
/** Alfa de una capa colocada en el lienzo (redondeada a píxeles enteros). */
function raster(l: Omit<Layer, "mask">): Promise<Raster | null> {
  const x = Math.round((l.x / 100) * S), y = Math.round((l.y / 100) * S);
  const w = Math.max(1, Math.round((l.w / 100) * S)), h = Math.max(1, Math.round((l.h / 100) * S));
  const key = `${l.src}|${x}|${y}|${w}|${h}`;
  if (!cache.has(key))
    cache.set(
      key,
      sharp(join(PUB, l.src))
        .resize(w, h, { fit: "fill" })
        .ensureAlpha()
        .extractChannel("alpha")
        .raw()
        .toBuffer()
        .then((b) => ({ x, y, w, h, a: new Uint8Array(b) }))
        .catch(() => null),
    );
  return cache.get(key)!;
}
const at = (r: Raster, X: number, Y: number) => (X < r.x || Y < r.y || X >= r.x + r.w || Y >= r.y + r.h ? 0 : r.a[(Y - r.y) * r.w + (X - r.x)]);

/** % de la capa i que queda tapada (capas posteriores opacas + máscara propia). */
async function hidden(layers: Layer[], i: number) {
  const t = await raster(layers[i]);
  if (!t) return { pct: -1, why: "falta imagen" };
  const later = (await Promise.all(layers.slice(i + 1).map((l) => raster(l)))).filter(Boolean) as Raster[];
  const mask = layers[i].mask ? await raster(layers[i].mask!) : null;
  let total = 0, covered = 0, byMask = 0;
  for (let j = 0; j < t.h; j++)
    for (let k = 0; k < t.w; k++) {
      if (t.a[j * t.w + k] < 128) continue;
      total++;
      const X = t.x + k, Y = t.y + j;
      if (mask && at(mask, X, Y) >= 128) { covered++; byMask++; continue; }
      if (later.some((r) => at(r, X, Y) >= 200)) covered++;
    }
  return { pct: total ? (100 * covered) / total : 0, why: byMask > covered / 2 ? "máscara del sombrero" : "capa posterior" };
}

const of = (slot: string) => PIECES.filter((p) => p.slot === slot).map((p) => p.id);
const HEAD = of("head"), FACE = of("face"), HAIR = of("hair"), CHEST = of("chest"), NECK = of("neck"), BODY = of("body");
// Pares que se revisan: la pieza pequeña (objetivo) con cada pieza que puede taparla.
const PAIRS: [string[], string[]][] = [[FACE, HEAD], [HAIR, HEAD], [CHEST, NECK], [CHEST, BODY]];

const rows: string[] = ["mascota,pose,objetivo,con,tapado_pct,causa"];
let checked = 0, fails = 0;
for (const pet of PETS.filter((p) => !only || p.id === only)) {
  for (const mood of MOODS) {
    for (const [targets, others] of PAIRS) {
      for (const t of targets) {
        for (const o of others) {
          const wear = [t, o];
          if (mood !== "happy" && !poseCovers(pet.id, mood, wear)) continue; // en esa pose no se dibuja ese conjunto
          const layers = dressLayers(pet.id, wear, mood);
          const i = layers.findIndex((l) => l.src.endsWith(`/layers/${t}.webp`));
          if (i < 0) continue;
          const { pct, why } = await hidden(layers, i);
          checked++;
          const lim = extra ?? UMBRAL[PIECES.find((p) => p.id === t)!.slot] ?? 8;
          if (pct > lim || pct < 0) {
            fails++;
            rows.push(`${pet.id},${mood},${t},${o},${pct.toFixed(1)},${why}`);
          }
        }
      }
    }
  }
  process.stdout.write(`${pet.id} `);
}
mkdirSync(join(ROOT, "docs", "qa"), { recursive: true });
writeFileSync(join(ROOT, "docs", "qa", "combinaciones.csv"), rows.join("\n") + "\n");
console.log(`
Combinaciones revisadas: ${checked} · por encima del umbral (cara 25 %, cabello 60 %, pecho 8 %): ${fails} (docs/qa/combinaciones.csv)`);
process.exit(fails ? 1 : 0);
