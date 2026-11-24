// Kit de escenario para las escenas de Fluye: naturaleza, mobiliario de perfil y utilerías.
// Todo sin contornos, con 2–3 tonos por objeto y sombra de contacto, para que "pese" en el suelo.
import { dark, light } from "./people.mjs";
import { mascotInner } from "../../src/lib/mascotSvg.ts";

export const C = { E: "#0a8f65", E2: "#22c79a", V: "#6a55e0", V2: "#b9adf7", SUN: "#ffb347", PINK: "#ff8fa8", SKY: "#8fd0f7", INK: "#2b2238", WOOD: "#c98d52", CREAM: "#fff3e2", RED: "#e8495a", GREY: "#8f97a8" };

export const shadow = (x, y, w = 26, o = 0.12) => `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${Math.max(3, w * 0.16)}" fill="#1a1024" opacity="${o}"/>`;

/** Árbol frondoso: tronco con conicidad y dos ramas, copa en tres capas (sombra, base, luz) con borde de hojas. */
export function tree(x, y, s = 1, c = C.E, cls = "sway") {
  const d = dark(c, 0.16);
  const l = light(c, 0.16);
  return `<g transform="translate(${x} ${y}) scale(${s})">${shadow(0, 0, 24)}<path d="M-7 0C-5 -16 -6 -30 -4 -46L4 -46C6 -30 5 -16 7 0Z" fill="#9a6a3e"/><path d="M1 0C2 -16 1 -30 2 -46L4 -46C6 -30 5 -16 7 0Z" fill="#7d5330"/><path d="M-3 -34C-10 -40 -16 -46 -20 -54M3 -38C10 -44 14 -50 18 -58" fill="none" stroke="#9a6a3e" stroke-width="5" stroke-linecap="round"/><g class="${cls}"><circle cx="16" cy="-58" r="24" fill="${d}"/><circle cx="-18" cy="-56" r="23" fill="${d}"/><circle cx="0" cy="-78" r="28" fill="${c}"/><circle cx="-22" cy="-66" r="20" fill="${c}"/><circle cx="22" cy="-68" r="20" fill="${c}"/><circle cx="-2" cy="-56" r="22" fill="${c}"/><circle cx="-10" cy="-88" r="15" fill="${l}"/><circle cx="-26" cy="-72" r="10" fill="${l}"/><circle cx="12" cy="-84" r="9" fill="${l}" opacity=".7"/><path d="M-8 -62q5 -5 10 0M10 -70q5 -5 10 0M-20 -52q4 -4 8 0" fill="none" stroke="${d}" stroke-width="2.4" stroke-linecap="round" opacity=".55"/></g></g>`;
}

/** Pino: tres faldones con borde ondulado, lado en sombra y tronco visible. snow = nieve en las ramas. */
export function pine(x, y, s = 1, c = "#1c8562", snow = false) {
  const d = dark(c, 0.18);
  const tier = (top, w, h) => `<path d="M0 ${top}L${w} ${top + h}Q${w * 0.72} ${top + h - 6} ${w * 0.5} ${top + h}Q${w * 0.25} ${top + h - 6} 0 ${top + h}Q${-w * 0.25} ${top + h - 6} ${-w * 0.5} ${top + h}Q${-w * 0.72} ${top + h - 6} ${-w} ${top + h}Z" fill="${c}"/><path d="M0 ${top}L${w} ${top + h}Q${w * 0.72} ${top + h - 6} ${w * 0.5} ${top + h}Q${w * 0.25} ${top + h - 6} 0 ${top + h}Z" fill="${d}"/>` + (snow ? `<path d="M0 ${top}L${w * 0.42} ${top + h * 0.42}Q${w * 0.2} ${top + h * 0.34} 0 ${top + h * 0.46}Q${-w * 0.2} ${top + h * 0.34} ${-w * 0.42} ${top + h * 0.42}Z" fill="#fff"/>` : "");
  return `<g transform="translate(${x} ${y}) scale(${s})">${shadow(0, 0, 22)}<rect x="-5" y="-16" width="10" height="17" rx="2" fill="#8a5a36"/><rect x="0" y="-16" width="5" height="17" fill="#6f4628"/>${tier(-50, 30, 38)}${tier(-74, 24, 34)}${tier(-96, 17, 30)}</g>`;
}

