// Dibujo de las mascotas de Fluye (v3). Vector original, estilo plano y expresivo, sin contornos:
// la forma se lee por silueta y por tonos (base, sombra, luz). Devuelve el contenido de un <svg viewBox="0 0 200 200">.
// Módulo sin dependencias para poder renderizarlo también fuera de React (hojas de revisión).

export type MSpecies = "zorro" | "gato" | "perro" | "oso" | "panda" | "buho";
export type MMood = "happy" | "cheer" | "think" | "oops" | "wow" | "sleep";
export type MLook = { species: MSpecies; mood: MMood; color: string; head?: string; face?: string; neck?: string; outfit?: string };

const INK = "#2b2238";
const CREAM = "#fff3e2";
const BLUSH = "#ff8fa8";
const EMERALD = "#0a8f65";
const VIOLET = "#6a55e0";

/** Mezcla dos colores hex (t = cuánto del segundo). */
export function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
const dark = (c: string, t = 0.22) => mix(c, "#1a1024", t);
const light = (c: string, t = 0.3) => mix(c, "#ffffff", t);
/** Dibuja una pieza y su espejo (el personaje es simétrico). */
const both = (s: string) => `${s}<g transform="matrix(-1 0 0 1 200 0)">${s}</g>`;

const HEAD = "M100 24C148 24 172 50 172 86C172 120 146 140 100 140C54 140 28 120 28 86C28 50 52 24 100 24Z";
const BODY = "M62 178C52 152 60 122 100 122C140 122 148 152 138 178C126 186 74 186 62 178Z";

function palette(l: MLook) {
  const c = l.color;
  switch (l.species) {
    case "panda":
      return { fur: "#fdf9f3", shade: "#e9e1d6", limb: c, ear: c, belly: "#fdf9f3", muzzle: "#fdf9f3", inner: light(c, 0.25) };
    case "buho":
      return { fur: c, shade: dark(c), limb: dark(c, 0.18), ear: dark(c, 0.2), belly: light(c, 0.55), muzzle: light(c, 0.62), inner: light(c, 0.5) };
    case "zorro":
      return { fur: c, shade: dark(c), limb: mix(c, "#3a1d14", 0.72), ear: c, belly: CREAM, muzzle: CREAM, inner: mix(c, "#3a1d14", 0.72) };
    case "perro":
      return { fur: c, shade: dark(c), limb: c, ear: mix(c, "#4a2814", 0.5), belly: CREAM, muzzle: CREAM, inner: light(c, 0.4) };
    case "gato":
      return { fur: c, shade: dark(c), limb: c, ear: c, belly: light(c, 0.72), muzzle: "#ffffff", inner: "#ffb8c9" };
    default:
      return { fur: c, shade: dark(c), limb: c, ear: c, belly: light(c, 0.45), muzzle: light(c, 0.5), inner: light(c, 0.42) };
  }
}

function ears(l: MLook, p: ReturnType<typeof palette>) {
  switch (l.species) {
    case "zorro":
      return both(`<path d="M36 74C24 44 30 14 44 6C62 14 82 34 90 54Z" fill="${p.ear}"/><path d="M44 62C38 42 40 26 47 19C58 27 70 40 76 52Z" fill="${p.inner}"/>`);
    case "gato":
      return both(`<path d="M36 72C28 46 33 20 44 11C60 20 76 37 84 54Z" fill="${p.ear}"/><path d="M44 60C40 44 42 31 47 25C56 32 66 43 71 53Z" fill="${p.inner}"/>`);
    case "oso":
      return both(`<circle cx="46" cy="40" r="21" fill="${p.ear}"/><circle cx="46" cy="41" r="11" fill="${p.inner}"/>`);
    case "panda":
      return both(`<circle cx="45" cy="38" r="21" fill="${p.ear}"/>`);
    case "buho":
      return both(`<path d="M34 58C26 38 30 20 38 10C50 20 64 32 72 44Z" fill="${p.ear}"/>`);
    default:
      return "";
  }
}

