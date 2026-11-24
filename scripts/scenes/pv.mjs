// Escenas de los sentidos de phrasal verbs (public/scenes/scene-pv-*.svg), en el mismo estilo que las misiones:
// personas articuladas, mascotas de Fluye, fondo por capas y movimiento.
import { person as P, SKIN, HAIR, dark, light } from "./people.mjs";
import { C, shadow, tree, bush, grass, cloud, sun, plant, cup, win, chair, table, counter, mascot, sparkle, heart } from "./kit.mjs";

const { E, E2, V, V2, SUN, PINK, SKY, INK, WOOD, RED, GREY } = C;
const JEANS = "#3b4560";
const floor = (y, c) => `<rect y="${y}" width="400" height="${240 - y}" fill="${c}"/><rect y="${y}" width="400" height="6" fill="#1a1024" opacity=".06"/>`;
const room = (wall, fl, fy = 190) => `<rect width="400" height="${fy}" fill="${wall}"/>` + floor(fy, fl);
const park = (sky = "#d8f3f5") => `<rect width="400" height="150" fill="${sky}"/><path d="M0 140C70 118 150 126 230 142C300 156 350 140 400 132V240H0Z" fill="#b6ebd0"/><path d="M0 178C110 160 240 176 400 164V240H0Z" fill="${E2}"/><path d="M0 214C120 204 280 214 400 206V240H0Z" fill="#1ab58a"/>`;
const street = (sky = "#d2e8f8") => `<rect width="400" height="170" fill="${sky}"/><rect x="0" y="92" width="60" height="84" fill="#bdd5ec"/><rect x="70" y="70" width="50" height="106" fill="#aecbe6"/><rect x="300" y="84" width="100" height="92" fill="#bdd5ec"/>` + [0, 1, 2, 3].map((i) => `<rect x="${80 + (i % 2) * 18}" y="${82 + Math.floor(i / 2) * 26}" width="10" height="14" rx="2" fill="#fff" opacity=".6"/>`).join("") + floor(176, "#c9ced8");
const road = (y = 204) => `<rect y="${y}" width="400" height="${240 - y}" fill="#7f8798"/><path d="M0 ${y + 18}h400" stroke="#fff" stroke-width="4" stroke-dasharray="26 20" opacity=".7"/>`;
const car = (x, y, c, dir = 1, extra = "") => `<g transform="translate(${x} ${y}) scale(${dir} 1)">${shadow(0, 2, 56)}<path d="M-58 -6v-10a10 10 0 0 1 10 -10h14l14 -22h42l18 22h8a10 10 0 0 1 10 10v10z" fill="${c}"/><path d="M-58 -12h116v6h-116z" fill="${dark(c, 0.18)}"/><path d="M-16 -28l10 -15h14v15zM14 -28v-15h10l12 15z" fill="#cfeaff"/><rect x="48" y="-22" width="9" height="6" rx="3" fill="#fff8d6"/><circle cx="-32" cy="-4" r="11" fill="${INK}"/><circle cx="-32" cy="-4" r="4.500" fill="#c9ced8"/><circle cx="32" cy="-4" r="11" fill="${INK}"/><circle cx="32" cy="-4" r="4.500" fill="#c9ced8"/>${extra}</g>`;
const bubble = (x, y, w, h, c, inner = "", cls = "float") => `<g class="${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(12, h / 2)}" fill="${c}"/><path d="M${x + 12} ${y + h - 2}l-4 11 14 -11z" fill="${c}"/>${inner}</g>`;
const txt = (x, y, s, size = 13, c = "#fff") => `<text x="${x}" y="${y}" font-family="Nunito,Arial,sans-serif" font-weight="900" font-size="${size}" fill="${c}" text-anchor="middle">${s}</text>`;
const no = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="${RED}" stroke-width="${r * 0.2}"/><path d="M${x - r * 0.7} ${y - r * 0.7}L${x + r * 0.7} ${y + r * 0.7}" stroke="${RED}" stroke-width="${r * 0.2}" stroke-linecap="round"/>`;
const check = (x, y, r = 13) => `<g class="twinkle"><circle cx="${x}" cy="${y}" r="${r}" fill="${E}"/><path d="M${x - r * 0.45} ${y}l${r * 0.32} ${r * 0.34} ${r * 0.6} ${-r * 0.7}" fill="none" stroke="#fff" stroke-width="${r * 0.24}" stroke-linecap="round" stroke-linejoin="round"/></g>`;
const boxS = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="${light(WOOD, 0.06)}"/><rect x="${x}" y="${y}" width="${w}" height="${h * 0.22}" fill="${dark(WOOD, 0.14)}"/><rect x="${x + w / 2 - 5}" y="${y}" width="10" height="${h}" fill="#f1d9a8" opacity=".85"/>`;
const drop = (x, y, c = SKY, cls = "drip") => `<path class="${cls}" d="M${x} ${y - 5}q4 5 0 8q-4 -3 0 -8z" fill="${c}"/>`;
const up = (x, y, c = E) => `<path class="float" d="M${x} ${y - 10}l8 10h-5v9h-6v-9h-5z" fill="${c}"/>`;