export const bush = (x, y, s = 1, c = C.E2) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="-12" cy="-8" r="12" fill="${dark(c, 0.12)}"/><circle cx="12" cy="-9" r="13" fill="${dark(c, 0.12)}"/><circle cx="0" cy="-14" r="15" fill="${c}"/><circle cx="-5" cy="-19" r="6" fill="${light(c, 0.2)}"/></g>`;
export const grass = (x, y, c = "#1ba87e") => `<path d="M${x - 6} ${y}q1 -9 -2 -12q6 3 6 12zM${x} ${y}q0 -12 2 -16q4 6 3 16zM${x + 6} ${y}q1 -8 5 -11q-1 6 -1 11z" fill="${c}"/>`;
export const cloud = (x, y, s = 1, cls = "float") => `<g class="${cls}"><g transform="translate(${x} ${y}) scale(${s})" fill="#fff" opacity=".9"><circle cx="-16" cy="0" r="11"/><circle cx="0" cy="-7" r="15"/><circle cx="17" cy="0" r="12"/><rect x="-27" y="-2" width="56" height="13" rx="6.500"/></g></g>`;
export const sun = (x, y, r = 22) => `<g class="spin">${Array.from({ length: 10 }, (_, i) => `<rect x="${x - 2.5}" y="${y - r - 15}" width="5" height="10" rx="2.5" fill="${C.SUN}" opacity=".7" transform="rotate(${i * 36} ${x} ${y})"/>`).join("")}</g><circle cx="${x}" cy="${y}" r="${r}" fill="${C.SUN}"/><circle cx="${x - r * 0.3}" cy="${y - r * 0.3}" r="${r * 0.35}" fill="#ffd27a"/>`;
export const snowfall = (n = 22) => `<g class="fall">${Array.from({ length: n }, (_, i) => `<circle cx="${(i * 67 + 13) % 400}" cy="${(i * 41) % 250 - 30}" r="${i % 3 ? 2 : 3}" fill="#fff" opacity=".9"/>`).join("")}</g><g class="fall d3">${Array.from({ length: n }, (_, i) => `<circle cx="${(i * 53 + 31) % 400}" cy="${(i * 37) % 250 - 150}" r="${i % 2 ? 2 : 2.6}" fill="#fff" opacity=".8"/>`).join("")}</g>`;

/** Planta de interior con maceta y hojas en dos tonos. */
export const plant = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${shadow(0, 0, 14)}<g class="sway"><path d="M0 -14C-16 -26 -16 -46 -8 -56C0 -44 4 -28 0 -14Z" fill="${C.E}"/><path d="M0 -14C12 -24 22 -38 18 -52C8 -44 0 -30 0 -14Z" fill="${C.E2}"/><path d="M0 -14C-6 -26 -20 -30 -28 -28C-24 -18 -14 -14 0 -14Z" fill="${dark(C.E, 0.1)}"/></g><path d="M-11 -14h22l-3 14h-16z" fill="${C.SUN}"/><path d="M-11 -14h22v4h-22z" fill="${dark(C.SUN, 0.16)}"/></g>`;

/** Vaso para llevar con tapa; steam = vapor animado. */
export const cup = (x, y, c = "#fff", steam = false) => `<path d="M${x - 5.5} ${y - 13}h11l-1.6 13h-7.8z" fill="${c}"/><rect x="${x - 4.6}" y="${y - 9}" width="9.2" height="4.5" fill="${C.WOOD}" opacity=".85"/><rect x="${x - 6.5}" y="${y - 15.5}" width="13" height="3.2" rx="1.6" fill="${dark(c, 0.16)}"/>${steam ? `<g fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"><path class="steam" d="M${x - 2} ${y - 19}q-3 -4 0 -8"/><path class="steam d1" d="M${x + 3} ${y - 19}q3 -4 0 -8"/></g>` : ""}`;

/** Ventana con marco, cristal y repisa; inner = lo que se ve fuera. */
export const win = (x, y, w, h, inner = "", glass = "#cfeaff") => `<rect x="${x - 4}" y="${y - 4}" width="${w + 8}" height="${h + 8}" rx="9" fill="#fff"/><clipPath id="w${x}${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"/></clipPath><g clip-path="url(#w${x}${y})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${glass}"/>${inner}<path d="M${x + w * 0.15} ${y}l${-w * 0.2} ${h}h${w * 0.14}l${w * 0.2} ${-h}z" fill="#fff" opacity=".28"/></g><rect x="${x + w / 2 - 2}" y="${y}" width="4" height="${h}" fill="#fff"/><rect x="${x - 8}" y="${y + h + 2}" width="${w + 16}" height="6" rx="3" fill="#f1e8dc"/>`;