function tail(l: MLook, p: ReturnType<typeof palette>) {
  switch (l.species) {
    case "zorro":
      return `<g class="mascot-tail" style="transform-origin:132px 170px"><path d="M128 176C164 184 190 160 180 124C177 113 164 112 163 124C162 144 148 154 128 156Z" fill="${p.fur}"/><path d="M180 124C177 113 164 112 163 124C163 133 168 139 175 139C180 137 182 131 180 124Z" fill="${CREAM}"/></g>`;
    case "gato":
      return `<g class="mascot-tail" style="transform-origin:136px 172px"><path d="M134 172C170 176 182 150 168 130" fill="none" stroke="${p.fur}" stroke-width="14" stroke-linecap="round"/><path d="M172 139C171 135 170 133 168 130" fill="none" stroke="${dark(p.fur, 0.3)}" stroke-width="14" stroke-linecap="round"/></g>`;
    case "perro":
      return `<g class="mascot-tail" style="transform-origin:136px 168px"><path d="M134 168C156 166 166 150 160 136" fill="none" stroke="${p.fur}" stroke-width="13" stroke-linecap="round"/></g>`;
    case "oso":
    case "panda":
      return `<circle cx="140" cy="166" r="9" fill="${l.species === "panda" ? p.limb : p.shade}"/>`;
    default:
      return "";
  }
}

function face(l: MLook, p: ReturnType<typeof palette>) {
  switch (l.species) {
    case "zorro":
      return `<path d="M28 92C46 96 64 106 80 120C88 128 95 132 100 132C105 132 112 128 120 120C136 106 154 96 172 92C170 122 144 140 100 140C56 140 30 122 28 92Z" fill="${p.muzzle}"/>`;
    case "gato":
      return `<ellipse cx="88" cy="111" rx="16" ry="12" fill="${p.muzzle}"/><ellipse cx="112" cy="111" rx="16" ry="12" fill="${p.muzzle}"/>` + `<g stroke="${dark(p.fur, 0.3)}" stroke-width="6" stroke-linecap="round"><path d="M100 30v13"/><path d="M84 33l3 12"/><path d="M116 33l-3 12"/></g>` + both(`<g stroke="#ffffff" stroke-opacity=".9" stroke-width="2.4" stroke-linecap="round"><path d="M40 106l-18 -4"/><path d="M40 113l-18 4"/></g>`);
    case "perro":
      return `<ellipse cx="72" cy="82" rx="27" ry="30" transform="rotate(-8 72 82)" fill="${p.ear}" opacity=".55"/><ellipse cx="100" cy="112" rx="31" ry="23" fill="${p.muzzle}"/>`;
    case "oso":
      return `<ellipse cx="100" cy="112" rx="27" ry="20" fill="${p.muzzle}"/>`;
    case "panda":
      return both(`<ellipse cx="72" cy="86" rx="22" ry="27" transform="rotate(20 72 86)" fill="${p.limb}"/>`);
    case "buho":
      return `<circle cx="72" cy="86" r="33" fill="${p.muzzle}"/><circle cx="128" cy="86" r="33" fill="${p.muzzle}"/>`;
  }
}

