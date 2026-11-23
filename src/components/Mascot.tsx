import type { Outfit } from "@/lib/look";
import type { Accessory, Species } from "@/lib/look";

export type Mood = "happy" | "cheer" | "think" | "oops" | "wow" | "sleep";

const INK = "#2a2230";
const mix = (c: string, pct: number, other: string) => `color-mix(in oklab, ${c} ${pct}%, ${other})`;

/**
 * Mascota original en SVG, estilo chibi: cabeza grande, ojos brillantes, contorno suave.
 * El color de pelaje es personalizable (en el panda tiñe las manchas).
 */
export function Mascot({ species = "castor", mood = "happy", color = "#a8693b", accessory = "none", outfit = "none", size = 120, className = "", animate = "bob", label, decorative = false }: { species?: Species; mood?: Mood; color?: string; accessory?: Accessory; outfit?: Outfit; size?: number; className?: string; animate?: "bob" | "hop" | "none"; label?: string; decorative?: boolean }) {
  const panda = species === "panda";
  const owl = species === "buho";
  const fox = species === "zorro";
  const beaver = species === "castor";
  const bear = species === "oso";

  // Paleta: en el panda el "color" son las manchas y el pelaje es blanco cálido.
  const fur = panda ? "#fbf8f3" : color;
  const patch = panda ? (color.toLowerCase() === "#fbf8f3" ? "#2f2a33" : color) : color;
  const line = panda ? mix(patch, 70, "black") : mix(color, 55, "black");
  const shade = panda ? "#ece6dc" : mix(color, 78, "black");
  const light = panda ? "#ffffff" : mix(color, 34, "white");
  const cheer = mood === "cheer";
  const sw = 2.6;

  return (
    <svg viewBox="0 0 160 160" width={size} height={size} {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": label ?? `Mascota ${species}` })} className={`overflow-visible ${animate === "bob" ? "mascot-bob" : animate === "hop" ? "mascot-hop" : ""} ${className}`}>
      {/* sombra */}
      <ellipse cx="80" cy="154" rx="38" ry="5" fill="#000" opacity="0.08" />

      {/* colas (detrás del cuerpo) */}
      {beaver && (
        <g className="mascot-tail" style={{ transformOrigin: "112px 134px" }}>
          <ellipse cx="128" cy="138" rx="22" ry="11" transform="rotate(-24 128 138)" style={{ fill: mix(color, 60, "black"), stroke: line }} strokeWidth={sw} />
          <path d="M116 132 l20 -8 M118 140 l22 -9 M122 146 l18 -7" style={{ stroke: mix(color, 45, "black") }} strokeWidth="1.6" strokeLinecap="round" opacity="0.6" />
        </g>
      )}
      {fox && (
        <g className="mascot-tail" style={{ transformOrigin: "108px 136px" }}>
          <path d="M104 140 C128 146 146 128 140 104 C138 96 130 94 128 102 C126 118 116 126 102 128 Z" style={{ fill: color, stroke: line }} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M140 104 C138 96 130 94 128 102 C128 108 132 112 136 112 C139 111 141 108 140 104 Z" fill="#fff8f0" />
        </g>
      )}

      {/* cuerpo */}
      <path d="M44 154 C40 128 54 110 80 110 C106 110 120 128 116 154 Z" style={{ fill: fur, stroke: line }} strokeWidth={sw} strokeLinejoin="round" />
      {!owl && !panda && <ellipse cx="80" cy="138" rx="20" ry="15" style={{ fill: light }} />}
      {owl && <path d="M62 152 C60 132 68 122 80 122 C92 122 100 132 98 152 Z" style={{ fill: light }} />}
      {owl && (
        <g style={{ stroke: mix(color, 60, "black") }} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.5">
          <path d="M72 134 q4 4 8 0 q4 4 8 0" />
          <path d="M70 142 q5 4 10 0 q5 4 10 0" />
        </g>
      )}

      {/* atuendos (sobre el cuerpo) */}
      {outfit === "hoodie" && (
        <g>
          <path d="M44 154 C40 128 54 110 80 110 C106 110 120 128 116 154 Z" style={{ fill: "var(--accent)", stroke: mix("var(--accent)", 65, "black") }} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M62 140 h36 v10 h-36 z" style={{ fill: mix("var(--accent)", 80, "black") }} />
          <path d="M74 112 l-2 18 M86 112 l2 18" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}
      {outfit === "sweater" && (
        <g>
          <path d="M44 154 C40 128 54 110 80 110 C106 110 120 128 116 154 Z" fill="#c2283c" stroke="#7d1726" strokeWidth={sw} strokeLinejoin="round" />
          <path d="M50 130 h60" stroke="#fff" strokeWidth="5" />
          <path d="M56 130 l4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4 4 4 4 -4 4 4" fill="none" stroke="#1f7a4a" strokeWidth="2.4" />
          <path d="M80 140 l3 6 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1z" fill="#ffd34d" />
        </g>
      )}
      {outfit === "labcoat" && (
        <g>
          <path d="M44 154 C40 128 54 110 80 110 C106 110 120 128 116 154 Z" fill="#fbfdff" stroke="#9aa7b8" strokeWidth={sw} strokeLinejoin="round" />
          <path d="M80 112 L70 132 L80 154 M80 112 L90 132 L80 154" fill="none" stroke="#9aa7b8" strokeWidth="2" />
          <rect x="94" y="132" width="12" height="9" rx="2" fill="none" stroke="#9aa7b8" strokeWidth="2" />
          <path d="M97 128 v6" stroke="var(--brand)" strokeWidth="2.4" strokeLinecap="round" />
        </g>
      )}
      {outfit === "suit" && (
        <g>
          <path d="M44 154 C40 128 54 110 80 110 C106 110 120 128 116 154 Z" fill="#2b3445" stroke="#161c26" strokeWidth={sw} strokeLinejoin="round" />
          <path d="M70 112 L80 140 L90 112 Z" fill="#fff" />
          <path d="M77 118 h6 l-1 4 2 14 -4 4 -4 -4 2 -14z" style={{ fill: "var(--brand)" }} />
        </g>
      )}

      {/* bufanda (sobre el cuerpo, bajo la cabeza) */}
      {accessory === "scarf" && (
        <g>
          <path d="M50 114 Q80 128 110 114 L112 126 Q80 140 48 126 Z" style={{ fill: "var(--brand)", stroke: mix("var(--brand)", 70, "black") }} strokeWidth="2" strokeLinejoin="round" />
          <path d="M94 124 l12 0 l2 22 q-8 4 -14 0 z" style={{ fill: mix("var(--brand)", 82, "black") }} />
          <path d="M60 120 l4 6 M72 124 l3 6 M86 124 l-2 6" stroke="#fff" strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* patitas abajo (al celebrar se dibujan delante, saludando) */}
      {!cheer && <Paws cheer={false} fill={panda ? patch : owl ? shade : fur} line={line} owl={owl} />}

      {/* orejas */}
      {(bear || panda) && (
        <g className="mascot-ears">
          <circle cx="36" cy="36" r="17" style={{ fill: panda ? patch : fur, stroke: line }} strokeWidth={sw} />
          <circle cx="124" cy="36" r="17" style={{ fill: panda ? patch : fur, stroke: line }} strokeWidth={sw} />
          {bear && <circle cx="36" cy="36" r="8.5" style={{ fill: light }} />}
          {bear && <circle cx="124" cy="36" r="8.5" style={{ fill: light }} />}
        </g>
      )}
      {beaver && (
        <g className="mascot-ears">
          <circle cx="38" cy="38" r="12" style={{ fill: shade, stroke: line }} strokeWidth={sw} />
          <circle cx="122" cy="38" r="12" style={{ fill: shade, stroke: line }} strokeWidth={sw} />
          <circle cx="38" cy="38" r="5.5" style={{ fill: light }} />
          <circle cx="122" cy="38" r="5.5" style={{ fill: light }} />
        </g>
      )}
      {fox && (
        <g className="mascot-ears">
          <path d="M26 58 C22 34 26 14 36 8 C46 14 60 28 66 40 Z" style={{ fill: color, stroke: line }} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M34 46 C32 32 34 22 38 18 C44 24 50 32 54 40 Z" fill="#fff4ea" />
          <path d="M134 58 C138 34 134 14 124 8 C114 14 100 28 94 40 Z" style={{ fill: color, stroke: line }} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M126 46 C128 32 126 22 122 18 C116 24 110 32 106 40 Z" fill="#fff4ea" />
        </g>
      )}
      {owl && (
        <g className="mascot-ears">
          <path d="M34 50 C28 34 30 20 36 12 C44 22 54 32 60 40 Z" style={{ fill: shade, stroke: line }} strokeWidth={sw} strokeLinejoin="round" />
          <path d="M126 50 C132 34 130 20 124 12 C116 22 106 32 100 40 Z" style={{ fill: shade, stroke: line }} strokeWidth={sw} strokeLinejoin="round" />
        </g>
      )}

      {/* cabeza */}
      <path d="M80 22 C118 22 140 44 140 74 C140 104 114 122 80 122 C46 122 20 104 20 74 C20 44 42 22 80 22 Z" style={{ fill: fur, stroke: line }} strokeWidth={sw} />
      {/* brillo suave en la frente */}
      <ellipse cx="58" cy="40" rx="11" ry="5.5" fill="#fff" opacity={panda ? 0.6 : 0.14} transform="rotate(-20 58 40)" />

      {/* hocico / cara clara */}
      {fox && <path d="M26 84 C40 112 62 118 80 118 C98 118 120 112 134 84 C118 96 102 98 80 98 C58 98 42 96 26 84 Z" fill="#fff8f0" />}
      {(bear || beaver) && <ellipse cx="80" cy="98" rx="22" ry="15" style={{ fill: light }} />}
      {owl && <path d="M80 50 C96 50 112 60 112 80 C112 98 98 110 80 110 C62 110 48 98 48 80 C48 60 64 50 80 50 Z" style={{ fill: light }} opacity="0.9" />}

      {/* manchas del panda */}
      {panda && (
        <g style={{ fill: patch }}>
          <ellipse cx="57" cy="80" rx="15" ry="19" transform="rotate(28 57 80)" />
          <ellipse cx="103" cy="80" rx="15" ry="19" transform="rotate(-28 103 80)" />
        </g>
      )}

      {/* mejillas */}
      <g className={cheer ? "mascot-blush" : ""} opacity={panda ? 0.55 : 0.6}>
        <ellipse cx="40" cy="98" rx="10" ry="6" fill="#ff8fab" />
        <ellipse cx="120" cy="98" rx="10" ry="6" fill="#ff8fab" />
      </g>

      <Eyes mood={mood} owl={owl} panda={panda} />
      {owl ? <Beak mood={mood} /> : <NoseMouth mood={mood} beaver={beaver} />}

      {cheer && <Paws cheer fill={panda ? patch : owl ? shade : fur} line={line} owl={owl} />}

      {/* accesorios de cabeza */}
      {accessory === "toque" && (
        <g>
          <path d="M28 52 C26 24 50 10 80 10 C110 10 134 24 132 52 C110 44 50 44 28 52 Z" style={{ fill: "var(--brand)", stroke: mix("var(--brand)", 65, "black") }} strokeWidth="2.4" />
          <path d="M26 48 C52 38 108 38 134 48 L135 62 C108 52 52 52 25 62 Z" style={{ fill: mix("var(--brand)", 80, "black") }} />
          <path d="M40 46 l0 12 M54 43 l0 12 M68 41 l0 12 M80 41 l0 12 M92 41 l0 12 M106 43 l0 12 M120 46 l0 12" stroke="#fff" strokeOpacity="0.25" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="80" cy="10" r="10" fill="#fff" stroke="#00000018" strokeWidth="2" />
        </g>
      )}
      {accessory === "glasses" && (
        <g fill="#fff" fillOpacity="0.18" stroke={INK} strokeWidth="3">
          <circle cx="60" cy="80" r="16" />
          <circle cx="100" cy="80" r="16" />
          <path d="M76 79 Q80 74 84 79" fill="none" />
        </g>
      )}
      {accessory === "headphones" && (
        <g>
          <path d="M24 82 C22 30 52 18 80 18 C108 18 138 30 136 82" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <rect x="12" y="66" width="20" height="34" rx="9" style={{ fill: "var(--accent)", stroke: INK }} strokeWidth="2.5" />
          <rect x="128" y="66" width="20" height="34" rx="9" style={{ fill: "var(--accent)", stroke: INK }} strokeWidth="2.5" />
        </g>
      )}

      {accessory === "crown" && (
        <g>
          <path d="M50 30 L56 6 L70 22 L80 2 L90 22 L104 6 L110 30 Z" fill="#ffcf3f" stroke="#b8860b" strokeWidth="2.4" strokeLinejoin="round" />
          <circle cx="80" cy="20" r="3.5" fill="#e0457b" />
          <circle cx="62" cy="24" r="2.5" fill="#4aa8f0" />
          <circle cx="98" cy="24" r="2.5" fill="#4aa8f0" />
        </g>
      )}
      {accessory === "cap" && (
        <g>
          <path d="M34 50 C34 24 56 14 80 14 C104 14 126 24 126 50 Z" style={{ fill: "var(--accent)", stroke: mix("var(--accent)", 65, "black") }} strokeWidth="2.4" />
          <path d="M100 46 C122 42 146 46 150 54 C132 56 112 54 96 52 Z" style={{ fill: mix("var(--accent)", 80, "black") }} />
          <circle cx="80" cy="15" r="4" style={{ fill: mix("var(--accent)", 70, "black") }} />
        </g>
      )}
      {accessory === "santa" && (
        <g>
          <path d="M30 50 C34 20 60 8 90 12 C110 16 126 30 136 46 C138 54 130 58 126 52 C118 40 110 34 104 32 C108 40 110 46 130 50 Z" fill="#d8283f" stroke="#8f1526" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M26 48 C52 38 108 38 134 48 L135 60 C108 52 52 52 25 60 Z" fill="#fff" stroke="#e5e5e5" strokeWidth="1.5" />
          <circle cx="132" cy="54" r="8" fill="#fff" stroke="#e5e5e5" strokeWidth="1.5" />
        </g>
      )}
      {accessory === "earmuffs" && (
        <g>
          <path d="M26 70 C26 30 52 16 80 16 C108 16 134 30 134 70" fill="none" stroke="#c9ced8" strokeWidth="6" strokeLinecap="round" />
          <circle cx="24" cy="78" r="15" fill="#ff9ec0" stroke="#d1678f" strokeWidth="2.4" />
          <circle cx="136" cy="78" r="15" fill="#ff9ec0" stroke="#d1678f" strokeWidth="2.4" />
        </g>
      )}
      {accessory === "flower" && (
        <g transform="translate(118 40)">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx="0" cy="-9" rx="6" ry="9" fill="#ffb3cf" stroke="#e06b98" strokeWidth="1.6" transform={`rotate(${r})`} />
          ))}
          <circle r="5" fill="#ffd34d" />
        </g>
      )}
      {accessory === "wizard" && (
        <g>
          <path d="M30 52 L80 -26 L130 52 Z" fill="#3b2f7a" stroke="#221a4d" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M24 52 C52 42 108 42 136 52 L134 60 C108 52 52 52 26 60 Z" fill="#221a4d" />
          <path d="M78 8 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z M96 30 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#ffd34d" />
        </g>
      )}
      {accessory === "bowtie" && (
        <g>
          <path d="M80 116 L62 106 L62 128 Z M80 116 L98 106 L98 128 Z" fill="#e0457b" stroke="#9b2350" strokeWidth="2" strokeLinejoin="round" />
          <circle cx="80" cy="117" r="5" fill="#c23268" />
        </g>
      )}

      {/* efectos de ánimo */}
      {cheer && (
        <g>
          <path className="mascot-twinkle" d="M18 26 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ffd34d" />
          <path className="mascot-twinkle" style={{ animationDelay: "0.35s" }} d="M142 20 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ffd34d" />
          <path className="mascot-twinkle" style={{ animationDelay: "0.7s" }} d="M148 78 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ff8fab" />
          <path className="mascot-twinkle" style={{ animationDelay: "1s" }} d="M10 80 c0 -4 6 -4 6 0 c0 -4 6 -4 6 0 c0 4 -6 8 -6 8 c0 0 -6 -4 -6 -8z" fill="#ff6b8b" />
        </g>
      )}
      {mood === "oops" && <path className="mascot-drop" d="M132 44 q7 11 0 18 q-7 -7 0 -18z" fill="#8fd3ff" stroke="#5aa9d6" strokeWidth="1.2" />}
      {mood === "think" && (
        <g fill="#fff" stroke={INK} strokeWidth="2">
          <circle cx="132" cy="40" r="3" />
          <circle cx="140" cy="28" r="5" />
          <ellipse cx="148" cy="12" rx="10" ry="7" />
        </g>
      )}
      {mood === "sleep" && (
        <g fill={INK} fontWeight="900" fontFamily="system-ui, sans-serif">
          <text className="mascot-z" x="118" y="34" fontSize="16">z</text>
          <text className="mascot-z" style={{ animationDelay: "0.6s" }} x="132" y="20" fontSize="12">z</text>
        </g>
      )}
    </svg>
  );
}

