// Hoja de contacto HTML con todas las mascotas y estados (para revisarlas a ojo).
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, writeFileSync } from "node:fs";
import { Mascot, type Mood } from "../src/components/Mascot";
import { SPECIES, ACCESSORIES } from "../src/lib/look";

const moods: Mood[] = ["happy", "cheer", "think", "oops", "wow", "sleep"];
const css = readFileSync("src/app/globals.css", "utf8").split("/* Mascota */")[1].split("@keyframes confetti-fall")[0];
const rows = SPECIES.map((s) => `<h3>${s.label}</h3><div class="row">${moods.map((m) => renderToStaticMarkup(<Mascot species={s.id} mood={m} color={s.color} size={150} animate="none" />)).join("")}</div>`).join("");
const acc = `<h3>Accesorios y colores</h3><div class="row">${ACCESSORIES.map((a, i) => renderToStaticMarkup(<Mascot species={SPECIES[i % 5].id} mood="happy" color={SPECIES[i % 5].color} accessory={a.id} size={150} animate="none" />)).join("")}${["#d96a8f", "#5b7fa6", "#3f9e8f"].map((c, i) => renderToStaticMarkup(<Mascot species={(["panda", "oso", "zorro"] as const)[i]} mood="cheer" color={c} accessory="toque" size={150} animate="none" />)).join("")}</div>`;
writeFileSync(".mascots.html", `<!doctype html><meta charset=utf-8><style>:root{--brand:#087a56;--accent:#5847d4}${css}body{font-family:sans-serif;background:#f7f8fb;padding:16px}.row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}svg{background:#fff;border-radius:16px}*{animation:none!important}</style>${rows}${acc}`);