function eyes(l: MLook) {
  const m = l.mood;
  const owl = l.species === "buho";
  const rx = owl ? 20 : 17;
  const ry = owl ? 22 : 20;
  const cy = 84;
  // Sobre las manchas oscuras del panda, los ojos cerrados y las cejas van en claro para que se lean.
  const line = l.species === "panda" ? "#fdf9f3" : INK;
  if (m === "cheer") return both(`<path d="M58 88Q74 68 90 88" fill="none" stroke="${line}" stroke-width="7" stroke-linecap="round"/>`);
  if (m === "sleep") return both(`<path d="M59 84Q74 97 89 84" fill="none" stroke="${line}" stroke-width="6.5" stroke-linecap="round"/>`);
  // desplazamiento de la pupila según la emoción
  const [dx, dy, pr] = m === "think" ? [5, -7, 0.9] : m === "oops" ? [0, 5, 0.95] : m === "wow" ? [0, 0, 0.72] : [2, 1, 1];
  const s = m === "wow" ? 1.12 : 1;
  const eye = (cx: number, sx: number) =>
    `<ellipse cx="${cx}" cy="${cy}" rx="${rx * s}" ry="${ry * s}" fill="#fff"/>` +
    `<g class="mascot-blink"><ellipse cx="${cx + dx * sx}" cy="${cy + dy}" rx="${11 * pr}" ry="${13 * pr}" fill="${INK}"/>` +
    `<circle cx="${cx + dx * sx - 4}" cy="${cy + dy - 5}" r="${4.2 * pr}" fill="#fff"/><circle cx="${cx + dx * sx + 4}" cy="${cy + dy + 5}" r="${1.9 * pr}" fill="#fff" opacity=".9"/></g>`;
  let out = eye(74, 1) + eye(126, m === "think" ? 1 : -1);
  if (m === "oops") out += `<path d="M58 60Q70 54 84 60" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".75" transform="rotate(-12 71 58)"/><path d="M116 60Q130 54 142 60" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".75" transform="rotate(12 129 58)"/>`;
  if (m === "think") out += `<path d="M112 56Q126 48 140 56" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity=".75"/>`;
  return out;
}

