// Temáticas legendarias (content/themes/themes.json) → src/app/temas.css + src/generated/themes.json.
// Valida contraste WCAG AA de cada paleta (claro y oscuro) antes de generar: ninguna temática deja texto ilegible.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themes = JSON.parse(readFileSync(join(root, "content", "themes", "themes.json"), "utf8"));
const lum = (h) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const cr = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const bad = [];
const chk = (label, a, b, min) => {
  const r = cr(a, b);
  if (r < min) bad.push(`${label}: ${r.toFixed(2)} < ${min}`);
};
for (const t of themes) {
  const { l, d } = t;
  chk(`${t.id} claro · texto/fondo`, l.text, l.bg, 7);
  chk(`${t.id} claro · texto/superficie2`, l.text, l.surface2, 7);
  chk(`${t.id} claro · secundario/superficie`, l.muted, l.surface, 4.5);
  chk(`${t.id} claro · secundario/superficie2`, l.muted, l.surface2, 4.5);
  chk(`${t.id} claro · blanco/marca`, "#ffffff", l.brand, 4.5);
  chk(`${t.id} claro · tinta/suave`, l.ink, l.soft, 4.5);
  chk(`${t.id} claro · tinta/fondo`, l.ink, l.bg, 4.5);
  chk(`${t.id} claro · blanco/acento`, "#ffffff", l.accent, 4.5);
  chk(`${t.id} oscuro · texto/fondo`, d.text, d.bg, 7);
  chk(`${t.id} oscuro · secundario/superficie`, d.muted, d.surface, 4.5);
  chk(`${t.id} oscuro · secundario/superficie2`, d.muted, d.surface2, 4.5);
  chk(`${t.id} oscuro · oscuro/marca`, "#0d1017", d.brand, 4.5);
  chk(`${t.id} oscuro · tinta/suave`, d.ink, d.soft, 4.5);
  chk(`${t.id} oscuro · marca/superficie`, d.brand, d.surface, 4.5);
  chk(`${t.id} oscuro · oscuro/acento`, "#0d1017", d.accent, 4.5);
}
if (bad.length) {
  console.error(`Temáticas con contraste insuficiente:\n${bad.join("\n")}`);
  process.exit(1);
}

/** Patrón de fondo suave por temática (CSS puro; el arte de Codex lo reemplazará). */
const enc = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
function pattern(kind, c) {
  const S = (body, s = 48) => enc(`<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}' viewBox='0 0 ${s} ${s}'>${body}</svg>`);
  switch (kind) {
    case "snow": return S(`<g fill='${c}'><circle cx='8' cy='10' r='2'/><circle cx='32' cy='22' r='1.5'/><circle cx='20' cy='40' r='2.2'/><circle cx='42' cy='6' r='1.2'/></g>`);
    case "stars": return S(`<g fill='${c}'><path d='M10 6l1.5 3 3 .5-2.2 2 .6 3-2.9-1.5L7 14.5l.6-3-2.2-2 3-.5z'/><circle cx='36' cy='30' r='1.4'/><circle cx='24' cy='42' r='1'/><path d='M40 8l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2-1.5-1.4 2-.3z'/></g>`);
    case "hearts": return S(`<path fill='${c}' d='M14 18c-3-3-8-1-8 3 0 4 8 9 8 9s8-5 8-9c0-4-5-6-8-3zM38 36c-2-2-5-.6-5 2 0 2.6 5 6 5 6s5-3.4 5-6c0-2.6-3-4-5-2z'/>`);
    case "leaves": return S(`<g fill='${c}'><path d='M12 6c6 2 8 8 6 14-6-2-8-8-6-14z'/><path d='M36 28c5 1 7 6 5 11-5-1-7-6-5-11z'/></g>`);
    case "flowers": return S(`<g fill='${c}'><circle cx='12' cy='12' r='3'/><circle cx='8' cy='12' r='2.5'/><circle cx='16' cy='12' r='2.5'/><circle cx='12' cy='8' r='2.5'/><circle cx='12' cy='16' r='2.5'/><circle cx='36' cy='36' r='2'/></g>`);
    case "waves": return S(`<path fill='none' stroke='${c}' stroke-width='2' d='M0 24c8-6 16-6 24 0s16 6 24 0'/>`, 48);
    case "beans": return S(`<g fill='${c}'><ellipse cx='12' cy='12' rx='4' ry='6' transform='rotate(-30 12 12)'/><ellipse cx='36' cy='34' rx='3.5' ry='5' transform='rotate(25 36 34)'/></g>`);
    case "papel": return S(`<g fill='${c}'><path d='M0 0h48v8l-6 6-6-6-6 6-6-6-6 6-6-6-6 6L0 8z'/></g>`);
    case "grid": return S(`<path fill='none' stroke='${c}' stroke-width='1' d='M0 .5h48M.5 0v48'/>`, 32);
    default: return S(`<circle cx='12' cy='12' r='2' fill='${c}'/><circle cx='36' cy='36' r='2' fill='${c}'/>`);
  }
}
const vars = (p) =>
  `--bg: ${p.bg}; --surface: ${p.surface}; --surface-2: ${p.surface2}; --line: ${p.line}; --text: ${p.text}; --muted: ${p.muted}; --brand: ${p.brand}; --brand-ink: ${p.ink}; --brand-soft: ${p.soft}; --accent: ${p.accent}; --accent-soft: color-mix(in oklab, ${p.accent} 14%, ${p.surface}); --hero-from: ${p.heroFrom}; --hero-to: ${p.heroTo}`; // --good/--bad no se tocan: correcto siempre verde y error siempre rojo, con cualquier temática.
let css = "/* Generado por scripts/build-themes.mjs a partir de content/themes/themes.json. No editar. */\n";
css += "/* Temáticas legendarias: van después de globals.css y ganan a los acentos. data-theme-pack va en <html>. */\n";
for (const t of themes) {
  css += `:root[data-theme-pack="${t.id}"] { ${vars(t.l)}; --theme-pattern: ${pattern(t.pattern, t.l.pat)}; }\n`;
  css += `:root[data-theme="dark"][data-theme-pack="${t.id}"] { ${vars(t.d)}; --theme-pattern: ${pattern(t.pattern, t.d.pat)}; }\n`;
}
css += ":root[data-theme-pack] body { background-image: var(--theme-pattern); background-attachment: fixed; }\n";
writeFileSync(join(root, "src", "app", "temas.css"), css);
mkdirSync(join(root, "src", "generated"), { recursive: true });
writeFileSync(join(root, "src", "generated", "themes.json"), JSON.stringify(themes.map((t) => ({ id: t.id, name: t.name, desc: t.desc, rarity: t.rarity, swatch: [t.l.bg, t.l.brand, t.l.accent, t.d.bg, t.d.brand], preview: Object.fromEntries(["l", "d"].map((m) => [m, { bg: t[m].bg, surface: t[m].surface, text: t[m].text, muted: t[m].muted, brand: t[m].brand, accent: t[m].accent, soft: t[m].soft, heroFrom: t[m].heroFrom, heroTo: t[m].heroTo, line: t[m].line }])) }))));
console.log(`temáticas: ${themes.length} (contraste AA en claro y oscuro)`);
