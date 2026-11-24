// Genera las escenas ilustradas y ANIMADAS de las misiones (public/scenes/scene-<ruta>.svg).
// Uso: node scripts/scenes/build.mjs [--sheet salida.png] [--only id]
// Principios: alguien hace algo CON alguien (manos que se encuentran, miradas, objetos compartidos),
// poses inclinadas, fondo por capas, sombras de contacto y movimiento (parpadeo, saludo, vapor, nieve, hojas).
import { writeFileSync, mkdirSync } from "node:fs";
import { person as P, SKIN, HAIR, dark, light, SCENE_CSS } from "./people.mjs";
import { C, shadow, tree, pine, bush, grass, cloud, sun, snowfall, plant, cup, win, chair, table, counter, laptop, mascot, sparkle, heart } from "./kit.mjs";

import { PV } from "./pv.mjs";

const { E, E2, V, V2, SUN, PINK, SKY, INK, WOOD, CREAM, RED, GREY } = C;
const frame = (title, bg, inner) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><title>${title}</title><style>${SCENE_CSS.replace(/\n/g, "")}</style><defs><clipPath id="c"><rect width="400" height="240" rx="22"/></clipPath></defs><g clip-path="url(#c)"><rect width="400" height="240" fill="${bg}"/>${inner}</g></svg>`;
const floor = (y, c) => `<rect y="${y}" width="400" height="${240 - y}" fill="${c}"/><rect y="${y}" width="400" height="6" fill="#1a1024" opacity=".06"/>`;
const lamp = (x, len = 34, c = SUN) => `<g class="sway" style="transform-origin:${x}px 0px;transform-box:view-box"><rect x="${x - 1}" y="0" width="2" height="${len}" fill="${INK}" opacity=".55"/><path d="M${x - 17} ${len + 16}Q${x} ${len - 12} ${x + 17} ${len + 16}Z" fill="${c}"/><ellipse cx="${x}" cy="${len + 16}" rx="17" ry="4" fill="${light(c, 0.5)}"/></g>`;
const board = (x, y, w, h, rows = 4) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="9" fill="${INK}"/>` + Array.from({ length: rows }, (_, i) => `<rect x="${x + 10}" y="${y + 11 + i * ((h - 18) / rows)}" width="${w * 0.14}" height="5.5" rx="2.7" fill="${[SUN, SKY, E2, PINK][i % 4]}"/><rect x="${x + 14 + w * 0.14}" y="${y + 11 + i * ((h - 18) / rows)}" width="${w * 0.4 - i * 4}" height="5.5" rx="2.7" fill="#fff" opacity=".88"/><rect x="${x + w * 0.66}" y="${y + 11 + i * ((h - 18) / rows)}" width="${w * 0.17}" height="5.5" rx="2.7" fill="#fff" opacity=".5"/><circle class="twinkle d${i % 3 + 1}" cx="${x + w - 11}" cy="${y + 13.5 + i * ((h - 18) / rows)}" r="3.2" fill="${[E2, SUN, E2, RED][i % 4]}"/>`).join("");
const apron = (c = "#fff3e2") => `<path d="M-11 -86L-13 -44C-6 -40 6 -40 13 -44L11 -86C6 -80 -6 -80 -11 -86Z" fill="${c}"/><rect x="-6" y="-66" width="12" height="9" rx="2.5" fill="${dark(c, 0.12)}"/>`;

