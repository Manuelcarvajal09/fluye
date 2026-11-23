// Verifica contraste WCAG de las paletas de acento y genera el CSS que va en globals.css.
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const cr = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const PRESETS = {
  esmeralda: { name: "Esmeralda", l: { brand: "#087a56", ink: "#065a40", soft: "#dcf7ec", accent: "#5847d4" }, d: { brand: "#22d3a0", ink: "#5eead0", soft: "#0f2e26", accent: "#9b8cff" } },
  oceano:    { name: "Océano",    l: { brand: "#0b6bb5", ink: "#084e84", soft: "#dcecfa", accent: "#6d3fd0" }, d: { brand: "#4aa8f0", ink: "#8cc9f7", soft: "#0f2a40", accent: "#b39dff" } },
  uva:       { name: "Uva",       l: { brand: "#6a3cc7", ink: "#4a2899", soft: "#ece4fb", accent: "#0b7a8a" }, d: { brand: "#a98bff", ink: "#cbb8ff", soft: "#2a1f4a", accent: "#4dd0e1" } },
  mandarina: { name: "Mandarina", l: { brand: "#b8460a", ink: "#8a3304", soft: "#fde9d9", accent: "#2f5fd0" }, d: { brand: "#ffa04d", ink: "#ffc08a", soft: "#3a2410", accent: "#8fb0ff" } },
  fresa:     { name: "Fresa",     l: { brand: "#c0285c", ink: "#8f1d44", soft: "#fde4ec", accent: "#5847d4" }, d: { brand: "#ff7fa5", ink: "#ffadc6", soft: "#3d1624", accent: "#9b8cff" } },
  grafito:   { name: "Grafito",   l: { brand: "#3f4a5a", ink: "#2a3340", soft: "#e6e9ee", accent: "#087a56" }, d: { brand: "#aab4c3", ink: "#cdd5e0", soft: "#232a35", accent: "#22d3a0" } },
};
let bad = 0;
const chk = (label, a, b, min) => { const r = cr(a, b); if (r < min) { bad++; console.log("FALLA", label, r.toFixed(2), "<", min); } };
for (const [id, p] of Object.entries(PRESETS)) {
  chk(`${id} luz: blanco sobre brand`, "#ffffff", p.l.brand, 4.5);
  chk(`${id} luz: ink sobre soft`, p.l.ink, p.l.soft, 4.5);
  chk(`${id} luz: brand sobre superficie (texto grande)`, p.l.brand, "#ffffff", 3);
  chk(`${id} luz: blanco sobre accent`, "#ffffff", p.l.accent, 4.5);
  chk(`${id} oscuro: texto oscuro sobre brand`, "#062118", p.d.brand, 4.5);
  chk(`${id} oscuro: ink sobre soft`, p.d.ink, p.d.soft, 4.5);
  chk(`${id} oscuro: brand sobre superficie`, p.d.brand, "#151a24", 4.5);
  chk(`${id} oscuro: texto oscuro sobre accent`, "#0d1017", p.d.accent, 4.5);
  chk(`${id} oscuro: accent sobre superficie`, p.d.accent, "#151a24", 3);
}
console.log(bad ? `${bad} combinaciones fallan` : "todas las paletas cumplen WCAG AA");
if (process.argv[2] === "css") {
  let css = "";
  for (const [id, p] of Object.entries(PRESETS)) {
    css += `[data-accent="${id}"] { --brand: ${p.l.brand}; --brand-ink: ${p.l.ink}; --brand-soft: ${p.l.soft}; --accent: ${p.l.accent}; --accent-soft: color-mix(in oklab, ${p.l.accent} 14%, white); }\n`;
    css += `[data-theme="dark"][data-accent="${id}"] { --brand: ${p.d.brand}; --brand-ink: ${p.d.ink}; --brand-soft: ${p.d.soft}; --accent: ${p.d.accent}; --accent-soft: color-mix(in oklab, ${p.d.accent} 22%, #151a24); }\n`;
  }
  console.log(css);
}