function Paws({ cheer, fill, line, owl }: { cheer: boolean; fill: string; line: string; owl: boolean }) {
  if (owl)
    return (
      <g style={{ fill, stroke: line }} strokeWidth="2.4" strokeLinejoin="round">
        <path className={cheer ? "mascot-wave-l" : ""} style={{ transformOrigin: "50px 118px" }} d={cheer ? "M50 118 C36 108 30 92 34 84 C42 90 50 104 56 116 Z" : "M50 118 C40 126 38 140 44 148 C50 140 54 128 56 120 Z"} />
        <path className={cheer ? "mascot-wave-r" : ""} style={{ transformOrigin: "110px 118px" }} d={cheer ? "M110 118 C124 108 130 92 126 84 C118 90 110 104 104 116 Z" : "M110 118 C120 126 122 140 116 148 C110 140 106 128 104 120 Z"} />
      </g>
    );
  return cheer ? (
    <g style={{ fill, stroke: line }} strokeWidth="2.4">
      <g className="mascot-wave-l" style={{ transformOrigin: "44px 116px" }}>
        <ellipse cx="24" cy="98" rx="11" ry="13" transform="rotate(-24 24 98)" />
        <path d="M18 92 q3 -3 6 0 M24 90 q3 -3 6 0" fill="none" strokeWidth="1.6" opacity="0.5" />
      </g>
      <g className="mascot-wave-r" style={{ transformOrigin: "116px 116px" }}>
        <ellipse cx="136" cy="98" rx="11" ry="13" transform="rotate(24 136 98)" />
        <path d="M130 92 q3 -3 6 0 M136 90 q3 -3 6 0" fill="none" strokeWidth="1.6" opacity="0.5" />
      </g>
    </g>
  ) : (
    <g style={{ fill, stroke: line }} strokeWidth="2.4">
      <ellipse cx="56" cy="136" rx="10" ry="9" />
      <ellipse cx="104" cy="136" rx="10" ry="9" />
    </g>
  );
}

