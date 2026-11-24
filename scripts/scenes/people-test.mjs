import sharp from "sharp";
import { person, SKIN, HAIR } from "./people.mjs";
const P = [
  { hairStyle: "short", top: "#6a55e0", mood: "smile", armL: [-22, -34], wave: "L", lean: -4, tilt: -5 },
  { hairStyle: "afro", top: "#0a8f65", mood: "laugh", armR: [26, -40], armL: [-24, -30], lean: 3, tilt: 6, skin: SKIN[3] },
  { hairStyle: "long", top: "#ff8fa8", mood: "talk", armR: [34, -8], look: 1, tilt: 4, hairColor: HAIR[2] },
  { hairStyle: "bun", top: "#ffb347", mood: "wow", armL: [-8, -46], armR: [8, -46], skin: SKIN[2], glasses: true },
  { hairStyle: "bald", top: "#58b4f5", mood: "smug", beard: true, armL: [-4, 20], armR: [4, 22], hairColor: HAIR[1], skin: SKIN[2], lean: -3 },
  { hairStyle: "hijab", top: "#e8497f", mood: "think", armR: [-8, -28], hairColor: "#ffb3cf", look: 1, tilt: -6, skin: SKIN[1] },
  { hairStyle: "curly", top: "#22c79a", mood: "worry", hairColor: HAIR[5], pose: "walk", armL: [-18, 26], armR: [20, 20], lean: 5, shortSleeve: true, skin: SKIN[0] },
  { hairStyle: "ponytail", top: "#6a55e0", mood: "proud", pose: "sit", armL: [10, 34], armR: [26, 30], hairColor: HAIR[3], skin: SKIN[0] },
];
let g = "";
P.forEach((p, i) => (g += person({ x: 80 + i * 150, y: 200, s: 1.25, skin: SKIN[i % 4], hairColor: HAIR[i % 6], ...p, anim: false })));
g += `<rect x="1100" y="145" width="90" height="10" rx="5" fill="#c98d52"/>`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1260 230" width="1890" height="345"><rect width="1260" height="230" fill="#faf6ef"/>${g}</svg>`;
await sharp(Buffer.from(svg)).png().toFile("test-results/personas.png");
