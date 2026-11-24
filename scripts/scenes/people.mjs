// Personas de las escenas de Fluye (v2). Diseño propio, mismo lenguaje que las mascotas:
// plano, sin contornos, ojos blancos con pupila y brillo, cejas y párpados que actúan, manos con pulgar,
// extremidades gruesas, cabeza con forma (no un círculo), poses inclinadas y asimétricas.
// Cada persona lleva clases para animarse dentro del SVG: .blink (parpadeo), .wave (brazo), .bob (respirar), .nod.
const INK = "#2b2238";
const mixc = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
export const dark = (c, t = 0.2) => mixc(c, "#1a1024", t);
export const light = (c, t = 0.3) => mixc(c, "#ffffff", t);
export const SKIN = ["#f8d2b3", "#e6ad84", "#bd7f55", "#80523a"];
export const HAIR = ["#2b2238", "#5a3a2a", "#a8622e", "#e3b55c", "#8f8a99", "#cf4b3d", "#7a5cd6"];

/**
 * Extremidad articulada del punto a al punto b: dos tramos RECTOS unidos por un codo/rodilla redondeado
 * (nunca una curva tipo fideo). Si el destino queda a la distancia del brazo, sale recto.
 * side = hacia qué lado dobla el codo (1 o -1). Termina en mano con pulgar si se pasa `hand`.
 */
function limb(ax, ay, bx, by, color, w, side = 0, hand = null, cls = "", origin = null, len = 46) {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy) || 1;
  let path = `M${ax} ${ay}L${bx} ${by}`;
  let ex = ax;
  let ey = ay;
  if (side && d < len * 0.97) {
    const h = Math.sqrt((len / 2) ** 2 - (d / 2) ** 2) * Math.sign(side);
    ex = (ax + bx) / 2 + (-dy / d) * h;
    ey = (ay + by) / 2 + (dx / d) * h;
    path = `M${ax} ${ay}L${ex.toFixed(1)} ${ey.toFixed(1)}L${bx} ${by}`;
  }
  const ang = Math.atan2(by - ey, bx - ex);
  const hnd = hand ? `<circle cx="${bx}" cy="${by}" r="${w * 0.64}" fill="${hand}"/><circle cx="${(bx + Math.cos(ang - 1.25) * w * 0.6).toFixed(1)}" cy="${(by + Math.sin(ang - 1.25) * w * 0.6).toFixed(1)}" r="${w * 0.3}" fill="${hand}"/>` : "";
  const inner = `<path d="${path}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>${hnd}`;
  return cls ? `<g class="${cls}" style="transform-origin:${origin ? origin[0] : ax}px ${origin ? origin[1] : ay}px">${inner}</g>` : inner;
}

/** Pelo relativo al centro de la cabeza (caja ±22 × ±21). back = detrás de la cabeza, front = encima. */
function hair(style, c) {
  const d = dark(c, 0.18);
  const cap = `<path d="M-24 -2C-27 -34 27 -34 24 -2C17 -11 4 -16 -6 -12C-13 -9 -19 -6 -24 -2Z" fill="${c}"/><path d="M-24 -2C-27 -34 27 -34 24 -2C24 -22 6 -30 -8 -27C-18 -24 -24 -14 -24 -2Z" fill="${light(c, 0.16)}" opacity=".35"/>`;
  switch (style) {
    case "afro":
      return { back: `<circle cx="0" cy="-10" r="31" fill="${c}"/><circle cx="-22" cy="2" r="14" fill="${c}"/><circle cx="22" cy="2" r="14" fill="${c}"/><circle cx="-10" cy="-22" r="16" fill="${light(c, 0.14)}" opacity=".35"/>`, front: `<path d="M-23 -6C-18 -24 18 -24 23 -6C14 -14 -14 -14 -23 -6Z" fill="${c}"/>` };
    case "long":
      return { back: `<path d="M-26 -6C-30 -34 30 -34 26 -6L29 34C16 40 -16 40 -29 34Z" fill="${c}"/><path d="M-29 34C-16 40 16 40 29 34L28 22C14 28 -14 28 -28 22Z" fill="${d}" opacity=".5"/>`, front: cap };
    case "bun":
      return { back: `<circle cx="6" cy="-30" r="11" fill="${c}"/><circle cx="6" cy="-30" r="11" fill="${d}" opacity=".25"/>`, front: cap };
    case "bob":
      return { back: `<path d="M-27 -6C-31 -34 31 -34 27 -6L26 16C18 22 -18 22 -26 16Z" fill="${c}"/>`, front: cap };
    case "curly":
      return { back: `<circle cx="-22" cy="-8" r="9" fill="${c}"/><circle cx="22" cy="-8" r="9" fill="${c}"/>`, front: [-18, -9, 0, 9, 18].map((x, i) => `<circle cx="${x}" cy="${-19 - (i % 2 ? 5 : 0)}" r="10" fill="${i % 2 ? c : light(c, 0.08)}"/>`).join("") };
    case "ponytail":
      return { back: `<path d="M18 -18C40 -22 44 6 30 22C30 8 26 -2 16 -6Z" fill="${c}"/>`, front: cap };
    case "bald":
      return { back: "", front: "" };
    case "hijab":
      return { back: `<path d="M-28 -4C-32 -38 32 -38 28 -4L26 30C12 40 -12 40 -26 30Z" fill="${c}"/>`, front: `<path d="M-25 -2C-28 -34 28 -34 25 -2C22 -18 -22 -18 -25 -2Z" fill="${c}"/><path d="M-22 14C-12 26 12 26 22 14L24 26C12 36 -12 36 -24 26Z" fill="${d}" opacity=".35"/>` };
    default:
      return { back: "", front: cap };
  }
}

