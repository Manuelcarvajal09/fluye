import { notFound } from "next/navigation";
import { Mascot } from "@/components/Mascot";
import { MOODS, PETS, PIECES, pieceOf, type Slot } from "@/lib/wardrobe";
import data from "@/lib/armario-data.json";

/**
 * Hojas de contacto para la auditoría visual de mascotas (docs/qa/). Usa el componente real <Mascot>.
 * Solo existe con FLUYE_QA=1 (entorno local de pruebas); en producción responde 404.
 * ?pet=zorro&sheet=pieces|poses|headface|bodyneck|chest&bg=light|dark
 */
export const dynamic = "force-dynamic";

const LOOKS = (data as unknown as { looks?: string[][] }).looks ?? [
  ["cap", "sweater", "glasses", "primer-repaso"],
  ["jardin-12", "sweater", "glasses", "primer-repaso"],
  ["jardin-12", "chaleco", "jardin-32", "jardin-21", "primera-amistad"],
  ["earmuffs", "delantal", "scarf", "racha-5"],
];
const by = (s: Slot) => PIECES.filter((p) => p.slot === s).map((p) => p.id);

export default async function QaMascotas({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.FLUYE_QA !== "1") notFound();
  const q = await searchParams;
  const pet = PETS.find((p) => p.id === q.pet)?.id ?? "zorro";
  const sheet = q.sheet ?? "pieces";
  const dark = q.bg === "dark";
  const size = Number(q.size ?? 150);
  type Cell = { label: string; wear: string[]; mood?: (typeof MOODS)[number] };
  let cells: Cell[] = [];
  if (sheet === "pieces") cells = [{ label: "base", wear: [] }, ...PIECES.map((p) => ({ label: p.id, wear: [p.id] }))];
  if (sheet === "poses") for (const look of [[], ...LOOKS]) for (const mood of MOODS) cells.push({ label: `${mood} · ${look.length ? look.join("+") : "sin ropa"}`, wear: look, mood });
  if (sheet === "headface") for (const h of ["", ...by("head")]) for (const f of ["", ...by("face")]) cells.push({ label: `${h || "–"} / ${f || "–"}`, wear: [h, f].filter(Boolean) });
  if (sheet === "bodyneck") for (const b of ["", ...by("body")]) for (const n of ["", ...by("neck")]) cells.push({ label: `${b || "–"} / ${n || "–"}`, wear: [b, n, "racha-30"].filter(Boolean) });
  if (sheet === "chest") for (const b of ["", ...by("body")]) for (const c of by("chest")) cells.push({ label: `${b || "–"} / ${c}`, wear: [b, c].filter(Boolean) });
  if (sheet === "hair") for (const h of ["", ...by("head")]) for (const f of by("hair")) cells.push({ label: `${h || "–"} / ${f}`, wear: [h, f].filter(Boolean) });
  return (
    <main data-qa-sheet={sheet} style={{ background: dark ? "#101722" : "#f4f8f6", color: dark ? "#fff" : "#192337", padding: 12, minHeight: "100vh" }}>
      <h1 style={{ font: "800 18px sans-serif", margin: "0 0 8px" }}>
        {pet} · {sheet} · {cells.length} celdas · {dark ? "oscuro" : "claro"}
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, ${size + 8}px)`, gap: 6 }}>
        {cells.map((c, i) => (
          <figure key={i} style={{ margin: 0, width: size + 8, outline: `1px solid ${dark ? "#2a3446" : "#dce5e3"}`, background: dark ? "#192337" : "#fff" }}>
            <Mascot species={pet} wear={c.wear} mood={c.mood ?? "happy"} size={size} animate="none" fx={false} crop="full" decorative />
            <figcaption style={{ font: "600 9px/1.15 sans-serif", padding: "0 3px 3px", wordBreak: "break-all" }}>
              {i + 1}. {c.label}
              {c.wear.some((k) => !pieceOf(k)) ? " ⚠" : ""}
            </figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