function mouth(l: MLook) {
  const m = l.mood;
  if (l.species === "buho") {
    const open = m === "cheer" || m === "wow";
    return `<path d="M100 98C108 98 112 104 110 110C108 116 103 120 100 121C97 120 92 116 90 110C88 104 92 98 100 98Z" fill="#ffab2e"/><path d="M91 108C96 111 104 111 109 108C108 114 103 119 100 121C97 119 92 114 91 108Z" fill="#e88a12"/>${open ? `<path d="M94 112Q100 117 106 112" fill="none" stroke="#b96607" stroke-width="2.4" stroke-linecap="round"/>` : ""}`;
  }
  const big = l.species === "perro";
  const nose = big ? `<ellipse cx="100" cy="100" rx="10" ry="7.5" fill="${INK}"/><ellipse cx="97" cy="98" rx="3.4" ry="2" fill="#fff" opacity=".45"/>` : `<path d="M93 99Q100 94 107 99Q105 106 100 107Q95 106 93 99Z" fill="${l.species === "gato" ? "#ff8fa8" : INK}"/>`;
  const y = big ? 112 : 111;
  let lips: string;
  if (m === "cheer") lips = `<path d="M86 ${y}Q100 ${y - 3} 114 ${y}Q112 ${y + 18} 100 ${y + 18}Q88 ${y + 18} 86 ${y}Z" fill="${INK}"/><path d="M92 ${y + 12}Q100 ${y + 7} 108 ${y + 12}Q104 ${y + 18} 100 ${y + 18}Q96 ${y + 18} 92 ${y + 12}Z" fill="#ff7d96"/>`;
  else if (m === "wow") lips = `<ellipse cx="100" cy="${y + 6}" rx="6.5" ry="8" fill="${INK}"/>`;
  else if (m === "oops") lips = `<path d="M89 ${y + 5}Q94 ${y} 100 ${y + 4}Q106 ${y + 8} 111 ${y + 3}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  else if (m === "sleep") lips = `<path d="M94 ${y + 3}Q100 ${y + 7} 106 ${y + 3}" fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>`;
  else if (m === "think") lips = `<path d="M94 ${y + 4}Q102 ${y + 7} 110 ${y + 1}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  else lips = `<path d="M100 ${y - 4}V${y + 1}M86 ${y}Q93 ${y + 9} 100 ${y + 1}Q107 ${y + 9} 114 ${y}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${big ? `<path d="M95 ${y + 5}Q100 ${y + 3} 105 ${y + 5}Q105 ${y + 15} 100 ${y + 15}Q95 ${y + 15} 95 ${y + 5}Z" fill="#ff7d96"/>` : ""}`;
  return nose + lips;
}

function arms(l: MLook, p: ReturnType<typeof palette>) {
  const c = p.limb;
  const sh = dark(c, 0.14);
  const down = (flip = false) => `<g${flip ? ' transform="matrix(-1 0 0 1 200 0)"' : ""}><ellipse cx="60" cy="152" rx="11.5" ry="20" transform="rotate(14 60 152)" fill="${c}"/><ellipse cx="57" cy="166" rx="8" ry="5" transform="rotate(14 57 166)" fill="${sh}" opacity=".5"/></g>`;
  // El espejo va en un grupo exterior: la animación CSS vive en el interior y no lo pisa.
  const up = (flip = false, cls = "") => `<g${flip ? ' transform="matrix(-1 0 0 1 200 0)"' : ""}><g class="${cls}" style="transform-origin:58px 134px"><ellipse cx="42" cy="120" rx="11.5" ry="22" transform="rotate(-34 42 120)" fill="${c}"/></g></g>`;
  if (l.mood === "cheer") return { back: "", front: up(false, "mascot-wave-l") + up(true, "mascot-wave-l") };
  if (l.mood === "oops") return { back: down(false), front: up(true) };
  if (l.mood === "think") return { back: down(false), front: `<ellipse cx="124" cy="136" rx="11" ry="19" transform="rotate(52 124 136)" fill="${c}"/>` };
  return { back: down(false) + down(true), front: "" };
}

function outfitSvg(id?: string) {
  if (id === "hoodie") return `<path d="${BODY}" fill="${VIOLET}"/><path d="M78 124C84 134 92 138 100 138C108 138 116 134 122 124" fill="none" stroke="${dark(VIOLET, 0.25)}" stroke-width="7" stroke-linecap="round"/><path d="M82 160h36v12c-10 4-26 4-36 0z" fill="${dark(VIOLET, 0.2)}"/><path d="M93 136v14M107 136v14" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`;
  if (id === "sweater") return `<path d="${BODY}" fill="#d43a4c"/><path d="M62 148h76" stroke="#fff" stroke-width="7"/><path d="M66 148l5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 5 5 5-5 4 4" fill="none" stroke="#1d8a55" stroke-width="2.8"/><path d="M100 158l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="#ffd34d"/>`;
  if (id === "labcoat") return `<path d="${BODY}" fill="#fbfdff"/><path d="M100 124L88 146L100 182M100 124L112 146L100 182" fill="none" stroke="#c3ccd9" stroke-width="2.6"/><rect x="113" y="152" width="14" height="11" rx="2.5" fill="none" stroke="#c3ccd9" stroke-width="2.4"/><path d="M117 147v8" stroke="${EMERALD}" stroke-width="3" stroke-linecap="round"/>`;
  if (id === "suit") return `<path d="${BODY}" fill="#333c52"/><path d="M88 124L100 156L112 124Z" fill="#fff"/><path d="M97 130h6l-1 5 3 16-5 5-5-5 3-16z" fill="${EMERALD}"/><path d="M88 124L96 150M112 124L104 150" stroke="#1f2636" stroke-width="3"/>`;
  return "";
}

function neckSvg(id?: string) {
  if (id === "scarf") return `<path d="M56 126C76 142 124 142 144 126L146 140C124 156 76 156 54 140Z" fill="${EMERALD}"/><path d="M118 146h18l3 28c-8 5-16 5-22 0z" fill="${dark(EMERALD, 0.22)}"/><path d="M70 137l3 9M86 141l2 9M112 141l-2 9" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`;
  if (id === "bowtie") return `<path d="M100 138L78 126V152Z" fill="#e8497f"/><path d="M100 138L122 126V152Z" fill="#e8497f"/><path d="M100 138L84 131V146Z" fill="#c9336a" opacity=".6"/><circle cx="100" cy="139" r="6.5" fill="#c9336a"/>`;
  return "";
}