function Eyes({ mood, owl, panda }: { mood: Mood; owl: boolean; panda: boolean }) {
  const xs = [60, 100];
  const y = 80;
  const discs = owl ? xs.map((x) => <circle key={x} cx={x} cy={y} r="19" fill="#fff" stroke="#00000020" strokeWidth="2" />) : null;
  const curve = (x: number, up: boolean) => (up ? `M${x - 9} ${y + 3} Q${x} ${y - 9} ${x + 9} ${y + 3}` : `M${x - 9} ${y - 1} Q${x} ${y + 8} ${x + 9} ${y - 1}`);
  const lineColor = panda ? "#fff" : INK;
  if (mood === "cheer")
    return (
      <g>
        {discs}
        <g fill="none" stroke={owl ? INK : lineColor} strokeWidth="4.2" strokeLinecap="round">
          {xs.map((x) => (
            <path key={x} d={curve(x, true)} />
          ))}
        </g>
      </g>
    );
  if (mood === "sleep")
    return (
      <g>
        {discs}
        <g fill="none" stroke={owl ? INK : lineColor} strokeWidth="3.8" strokeLinecap="round">
          {xs.map((x) => (
            <path key={x} d={curve(x, false)} />
          ))}
        </g>
      </g>
    );
  const big = mood === "wow";
  const dx = mood === "think" ? 3 : 0;
  const dy = mood === "think" ? -3 : 0;
  const rx = big ? 10 : 8.5;
  const ry = big ? 12.5 : 10.5;
  return (
    <g>
      {discs}
      {xs.map((x) => (
        <g key={x} className="mascot-blink" style={{ transformOrigin: `${x}px ${y}px` }}>
          <ellipse cx={x + dx} cy={y + dy} rx={rx} ry={ry} fill={INK} />
          <circle cx={x + dx + 3} cy={y + dy - 4} r={big ? 4 : 3.4} fill="#fff" />
          <circle cx={x + dx - 3} cy={y + dy + 4} r="1.6" fill="#fff" opacity="0.9" />
        </g>
      ))}
      {mood === "oops" && (
        <g stroke={panda ? "#fff" : INK} strokeWidth="3" strokeLinecap="round">
          <path d="M50 62 L68 58" />
          <path d="M92 58 L110 62" />
        </g>
      )}
      {mood === "think" && (
        <g stroke={panda ? "#fff" : INK} strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M51 64 L68 64" />
          <path d="M92 61 Q100 55 109 60" />
        </g>
      )}
    </g>
  );
}

