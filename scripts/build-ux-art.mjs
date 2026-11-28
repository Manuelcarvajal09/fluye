// Arte de UX (Codex, fase 4) → módulos TS con SVG listos para montar en línea.
// - Prefija los id para que varias piezas convivan en una página.
// - Cada <g id="x"><!-- origen: a,b --> pasa a data-part="x" con su pivote (transform-origin en unidades del viewBox).
// - El fondo de las cabeceras usa --hero-from/--hero-to: sigue el tema (claro/oscuro) y la temporada.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "content", "ux-art");
const out = join(root, "src", "generated", "ux-art");
mkdirSync(out, { recursive: true });

function prepare(key, raw) {
  let s = raw.replace(/<\?xml[^>]*>/g, "").trim();
  // Grupos animables con pivote.
  s = s.replace(/<g id="([^"]+)">\s*<!--\s*origen:\s*([\d.]+)\s*,\s*([\d.]+)\s*-->/g, (_, id, x, y) => `<g data-part="${id}" style="transform-box:view-box;transform-origin:${x}px ${y}px">`);
  s = s.replace(/<g id="([^"]+)">/g, (_, id) => `<g data-part="${id}">`);
  s = s.replace(/<!--[\s\S]*?-->/g, "");
  // Resto de id (gradientes): únicos por pieza.
  s = s.replace(/\bid="([^"]+)"/g, (_, id) => `id="ux-${key}-${id}"`).replace(/url\(#([^)]+)\)/g, (_, id) => `url(#ux-${key}-${id})`).replace(/href="#([^"]+)"/g, (_, id) => `href="#ux-${key}-${id}"`);
  if (key.startsWith("cab-")) {
    let i = 0;
    s = s.replace(/<stop offset="([^"]+)" stop-color="([^"]+)"\/>/g, (_, off, c) => `<stop offset="${off}" style="stop-color:var(${i++ === 0 ? "--hero-from" : "--hero-to"},${c})"/>`);
  }
  if (key.startsWith("cab-")) s = s.replace("<svg", "<svg preserveAspectRatio=\"xMidYMid slice\"");
  // Raíz: tamaño fluido y decorativa.
  s = s.replace(/<svg([^>]*)>/, (_, attrs) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")} aria-hidden="true" focusable="false">`);
  if (/<script|on\w+=|<foreignObject|<image|href="http/i.test(s)) throw new Error(`${key}: contenido no permitido`);
  return s;
}

const groups = { icons: (k) => k.startsWith("ico-"), empty: (k) => k.startsWith("vacio-") || k.startsWith("error-"), cab: (k) => k.startsWith("cab-"), celebra: (k) => k.startsWith("celebracion"), gen: (k) => k.startsWith("gen-") };
const files = readdirSync(src).filter((f) => f.endsWith(".svg"));
for (const [name, test] of Object.entries(groups)) {
  const art = {};
  for (const f of files) {
    const key = f.replace(/\.svg$/, "");
    if (test(key)) art[key] = prepare(key, readFileSync(join(src, f), "utf8"));
  }
  writeFileSync(join(out, `${name}.ts`), `// Generado por scripts/build-ux-art.mjs. No editar.\nexport const ART: Record<string, string> = ${JSON.stringify(art, null, 0)};\n`);
  console.log(`ux-art/${name}: ${Object.keys(art).length} piezas`);
}
