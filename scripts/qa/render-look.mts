// Renderiza conjuntos con la misma composición que la app (para revisar a ojo):
//   npx tsx scripts/qa/render-look.mts out.png zorro:happy:glasses+toque gato:cheer:cap ...
// Mezcla las capas a mano (con recorte en los bordes y la máscara del sombrero como en layerStyle).
import sharp from "sharp";
import { join } from "node:path";
import { dressLayers, type Layer } from "../../src/lib/wardrobe";

const PUB = join(import.meta.dirname, "..", "..", "public");
const S = 400;
const [out, ...looks] = process.argv.slice(2);

async function rgba(src: string, w: number, h: number) {
  return new Uint8Array(await sharp(join(PUB, src)).resize(w, h, { fit: "fill" }).ensureAlpha().raw().toBuffer());
}
const box = (l: Omit<Layer, "mask">) => ({ x: Math.round((l.x / 100) * S), y: Math.round((l.y / 100) * S), w: Math.max(1, Math.round((l.w / 100) * S)), h: Math.max(1, Math.round((l.h / 100) * S)) });

const tiles: Buffer[] = [];
for (const spec of looks) {
  const [pet, mood, wear] = spec.split(":");
  const canvas = new Float32Array(S * S * 4);
  for (let i = 0; i < S * S; i++) canvas.set([244, 248, 246, 255], i * 4);
  for (const l of dressLayers(pet, wear.split("+"), mood)) {
    const b = box(l);
    const px = await rgba(l.src, b.w, b.h);
    const mb = l.mask ? box(l.mask) : null;
    const ma = l.mask && mb ? await rgba(l.mask.src, mb.w, mb.h) : null;
    for (let j = 0; j < b.h; j++)
      for (let k = 0; k < b.w; k++) {
        const X = b.x + k, Y = b.y + j;
        if (X < 0 || Y < 0 || X >= S || Y >= S) continue;
        const o = (j * b.w + k) * 4;
        let a = px[o + 3] / 255;
        if (ma && mb) {
          const mx = X - mb.x, my = Y - mb.y;
          if (mx >= 0 && my >= 0 && mx < mb.w && my < mb.h) a *= 1 - ma[(my * mb.w + mx) * 4 + 3] / 255;
        }
        if (a <= 0) continue;
        const c = (Y * S + X) * 4;
        for (let ch = 0; ch < 3; ch++) canvas[c + ch] = canvas[c + ch] * (1 - a) + px[o + ch] * a;
      }
  }
  tiles.push(await sharp(Buffer.from(Uint8Array.from(canvas)), { raw: { width: S, height: S, channels: 4 } }).png().toBuffer());
}
await sharp({ create: { width: S * tiles.length, height: S, channels: 4, background: "#ffffff" } })
  .composite(tiles.map((t, i) => ({ input: t, left: i * S, top: 0 })))
  .png()
  .toFile(out);
console.log("ok", out);