function NoseMouth({ mood, beaver }: { mood: Mood; beaver: boolean }) {
  return (
    <g>
      <path d="M74 91 Q80 87 86 91 Q84 96 80 97 Q76 96 74 91 Z" fill={INK} />
      {mood === "cheer" && (
        <g>
          <path d="M70 100 Q80 118 90 100 Z" fill="#8a2236" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M74 108 Q80 104 86 108 Q84 114 80 114 Q76 114 74 108 Z" fill="#ff8aa0" />
        </g>
      )}
      {mood === "wow" && <ellipse cx="80" cy="106" rx="5.5" ry="7" fill="#8a2236" stroke={INK} strokeWidth="2" />}
      {(mood === "happy" || mood === "sleep") && <path d="M71 100 Q75.5 105 80 100 Q84.5 105 89 100" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {mood === "think" && <path d="M74 103 Q80 100 87 104" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />}
      {mood === "oops" && <path d="M72 105 Q76 101 80 104 Q84 107 88 103" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />}
      {beaver && mood !== "cheer" && mood !== "wow" && (
        <g>
          <path d="M73 103 h14 v8 a3 3 0 0 1 -3 3 h-8 a3 3 0 0 1 -3 -3 z" fill="#fff" stroke={INK} strokeWidth="2.2" strokeLinejoin="round" />
          <path d="M80 103 L80 114" stroke={INK} strokeWidth="1.8" />
        </g>
      )}
    </g>
  );
}

function Beak({ mood }: { mood: Mood }) {
  const open = mood === "cheer" || mood === "wow";
  return (
    <g strokeLinejoin="round">
      <path d={open ? "M72 92 L88 92 L80 104 Z" : "M73 92 L87 92 L80 102 Z"} fill="#ffb23f" stroke="#c97c00" strokeWidth="2" />
      {open && <path d="M74 100 L86 100 L80 110 Z" fill="#ef9300" stroke="#c97c00" strokeWidth="2" />}
    </g>
  );
}
