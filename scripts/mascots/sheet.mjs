// Hoja de revisión de mascotas: renderiza el dibujo vectorial a PNG para mirarlo de verdad.
// Uso: node scripts/mascots/sheet.mjs [salida.png] [modo]   modo: species (por defecto) | acc
import sharp from "sharp";
import { mascotSvg } from "../../src/lib/mascotSvg.ts";

const out = process.argv[2] ?? "test-results/mascotas.png";
const mode = process.argv[3] ?? "species";
const SP = [
  ["zorro", "#f0832f"],
  ["gato", "#9aa5c9"],
  ["perro", "#dba05f"],
  ["oso", "#b07a52"],
  ["panda", "#2f2a33"],
  ["buho", "#8d7b6a"],
];
const MOODS = ["happy", "cheer", "think", "wow", "oops", "sleep"];
const S = 220;
let cells = [];
if (mode === "acc") {
  const heads = ["toque", "cap", "crown", "headphones", "earmuffs", "santa", "wizard", "flower"];
  cells = [
    heads.map((h, i) => ({ species: SP[i % 6][0], color: SP[i % 6][1], mood: "happy", head: h })),
    [
      { species: "zorro", color: SP[0][1], mood: "happy", face: "glasses", neck: "scarf", head: "toque" },
      { species: "gato", color: SP[1][1], mood: "cheer", face: "glasses", neck: "bowtie", head: "crown" },
      { species: "perro", color: SP[2][1], mood: "happy", outfit: "hoodie", head: "cap" },
      { species: "oso", color: SP[3][1], mood: "think", outfit: "sweater", head: "santa" },
      { species: "panda", color: SP[4][1], mood: "happy", outfit: "labcoat", face: "glasses" },
      { species: "buho", color: SP[5][1], mood: "wow", outfit: "suit", neck: "bowtie" },
      { species: "zorro", color: "#d96a8f", mood: "cheer", neck: "scarf" },
      { species: "gato", color: "#f0a04b", mood: "happy", head: "flower" },
    ],
  ];
} else cells = SP.map(([species, color]) => MOODS.map((mood) => ({ species, color, mood })));

const cols = Math.max(...cells.map((r) => r.length));
const composite = [];
for (let r = 0; r < cells.length; r++)
  for (let c = 0; c < cells[r].length; c++) composite.push({ input: await sharp(Buffer.from(mascotSvg(cells[r][c], S))).png().toBuffer(), left: c * S + 10, top: r * S + 10 });
await sharp({ create: { width: cols * S + 20, height: cells.length * S + 20, channels: 4, background: "#faf6ef" } }).composite(composite).png().toFile(out);
console.log("hoja:", out);