function faceAcc(id?: string) {
  if (id === "glasses") return `<g fill="#fff" fill-opacity=".14" stroke="${INK}" stroke-width="4.5"><circle cx="74" cy="84" r="24"/><circle cx="126" cy="84" r="24"/></g><path d="M97 82Q100 78 103 82" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/><path d="M58 72q6-6 14-6" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`;
  return "";
}

function headAcc(id?: string) {
  switch (id) {
    case "toque":
      return `<path d="M34 62C32 28 62 10 100 10C138 10 168 28 166 62C140 50 60 50 34 62Z" fill="${EMERALD}"/><path d="M30 56C60 42 140 42 170 56L171 74C140 60 60 60 29 74Z" fill="${dark(EMERALD, 0.22)}"/><path d="M48 52v14M66 48v14M83 46v14M100 45v14M117 46v14M134 48v14M152 52v14" stroke="#fff" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/><circle cx="100" cy="10" r="13" fill="#fff"/><circle cx="96" cy="6" r="4" fill="#fff" stroke="#e9e3da" stroke-width="1"/>`;
    case "cap":
      return `<path d="M40 60C40 28 68 14 100 14C132 14 160 28 160 60Z" fill="${VIOLET}"/><path d="M126 54C152 48 184 54 190 66C168 70 142 66 120 62Z" fill="${dark(VIOLET, 0.25)}"/><circle cx="100" cy="15" r="5" fill="${dark(VIOLET, 0.25)}"/><path d="M100 18v40" stroke="${dark(VIOLET, 0.18)}" stroke-width="3"/>`;
    case "crown":
      return `<path d="M62 40L68 6L86 26L100 0L114 26L132 6L138 40Z" fill="#ffcc3d"/><path d="M62 40h76v8H62z" fill="#e9a91a"/><circle cx="100" cy="24" r="5" fill="#e8497f"/><circle cx="76" cy="30" r="3.4" fill="#58b4f5"/><circle cx="124" cy="30" r="3.4" fill="#58b4f5"/>`;
    case "headphones":
      return `<path d="M30 92C26 34 60 18 100 18C140 18 174 34 170 92" fill="none" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>` + both(`<rect x="14" y="72" width="24" height="42" rx="11" fill="${VIOLET}"/><rect x="14" y="72" width="10" height="42" rx="5" fill="${dark(VIOLET, 0.25)}"/>`);
    case "earmuffs":
      return `<path d="M32 78C32 36 62 18 100 18C138 18 168 36 168 78" fill="none" stroke="#d5d9e2" stroke-width="7" stroke-linecap="round"/>` + both(`<circle cx="28" cy="88" r="19" fill="#ff9ec0"/><circle cx="24" cy="83" r="6" fill="#fff" opacity=".4"/>`);
    case "santa":
      return `<path d="M36 60C40 22 74 6 112 12C138 16 158 34 170 54C173 64 163 68 158 62C148 48 138 40 130 38C136 48 138 54 164 60Z" fill="#dd2f45"/><path d="M30 56C60 44 140 44 170 56L171 72C140 60 60 60 29 72Z" fill="#fff"/><circle cx="166" cy="64" r="10" fill="#fff"/>`;
    case "wizard":
      return `<path d="M36 62L100 -38L164 62Z" fill="#43358c"/><path d="M28 60C60 48 140 48 172 60L170 72C140 62 60 62 30 72Z" fill="#2b2166"/><path d="M98 4l3 7 7 3-7 3-3 7-3-7-7-3 7-3zM122 34l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#ffd34d"/>`;
    case "flower":
      return `<g transform="translate(148 46)">${[0, 72, 144, 216, 288].map((r) => `<ellipse cx="0" cy="-11" rx="7.5" ry="11" fill="#ffb3cf" transform="rotate(${r})"/>`).join("")}<circle r="6.5" fill="#ffd34d"/></g>`;
    default:
      return "";
  }
}

