// Escala por pieza: las imágenes «whole» con ropa de cuerpo o cuello vienen dibujadas más grandes que la base.
// Para cada (especie, pieza) busca la escala r que hace coincidir la silueta con la base:
//  - cuerpo y cuello: altura desde los pies hasta la punta de las orejas (no hay sombrero que la altere);
//  - cabeza: coincidencia de la mitad inferior (cuerpo y patas), que el sombrero no toca.
// Escribe `pieceFit[especie][pieza] = r` en src/lib/armario-data.json. Uso: node scripts/armario/calibrar-piezas.mjs
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
const f = "src/lib/armario-data.json";
const D = JSON.parse(readFileSync(f, "utf8"));
const N = 256; // resolución de trabajo

async function mask(path) {
  const { data, info } = await sharp(path).resize(N, N, { fit: "fill" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const m = new Uint8Array(N * N);
  for (let i = 0; i < N * N; i++) m[i] = data[i * 4 + 3] > 80 ? 1 : 0;
  return m;
}
const top = (m) => { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y * N + x]) return (y / N) * 1024; return 0; };

/** IoU entre la base y la pieza escalada r alrededor de los pies, en la franja [y0, feet]. */
function iou(base, feetB, piece, feetP, r, y0) {
  let inter = 0, uni = 0;
  for (let y = Math.floor((y0 / 1024) * N); y < Math.floor((feetB / 1024) * N); y++)
    for (let x = 0; x < N; x++) {
      const b = base[y * N + x];
      // punto de la base (x,y) en coordenadas de la pieza: pies alineados y escala r alrededor del centro x = 512
      const X = 512 + (((x / N) * 1024 - 512) / r);
      const Y = feetP - (feetB - (y / N) * 1024) / r;
      const px = Math.round((X / 1024) * N), py = Math.round((Y / 1024) * N);
      const p = px >= 0 && py >= 0 && px < N && py < N ? piece[py * N + px] : 0;
      if (b || p) uni++;
      if (b && p) inter++;
    }
  return uni ? inter / uni : 0;
}

D.pieceFit = {};
for (const pet of Object.keys(D.pets)) {
  const base = await mask(`public/armario/pets/${pet}/base.webp`);
  const fb = D.feet[pet].base, tb = top(base);
  const out = (D.pieceFit[pet] = {});
  for (const k of D.pets[pet].whole) {
    const m = await mask(`public/armario/pets/${pet}/whole-${k}.webp`);
    const fp = D.feet[pet][k];
    let r;
    if (D.groups.head.includes(k)) {
      const y0 = tb + (fb - tb) * 0.5;
      let best = [0, 1];
      for (let s = 0.8; s <= 1.2; s += 0.005) { const v = iou(base, fb, m, fp, s, y0); if (v > best[0]) best = [v, s]; }
      // best[1] es la escala que aplicada a la pieza la hace coincidir con la base (ya es la corrección): r = 1 / best[1].
      r = 1 / best[1];
    } else r = (fp - top(m)) / (fb - tb);
    // r = cuánto más grande está dibujada la pieza; se corrige con 1/r. Ignora diferencias menores al 1 %.
    // En cabeza la medida por coincidencia es ruidosa (±5 %): solo se corrigen diferencias claras (≥ 8 %, p. ej. audífonos redibujados).
    const fix = Math.abs(r - 1) < (D.groups.head.includes(k) ? 0.08 : 0.01) ? 1 : +(1 / r).toFixed(4);
    if (fix !== 1) out[k] = fix;
  }
  console.log(pet, Object.entries(out).map(([k, v]) => `${k}:${v}`).join(" "));
}
writeFileSync(f, JSON.stringify(D));

// Poses (armario-poses.json): misma medición contra la base de cada pose (solo cuerpo y cuello).
const fp = "src/lib/armario-poses.json";
const P = JSON.parse(readFileSync(fp, "utf8"));
for (const [pet, moods] of Object.entries(P))
  for (const [mood, p] of Object.entries(moods)) {
    const dir = `public/armario/poses/${pet}/${mood}`;
    const base = await mask(`${dir}/base.webp`);
    const fb = p.feet?.base ?? 964, tb = top(base);
    p.pieceFit = {};
    for (const k of p.whole) {
      if (D.groups.head.includes(k)) continue;
      const m = await mask(`${dir}/whole-${k}.webp`);
      const r = ((p.feet?.[k] ?? fb) - top(m)) / (fb - tb);
      if (Math.abs(r - 1) >= 0.01) p.pieceFit[k] = +(1 / r).toFixed(4);
    }
    const v = Object.values(p.pieceFit);
    console.log(pet, mood, v.length ? `${v.length} piezas reescaladas (${Math.min(...v)}–${Math.max(...v)})` : "sin reescalar");
  }
writeFileSync(fp, JSON.stringify(P));