const SCENES = {
  cafe: () =>
    frame("Una clienta recibe su café de manos del barista mientras un gato espera su turno", "#fde6cb", [
      `<rect width="400" height="160" fill="#fde0c0"/>`,
      win(22, 34, 78, 70, `<rect x="22" y="78" width="78" height="26" fill="#bfe3d1"/><circle cx="46" cy="76" r="14" fill="${E2}"/><rect x="43" y="80" width="6" height="24" fill="#9a6a3e"/>`),
      board(128, 26, 96, 62, 3),
      lamp(262, 30) + lamp(332, 22, PINK),
      floor(186, "#e8c79d"),
      mascot("gato", "#9aa5c9", "happy", 62, 214, 72, { neck: "bowtie" }),
      table(118, 214, 54, 40),
      cup(118, 167, "#fff", true),
      // barista (detrás del mostrador) entrega el vaso
      P({ x: 320, y: 212, s: 0.78, skin: SKIN[2], hairStyle: "bun", hairColor: HAIR[0], top: E, armL: [-46, 4], armR: [14, 34], mood: "smile", look: -1, tilt: -5, lean: -4, extra: apron() }),
      `<rect x="348" y="110" width="44" height="44" rx="8" fill="#5a6072"/><rect x="354" y="116" width="32" height="13" rx="4" fill="${E2}"/><circle class="twinkle" cx="381" cy="140" r="4" fill="${SUN}"/><rect x="356" y="134" width="14" height="16" rx="3" fill="#3f4556"/>`,
      counter(244, 214, 160, 62, WOOD),
      `<rect x="258" y="170" width="72" height="34" rx="8" fill="#fff" opacity=".9"/><circle cx="276" cy="188" r="9" fill="${SUN}"/><circle cx="276" cy="188" r="3.4" fill="#fff" opacity=".9"/><circle cx="298" cy="188" r="9" fill="${PINK}"/><path d="M310 196q8 -18 16 0z" fill="#f2c9a0"/>`,
      shadow(204, 214, 24),
      P({ x: 204, y: 212, s: 0.8, skin: SKIN[0], hairStyle: "long", hairColor: HAIR[2], top: V, bottom: "#3b4560", armR: [42, 2], armL: [-10, 36], mood: "laugh", look: 1, tilt: 6, lean: 4, extra: `<path d="M-19 -74C-30 -70 -30 -48 -22 -44L-18 -70Z" fill="${SUN}"/>` }),
      cup(254, 152, "#fff", true),
      heart(232, 104, 0.9),
    ].join("")),

  aeropuerto: () =>
    frame("Un viajero entrega su pase de abordar en el mostrador de una aerolínea", "#e8e5ff", [
      `<rect width="400" height="160" fill="#e2defc"/>`,
      win(18, 30, 150, 86, `<rect x="18" y="96" width="150" height="20" fill="#bcd9ef"/><g class="drive"><path d="M40 86l40 -10 22 -24 9 2 -9 24 26 -6 7 4 -34 16 -48 8z" fill="#fff"/><path d="M40 86l40 -10 7 4 -38 14z" fill="${V2}"/><path d="M108 74l10 -14 6 1 -6 14z" fill="${V}"/></g>` + cloud(140, 50, 0.5)),
      board(206, 20, 150, 66, 4) + `<rect x="230" y="0" width="3" height="22" fill="${INK}" opacity=".6"/><rect x="330" y="0" width="3" height="22" fill="${INK}" opacity=".6"/>`,
      floor(186, "#d5d1ef"),
      `<path d="M0 204h400" stroke="#fff" stroke-width="3" stroke-dasharray="18 14" opacity=".5"/>`,
      P({ x: 322, y: 212, s: 0.78, skin: SKIN[3], hairStyle: "afro", hairColor: HAIR[0], top: V, armL: [-44, 2], armR: [10, 34], mood: "talk", look: -1, tilt: -4, extra: `<path d="M-6 -90L0 -76L6 -90Z" fill="#fff"/><rect x="-3" y="-86" width="6" height="14" rx="2" fill="${SUN}"/>` }),
      `<rect x="352" y="122" width="36" height="28" rx="5" fill="#5a6072"/><rect x="356" y="126" width="28" height="18" rx="3" fill="${SKY}"/>`,
      counter(250, 214, 154, 62, E, "#fff"),
      `<rect x="276" y="178" width="52" height="8" rx="4" fill="#fff" opacity=".85"/>`,
      shadow(150, 214, 46),
      // maleta con ruedas y etiqueta
      `<g class="bob"><rect x="96" y="150" width="44" height="58" rx="9" fill="${SUN}"/><rect x="96" y="170" width="44" height="7" fill="${dark(SUN, 0.2)}"/><rect x="96" y="186" width="44" height="7" fill="${dark(SUN, 0.2)}"/><rect x="109" y="128" width="18" height="24" rx="5" fill="none" stroke="${INK}" stroke-width="4"/><circle cx="105" cy="210" r="5" fill="${INK}"/><circle cx="131" cy="210" r="5" fill="${INK}"/><path d="M127 150l8 12h-10z" fill="${RED}"/></g>`,
      P({ x: 184, y: 212, s: 0.8, pose: "walk", skin: SKIN[2], hairStyle: "curly", hairColor: HAIR[0], top: PINK, bottom: "#4a4f9c", armR: [48, -2], armL: [-34, 24], mood: "smile", look: 1, lean: 5, tilt: 4, extra: `<rect x="60" y="-98" width="20" height="12" rx="2.500" fill="#fff" transform="rotate(-14 70 -92)"/><rect x="63" y="-95" width="9" height="3" rx="1.500" fill="${V}" transform="rotate(-14 70 -92)"/>` }),
      mascot("zorro", "#f0832f", "wow", 46, 214, 62, { head: "cap", flip: true }),
    ].join("")),

  amistades: () =>
    frame("Dos amigas se ríen sentadas en la banca de un parque con su perro", "#dff6ea", [
      `<rect width="400" height="150" fill="#d8f3f5"/>`,
      sun(338, 44, 20) + cloud(84, 42, 0.9) + cloud(236, 30, 0.6, "float d2"),
      `<path d="M0 140C70 118 150 126 230 142C300 156 350 140 400 132V240H0Z" fill="#b6ebd0"/><path d="M0 178C110 160 240 176 400 164V240H0Z" fill="${E2}"/><path d="M0 214C120 204 280 214 400 206V240H0Z" fill="#1ab58a"/>`,
      tree(56, 176, 1.05, "#17a67c") + tree(352, 184, 1.2) + bush(300, 196, 0.9) + bush(18, 204, 0.8, "#17a67c"),
      grass(96, 212) + grass(276, 216) + grass(332, 222),
      // banca: respaldo, asiento y patas
      shadow(196, 216, 92),
      `<rect x="110" y="136" width="172" height="9" rx="4.5" fill="${WOOD}"/><rect x="110" y="150" width="172" height="9" rx="4.5" fill="${WOOD}"/><rect x="118" y="134" width="7" height="50" rx="3" fill="${dark(WOOD, 0.25)}"/><rect x="267" y="134" width="7" height="50" rx="3" fill="${dark(WOOD, 0.25)}"/>`,
      P({ x: 150, y: 214, s: 0.78, pose: "sit", skin: SKIN[1], hairStyle: "long", hairColor: HAIR[1], top: V, bottom: "#4a4f9c", armL: [14, 34], armR: [38, -14], mood: "laugh", look: 1, tilt: 8, lean: 3 }),
      P({ x: 246, y: 214, s: 0.78, pose: "sit", flip: true, skin: SKIN[3], hairStyle: "afro", hairColor: HAIR[0], top: SUN, bottom: "#3b4560", armL: [12, 36], armR: [30, 24], mood: "laugh", look: 1, tilt: 6, wave: "", extra: "" }),
      `<rect x="104" y="176" width="184" height="10" rx="5" fill="${light(WOOD, 0.1)}"/><rect x="116" y="186" width="8" height="28" rx="3" fill="${dark(WOOD, 0.3)}"/><rect x="268" y="186" width="8" height="28" rx="3" fill="${dark(WOOD, 0.3)}"/>`,
      cup(198, 176, SKY, true),
      mascot("perro", "#dba05f", "cheer", 330, 220, 62, { neck: "scarf", flip: true }),
      heart(198, 96) + sparkle(120, 96, 7) + sparkle(284, 104, 6, PINK, "twinkle d2"),
    ].join("")),

  medico: () =>
    frame("Una farmacéutica explica una receta a un paciente; un panda espera sentado", "#e2f6ef", [
      `<rect width="400" height="160" fill="#def4ec"/>`,
      `<circle cx="58" cy="54" r="24" fill="#fff"/><path class="twinkle" d="M51 41h14v8h8v14h-8v8H51v-8h-8V49h8z" fill="${E}"/>`,
      `<rect x="236" y="22" width="146" height="100" rx="10" fill="#fff"/>` + [0, 1].map((r) => `<rect x="244" y="${66 + r * 44}" width="130" height="5" rx="2.5" fill="#d5e4de"/>` + [0, 1, 2, 3, 4].map((i) => `<rect x="${252 + i * 25}" y="${38 + r * 44}" width="16" height="28" rx="5" fill="${[PINK, SKY, SUN, E2, V2][(i + r * 2) % 5]}"/><rect x="${254 + i * 25}" y="${34 + r * 44}" width="12" height="6" rx="2" fill="${INK}" opacity=".55"/><rect x="${255 + i * 25}" y="${48 + r * 44}" width="10" height="8" rx="2" fill="#fff" opacity=".8"/>`).join("")).join(""),
      floor(186, "#cbe9de"),
      // sala de espera: panda con bufanda en una silla
      chair(70, 214, 1, SKY),
      mascot("panda", "#2f2a33", "think", 78, 192, 66, { neck: "scarf" }),
      P({ x: 324, y: 212, s: 0.78, skin: SKIN[0], hairStyle: "bob", hairColor: HAIR[3], top: "#fbfdff", armL: [-46, 0], armR: [8, 36], mood: "talk", look: -1, tilt: -6, glasses: true, extra: `<path d="M-6 -90L0 -74L6 -90Z" fill="${E}"/><rect x="6" y="-76" width="9" height="11" rx="2" fill="${E2}"/>` }),
      counter(244, 214, 160, 62, V, "#fff"),
      `<rect x="268" y="178" width="46" height="8" rx="4" fill="#fff" opacity=".8"/>`,
      // bolsa de farmacia que pasa de mano en mano
      `<g class="float"><path d="M244 124h22l3 26h-28z" fill="#fff"/><path d="M249 124q6 -12 12 0" fill="none" stroke="#c9d6d0" stroke-width="2.4"/><path d="M251 134h8v-4h0v4h4v0h-4v4h0v-4z" stroke="${E}" stroke-width="3.2" stroke-linecap="round"/></g>`,
      shadow(190, 214, 24),
      P({ x: 190, y: 212, s: 0.8, skin: SKIN[2], hairStyle: "short", hairColor: HAIR[0], top: SKY, bottom: "#3b4560", armR: [50, -4], armL: [-8, -30], mood: "worry", look: 1, lean: 3, tilt: 5, extra: `<rect x="-30" y="-122" width="13" height="17" rx="2.500" fill="#fff"/><path d="M-27 -117h7M-27 -113h7M-27 -109h4" stroke="${GREY}" stroke-width="1.6"/>` }),
    ].join("")),

  navidad: () =>
    frame("Una familia intercambia regalos junto al árbol de Navidad mientras un oso celebra", "#fff1e2", [
      `<rect width="400" height="165" fill="#ffe9d4"/>`,
      `<path d="M0 22Q100 52 200 22T400 22" fill="none" stroke="${E}" stroke-width="3"/>` + [26, 76, 126, 176, 226, 276, 326, 374].map((x, i) => `<circle class="twinkle d${(i % 3) + 1}" cx="${x}" cy="${i % 2 ? 31 : 36}" r="6" fill="${[PINK, SUN, SKY, E2, V2][i % 5]}"/>`).join(""),
      win(250, 50, 110, 72, `<rect x="250" y="100" width="110" height="22" fill="#fff"/>` + snowfall(10), "#bcdcf4"),
      floor(190, "#f0d3b5"),
      `<ellipse cx="200" cy="214" rx="150" ry="16" fill="${RED}" opacity=".16"/>`,
      // árbol decorado
      `<g transform="translate(70 214)">${shadow(0, 0, 40)}<rect x="-8" y="-20" width="16" height="22" rx="3" fill="#8a5a36"/><path d="M0 -168L34 -112H18L46 -66H26L58 -18H-58L-26 -66H-46L-18 -112H-34Z" fill="#1c8562"/><path d="M0 -168L34 -112H18L46 -66H26L58 -18H0Z" fill="#166e51"/><path d="M-30 -86Q0 -70 30 -90M-44 -40Q0 -22 46 -46" fill="none" stroke="${SUN}" stroke-width="3" stroke-linecap="round"/>${[[-12, -120, PINK], [14, -100, SKY], [-24, -64, SUN], [20, -60, PINK], [-34, -30, SKY], [4, -34, RED], [36, -30, SUN]].map(([x, y, c], i) => `<circle class="twinkle d${(i % 3) + 1}" cx="${x}" cy="${y}" r="5.500" fill="${c}"/>`).join("")}<path class="twinkle" d="M0 -186l5 11 12 2-9 8 2 12-10-6-10 6 2-12-9-8 12-2z" fill="${SUN}"/></g>`,
      `<rect x="96" y="188" width="30" height="26" rx="4" fill="${V}"/><rect x="108" y="188" width="6" height="26" fill="${SUN}"/><rect x="118" y="198" width="24" height="18" rx="4" fill="${E2}"/><rect x="127" y="198" width="5" height="18" fill="#fff"/>`,
      shadow(206, 216, 26) + shadow(290, 216, 26),
      P({ x: 206, y: 214, s: 0.8, skin: SKIN[1], hairStyle: "ponytail", hairColor: HAIR[1], top: RED, bottom: "#3b4560", armR: [40, 0], armL: [30, 14], mood: "laugh", look: 1, tilt: 6, lean: 4 }),
      P({ x: 292, y: 214, s: 0.8, flip: true, skin: SKIN[3], hairStyle: "short", hairColor: HAIR[0], top: E, bottom: "#4a4f9c", armR: [40, 2], armL: [30, 16], mood: "wow", look: 1, tilt: 5, lean: 3, beard: true }),
      // regalo que pasa de unas manos a otras
      `<g class="float"><rect x="232" y="132" width="34" height="28" rx="5" fill="${PINK}"/><rect x="246" y="132" width="6" height="28" fill="#fff"/><rect x="232" y="143" width="34" height="6" fill="#fff"/><path d="M249 132c-8 -12 -18 -6 -10 0zM249 132c8 -12 18 -6 10 0z" fill="#fff"/></g>`,
      mascot("oso", "#b07a52", "cheer", 356, 218, 66, { head: "santa", neck: "scarf", flip: true }),
      sparkle(250, 110, 6) + sparkle(182, 96, 5, PINK, "twinkle d2"),
    ].join("")),

  invierno: () =>
    frame("Una persona quita la nieve frente a su casa mientras un zorro abrigado hace un muñeco de nieve", "#dbeaf9", [
      `<rect width="400" height="150" fill="#cfe2f6"/>`,
      cloud(70, 36, 0.9) + cloud(330, 28, 0.7, "float d2"),
      `<path d="M0 150C70 132 130 140 210 150C290 160 350 144 400 150V240H0Z" fill="#fff"/>`,
      // casa
      `<rect x="232" y="72" width="142" height="92" rx="6" fill="#f3dcc4"/><rect x="232" y="72" width="142" height="14" fill="#1a1024" opacity=".06"/><path d="M220 80L303 26L386 80Z" fill="#8a5a44"/><path d="M220 80L303 26L386 80L374 80L303 36L232 80Z" fill="#fff"/><rect x="330" y="30" width="16" height="30" fill="#a56d52"/><rect x="326" y="26" width="24" height="8" rx="3" fill="#fff"/><g fill="#fff" opacity=".8"><circle class="steam" cx="338" cy="18" r="6"/><circle class="steam d1" cx="344" cy="8" r="5"/></g><rect x="288" y="114" width="32" height="50" rx="5" fill="${V}"/><circle cx="313" cy="140" r="2.800" fill="${SUN}"/><rect x="246" y="96" width="30" height="28" rx="5" fill="#ffe2a6"/><rect x="259.500" y="96" width="3" height="28" fill="#f3dcc4"/><rect x="334" y="96" width="30" height="28" rx="5" fill="#ffe2a6"/><rect x="347.500" y="96" width="3" height="28" fill="#f3dcc4"/>`,
      pine(40, 176, 1.05, "#1c8562", true) + pine(96, 166, 0.72, "#1c8562", true) + pine(392, 178, 0.9, "#1c8562", true),
      `<path d="M0 196C110 182 250 200 400 186V240H0Z" fill="#eef5fc"/>`,
      // muñeco de nieve y zorro
      `<g>${shadow(112, 216, 22)}<circle cx="112" cy="198" r="19" fill="#fff"/><circle cx="112" cy="170" r="13" fill="#fff"/><circle cx="108" cy="168" r="1.900" fill="${INK}"/><circle cx="116" cy="168" r="1.900" fill="${INK}"/><path d="M112 172l10 3-10 2z" fill="${SUN}"/><path d="M100 180q12 6 24 0v6q-12 6 -24 0z" fill="${RED}"/><path d="M93 192l-14 -10M131 192l14 -10" stroke="#8a5a36" stroke-width="3" stroke-linecap="round"/><circle cx="112" cy="194" r="2" fill="${INK}"/><circle cx="112" cy="203" r="2" fill="${INK}"/></g>`,
      mascot("zorro", "#f0832f", "cheer", 56, 222, 66, { head: "toque", neck: "scarf" }),
      shadow(214, 220, 30),
      `<ellipse cx="262" cy="218" rx="26" ry="9" fill="#fff"/><ellipse cx="262" cy="213" rx="16" ry="7" fill="#eef5fc"/>`,
      P({ x: 208, y: 218, s: 0.8, pose: "walk", skin: SKIN[1], hairStyle: "short", hairColor: HAIR[1], top: "#e8497f", bottom: "#3b4560", armL: [34, 30], armR: [44, 16], mood: "smile", look: 1, lean: 12, tilt: -4, back: `<path d="M22 -60L70 -4" stroke="#9a6a3e" stroke-width="5" stroke-linecap="round"/><path d="M58 -10l22 14 6 -10 -22 -14z" fill="${GREY}"/>`, extra: `<path d="M-23 -124C-25 -150 25 -150 23 -124C12 -132 -12 -132 -23 -124Z" fill="${E}"/><circle cx="0" cy="-146" r="7" fill="#fff"/><path d="M-17 -96C-6 -88 6 -88 17 -96L17 -86C6 -78 -6 -78 -17 -86Z" fill="${V}"/>` }),
      snowfall(24),
    ].join("")),

  super: () =>
    frame("Una clienta con su carrito recibe una muestra de un empleado del supermercado", "#fff4e0", [
      `<rect width="400" height="165" fill="#fff0d8"/>`,
      `<rect x="16" y="20" width="200" height="146" rx="10" fill="#fff"/>` +
        [0, 1, 2].map((r) => `<rect x="24" y="${60 + r * 44}" width="184" height="6" rx="3" fill="#e6dccb"/>` + [0, 1, 2, 3, 4, 5].map((i) => (r === 1 ? `<circle cx="${42 + i * 30}" cy="92" r="11" fill="${[RED, SUN, E2, PINK, SUN, E2][i]}"/><path d="M${42 + i * 30} 81q3 -5 6 -3" stroke="${E}" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : `<rect x="${32 + i * 30}" y="${32 + r * 44}" width="20" height="28" rx="5" fill="${[SKY, PINK, SUN, E2, V2, SKY][(i + r) % 6]}"/><rect x="${35 + i * 30}" y="${42 + r * 44}" width="14" height="8" rx="2" fill="#fff" opacity=".75"/>`)).join("")).join(""),
      `<path d="M250 28h134l-6 26H256z" fill="${E}"/>` + [0, 1, 2, 3].map((i) => `<path d="M${256 + i * 32} 54h32q-16 14 -32 0z" fill="${i % 2 ? "#fff" : PINK}"/>`).join(""),
      floor(190, "#ecd8b6"),
      P({ x: 336, y: 212, s: 0.78, skin: SKIN[3], hairStyle: "short", hairColor: HAIR[0], top: "#fff", armL: [-46, 2], armR: [10, 34], mood: "smile", look: -1, tilt: -6, extra: apron(E2) + `<path d="M-23 -124C-22 -142 22 -142 23 -124Z" fill="#fff"/><rect x="-24" y="-127" width="48" height="7" rx="3.500" fill="${E2}"/>` }),
      counter(270, 214, 134, 62, "#cfeaff", "#fff"),
      `<rect x="284" y="172" width="100" height="30" rx="6" fill="#fff" opacity=".75"/><circle cx="304" cy="188" r="10" fill="${PINK}"/><circle cx="332" cy="188" r="10" fill="${SUN}"/><rect x="348" y="178" width="30" height="18" rx="6" fill="#f2c9a0"/>`,
      `<g class="float"><circle cx="262" cy="146" r="7" fill="${SUN}"/><path d="M262 153v10" stroke="${WOOD}" stroke-width="2.600" stroke-linecap="round"/></g>`,
      shadow(170, 214, 62),
      // carrito con compras
      `<g class="drive"><path d="M178 150h64l-8 36h-48z" fill="#fff" opacity=".5"/><path d="M178 150h64l-8 36h-48z" fill="none" stroke="${GREY}" stroke-width="5" stroke-linejoin="round"/><path d="M188 162h46M186 174h46M200 150l4 36M220 150l-2 36" stroke="${GREY}" stroke-width="2.600"/><circle cx="192" cy="206" r="7" fill="${INK}"/><circle cx="230" cy="206" r="7" fill="${INK}"/><path d="M188 186l-2 14M234 186l-2 14" stroke="${GREY}" stroke-width="4"/><rect x="190" y="126" width="16" height="26" rx="4" fill="${SUN}"/><circle cx="224" cy="142" r="11" fill="${E2}"/><rect x="206" y="120" width="12" height="32" rx="4" fill="${SKY}"/><path d="M178 150l-12 -16h-10" fill="none" stroke="${GREY}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></g>`,
      P({ x: 124, y: 212, s: 0.8, pose: "walk", skin: SKIN[0], hairStyle: "bun", hairColor: HAIR[5], top: V, bottom: "#3b4560", armR: [26, 22], armL: [44, 18], mood: "wow", look: 1, lean: 6, tilt: 4 }),
      mascot("buho", "#8d7b6a", "happy", 44, 214, 56, { face: "glasses" }),
    ].join("")),

  vivienda: () =>
    frame("Dos personas cargan una caja de mudanza hacia su departamento nuevo y un vecino panda los saluda", "#fdebd9", [
      `<rect width="400" height="168" fill="#fbe3ca"/>`,
      win(22, 36, 92, 76, sun(92, 60, 12) + `<rect x="22" y="92" width="92" height="20" fill="#bfe3d1"/>`),
      `<rect x="268" y="30" width="108" height="158" rx="8" fill="#8a5a44"/><rect x="276" y="38" width="92" height="150" rx="4" fill="#3a2f4a"/>`,
      mascot("panda", "#2f2a33", "cheer", 322, 190, 76, { head: "flower" }),
      `<path d="M276 38l-34 12v150l34 -12z" fill="${V}"/><path d="M276 38l-34 12v150l34 -12z" fill="#1a1024" opacity=".12"/><circle cx="250" cy="126" r="4.500" fill="${SUN}"/>`,
      floor(190, "#e9cfae"),
      `<rect x="258" y="188" width="128" height="8" rx="4" fill="${E}"/>`,
      plant(392, 214, 1),
      shadow(52, 216, 34),
      `<rect x="20" y="166" width="62" height="48" rx="6" fill="${WOOD}"/><rect x="20" y="166" width="62" height="10" fill="${dark(WOOD, 0.14)}"/><rect x="46" y="166" width="10" height="48" fill="#f1d9a8" opacity=".8"/><rect x="30" y="128" width="46" height="40" rx="6" fill="${light(WOOD, 0.14)}"/><rect x="30" y="128" width="46" height="9" fill="${WOOD}"/><rect x="40" y="144" width="18" height="8" rx="3" fill="#fff" opacity=".8"/>`,
      shadow(124, 216, 24) + shadow(214, 216, 24),
      P({ x: 124, y: 214, s: 0.8, pose: "walk", skin: SKIN[3], hairStyle: "curly", hairColor: HAIR[0], top: E2, bottom: "#3b4560", armR: [40, 20], armL: [30, 34], mood: "laugh", look: 1, lean: -4, tilt: 5 }),
      P({ x: 216, y: 214, s: 0.8, pose: "walk", flip: true, skin: SKIN[0], hairStyle: "ponytail", hairColor: HAIR[3], top: PINK, bottom: "#4a4f9c", armR: [40, 20], armL: [30, 34], mood: "smile", look: 1, lean: -4, tilt: 4 }),
      // la caja que cargan entre los dos
      `<g class="bob"><rect x="140" y="124" width="60" height="44" rx="6" fill="${light(WOOD, 0.06)}"/><rect x="140" y="124" width="60" height="10" fill="${dark(WOOD, 0.14)}"/><rect x="165" y="124" width="10" height="44" fill="#f1d9a8" opacity=".85"/><path d="M150 146l6 -8 6 8M153 146v8h6v-8" fill="none" stroke="${dark(WOOD, 0.3)}" stroke-width="2.400" stroke-linejoin="round"/></g>`,
      `<g class="twinkle"><circle cx="232" cy="96" r="6" fill="none" stroke="${SUN}" stroke-width="3"/><path d="M232 102v14M232 110h5M232 115h4" stroke="${SUN}" stroke-width="3" stroke-linecap="round"/></g>`,
    ].join("")),

  transporte: () =>
    frame("Una pasajera valida su tarjeta para subir al tren ligero; un búho con audífonos espera en la parada", "#e0f0fb", [
      `<rect width="400" height="160" fill="#d2e8f8"/>`,
      cloud(60, 34, 0.8) + cloud(250, 22, 0.6, "float d2"),
      `<rect x="0" y="92" width="52" height="80" fill="#bdd5ec"/><rect x="60" y="64" width="46" height="108" fill="#aecbe6"/>` + [0, 1, 2, 3].map((i) => `<rect x="${68 + (i % 2) * 18}" y="${76 + Math.floor(i / 2) * 26}" width="10" height="14" rx="2" fill="#fff" opacity=".6"/>`).join("") + `<rect x="330" y="80" width="70" height="92" fill="#bdd5ec"/>`,
      tree(26, 176, 0.7),
      floor(176, "#c9ced8") + `<rect y="204" width="400" height="36" fill="#7f8798"/><path d="M0 222h400" stroke="#fff" stroke-width="4" stroke-dasharray="26 20" opacity=".7"/>`,
      // tren ligero
      `<g class="drive"><rect x="170" y="60" width="250" height="128" rx="24" fill="${E}"/><path d="M170 150h250v14a24 24 0 0 1 -24 24H194a24 24 0 0 1 -24 -24z" fill="${dark(E, 0.2)}"/><rect x="188" y="82" width="58" height="52" rx="10" fill="#cfeaff"/><rect x="256" y="82" width="58" height="52" rx="10" fill="#cfeaff"/><path d="M196 82l-10 52h14l10 -52z" fill="#fff" opacity=".35"/><rect x="328" y="76" width="72" height="108" rx="8" fill="#e8f6ff"/><rect x="362" y="76" width="4" height="108" fill="${E}"/><rect x="170" y="140" width="150" height="6" fill="#fff" opacity=".9"/><circle class="twinkle" cx="184" cy="164" r="6" fill="${SUN}"/><circle cx="216" cy="190" r="13" fill="${INK}"/><circle cx="216" cy="190" r="5" fill="#c9ced8"/><circle cx="300" cy="190" r="13" fill="${INK}"/><circle cx="300" cy="190" r="5" fill="#c9ced8"/><circle cx="285" cy="104" r="11" fill="${SKIN[2]}"/><path d="M274 102a11 11 0 0 1 22 0q-11 -7 -22 0z" fill="${HAIR[0]}"/></g>`,
      // poste lector
      `<rect x="140" y="112" width="8" height="78" rx="3" fill="#5a6072"/><rect x="128" y="96" width="32" height="32" rx="8" fill="${V}"/><circle cx="144" cy="112" r="8" fill="${E2}"/><g fill="none" stroke="${E2}" stroke-width="2.800" stroke-linecap="round"><path class="twinkle" d="M137 84q7 -7 14 0"/><path class="twinkle d1" d="M132 77q12 -12 24 0"/></g>`,
      mascot("buho", "#8d7b6a", "happy", 44, 202, 62, { head: "headphones" }),
      shadow(98, 202, 24),
      P({ x: 98, y: 200, s: 0.8, skin: SKIN[1], hairStyle: "bob", hairColor: HAIR[0], top: SUN, bottom: "#3b4560", armR: [30, -14], armL: [-18, 30], mood: "smile", look: 1, lean: 4, tilt: 5, wave: "R", extra: `<rect x="40" y="-108" width="16" height="11" rx="2.500" fill="#fff"/><rect x="42" y="-105" width="12" height="3" rx="1.500" fill="${V}"/>`, back: `<path d="M-18 -84C-34 -82 -34 -50 -22 -46L-16 -80Z" fill="${V}"/>` }),
    ].join("")),

  entrevistas: () =>
    frame("Una candidata y un entrevistador conversan sentados frente a frente en una oficina", "#eae6ff", [
      `<rect width="400" height="170" fill="#e3defb"/>`,
      win(236, 26, 140, 92, `<rect x="252" y="76" width="18" height="42" fill="#a9c5e0"/><rect x="278" y="56" width="22" height="62" fill="#9bbbd9"/><rect x="308" y="84" width="16" height="34" fill="#b5cfe8"/><rect x="334" y="64" width="24" height="54" fill="#a9c5e0"/>` + cloud(300, 44, 0.45)),
      `<rect x="30" y="34" width="76" height="56" rx="8" fill="#fff"/><path d="M40 80l16 -18 13 11 14 -22 13 29z" fill="${E2}"/><circle cx="54" cy="52" r="6" fill="${SUN}"/><rect x="128" y="40" width="46" height="34" rx="6" fill="#fff"/><path class="twinkle" d="M140 64l8 -10 6 6 8 -12" fill="none" stroke="${V}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
      floor(190, "#d2cbef"),
      plant(24, 214, 1.05),
      chair(110, 214, 1, E) + chair(292, 214, -1, V),
      P({ x: 116, y: 214, s: 0.78, pose: "sit", skin: SKIN[2], hairStyle: "curly", hairColor: HAIR[0], top: PINK, bottom: "#3b4560", armL: [26, 30], armR: [44, -2], mood: "talk", look: 1, tilt: 6, lean: 3, wave: "R" }),
      P({ x: 286, y: 214, s: 0.78, pose: "sit", flip: true, skin: SKIN[0], hairStyle: "bald", hairColor: HAIR[1], top: "#333c52", bottom: "#4a4f66", armL: [24, 30], armR: [36, 26], mood: "smile", look: 1, tilt: 5, glasses: true, beard: true, extra: `<path d="M-6 -90L0 -74L6 -90Z" fill="#fff"/>` }),
      table(201, 214, 96, 46),
      laptop(214, 161, -1) + cup(176, 161, V2, true) + `<rect x="188" y="155" width="20" height="6" rx="2" fill="#fff" transform="rotate(-8 198 158)"/>`,
      mascot("gato", "#9aa5c9", "think", 366, 216, 50, { neck: "bowtie", flip: true }),
    ].join("")),

  reuniones: () =>
    frame("Una persona presenta resultados en una pantalla ante su equipo, que incluye a un zorro con lentes", "#e2f6ee", [
      `<rect width="400" height="170" fill="#dbf3e8"/>`,
      `<rect x="150" y="18" width="186" height="110" rx="10" fill="${INK}"/><rect x="158" y="26" width="170" height="94" rx="5" fill="#fff"/>` +
        [0, 1, 2, 3, 4].map((i) => `<rect class="twinkle d${(i % 3) + 1}" x="${172 + i * 22}" y="${96 - [22, 34, 28, 48, 60][i]}" width="14" height="${[22, 34, 28, 48, 60][i]}" rx="4" fill="${[V2, SKY, E2, SUN, E][i]}"/>`).join("") +
        `<path d="M172 70l22 -10 22 6 22 -20 22 -12" fill="none" stroke="${RED}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><rect x="292" y="40" width="26" height="6" rx="3" fill="${INK}" opacity=".6"/><rect x="292" y="52" width="18" height="5" rx="2.5" fill="${GREY}"/><rect x="238" y="128" width="10" height="16" fill="#5a6072"/>`,
      floor(190, "#c4e8d7"),
      shadow(98, 216, 24),
      P({ x: 98, y: 214, s: 0.82, skin: SKIN[1], hairStyle: "hijab", hairColor: "#7a5cd6", top: SUN, bottom: "#3b4560", armR: [46, -40], armL: [-14, 34], mood: "talk", look: 1, lean: -3, tilt: -5, wave: "R", back: `<path d="M56 -128L96 -152" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>` }),
      chair(262, 214, -1, E) + chair(352, 214, -1, V),
      P({ x: 258, y: 214, s: 0.76, pose: "sit", flip: true, skin: SKIN[3], hairStyle: "short", hairColor: HAIR[0], top: SKY, bottom: "#3b4560", armL: [30, 22], armR: [34, -6], mood: "think", look: 1, tilt: 6 }),
      mascot("zorro", "#f0832f", "wow", 344, 192, 64, { face: "glasses", flip: true }),
      table(292, 214, 150, 42),
      laptop(250, 165, -1, V2) + cup(318, 165, SUN, true) + `<rect x="340" y="158" width="26" height="7" rx="2" fill="#fff"/>`,
    ].join("")),

  "series-noticias": () =>
    frame("Dos amigos ven las noticias en el sofá con palomitas; un gato duerme a su lado", "#e6e1fb", [
      `<rect width="400" height="172" fill="#ddd6f7"/>`,
      `<ellipse cx="300" cy="100" rx="130" ry="80" fill="#fff" opacity=".22"/>`,
      win(24, 30, 70, 64, `<circle cx="74" cy="50" r="9" fill="#fff"/>` + sparkle(40, 48, 4, "#fff") + sparkle(56, 72, 3, "#fff", "twinkle d2"), "#3a3566"),
      // tele sobre mueble
      `<rect x="250" y="40" width="136" height="92" rx="10" fill="${INK}"/><rect x="257" y="47" width="122" height="78" rx="5" fill="#cfeaff"/><rect x="257" y="103" width="122" height="22" fill="${V}"/><rect x="264" y="109" width="62" height="5.500" rx="2.700" fill="#fff"/><rect x="264" y="117" width="38" height="4" rx="2" fill="#fff" opacity=".6"/><circle class="twinkle" cx="364" cy="60" r="5" fill="${RED}"/><g class="nod"><circle cx="304" cy="76" r="12" fill="${SKIN[2]}"/><path d="M292 74a12 12 0 0 1 24 0q-12 -8 -24 0z" fill="${HAIR[0]}"/><circle cx="300" cy="77" r="1.600" fill="${INK}"/><circle cx="308" cy="77" r="1.600" fill="${INK}"/><path d="M300 82q4 3 8 0" fill="none" stroke="${INK}" stroke-width="1.600" stroke-linecap="round"/></g><path d="M284 103q20 -22 40 0z" fill="${RED}"/><rect x="306" y="132" width="24" height="12" fill="#5a6072"/><rect x="240" y="142" width="156" height="12" rx="5" fill="${WOOD}"/><rect x="250" y="154" width="136" height="38" rx="4" fill="${dark(WOOD, 0.14)}"/>`,
      floor(192, "#cdc4ef"),
      `<ellipse cx="150" cy="218" rx="150" ry="14" fill="${V}" opacity=".14"/>`,
      plant(232, 214, 0.9),
      // sofá de perfil 3/4: respaldo, asiento y brazo
      shadow(118, 218, 110),
      `<path d="M16 214V140C16 126 28 118 42 118H56V214Z" fill="${dark(E, 0.14)}"/><rect x="34" y="124" width="170" height="60" rx="18" fill="${E}"/>`,
      P({ x: 84, y: 212, s: 0.76, pose: "sit", skin: SKIN[0], hairStyle: "bun", hairColor: HAIR[5], top: PINK, bottom: "#4a4f9c", armL: [22, 30], armR: [38, 4], mood: "wow", look: 1, tilt: 5 }),
      P({ x: 146, y: 212, s: 0.76, pose: "sit", skin: SKIN[2], hairStyle: "curly", hairColor: HAIR[3], top: SUN, bottom: "#3b4560", armL: [22, 16], armR: [32, 24], mood: "laugh", look: 1, tilt: -6 }),
      `<rect x="28" y="176" width="190" height="24" rx="12" fill="${light(E, 0.1)}"/><rect x="36" y="198" width="10" height="16" rx="3" fill="${dark(E, 0.3)}"/><rect x="196" y="198" width="10" height="16" rx="3" fill="${dark(E, 0.3)}"/>`,
      `<g class="bob"><path d="M118 146h24l-4 28h-16z" fill="#fff"/><path d="M123 146l2 28M130 146v28M137 146l-2 28" stroke="${RED}" stroke-width="3"/>${[[121, 143], [128, 139], [135, 142], [140, 145], [130, 133]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5.500" fill="#fff3c9"/>`).join("")}</g>`,
      mascot("gato", "#9aa5c9", "sleep", 196, 182, 44, { still: true }),
    ].join("")),

  sistemas: () =>
    frame("Una desarrolladora trabaja en su laptop mientras su colega señala un flujo de automatización", "#e9e6ff", [
      `<rect width="400" height="172" fill="#e1dcfb"/>`,
      `<rect x="120" y="20" width="228" height="124" rx="12" fill="#fff"/>` +
        `<path d="M196 56h28M270 56h18v30M196 110h28M288 96v-4" fill="none" stroke="#c9ced8" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/><path d="M218 51l8 5-8 5zM218 105l8 5-8 5z" fill="#c9ced8"/>` +
        [[146, 42, E2], [228, 42, V2], [262, 78, SUN], [146, 96, PINK], [228, 96, SKY]].map(([x, y, c], i) => `<g class="twinkle d${(i % 3) + 1}"><rect x="${x}" y="${y}" width="48" height="28" rx="8" fill="${c}"/><rect x="${x + 8}" y="${y + 8}" width="24" height="4.500" rx="2.200" fill="#fff" opacity=".9"/><rect x="${x + 8}" y="${y + 16}" width="15" height="4" rx="2" fill="#fff" opacity=".65"/></g>`).join("") +
        `<circle cx="324" cy="110" r="12" fill="${E}"/><path d="M318 110l4 4 8 -9" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
      floor(192, "#d2cbef"),
      plant(382, 214, 1),
      shadow(66, 216, 24),
      P({ x: 66, y: 214, s: 0.82, skin: SKIN[2], hairStyle: "short", hairColor: HAIR[0], top: E, bottom: "#3b4560", armR: [50, -34], armL: [-10, 36], mood: "talk", look: 1, lean: -3, tilt: -5, wave: "R", beard: true }),
      chair(232, 214, 1, V),
      P({ x: 238, y: 214, s: 0.78, pose: "sit", skin: SKIN[0], hairStyle: "long", hairColor: HAIR[6], top: SUN, bottom: "#3b4560", armL: [30, 26], armR: [44, 22], mood: "smile", look: 1, tilt: 4, glasses: true }),
      table(310, 214, 110, 46),
      laptop(296, 161, 1, SKY) + cup(346, 161, PINK, true),
      mascot("buho", "#8d7b6a", "happy", 356, 161, 34, { face: "glasses", still: true }),
    ].join("")),

  biologia: () =>
    frame("Dos biólogas toman muestras de agua junto a un río; un oso curioso asoma tras un árbol", "#dff6ea", [
      `<rect width="400" height="130" fill="#d6f2f5"/>`,
      sun(346, 40, 18) + cloud(110, 34, 0.9) + cloud(250, 52, 0.55, "float d2"),
      `<path d="M0 118C70 96 150 102 230 120C290 134 350 122 400 112V240H0Z" fill="#b6ebd0"/>`,
      pine(128, 138, 0.8) + tree(360, 150, 0.95) + pine(300, 130, 0.6),
      tree(30, 172, 1.2, "#17a67c", "sway"),
      mascot("oso", "#b07a52", "wow", 316, 178, 56, { flip: true }),
      // río con brillos
      `<path d="M170 240C186 204 262 198 282 168C296 146 340 138 400 142V240Z" fill="${SKY}"/><path d="M182 240C198 210 268 204 288 176C302 156 344 148 400 152V160C346 156 306 164 294 184C276 212 206 216 192 240Z" fill="#fff" opacity=".3"/><g fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".85"><path class="drive" d="M214 226q14 -8 28 0"/><path class="drive d1" d="M272 200q12 -7 24 0"/><path class="drive d2" d="M330 166q12 -7 24 0"/></g>`,
      `<path d="M0 174C60 160 120 172 168 204L150 240H0Z" fill="${E2}"/>`,
      grass(60, 214) + grass(132, 220) + bush(20, 222, 0.8, "#17a67c"),
      `<circle cx="252" cy="214" r="9" fill="${GREY}"/><circle cx="262" cy="218" r="6" fill="${dark(GREY, 0.12)}"/>`,
      shadow(96, 220, 24) + shadow(160, 224, 22),
      P({ x: 94, y: 218, s: 0.8, skin: SKIN[0], hairStyle: "ponytail", hairColor: HAIR[2], top: SUN, bottom: "#4a6b55", armL: [4, 26], armR: [-2, 22], mood: "smile", look: 1, tilt: -5, lean: -2, extra: `<g transform="translate(0 34)"><rect x="-15" y="-112" width="30" height="38" rx="4" fill="#fff"/><rect x="-7" y="-116" width="14" height="7" rx="3" fill="${GREY}"/><path d="M-9 -100h18M-9 -92h18M-9 -84h12" stroke="${GREY}" stroke-width="2.400" stroke-linecap="round"/></g>` }),
      P({ x: 160, y: 222, s: 0.8, pose: "walk", skin: SKIN[2], hairStyle: "bun", hairColor: HAIR[0], top: "#fbfdff", bottom: "#4a6b55", shoes: "#3f7f66", armR: [50, 30], armL: [-14, 30], mood: "think", look: 1, lean: 16, tilt: -6, extra: `<g class="float"><rect x="60" y="-64" width="11" height="26" rx="4.500" fill="#fff" opacity=".92"/><rect x="60" y="-50" width="11" height="12" rx="4.500" fill="${SKY}"/><rect x="58" y="-67" width="15" height="5" rx="2" fill="${V}"/></g>` }),
      sparkle(238, 178, 5, "#fff") + sparkle(310, 186, 4, "#fff", "twinkle d2"),
    ].join("")),
};

for (const [id, f] of Object.entries(PV)) SCENES[id] = () => frame(...f());

mkdirSync("public/scenes", { recursive: true });
const only = process.argv.includes("--only") ? process.argv[process.argv.indexOf("--only") + 1] : null;
const ids = Object.keys(SCENES).filter((i) => !only || i === only || (only === "pv" && i.startsWith("pv-")));
for (const id of ids) writeFileSync(`public/scenes/scene-${id}.svg`, SCENES[id]());
console.log("escenas generadas:", ids.length);

const i = process.argv.indexOf("--sheet");
if (i > 0) {
  const sharp = (await import("sharp")).default;
  const comp = [];
  const W = ids.length > 16 ? 4 : ids.length > 4 ? 3 : 2;
  for (let k = 0; k < ids.length; k++) comp.push({ input: await sharp(Buffer.from(SCENES[ids[k]]())).resize(600).png().toBuffer(), left: (k % W) * 610 + 10, top: Math.floor(k / W) * 370 + 10 });
  await sharp({ create: { width: W * 610 + 10, height: Math.ceil(ids.length / W) * 370 + 10, channels: 4, background: "#ffffff" } }).composite(comp).png().toFile(process.argv[i + 1]);
  console.log("hoja:", process.argv[i + 1]);
}