export const PV = {
  "pv-pick-up-box": () => [
    "Una persona levanta una caja de cartón con ambas manos mientras un gato la observa",
    "#fde6cb",
    [
      room("#fde0c0", "#e8c79d"),
      win(28, 34, 80, 70, sun(68, 66, 12)),
      plant(372, 212, 1),
      boxS(286, 172, 56, 42) + boxS(296, 136, 44, 36),
      mascot("gato", "#9aa5c9", "wow", 92, 214, 66, {}),
      shadow(190, 214, 26),
      P({ x: 190, y: 212, s: 0.84, skin: SKIN[2], hairStyle: "curly", hairColor: HAIR[0], top: E, bottom: JEANS, armL: [34, 34], armR: [44, 30], mood: "smile", look: 1, lean: 8, tilt: -4, extra: `<g class="bob">${boxS(12, -84, 48, 40)}</g><circle cx="18" cy="-50" r="7" fill="${SKIN[2]}"/>` }),
      up(236, 104) + up(256, 118, E2),
    ].join(""),
  ],

  "pv-pick-up-person": () => [
    "Una persona saluda desde la banqueta mientras un auto amarillo llega a recogerla",
    "#d2e8f8",
    [
      street(),
      cloud(200, 36, 0.8) + sun(352, 40, 16),
      tree(170, 176, 0.8),
      road(),
      `<g class="drive"><g transform="translate(290 224) scale(1.35)">${car(0, 0, "#ffc21a", -1, `<circle cx="2" cy="-34" r="9" fill="${SKIN[3]}"/><path d="M-7 -36a9 9 0 0 1 18 0q-9 -6 -18 0z" fill="${HAIR[0]}"/>`)}</g></g>`,
      mascot("perro", "#dba05f", "cheer", 54, 204, 58, { neck: "scarf" }),
      shadow(128, 204, 24),
      P({ x: 128, y: 202, s: 0.82, skin: SKIN[0], hairStyle: "ponytail", hairColor: HAIR[2], top: PINK, bottom: "#4a4f9c", armR: [28, -36], armL: [-16, 32], mood: "laugh", look: 1, lean: 3, tilt: 5, wave: "R", back: `<path d="M-18 -84C-34 -82 -34 -50 -22 -46L-16 -80Z" fill="${V}"/>` }),
    ].join(""),
  ],

  "pv-pick-up-language": () => [
    "Una persona con audífonos y un libro aprende frases que flotan en globos de colores; un búho la acompaña",
    "#e9e6ff",
    [
      room("#e1dcfb", "#d2cbef"),
      bubble(40, 28, 74, 34, V, txt(77, 51, "Hi!", 16)),
      bubble(252, 22, 96, 34, E, txt(300, 45, "¡Hola!", 16), "float d2"),
      bubble(286, 82, 78, 30, SUN, txt(325, 103, "Salut!", 14), "float d1"),
      bubble(64, 88, 70, 30, PINK, txt(99, 109, "Ciao!", 14), "float d3"),
      plant(30, 214, 1),
      chair(182, 214, 1, V),
      P({ x: 188, y: 214, s: 0.84, pose: "sit", skin: SKIN[1], hairStyle: "bob", hairColor: HAIR[1], top: SUN, bottom: JEANS, armL: [30, 30], armR: [44, 28], mood: "laugh", look: 1, tilt: 6, extra: `<path d="M-25 -116a25 26 0 0 1 50 0" fill="none" stroke="${INK}" stroke-width="5"/><rect x="-31" y="-122" width="11" height="18" rx="5" fill="${V}"/><rect x="20" y="-122" width="11" height="18" rx="5" fill="${V}"/><g transform="rotate(-8 34 -52)"><path d="M12 -64h20v24h-20z" fill="${RED}"/><path d="M32 -64h20v24h-20z" fill="${dark(RED, 0.14)}"/><path d="M15 -60h14v17h-14zM35 -60h14v17h-14z" fill="#fff"/></g>` }),
      mascot("buho", "#8d7b6a", "happy", 322, 214, 62, { head: "headphones", flip: true }),
      sparkle(160, 66, 6) + sparkle(238, 96, 5, PINK, "twinkle d2"),
    ].join(""),
  ],

  "pv-take-off-plane": () => [
    "Un avión despega de la pista hacia un cielo soleado mientras un zorro lo despide",
    "#cfe9fb",
    [
      `<rect width="400" height="180" fill="#c8e6fb"/>`,
      sun(60, 50, 22) + cloud(170, 44, 1) + cloud(330, 96, 0.7, "float d2") + cloud(40, 118, 0.6, "float d1"),
      `<path d="M0 168C90 150 250 160 400 150V240H0Z" fill="#b6ebd0"/>`,
      `<rect x="334" y="96" width="14" height="70" fill="#aecbe6"/><rect x="322" y="78" width="38" height="24" rx="6" fill="${V}"/><rect x="327" y="83" width="28" height="9" rx="3" fill="#cfeaff"/><circle class="twinkle" cx="341" cy="72" r="4" fill="${RED}"/>`,
      `<rect y="190" width="400" height="50" fill="#7f8798"/><path d="M0 214h400" stroke="#fff" stroke-width="5" stroke-dasharray="30 22" opacity=".8"/>`,
      `<g class="float"><g transform="translate(206 104) rotate(-20)"><path d="M-84 0C-84 -13 -60 -16 -40 -16H52C76 -16 92 -6 92 0C92 8 76 14 52 14H-40C-60 14 -84 13 -84 0Z" fill="#fff"/><path d="M-84 0C-84 8 -60 14 -40 14H52C76 14 92 8 92 0Z" fill="#e6ecf5"/><path d="M-66 -14l-22 -34h16l30 34z" fill="${V}"/><path d="M-10 4l-34 40h18l44 -40z" fill="${V2}"/><path d="M-4 -14l-22 -26h12l34 26z" fill="${V2}" opacity=".8"/>${[-30, -12, 6, 24, 42].map((x) => `<rect x="${x}" y="-9" width="9" height="8" rx="3" fill="${SKY}"/>`).join("")}<path d="M66 -12q14 2 22 9h-22z" fill="${SKY}"/></g></g>`,
      `<g fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"><path class="twinkle" d="M84 150l-24 9"/><path class="twinkle d1" d="M96 164l-28 10"/><path class="twinkle d2" d="M70 138l-18 6"/></g>`,
      mascot("zorro", "#f0832f", "cheer", 300, 222, 66, { head: "cap" }),
    ].join(""),
  ],

  "pv-take-off-jacket": () => [
    "Una persona acalorada se quita la chamarra amarilla junto a un perchero, con el sol entrando por la ventana",
    "#fde6cb",
    [
      room("#fde0c0", "#e8c79d"),
      win(250, 30, 110, 84, sun(305, 72, 24), "#ffe9b8"),
      `<rect x="62" y="60" width="6" height="154" rx="3" fill="${dark(WOOD, 0.2)}"/><path d="M65 72l-18 -10M65 72l18 -10M65 92l-16 -8M65 92l16 -8" stroke="${dark(WOOD, 0.2)}" stroke-width="5" stroke-linecap="round"/><rect x="48" y="210" width="34" height="6" rx="3" fill="${dark(WOOD, 0.3)}"/><path d="M76 62q12 -10 16 6q-2 14 -12 12z" fill="${RED}"/>`,
      plant(372, 214, 0.9),
      shadow(190, 214, 26),
      P({ x: 190, y: 212, s: 0.86, skin: SKIN[1], hairStyle: "short", hairColor: HAIR[1], top: "#fbfdff", bottom: JEANS, armL: [-14, 40], armR: [14, 40], mood: "tired", look: 0, tilt: 5, shortSleeve: true, back: `<path d="M-26 -72C-30 -50 -30 -30 -26 -14H26C30 -30 30 -50 26 -72C14 -62 -14 -62 -26 -72Z" fill="${dark(SUN, 0.12)}"/>`, extra: `<g class="bob"><path d="M-24 -66L-31 -40" stroke="${SUN}" stroke-width="16" stroke-linecap="round"/><path d="M24 -66L31 -40" stroke="${SUN}" stroke-width="16" stroke-linecap="round"/><path d="M-20 -64C-24 -44 -24 -28 -22 -14H-9C-11 -34 -11 -50 -12 -62Z" fill="${SUN}"/><path d="M20 -64C24 -44 24 -28 22 -14H9C11 -34 11 -50 12 -62Z" fill="${SUN}"/><circle cx="-15" cy="-34" r="2.400" fill="#fff"/><circle cx="-15" cy="-24" r="2.400" fill="#fff"/></g>` }),
      drop(160, 96) + drop(224, 104, SKY, "drip d1") + drop(150, 122, SKY, "drip d2"),
      mascot("panda", "#2b2238", "oops", 318, 214, 58, { flip: true }),
    ].join(""),
  ],

  "pv-take-off-business": () => [
    "La dueña de una tienda celebra frente a una gráfica cuyas ventas suben como cohete",
    "#e2f6ee",
    [
      `<rect width="400" height="176" fill="#dbf3e8"/>` + cloud(60, 34, 0.7) + floor(190, "#c4e8d7"),
      `<rect x="20" y="92" width="124" height="98" fill="#fff8ee"/><path d="M12 70h140l10 26a12 12 0 0 1 -24 0a12 12 0 0 1 -24 0a12 12 0 0 1 -24 0a12 12 0 0 1 -24 0a12 12 0 0 1 -24 0a12 12 0 0 1 -24 0a12 12 0 0 1 -20 4z" fill="${PINK}"/><rect x="34" y="118" width="46" height="40" rx="5" fill="#cfeaff"/><rect x="94" y="118" width="36" height="72" rx="5" fill="${V}"/><circle cx="102" cy="156" r="3" fill="${SUN}"/>`,
      `<rect x="212" y="26" width="168" height="130" rx="12" fill="#fff"/>` + [0, 1, 2, 3, 4].map((i) => `<rect x="${228 + i * 28}" y="${140 - [18, 28, 40, 62, 92][i]}" width="18" height="${[18, 28, 40, 62, 92][i]}" rx="5" fill="${[V2, SKY, E2, SUN, E][i]}"/>`).join("") + `<path class="twinkle" d="M226 116l34 -14 28 -16 30 -30 30 -22" fill="none" stroke="${RED}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
      `<g class="float"><g transform="translate(356 32) rotate(38)"><path d="M0 -20C10 -10 10 8 6 16H-6C-10 8 -10 -10 0 -20Z" fill="#fff"/><path d="M0 -20C6 -14 8 -8 8 -4H-8C-8 -8 -6 -14 0 -20Z" fill="${RED}"/><circle cx="0" cy="2" r="4" fill="${SKY}"/><path d="M-6 10l-8 10 8 -2zM6 10l8 10 -8 -2z" fill="${V}"/><path class="twinkle" d="M-4 16q4 16 8 0z" fill="${SUN}"/></g></g>`,
      shadow(178, 216, 26),
      P({ x: 178, y: 214, s: 0.84, skin: SKIN[3], hairStyle: "afro", hairColor: HAIR[0], top: SUN, bottom: JEANS, armL: [-22, -38], armR: [22, -38], mood: "laugh", look: 1, tilt: -4, wave: "R" }),
      mascot("oso", "#b07a52", "cheer", 296, 216, 60, { neck: "bowtie", flip: true }),
      sparkle(200, 60, 7) + sparkle(150, 80, 5, PINK, "twinkle d2"),
    ].join(""),
  ],

  "pv-look-up-word": () => [
    "Una persona busca una palabra en su celular; junto a ella, una página de diccionario ampliada con una lupa",
    "#e9e6ff",
    [
      room("#e1dcfb", "#d2cbef"),
      `<g transform="rotate(-5 110 100)"><rect x="40" y="26" width="140" height="150" rx="10" fill="#fff"/><rect x="56" y="44" width="70" height="10" rx="5" fill="${V}"/>${[66, 82, 98, 124, 140, 156].map((y, i) => `<rect x="56" y="${y}" width="${[108, 92, 100, 108, 84, 96][i]}" height="6" rx="3" fill="${i === 3 ? V2 : "#d9dce6"}"/>`).join("")}<rect x="56" y="112" width="48" height="8" rx="4" fill="${SUN}"/></g>`,
      `<g class="float"><circle cx="150" cy="118" r="30" fill="#fff" opacity=".55"/><circle cx="150" cy="118" r="30" fill="none" stroke="${INK}" stroke-width="7"/><path d="M172 140l22 22" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><rect x="132" y="112" width="36" height="9" rx="4.500" fill="${SUN}"/><path d="M134 104q8 -10 20 -8" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`,
      shadow(262, 216, 26),
      P({ x: 262, y: 214, s: 0.86, flip: true, skin: SKIN[2], hairStyle: "bun", hairColor: HAIR[0], top: E, bottom: JEANS, armL: [28, 4], armR: [20, 34], mood: "think", look: 1, tilt: 8, extra: `<rect x="6" y="-98" width="15" height="25" rx="4" fill="${INK}"/><rect x="8" y="-95" width="11" height="18" rx="2" fill="${SKY}"/><circle cx="14" cy="-78" r="6.500" fill="${SKIN[2]}"/>` }),
      mascot("buho", "#8d7b6a", "think", 346, 216, 58, { face: "glasses", flip: true }),
      `<g class="twinkle">${txt(214, 78, "?", 30, V)}</g>`,
    ].join(""),
  ],

  "pv-look-up-to": () => [
    "Una niña mira con admiración a su entrenadora, que sonríe en el podio con una medalla",
    "#fdebd0",
    [
      `<rect width="400" height="180" fill="#fde6c4"/><ellipse cx="270" cy="110" rx="120" ry="100" fill="#fff" opacity=".35"/>` + floor(196, "#e8c79d"),
      [40, 96, 152, 208, 264, 320, 376].map((x, i) => `<path class="sway" d="M${x - 14} 0h28l-14 26z" fill="${[RED, SUN, E2, SKY, V, PINK, SUN][i]}"/>`).join(""),
      `<rect x="214" y="150" width="112" height="66" rx="8" fill="${V}"/><rect x="214" y="150" width="112" height="12" rx="6" fill="${light(V, 0.2)}"/>` + txt(270, 196, "1", 30),
      `<rect x="326" y="176" width="60" height="40" rx="6" fill="${V2}"/><rect x="154" y="186" width="60" height="30" rx="6" fill="${V2}"/>`,
      P({ x: 270, y: 150, s: 0.8, skin: SKIN[3], hairStyle: "ponytail", hairColor: HAIR[0], top: E, bottom: "#2b2238", armL: [-22, 32], armR: [24, -36], mood: "proud", look: -1, tilt: -6, wave: "R", flip: true, extra: `<path d="M-9 -92L0 -66L9 -92" fill="none" stroke="${RED}" stroke-width="5"/><circle cx="0" cy="-62" r="9" fill="${SUN}"/><circle cx="0" cy="-62" r="4.500" fill="#ffd97a"/>` }),
      shadow(96, 216, 20),
      P({ x: 96, y: 214, s: 0.6, skin: SKIN[0], hairStyle: "long", hairColor: HAIR[5], top: PINK, bottom: "#4a4f9c", armL: [16, -14], armR: [30, -20], mood: "wow", look: 1, tilt: -16, lean: -4 }),
      sparkle(190, 70, 8) + sparkle(346, 60, 7, SUN, "twinkle d1") + sparkle(150, 120, 5, PINK, "twinkle d2") + heart(128, 90, 0.9),
      mascot("zorro", "#f0832f", "cheer", 36, 216, 50, {}),
    ].join(""),
  ],

  "pv-break-down-car": () => [
    "Un auto con el cofre abierto echa humo en la carretera; su dueño se lleva las manos a la cabeza junto a un triángulo de advertencia",
    "#d8f3f5",
    [
      park(),
      cloud(70, 36, 0.8) + tree(40, 180, 1) + bush(366, 190, 0.9),
      road(196),
      car(250, 216, RED, -1, `<path d="M40 -26l22 -22" stroke="${dark(RED, 0.2)}" stroke-width="7" stroke-linecap="round"/>`),
      `<g fill="#9aa1b3"><circle class="steam" cx="196" cy="170" r="12"/><circle class="steam d1" cx="184" cy="150" r="15" opacity=".8"/><circle class="steam d2" cx="204" cy="132" r="18" opacity=".6"/></g>`,
      `<path d="M330 216l16 -28 16 28z" fill="${RED}"/><path d="M338 212l8 -14 8 14z" fill="#fff"/>`,
      shadow(104, 218, 26),
      P({ x: 104, y: 216, s: 0.84, skin: SKIN[1], hairStyle: "short", hairColor: HAIR[1], top: SKY, bottom: JEANS, armL: [-8, -34], armR: [8, -34], mood: "worry", look: 1, tilt: 6, lean: -3, beard: true }),
      drop(74, 96) + drop(134, 100, SKY, "drip d2"),
      mascot("perro", "#dba05f", "oops", 164, 220, 52, {}),
    ].join(""),
  ],

  "pv-break-down-crying": () => [
    "Una persona rompe a llorar con un pañuelo en la mano bajo una nube de lluvia; un panda le acerca más pañuelos",
    "#dfe6f3",
    [
      room("#d9e1f0", "#c3cce0"),
      win(30, 34, 84, 70, [0, 1, 2, 3, 4].map((i) => `<path class="drip d${(i % 3) + 1}" d="M${42 + i * 15} ${46 + (i % 2) * 14}v10" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`).join(""), "#a9bbd6"),
      `<g class="float"><g fill="#8f97a8"><circle cx="176" cy="46" r="15"/><circle cx="200" cy="38" r="20"/><circle cx="226" cy="48" r="15"/><rect x="162" y="44" width="78" height="18" rx="9"/></g></g>` + [0, 1, 2, 3].map((i) => `<path class="drip d${(i % 3) + 1}" d="M${174 + i * 18} 70v10" stroke="${SKY}" stroke-width="3.500" stroke-linecap="round"/>`).join(""),
      shadow(200, 216, 26),
      P({ x: 200, y: 214, s: 0.86, skin: SKIN[0], hairStyle: "long", hairColor: HAIR[1], top: V, bottom: JEANS, armL: [10, -16], armR: [22, 32], mood: "worry", look: 0, tilt: 8, lean: 3, extra: `<path d="M-14 -112l10 -3 9 5 -3 12 -14 2z" fill="#fff"/>` }),
      drop(184, 124, SKY) + drop(216, 122, SKY, "drip d1") + drop(190, 140, SKY, "drip d2"),
      table(92, 214, 60, 44) + `<rect x="74" y="144" width="36" height="20" rx="4" fill="${PINK}"/><path d="M84 144q8 -14 16 0z" fill="#fff"/>`,
      mascot("panda", "#2b2238", "oops", 300, 216, 64, { flip: true }),
      `<path class="float" d="M262 168l14 -4 12 8 -4 14 -18 2z" fill="#fff"/>`,
    ].join(""),
  ],

  "pv-turn-down-volume": () => [
    "Una persona baja el volumen de la bocina girando la perilla porque un gato duerme en el sillón",
    "#e9e6ff",
    [
      room("#e1dcfb", "#d2cbef"),
      `<rect x="40" y="28" width="150" height="40" rx="12" fill="#fff"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${54 + i * 18}" y="${54 - 6 - i * 2.5}" width="11" height="${10 + i * 2.5}" rx="3" fill="${i < 2 ? E : "#dcdfe8"}"/>`).join(""),
      `<g opacity=".55" fill="${V2}"><path class="float" d="M232 56v-22l16 -4v20a6 5 0 1 1 -4 -5v-9l-8 2v20a6 5 0 1 1 -4 -5z"/><circle class="twinkle d2" cx="270" cy="70" r="4"/></g>`,
      `<path d="M250 216V150C250 136 262 128 276 128H372C386 128 396 138 396 152V216Z" fill="${dark(E, 0.14)}"/><rect x="258" y="170" width="140" height="30" rx="14" fill="${light(E, 0.1)}"/>`,
      mascot("gato", "#9aa5c9", "sleep", 326, 180, 60, { still: true }),
      table(118, 214, 86, 52),
      `<rect x="82" y="118" width="72" height="38" rx="9" fill="${INK}"/><circle cx="102" cy="137" r="11" fill="#5a6072"/><circle cx="102" cy="137" r="5" fill="${GREY}"/><circle cx="138" cy="137" r="9" fill="${SUN}"/><path d="M138 137l-6 -5" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><path class="twinkle" d="M152 122a16 16 0 0 0 -24 -4l-2 -6M126 112l1 8 8 -2" fill="none" stroke="${RED}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
      shadow(200, 216, 24),
      P({ x: 202, y: 214, s: 0.84, flip: true, skin: SKIN[2], hairStyle: "curly", hairColor: HAIR[0], top: SUN, bottom: JEANS, armR: [42, 14], armL: [-16, 32], mood: "smile", look: 1, tilt: 4, lean: 5 }),
      txt(238, 102, "shh", 15, V),
    ].join(""),
  ],

  "pv-turn-down-offer": () => [
    "Una persona rechaza con amabilidad, levantando la palma, el sobre con una oferta que le extiende otra",
    "#eae6ff",
    [
      room("#e3defb", "#d2cbef"),
      win(140, 26, 120, 84, `<rect x="156" y="70" width="18" height="40" fill="#a9c5e0"/><rect x="182" y="52" width="22" height="58" fill="#9bbbd9"/><rect x="214" y="78" width="26" height="32" fill="#b5cfe8"/>` + cloud(210, 44, 0.4)),
      plant(24, 214, 1) + plant(378, 214, 0.9),
      shadow(120, 216, 26) + shadow(286, 216, 26),
      P({ x: 120, y: 214, s: 0.84, skin: SKIN[0], hairStyle: "bald", hairColor: HAIR[1], top: "#333c52", bottom: "#4a4f66", armR: [44, 6], armL: [-16, 34], mood: "talk", look: 1, tilt: 4, lean: 4, glasses: true, beard: true, extra: `<g class="bob"><g transform="rotate(-8 74 -80)"><rect x="56" y="-94" width="38" height="26" rx="4" fill="#fff"/><path d="M56 -92l19 14 19 -14" fill="none" stroke="${GREY}" stroke-width="2.600"/><circle cx="75" cy="-76" r="5" fill="${SUN}"/></g></g>` }),
      P({ x: 286, y: 214, s: 0.84, flip: true, skin: SKIN[2], hairStyle: "bob", hairColor: HAIR[0], top: E2, bottom: JEANS, armR: [40, -10], armL: [-14, 34], mood: "smug", look: 1, tilt: -6, lean: -5, extra: `<g class="wave" style="transform-origin:32px -78px"><rect x="48" y="-108" width="17" height="20" rx="7" fill="${dark(SKIN[2], 0.12)}"/></g>` }),
      `<g class="twinkle">${no(204, 118, 15)}</g>`,
      mascot("buho", "#8d7b6a", "think", 346, 216, 50, { flip: true }),
    ].join(""),
  ],

  "pv-work-out-gym": () => [
    "Una persona levanta una barra con pesas sobre la cabeza en el gimnasio; un oso la anima",
    "#e2f6ee",
    [
      room("#dbf3e8", "#c4e8d7"),
      `<rect x="250" y="24" width="124" height="150" rx="12" fill="#fff"/><rect x="258" y="32" width="108" height="134" rx="7" fill="#cfeaff"/><path d="M286 32l-28 134h20l28 -134z" fill="#fff" opacity=".4"/>`,
      `<rect x="30" y="60" width="90" height="8" rx="4" fill="${GREY}"/>` + [40, 62, 84, 106].map((x, i) => `<rect x="${x - 6}" y="68" width="12" height="${22 + (i % 2) * 6}" rx="5" fill="${[V, PINK, SUN, E][i]}"/>`).join(""),
      `<path d="M330 216a14 14 0 1 1 28 0z" fill="${INK}"/><path d="M336 200a8 8 0 0 1 16 0" fill="none" stroke="${INK}" stroke-width="5"/>`,
      shadow(186, 216, 30),
      P({ x: 186, y: 214, s: 0.86, skin: SKIN[2], hairStyle: "bun", hairColor: HAIR[0], top: PINK, bottom: "#2b2238", shoes: V, armL: [-18, -44], armR: [18, -44], mood: "proud", tilt: 0, shortSleeve: true, extra: `<g class="bob"><rect x="-74" y="-136" width="148" height="7" rx="3.500" fill="${GREY}"/><rect x="-78" y="-152" width="12" height="40" rx="5" fill="${INK}"/><rect x="-64" y="-146" width="9" height="28" rx="4" fill="${V}"/><rect x="66" y="-152" width="12" height="40" rx="5" fill="${INK}"/><rect x="55" y="-146" width="9" height="28" rx="4" fill="${V}"/></g><circle cx="-34" cy="-131" r="7" fill="${SKIN[2]}"/><circle cx="34" cy="-131" r="7" fill="${dark(SKIN[2], 0.12)}"/>` }),
      drop(142, 108) + drop(232, 112, SKY, "drip d2"),
      mascot("oso", "#b07a52", "cheer", 76, 216, 64, {}),
      sparkle(120, 40, 6) + sparkle(226, 46, 5, PINK, "twinkle d2"),
    ].join(""),
  ],

  "pv-work-out-problem": () => [
    "Una persona celebra con el puño en alto cuando la última pieza del rompecabezas encaja; un zorro aplaude",
    "#fde6cb",
    [
      room("#fde0c0", "#e8c79d"),
      `<rect x="196" y="30" width="170" height="124" rx="12" fill="#fff"/>` +
        [[212, 46, SKY], [262, 46, E2], [312, 46, SUN], [212, 96, V2], [262, 96, SUN], [312, 96, "#f1e8dc"]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="46" height="46" rx="7" fill="${c}"/><circle cx="${x + 23}" cy="${y}" r="7" fill="${c}"/>`).join("") +
        `<g class="float"><rect x="312" y="88" width="46" height="46" rx="7" fill="${PINK}"/><circle cx="335" cy="88" r="7" fill="${PINK}"/></g>`,
      check(366, 36, 15),
      `<g class="twinkle"><path d="M64 44a16 16 0 1 1 22 15v8h-12v-8a16 16 0 0 1 -10 -15z" fill="${SUN}"/><rect x="72" y="70" width="16" height="7" rx="3" fill="${GREY}"/></g><g stroke="${SUN}" stroke-width="3.500" stroke-linecap="round"><path class="twinkle d1" d="M48 30l-8 -6M112 30l8 -6M80 14v-9"/></g>`,
      shadow(130, 216, 26),
      P({ x: 130, y: 214, s: 0.86, skin: SKIN[1], hairStyle: "hijab", hairColor: "#7a5cd6", top: E, bottom: JEANS, armR: [26, -40], armL: [-20, 30], mood: "laugh", look: 1, tilt: -5, lean: -3, wave: "R" }),
      mascot("zorro", "#f0832f", "cheer", 250, 216, 62, { face: "glasses", flip: true }),
    ].join(""),
  ],

  "pv-make-up-friends": () => [
    "Dos amigos se reconcilian con un abrazo; la nube gris se aleja y sale el sol",
    "#dff6ea",
    [
      park(),
      sun(86, 50, 22),
      `<g class="drive"><g fill="#8f97a8" opacity=".85"><circle cx="318" cy="42" r="14"/><circle cx="340" cy="34" r="18"/><circle cx="364" cy="44" r="14"/><rect x="304" y="40" width="74" height="16" rx="8"/></g></g>`,
      tree(44, 184, 1.1, "#17a67c") + tree(360, 188, 1) + bush(300, 204, 0.8),
      grass(96, 216) + grass(290, 220),
      shadow(200, 218, 50),
      P({ x: 174, y: 216, s: 0.84, skin: SKIN[3], hairStyle: "short", hairColor: HAIR[0], top: SUN, bottom: JEANS, armR: [42, 6], armL: [34, 22], mood: "laugh", look: 1, tilt: 8, lean: 7 }),
      P({ x: 228, y: 216, s: 0.84, flip: true, skin: SKIN[0], hairStyle: "curly", hairColor: HAIR[2], top: V, bottom: "#4a4f9c", armR: [42, 6], armL: [34, 22], mood: "laugh", look: 1, tilt: 8, lean: 7 }),
      heart(200, 78, 1.3) + heart(172, 96, 0.8, "float d1") + heart(232, 92, 0.9, "float d2"),
      mascot("perro", "#dba05f", "cheer", 300, 222, 56, { flip: true }),
    ].join(""),
  ],

  "pv-make-up-cosmetics": () => [
    "Una mujer se pinta los labios frente al espejo de su tocador, con una paleta de colores y una brocha",
    "#ffe6ee",
    [
      room("#ffe0ea", "#f3c9d6"),
      `<circle cx="264" cy="96" r="60" fill="#fff"/><circle cx="264" cy="96" r="51" fill="#cfeaff"/><path d="M236 52l-22 80h18l22 -80z" fill="#fff" opacity=".45"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<circle class="twinkle d${(i % 3) + 1}" cx="${(264 + Math.cos((i * Math.PI) / 4) * 60).toFixed(1)}" cy="${(96 + Math.sin((i * Math.PI) / 4) * 60).toFixed(1)}" r="5" fill="${SUN}"/>`).join(""),
      `<g transform="translate(264 104) scale(.62)"><rect x="-22" y="-21" width="44" height="43" rx="19" fill="${SKIN[1]}"/><path d="M-26 -6C-30 -34 30 -34 26 -6C17 -15 -17 -15 -26 -6Z" fill="${HAIR[5]}"/><path d="M-13 -4q4 -5 8 0M5 -4q4 -5 8 0" fill="none" stroke="${INK}" stroke-width="2.600" stroke-linecap="round"/><path d="M-5 9q5 5 10 0q-5 -3 -10 0z" fill="${RED}"/></g>`,
      counter(190, 214, 190, 50, "#ff8fa8", "#fff"),
      `<rect x="300" y="146" width="44" height="10" rx="3" fill="${INK}"/>` + [V, PINK, SUN, E2].map((c, i) => `<circle cx="${307 + i * 10}" cy="151" r="3.500" fill="${c}"/>`).join("") + `<rect x="352" y="130" width="6" height="26" rx="3" fill="${dark(WOOD, 0.2)}"/><path d="M350 130q5 -14 10 0z" fill="${PINK}"/><rect x="216" y="140" width="9" height="16" rx="2" fill="${INK}"/><path d="M217 140v-8l7 3v5z" fill="${RED}"/>`,
      shadow(120, 216, 26),
      P({ x: 124, y: 214, s: 0.86, skin: SKIN[1], hairStyle: "long", hairColor: HAIR[5], top: V, bottom: JEANS, armR: [-2, -22], armL: [-18, 32], mood: "smile", look: 1, tilt: 6, extra: `<rect x="17" y="-118" width="6" height="15" rx="2" fill="${INK}" transform="rotate(30 20 -110)"/><path d="M24 -118l5 -7 3 6z" fill="${RED}"/>` }),
      mascot("gato", "#9aa5c9", "wow", 46, 216, 54, { neck: "bowtie" }),
      sparkle(180, 50, 6, PINK) + sparkle(340, 60, 5, "#fff", "twinkle d2"),
    ].join(""),
  ],

  "pv-run-into": () => [
    "Dos personas se topan de frente en la calle, sorprendidas; a una se le derrama el café",
    "#d2e8f8",
    [
      street(),
      cloud(200, 32, 0.8) + tree(26, 178, 0.8) + tree(378, 178, 0.7),
      shadow(160, 216, 26) + shadow(244, 216, 26),
      P({ x: 160, y: 214, s: 0.84, pose: "walk", skin: SKIN[0], hairStyle: "ponytail", hairColor: HAIR[3], top: PINK, bottom: "#4a4f9c", armR: [34, -22], armL: [-26, 20], mood: "wow", look: 1, lean: -8, tilt: -6, extra: `<g class="float"><g transform="rotate(34 50 -112)"><path d="M43 -122h14l-2 16h-10z" fill="#fff"/><rect x="42" y="-125" width="16" height="4" rx="2" fill="${GREY}"/></g></g>` }),
      P({ x: 244, y: 214, s: 0.84, pose: "walk", flip: true, skin: SKIN[3], hairStyle: "afro", hairColor: HAIR[0], top: E, bottom: JEANS, armR: [34, -18], armL: [-24, 22], mood: "wow", look: 1, lean: -8, tilt: -6, back: `<path d="M-30 -52h22v28h-22z" fill="${SUN}"/><path d="M-26 -52q7 -14 14 0" fill="none" stroke="${dark(SUN, 0.2)}" stroke-width="3"/>` }),
      `<g class="twinkle"><path d="M202 84l5 14 15 -3 -10 11 10 11 -15 -3 -5 14 -5 -14 -15 3 10 -11 -10 -11 15 3z" fill="${SUN}"/></g>`,
      drop(214, 126, WOOD) + drop(226, 138, WOOD, "drip d1") + drop(206, 146, WOOD, "drip d2"),
      mascot("buho", "#8d7b6a", "wow", 330, 216, 52, { flip: true }),
    ].join(""),
  ],

  "pv-give-up-quit": () => [
    "Un boxeador agotado lanza la toalla al aire en el ring: se rinde",
    "#e6e1fb",
    [
      `<rect width="400" height="240" fill="#3a3566"/><ellipse cx="200" cy="60" rx="180" ry="120" fill="#fff" opacity=".12"/>`,
      [60, 200, 340].map((x) => `<path d="M${x - 16} 0h32l22 60h-76z" fill="#fff" opacity=".08"/>`).join(""),
      `<rect y="196" width="400" height="44" fill="${V}"/><rect y="196" width="400" height="8" fill="${light(V, 0.25)}"/>`,
      `<rect x="20" y="84" width="14" height="116" rx="5" fill="${RED}"/><rect x="366" y="84" width="14" height="116" rx="5" fill="${SKY}"/>` + [104, 136, 168].map((y) => `<path d="M34 ${y}h332" stroke="#fff" stroke-width="5" opacity=".85"/>`).join(""),
      `<g class="float"><g transform="rotate(-16 236 62)"><path d="M212 44h48v34q-12 6 -24 0t-24 0z" fill="#fff"/><path d="M212 52h48" stroke="${SKY}" stroke-width="4"/></g></g>`,
      `<path class="twinkle" d="M200 96q8 -14 22 -18" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-dasharray="3 7"/>`,
      shadow(170, 216, 28, 0.25),
      P({ x: 170, y: 214, s: 0.86, skin: SKIN[2], hairStyle: "short", hairColor: HAIR[0], top: SKIN[2], bottom: RED, shoes: "#fff", armR: [26, -38], armL: [-20, 32], mood: "tired", look: 1, tilt: 8, lean: 4, shortSleeve: true, extra: `<circle cx="-36" cy="-52" r="12" fill="${RED}"/><circle cx="-36" cy="-52" r="12" fill="#fff" opacity=".12"/><path d="M-17 -54h34v8h-34z" fill="#fff"/>` }),
      drop(140, 104) + drop(204, 118, SKY, "drip d2"),
      mascot("perro", "#dba05f", "oops", 320, 216, 60, { neck: "scarf", flip: true }),
    ].join(""),
  ],

  "pv-give-up-sugar": () => [
    "Una persona sonríe con una manzana en la mano tras dejar el azúcar: el azucarero y la dona quedan tachados",
    "#e2f6ee",
    [
      room("#dbf3e8", "#c4e8d7"),
      win(26, 30, 84, 70, sun(68, 64, 12)),
      counter(196, 214, 204, 56, E, "#fff"),
      `<rect x="232" y="108" width="40" height="42" rx="9" fill="#fff"/><rect x="232" y="124" width="40" height="26" rx="9" fill="#f1f3f7"/><rect x="236" y="100" width="32" height="10" rx="4" fill="${V}"/><rect x="240" y="128" width="24" height="8" rx="3" fill="${V2}"/>`,
      `<circle cx="326" cy="136" r="20" fill="#e3a868"/><path d="M306 134a20 20 0 0 1 40 0q-6 6 -12 0t-14 2t-14 -2z" fill="${PINK}"/><circle cx="326" cy="136" r="7" fill="#fff"/>` + [[314, 124, V], [330, 120, SUN], [340, 128, E2]].map(([x, y, c]) => `<rect x="${x}" y="${y}" width="6" height="2.600" rx="1.300" fill="${c}"/>`).join(""),
      `<g class="twinkle">${no(252, 128, 30)}${no(326, 134, 30)}</g>`,
      shadow(124, 216, 26),
      P({ x: 124, y: 214, s: 0.86, skin: SKIN[0], hairStyle: "curly", hairColor: HAIR[5], top: SUN, bottom: JEANS, armR: [30, -30], armL: [-20, 32], mood: "laugh", look: 1, tilt: -5, extra: `<g class="bob"><path d="M36 -128C28 -130 26 -116 32 -108C38 -102 54 -102 60 -108C66 -116 64 -130 56 -128C52 -127 50 -124 46 -124C42 -124 40 -127 36 -128Z" fill="${RED}"/><path d="M46 -126q0 -8 5 -10" fill="none" stroke="#7d5330" stroke-width="2.600" stroke-linecap="round"/><path d="M50 -134q8 -6 12 0q-6 5 -12 0z" fill="${E2}"/><ellipse cx="37" cy="-120" rx="2.500" ry="4" fill="#fff" opacity=".6"/></g><circle cx="46" cy="-106" r="7" fill="${dark(SKIN[0], 0.12)}"/>` }),
      mascot("oso", "#b07a52", "happy", 44, 216, 50, {}),
      sparkle(170, 66, 6) + heart(92, 84, 0.8),
    ].join(""),
  ],

  "pv-put-off": () => [
    "Una persona relajada en el sillón pospone su tarea: en el calendario, una flecha la mueve a otro día junto a un reloj",
    "#fde6cb",
    [
      room("#fde0c0", "#e8c79d"),
      `<rect x="150" y="22" width="180" height="128" rx="12" fill="#fff"/><rect x="150" y="22" width="180" height="26" rx="12" fill="${RED}"/><rect x="150" y="38" width="180" height="10" fill="${RED}"/><circle cx="184" cy="22" r="5" fill="${INK}"/><circle cx="296" cy="22" r="5" fill="${INK}"/>` +
        Array.from({ length: 15 }, (_, i) => `<rect x="${164 + (i % 5) * 32}" y="${58 + Math.floor(i / 5) * 29}" width="24" height="21" rx="5" fill="${i === 1 ? "#fff3c9" : i === 13 ? SUN : "#f1f3f7"}"${i === 1 ? ` stroke="${SUN}" stroke-width="2" stroke-dasharray="4 3"` : ""}/>`).join("") +
        `<path class="twinkle" d="M214 66C268 60 282 96 276 112" fill="none" stroke="${V}" stroke-width="4.500" stroke-linecap="round"/><path class="twinkle" d="M266 106l10 12 8 -14z" fill="${V}"/>`,
      `<circle cx="72" cy="62" r="30" fill="#fff"/><circle cx="72" cy="62" r="30" fill="none" stroke="${V}" stroke-width="6"/><path d="M72 62v-17" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><g class="spin" style="transform-origin:72px 62px;transform-box:view-box;animation-duration:8s"><path d="M72 62l14 8" stroke="${RED}" stroke-width="3.500" stroke-linecap="round"/></g><circle cx="72" cy="62" r="3.500" fill="${INK}"/>`,
      `<path d="M40 216V152C40 138 52 130 66 130H190C204 130 214 140 214 154V216Z" fill="${dark(V, 0.14)}"/>`,
      P({ x: 116, y: 212, s: 0.8, pose: "sit", skin: SKIN[2], hairStyle: "short", hairColor: HAIR[0], top: E2, bottom: JEANS, armL: [-8, -34], armR: [10, -34], mood: "smug", look: 1, tilt: -8, lean: -12 }),
      `<rect x="48" y="176" width="176" height="26" rx="13" fill="${light(V, 0.12)}"/><rect x="58" y="200" width="10" height="16" rx="3" fill="${dark(V, 0.3)}"/><rect x="204" y="200" width="10" height="16" rx="3" fill="${dark(V, 0.3)}"/>`,
      mascot("gato", "#9aa5c9", "sleep", 188, 182, 46, { still: true }),
      `<g class="float">${txt(250, 186, "zzz", 16, V)}</g>`,
      plant(366, 214, 1),
    ].join(""),
  ],

  "pv-hang-out": () => [
    "Dos amigas y un zorro pasan el rato sentados en un muro al atardecer, brindando bajo luces de feria",
    "#ffd9b8",
    [
      `<rect width="400" height="240" fill="#ffd2ae"/><rect width="400" height="90" fill="#ffb9a0" opacity=".6"/><circle cx="200" cy="150" r="56" fill="#ffe7a6"/><circle cx="200" cy="150" r="40" fill="#fff3c9"/>`,
      `<path d="M0 160C60 140 120 150 180 162C260 176 330 150 400 158V240H0Z" fill="#f39a7c" opacity=".6"/>`,
      `<path d="M0 26Q100 62 200 30T400 26" fill="none" stroke="${INK}" stroke-width="2.400" opacity=".6"/>` + [30, 78, 126, 174, 226, 274, 322, 370].map((x, i) => `<circle class="twinkle d${(i % 3) + 1}" cx="${x}" cy="${[36, 46, 47, 37, 33, 40, 39, 30][i]}" r="6" fill="${[SUN, PINK, "#fff", E2, SUN, PINK, "#fff", SKY][i]}"/>`).join(""),
      `<rect y="170" width="400" height="70" fill="#c9705a"/><rect y="170" width="400" height="10" fill="#e08a6e"/>` + [0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${i * 62 - 10}" y="${188 + (i % 2) * 20}" width="50" height="3" rx="1.500" fill="#a9563f" opacity=".6"/>`).join(""),
      P({ x: 110, y: 208, s: 0.8, pose: "sit", skin: SKIN[3], hairStyle: "afro", hairColor: HAIR[0], top: V, bottom: JEANS, armL: [22, 30], armR: [40, -14], mood: "laugh", look: 1, tilt: 8, extra: `<g class="bob"><path d="M52 -112h12l-2 16h-8z" fill="#fff"/><rect x="53" y="-108" width="10" height="5" fill="${SUN}"/></g>` }),
      P({ x: 236, y: 208, s: 0.8, pose: "sit", flip: true, skin: SKIN[0], hairStyle: "long", hairColor: HAIR[3], top: E2, bottom: "#4a4f9c", armL: [22, 30], armR: [40, -14], mood: "laugh", look: 1, tilt: 8, extra: `<g class="bob"><path d="M52 -112h12l-2 16h-8z" fill="#fff"/><rect x="53" y="-108" width="10" height="5" fill="${PINK}"/></g>` }),
      mascot("zorro", "#f0832f", "cheer", 320, 174, 66, { neck: "scarf", flip: true }),
      sparkle(174, 96, 6, "#fff") + heart(172, 112, 0.8) + sparkle(280, 90, 5, "#fff", "twinkle d2"),
    ].join(""),
  ],

  "pv-get-over-cold": () => [
    "A la izquierda, una persona resfriada y abrigada con termómetro; a la derecha, la misma persona ya recuperada celebra al sol",
    "#e8eef6",
    [
      `<rect width="200" height="240" fill="#d5dcea"/><rect x="200" width="200" height="240" fill="#d8f3f5"/>`,
      `<rect y="196" width="200" height="44" fill="#bcc5d8"/><path d="M200 176C260 162 330 172 400 164V240H200Z" fill="${E2}"/>`,
      `<g class="float"><g fill="#8f97a8"><circle cx="52" cy="44" r="13"/><circle cx="72" cy="36" r="17"/><circle cx="94" cy="46" r="13"/><rect x="40" y="42" width="66" height="15" rx="7"/></g></g>`,
      sun(340, 52, 22) + cloud(250, 40, 0.6) + tree(374, 190, 0.8) + grass(232, 216),
      // enferma: cobija, bufanda, termómetro
      shadow(100, 218, 30),
      P({ x: 100, y: 216, s: 0.84, skin: SKIN[1], hairStyle: "bob", hairColor: HAIR[1], top: SKY, bottom: JEANS, armL: [10, 6], armR: [20, 30], mood: "tired", tilt: 8, lean: 3, legs: true, back: `<path d="M-36 -92C-46 -60 -44 -30 -38 -8H38C44 -30 46 -60 36 -92C20 -80 -20 -80 -36 -92Z" fill="${V2}"/>`, extra: `<path d="M-20 -94h40v12h-40z" fill="${RED}"/><path d="M8 -84h12v26h-12z" fill="${dark(RED, 0.14)}"/><circle cx="0" cy="-110" r="4" fill="${RED}" opacity=".7"/><path d="M4 -104l22 6" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="27" cy="-98" r="3" fill="${RED}"/>` }),
      `<g fill="none" stroke="${GREY}" stroke-width="3" stroke-linecap="round"><path class="twinkle" d="M146 106q8 4 0 10"/><path class="twinkle d1" d="M156 100q12 8 0 22"/></g>`,
      `<path class="twinkle" d="M176 120h34l-10 -10M210 120l-10 10" fill="none" stroke="${V}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
      shadow(296, 218, 26),
      P({ x: 296, y: 216, s: 0.84, skin: SKIN[1], hairStyle: "bob", hairColor: HAIR[1], top: SUN, bottom: JEANS, armL: [-22, -38], armR: [22, -38], mood: "laugh", tilt: -4, wave: "R", shortSleeve: true }),
      sparkle(250, 100, 7) + sparkle(346, 110, 6, PINK, "twinkle d2") + heart(296, 66, 1),
      mascot("panda", "#2b2238", "cheer", 366, 222, 48, { flip: true }),
    ].join(""),
  ],

  "pv-get-over-fence": () => [
    "Una persona se agarra de una cerca de madera y pasa una pierna por encima para cruzar; un perro la anima del otro lado",
    "#dff6ea",
    [
      park(),
      sun(336, 44, 20) + cloud(90, 40, 0.9),
      tree(48, 180, 1.1, "#17a67c") + bush(356, 200, 0.9),
      P({ x: 196, y: 190, s: 0.84, skin: SKIN[2], hairStyle: "ponytail", hairColor: HAIR[0], top: PINK, bottom: JEANS, armL: [30, 34], armR: [40, 30], mood: "think", look: 1, tilt: -4, lean: 14 }),
      // cerca por delante del cuerpo
      shadow(200, 218, 150, 0.1),
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => `<path d="M${70 + i * 28} 218v-56l9 -8 9 8v56z" fill="${i % 2 ? WOOD : light(WOOD, 0.08)}"/>`).join("") + `<rect x="62" y="172" width="290" height="8" rx="4" fill="${dark(WOOD, 0.18)}"/><rect x="62" y="198" width="290" height="8" rx="4" fill="${dark(WOOD, 0.18)}"/>`,
      // pierna que ya pasó y manos sobre la cerca
      `<g class="bob"><path d="M204 150L238 148L244 196" fill="none" stroke="${JEANS}" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><path transform="translate(246 204)" d="M-9 0v-4a6 6 0 0 1 6 -6h5a11 10 0 0 1 11 10z" fill="${INK}"/><circle cx="222" cy="156" r="7" fill="${SKIN[2]}"/></g>`,
      up(196, 70, E) + sparkle(250, 110, 6),
      grass(90, 222) + grass(330, 224),
      mascot("perro", "#dba05f", "cheer", 312, 226, 60, { flip: true }),
    ].join(""),
  ],
};