function effects(m: MMood) {
  if (m === "cheer") return `<path class="mascot-twinkle" d="M22 34l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" fill="#ffd34d"/><path class="mascot-twinkle" style="animation-delay:.35s" d="M178 24l3.5 8 8 3.5-8 3.5-3.5 8-3.5-8-8-3.5 8-3.5z" fill="#ffd34d"/><path class="mascot-twinkle" style="animation-delay:.7s" d="M186 96l2.5 6 6 2.5-6 2.5-2.5 6-2.5-6-6-2.5 6-2.5z" fill="${BLUSH}"/>`;
  if (m === "oops") return `<path class="mascot-drop" d="M166 46q9 14 0 23q-9-9 0-23z" fill="#8fd3ff"/>`;
  if (m === "think") return `<g fill="#fff" stroke="#d9d3e6" stroke-width="2"><circle cx="164" cy="48" r="4"/><circle cx="174" cy="34" r="6.5"/><ellipse cx="184" cy="15" rx="13" ry="9.5"/></g>`;
  if (m === "sleep") return `<g fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"><path class="mascot-z" d="M150 30h12l-12 13h12"/><path class="mascot-z" style="animation-delay:.6s" d="M170 12h8l-8 9h8"/></g>`;
  return "";
}

/** Contenido SVG (sin la etiqueta <svg>) de una mascota. */
export function mascotInner(l: MLook) {
  const p = palette(l);
  const a = arms(l, p);
  const owl = l.species === "buho";
  const feet = both(`<ellipse cx="80" cy="181" rx="18" ry="9" fill="${owl ? "#ffab2e" : dark(p.limb, l.species === "panda" ? 0 : 0.12)}"/>`);
  const belly = l.outfit && l.outfit !== "none" ? "" : owl ? `<path d="M74 180C70 154 80 134 100 134C120 134 130 154 126 180Z" fill="${p.belly}"/><g fill="none" stroke="${dark(p.belly, 0.14)}" stroke-width="2.6" stroke-linecap="round"><path d="M88 150q6 6 12 0q6 6 12 0"/><path d="M86 163q7 6 14 0q7 6 14 0"/></g>` : l.species === "panda" ? "" : `<ellipse cx="100" cy="160" rx="25" ry="21" fill="${p.belly}"/>`;
  const dogEars = l.species === "perro" ? `<g class="mascot-ears">${both(`<path d="M40 44C16 48 8 88 20 116C34 124 50 108 52 82C53 62 50 48 40 44Z" fill="${p.ear}"/><path d="M40 44C30 52 26 76 28 100" fill="none" stroke="${dark(p.ear, 0.18)}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`)}</g>` : "";
  return [
    `<ellipse cx="100" cy="189" rx="46" ry="6" fill="#000" opacity=".08"/>`,
    tail(l, p),
    feet,
    `<path d="${BODY}" fill="${p.fur}"/>`,
    `<path d="M62 178C74 186 126 186 138 178C140 172 141 166 141 160C130 176 70 176 59 160C59 166 60 172 62 178Z" fill="${p.shade}" opacity=".45"/>`,
    belly,
    outfitSvg(l.outfit),
    a.back,
    neckSvg(l.neck),
    `<g class="mascot-ears">${ears(l, p)}</g>`,
    `<path d="${HEAD}" fill="${p.fur}"/>`,
    `<path d="M29 96C38 126 68 140 100 140C132 140 162 126 171 96C160 120 132 131 100 131C68 131 40 120 29 96Z" fill="${p.shade}" opacity=".5"/>`,
    `<ellipse cx="70" cy="42" rx="20" ry="8" transform="rotate(-18 70 42)" fill="#fff" opacity="${l.species === "panda" ? 0.7 : 0.2}"/>`,
    face(l, p),
    both(`<ellipse cx="50" cy="108" rx="11" ry="7" fill="${BLUSH}" opacity=".55"${l.mood === "cheer" ? ' class="mascot-blush"' : ""}/>`),
    eyes(l),
    mouth(l),
    dogEars,
    faceAcc(l.face),
    headAcc(l.head),
    a.front,
    effects(l.mood),
  ].join("");
}

export const mascotSvg = (l: MLook, size = 200) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="${size}" height="${size}">${mascotInner(l)}</svg>`;