function faceSvg({ skin, mood, look, glasses, beard, hairColor }) {
  const sk2 = dark(skin, 0.14);
  const lx = look * 2.2;
  const brow = (x, tilt) => `<path d="M${x - 5} -9.5Q${x} -12.5 ${x + 5} -9.5" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".8" transform="rotate(${tilt} ${x} -10)"/>`;
  let eyes;
  if (mood === "laugh" || mood === "proud") eyes = [-9, 9].map((x) => `<path d="M${x - 5} -1Q${x} -8 ${x + 5} -1" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`).join("");
  else {
    const big = mood === "wow" ? 1.15 : 1;
    eyes = [-9, 9]
      .map(
        (x) =>
          `<ellipse cx="${x}" cy="-2" rx="${5.6 * big}" ry="${6.6 * big}" fill="#fff"/><g class="blink"><ellipse cx="${x + lx}" cy="${mood === "think" ? -3.5 : -1.5}" rx="${mood === "wow" ? 2.6 : 3.3}" ry="${mood === "wow" ? 3 : 3.9}" fill="${INK}"/><circle cx="${x + lx - 1.1}" cy="${mood === "think" ? -5 : -3}" r="1.15" fill="#fff"/></g>` +
          (mood === "smug" || mood === "tired" ? `<path d="M${x - 6} -4Q${x} -9 ${x + 6} -4L${x + 6} -9L${x - 6} -9Z" fill="${skin}"/>` : ""),
      )
      .join("");
  }
  const brows = mood === "worry" ? brow(-9, -16) + brow(9, 16) : mood === "smug" ? brow(-9, 10) + brow(9, -14) : mood === "wow" ? brow(-9, -4).replace("-9.5Q", "-12Q").replace("-9.5", "-12") + brow(9, 4) : mood === "think" ? brow(-9, 6) + brow(9, -12) : brow(-9, -5) + brow(9, 5);
  const mouth =
    mood === "laugh"
      ? `<path d="M-7 8Q0 6 7 8Q6 17 0 17Q-6 17 -7 8Z" fill="${INK}"/><path d="M-4 14Q0 11 4 14Q2 17 0 17Q-2 17 -4 14Z" fill="#ff7d96"/><path d="M-5.5 8.2h11v2.2h-11z" fill="#fff"/>`
      : mood === "wow"
        ? `<ellipse cx="0" cy="11" rx="3.2" ry="4.2" fill="${INK}"/>`
        : mood === "talk"
          ? `<path d="M-5 8Q0 7 5 8Q4 14 0 14Q-4 14 -5 8Z" fill="${INK}"/><path d="M-3.5 8.3h7v1.8h-7z" fill="#fff"/>`
          : mood === "worry"
            ? `<path d="M-5 12Q0 8 5 12" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
            : mood === "smug" || mood === "think"
              ? `<path d="M-4 10Q2 13 7 8" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
              : `<path d="M-6 8Q0 15 6 8" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
  return (
    `<ellipse cx="-13" cy="6" rx="5" ry="3.3" fill="#ff8fa8" opacity=".5"/><ellipse cx="13" cy="6" rx="5" ry="3.3" fill="#ff8fa8" opacity=".5"/>` +
    eyes +
    brows +
    `<path d="M-2.2 3.5Q0 6.5 2.2 3.5" fill="none" stroke="${sk2}" stroke-width="2.4" stroke-linecap="round"/>` +
    (beard ? `<path d="M-19 4C-18 22 -8 27 0 27C8 27 18 22 19 4C12 10 6 6 0 7C-6 6 -12 10 -19 4Z" fill="${hairColor}"/>` : "") +
    mouth +
    (glasses ? `<g fill="#fff" fill-opacity=".18" stroke="${INK}" stroke-width="2.4"><rect x="-17" y="-9" width="14" height="13" rx="5"/><rect x="3" y="-9" width="14" height="13" rx="5"/></g><path d="M-3 -3h6" stroke="${INK}" stroke-width="2.4"/>` : "")
  );
}

/**
 * Persona. (x, y) = suelo bajo el cuerpo; s = escala (1 ≈ 128 px de alto de pie).
 * pose: "stand" | "sit" (sentada de 3/4 mirando a la derecha; usa flip para girar) | "walk"
 * armL / armR: mano relativa al hombro [dx, dy]. wave: "L" | "R" anima ese brazo. lean: inclinación del cuerpo (grados).
 * tilt: inclinación de la cabeza. mood: smile | laugh | talk | wow | think | worry | smug | proud | tired.
 */
export function person({ x, y, s = 1, skin = SKIN[1], hairStyle = "short", hairColor = HAIR[0], top = "#6a55e0", bottom = "#3b4560", shoes = "#2b2238", armL, armR, mood = "smile", pose = "stand", look = 0, lean = 0, tilt = 0, wave = "", extra = "", back = "", flip = false, glasses = false, beard = false, legs = true, shortSleeve = false, anim = true }) {
  const sit = pose === "sit";
  const hipY = sit ? -44 : -50;
  const shY = hipY - 40; // hombros
  const headY = shY - 24;
  const h = hair(hairStyle, hairColor);
  const sk2 = dark(skin, 0.12);
  const top2 = dark(top, 0.14);
  const bot2 = dark(bottom, 0.14);
  const shL = [-16, shY + 4];
  const shR = [16, shY + 4];
  const hl = armL ? [shL[0] + armL[0], shL[1] + armL[1]] : [-23, hipY + 2];
  const hr = armR ? [shR[0] + armR[0], shR[1] + armR[1]] : [23, hipY + 2];
  // Zapato con puntera redondeada hacia `dir` (1 derecha, -1 izquierda) y suela plana.
  const shoe = (cx, dir, c) => `<path transform="translate(${cx} 0) scale(${dir} 1)" d="M-9 0v-4a6 6 0 0 1 6 -6h5a11 10 0 0 1 11 10z" fill="${c}"/>`;
  let legsSvg = "";
  if (legs) {
    if (sit) legsSvg = limb(4, hipY, 24, hipY + 2, bot2, 16) + limb(24, hipY + 2, 22, -7, bot2, 14) + shoe(25, 1, shoes) + limb(-4, hipY, 32, hipY + 1, bottom, 16) + limb(32, hipY + 1, 34, -7, bottom, 14) + shoe(37, 1, shoes);
    else if (pose === "walk") legsSvg = limb(-5, hipY, -16, -7, bot2, 15) + shoe(-17, 1, shoes) + limb(6, hipY, 16, -7, bottom, 15) + shoe(19, 1, shoes);
    else legsSvg = limb(-8, hipY, -10, -7, bot2, 15) + shoe(-11, -1, shoes) + limb(8, hipY, 10, -7, bottom, 15) + shoe(11, 1, shoes);
  }
  const sleeve = (sh, hd, c) => {
    if (!shortSleeve) return "";
    const ex = sh[0] + (hd[0] - sh[0]) * 0.38;
    const ey = sh[1] + (hd[1] - sh[1]) * 0.38;
    return `<path d="M${sh[0]} ${sh[1]}L${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${c}" stroke-width="14" stroke-linecap="round"/>`;
  };
  const armBack = limb(shR[0], shR[1], hr[0], hr[1], shortSleeve ? sk2 : top2, 12, hr[0] >= shR[0] ? 1 : -1, sk2, anim && wave === "R" ? "wave" : "", shR) + sleeve(shR, hr, top2);
  const armFront = limb(shL[0], shL[1], hl[0], hl[1], shortSleeve ? skin : top, 12, hl[0] <= shL[0] ? -1 : 1, skin, anim && wave === "L" ? "wave" : "", shL) + sleeve(shL, hl, top);
  const torso =
    `<path d="M-19 ${shY + 4}C-20 ${shY - 6} -10 ${shY - 9} 0 ${shY - 9}C10 ${shY - 9} 20 ${shY - 6} 19 ${shY + 4}L17 ${hipY + 4}C17 ${hipY + 11} -17 ${hipY + 11} -17 ${hipY + 4}Z" fill="${top}"/>` +
    `<path d="M-17 ${hipY - 6}C-8 ${hipY} 8 ${hipY} 17 ${hipY - 6}L17 ${hipY + 4}C17 ${hipY + 11} -17 ${hipY + 11} -17 ${hipY + 4}Z" fill="${top2}" opacity=".55"/>`;
  const head =
    `<g transform="translate(0 ${headY}) rotate(${tilt})"><g class="${anim ? "nod" : ""}">` +
    h.back +
    `<rect x="-5.5" y="14" width="11" height="12" rx="4" fill="${sk2}"/>` +
    `<circle cx="-22" cy="2" r="4.6" fill="${sk2}"/><circle cx="22" cy="2" r="4.6" fill="${sk2}"/>` +
    `<rect x="-22" y="-21" width="44" height="43" rx="19" fill="${skin}"/>` +
    faceSvg({ skin, mood, look, glasses, beard, hairColor }) +
    h.front +
    `</g></g>`;
  const body = `<g transform="rotate(${lean} 0 ${hipY})">${back}${armBack}${torso}${head}${armFront}${extra}</g>`;
  return `<g transform="translate(${x} ${y}) scale(${flip ? -s : s} ${s})"><g class="${anim ? "bob" : ""}">${legsSvg}${body}</g></g>`;
}

/** Estilos de animación para incrustar en cada SVG de escena (se respetan las preferencias de movimiento reducido). */
export const SCENE_CSS = `
.blink{animation:blink 4.6s infinite;transform-box:fill-box;transform-origin:center}
.wave{animation:wave 1.1s ease-in-out infinite alternate}
.bob{animation:bob 3.4s ease-in-out infinite}
.nod{animation:nod 5.2s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 90%}
.sway{animation:sway 5s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
.float{animation:float 3.2s ease-in-out infinite}
.steam{animation:steam 2.6s ease-out infinite}
.fall{animation:fall 7s linear infinite}
.spin{animation:spin 26s linear infinite;transform-box:fill-box;transform-origin:center}
.twinkle{animation:twinkle 1.8s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.drive{animation:drive 6s ease-in-out infinite alternate}
.drip{animation:drip 1.5s ease-in infinite}
.mascot-blink{animation:blink 4.2s infinite;transform-box:fill-box;transform-origin:center}
.mascot-tail{animation:wag 1.4s ease-in-out infinite}
.mascot-ears{animation:ears 5.5s ease-in-out infinite;transform-box:fill-box;transform-origin:50% 100%}
.mascot-wave-l{animation:wave 0.7s ease-in-out infinite alternate}
.mascot-twinkle{animation:twinkle 1.3s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
.d1{animation-delay:.6s}.d2{animation-delay:1.3s}.d3{animation-delay:2.1s}
@keyframes blink{0%,93%,100%{transform:scaleY(1)}96%{transform:scaleY(.08)}}
@keyframes wave{from{transform:rotate(-9deg)}to{transform:rotate(12deg)}}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.6px)}}
@keyframes nod{0%,84%,100%{transform:rotate(0)}90%{transform:rotate(-4deg)}95%{transform:rotate(3deg)}}
@keyframes sway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@keyframes steam{0%{transform:translateY(4px);opacity:0}30%{opacity:.8}100%{transform:translateY(-12px);opacity:0}}
@keyframes fall{from{transform:translateY(-40px)}to{transform:translateY(250px)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes twinkle{0%,100%{opacity:.35;transform:scale(.7)}50%{opacity:1;transform:scale(1.15)}}
@keyframes drip{0%{transform:translateY(-3px);opacity:0}25%{opacity:1}100%{transform:translateY(13px);opacity:0}}
@keyframes drive{from{transform:translateX(-4px)}to{transform:translateX(4px)}}
@keyframes wag{0%,100%{transform:rotate(0)}50%{transform:rotate(-9deg)}}
@keyframes ears{0%,88%,100%{transform:rotate(0)}92%{transform:rotate(-4deg)}96%{transform:rotate(3deg)}}
@media (prefers-reduced-motion:reduce){*{animation:none!important}}
`;
