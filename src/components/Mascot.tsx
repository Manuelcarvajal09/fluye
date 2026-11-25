import { dressLayers, petOf, poseLayers, type Mood } from "@/lib/wardrobe";

export type { Mood };

/** Recorte de cabeza (en % del lienzo) para avatares pequeños, donde el cuerpo entero no se leería. */
const HEAD = { y: 38, d: 53 };

/**
 * Mascota de Fluye: una ilustración por estado (feliz, celebra, piensa…). En la pose feliz el conjunto se compone
 * por capas ajustadas a cada especie; en las demás se añaden sus piezas de cabeza y cara. El estado también se expresa
 * con movimiento y efectos dibujados en código, que respetan "reducir movimiento".
 */
export function Mascot({
  species = "zorro",
  mood = "happy",
  wear = [],
  size = 120,
  className = "",
  animate = "bob",
  label,
  decorative = false,
  crop,
  fx = true,
}: {
  species?: string;
  mood?: Mood;
  wear?: string[];
  size?: number;
  className?: string;
  animate?: "bob" | "hop" | "none";
  label?: string;
  decorative?: boolean;
  crop?: "full" | "head";
  fx?: boolean;
}) {
  const pet = petOf(species) ?? petOf("zorro")!;
  const head = (crop ?? (size <= 60 ? "head" : "full")) === "head";
  // Feliz: conjunto completo por capas. Otras poses: la ilustración del estado con sus piezas de cabeza y cara.
  const dressed = wear.length > 0 && mood === "happy";
  const layers = dressed ? dressLayers(pet.id, wear) : [];
  const extras = !dressed && wear.length ? poseLayers(pet.id, wear) : [];
  const k = head ? 100 / HEAD.d : 1;
  const frame = head ? { width: `${k * 100}%`, height: `${k * 100}%`, left: `${-(pet.x - HEAD.d / 2) * k}%`, top: `${-(HEAD.y - HEAD.d / 2) * k}%` } : { width: "100%", height: "100%", left: 0, top: 0 };
  const move = animate === "bob" ? "mascot-bob" : animate === "hop" ? "mascot-hop" : "";
  return (
    <span
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? `Mascota ${pet.label}` })}
      className={`mascot relative inline-block shrink-0 ${head ? "overflow-hidden rounded-[28%]" : ""} ${move} ${className}`}
      style={{ width: size, height: size }}
    >
      <span className={`absolute mascot-mood-${mood}`} style={frame}>
        {layers.length ? (
          layers.map((l, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- capas locales ya optimizadas (WebP)
            <img key={l.src} src={l.src} alt="" draggable={false} className="absolute max-w-none select-none" style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%`, zIndex: i }} />
          ))
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- ilustración local ya optimizada (WebP 512)
          <img src={`/mascots/${pet.id}-${mood}.webp`} alt="" width={512} height={512} draggable={false} className="absolute inset-0 h-full w-full select-none" />
        )}
        {extras.map((l) => (
          // eslint-disable-next-line @next/next/no-img-element -- capa local
          <img key={l.src} src={l.src} alt="" draggable={false} className="absolute max-w-none select-none" style={{ left: `${l.x}%`, top: `${l.y}%`, width: `${l.w}%`, height: `${l.h}%` }} />
        ))}
      </span>
      {fx && !head && size >= 72 && <MoodFx mood={mood} />}
    </span>
  );
}

/** Efectos del estado, dibujados en código (las ilustraciones no los traen). */
function MoodFx({ mood }: { mood: Mood }) {
  if (mood === "cheer" || mood === "proud")
    return (
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {[
          [14, 26, 7, 0],
          [84, 20, 6, 0.4],
          [88, 52, 4.5, 0.8],
          [10, 56, 4, 1.1],
        ].map(([x, y, r, d], i) => (
          <path key={i} className="mascot-twinkle" style={{ animationDelay: `${d}s` }} d={`M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`} fill="var(--gold)" />
        ))}
      </svg>
    );
  if (mood === "sleep")
    return (
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {[0, 0.7, 1.4].map((d, i) => (
          <text key={i} x={74 + i * 6} y={24 - i * 7} className="mascot-z" style={{ animationDelay: `${d}s` }} fontSize={9 + i * 3} fontWeight={900} fill="var(--sky)">
            z
          </text>
        ))}
      </svg>
    );
  if (mood === "think")
    return (
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {[0, 1, 2].map((i) => (
          <circle key={i} cx={78 + i * 6} cy={22 - i * 5} r={2 + i} className="mascot-twinkle" style={{ animationDelay: `${i * 0.3}s` }} fill="var(--muted)" opacity={0.7} />
        ))}
      </svg>
    );
  if (mood === "wow")
    return (
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        <g stroke="var(--fire)" strokeWidth={3} strokeLinecap="round" className="mascot-twinkle">
          <path d="M80 18l5-8M86 28l9-3M74 12l1-9" />
        </g>
      </svg>
    );
  if (mood === "oops")
    return (
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        <path className="mascot-drop" d="M80 16q4 7 0 10q-4-3 0-10z" fill="var(--sky)" />
      </svg>
    );
  return null;
}