/** Silla de perfil. dir = hacia dónde mira quien se sienta (1 derecha). (x, y) = suelo bajo el asiento. */
export const chair = (x, y, dir = 1, c = C.V, s = 1) => `<g transform="translate(${x} ${y}) scale(${dir * s} ${s})"><rect x="-17" y="-66" width="7" height="42" rx="3.5" fill="${dark(c, 0.18)}"/><rect x="-20" y="-70" width="13" height="30" rx="6" fill="${c}"/><rect x="-18" y="-30" width="38" height="8" rx="4" fill="${c}"/><rect x="-15" y="-23" width="5" height="23" rx="2" fill="${dark(c, 0.3)}"/><rect x="12" y="-23" width="5" height="23" rx="2" fill="${dark(c, 0.3)}"/></g>`;

/** Mesa de perfil: tablero con canto y una pata central con base. */
export const table = (x, y, w, h = 44, c = C.WOOD) => `${shadow(x, y, w * 0.42)}<rect x="${x - 4}" y="${y - h}" width="8" height="${h}" fill="${dark(c, 0.22)}"/><rect x="${x - 18}" y="${y - 5}" width="36" height="5" rx="2.5" fill="${dark(c, 0.3)}"/><rect x="${x - w / 2}" y="${y - h - 7}" width="${w}" height="9" rx="4.5" fill="${c}"/><rect x="${x - w / 2 + 4}" y="${y - h - 1}" width="${w - 8}" height="3" rx="1.5" fill="${dark(c, 0.2)}" opacity=".6"/>`;

/** Mostrador (bloque hasta el suelo) con tapa clara. */
export const counter = (x, y, w, h, c, top = "#fff8ee") => `<rect x="${x}" y="${y - h}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y - h}" width="${w}" height="9" fill="#1a1024" opacity=".12"/><rect x="${x + 12}" y="${y - h + 22}" width="${w - 24}" height="${h - 34}" rx="6" fill="${dark(c, 0.1)}" opacity=".6"/><rect x="${x - 6}" y="${y - h - 9}" width="${w + 12}" height="11" rx="5.5" fill="${top}"/>`;

export const laptop = (x, y, dir = 1, screen = C.SKY) => `<g transform="translate(${x} ${y}) scale(${dir} 1)"><path d="M-2 -1L6 -24h24l-6 23z" fill="#4a5064"/><path d="M1.500 -3L8 -21.500h19L22 -3z" fill="${screen}"/><rect x="-16" y="-2" width="42" height="4" rx="2" fill="#6b7288"/></g>`;

/** Mascota de Fluye dentro de una escena. (x, y) = suelo bajo los pies; size = alto aproximado. */
export const mascot = (species, color, mood, x, y, size = 70, o = {}) => `<g transform="translate(${(x - size / 2).toFixed(1)} ${(y - size * 0.945).toFixed(1)}) scale(${(size / 200).toFixed(3)})${o.flip ? " translate(200 0) scale(-1 1)" : ""}"><g class="${o.still ? "" : "bob"}">${mascotInner({ species, color, mood, head: o.head, face: o.face, neck: o.neck, outfit: o.outfit }).replace(/<ellipse cx="100" cy="189"[^>]*>/, "")}</g></g>`;

export const sparkle = (x, y, r = 6, c = C.SUN, cls = "twinkle") => `<path class="${cls}" d="M${x} ${y - r}l${r * 0.3} ${r * 0.7} ${r * 0.7} ${r * 0.3} ${-r * 0.7} ${r * 0.3} ${-r * 0.3} ${r * 0.7} ${-r * 0.3} ${-r * 0.7} ${-r * 0.7} ${-r * 0.3} ${r * 0.7} ${-r * 0.3}z" fill="${c}"/>`;
export const heart = (x, y, s = 1, cls = "float") => `<path class="${cls}" transform="translate(${x} ${y}) scale(${s})" d="M0 6C-10 -1 -8 -10 -3 -10C-1 -10 0 -8 0 -7C0 -8 1 -10 3 -10C8 -10 10 -1 0 6Z" fill="${C.PINK}"/>`;
