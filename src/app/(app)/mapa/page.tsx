import Link from "next/link";
import { BookOpen, Briefcase, Check, ChevronDown, Flag, MessagesSquare, Newspaper, RotateCcw } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { mapOf } from "@/lib/map";
import { MAP_LEVELS, nextStop, pct, type ContentStop, type Island } from "@/lib/map-rules";
import { Bar } from "@/components/ui";
import { MapChest, MapTrophy } from "@/components/map/MapGifts";

export const metadata = { title: "Tu viaje" };

const KIND = {
  lesson: { Icon: BookOpen, label: "Lección" },
  mission: { Icon: Flag, label: "Misión" },
  interview: { Icon: Briefcase, label: "Entrevista" },
  roleplay: { Icon: MessagesSquare, label: "Conversación" },
  reading: { Icon: Newspaper, label: "Lectura" },
} as const;
/**
 * Geometría del camino (en rem): cada fila mide ROW; la fila de «sigue aquí» suma espacio arriba para su globito.
 * El zigzag (WAVE) desplaza el centro de cada parada; el SVG traza una curva continua de centro a centro.
 */
const WAVE = [0.3, 3, 5, 3];
const ROW = 6.6;
const HERE_EXTRA = 1.7;
const NODE = 3.75;
const NODE_HERE = 4.25;

function statusOf(isl: Island, mine: number) {
  const i = MAP_LEVELS.indexOf(isl.level);
  if (isl.total > 0 && isl.done === isl.total) return { text: "Completa", cls: "bg-good-soft text-good" };
  if (i === mine) return { text: "Tu nivel", cls: "bg-brand-soft text-brand-ink" };
  if (i < mine) return { text: "Superada por tu nivel inicial · abierta", cls: "bg-surface-2 text-muted" };
  return { text: "Más adelante · abierta", cls: "bg-surface-2 text-muted" };
}

type Row = { key: string; x: number; here: boolean; done: boolean; h: number; extra: number };

/** Curva continua que une los centros de las paradas: verde y sólida en lo recorrido, de puntos en lo pendiente. */
function SectionPath({ rows }: { rows: Row[] }) {
  const pts: { x: number; y: number; done: boolean }[] = [];
  let y = 0;
  for (const r of rows) {
    const size = r.here ? NODE_HERE : NODE;
    pts.push({ x: r.x + size / 2, y: y + r.extra + ROW / 2, done: r.done });
    y += r.h;
  }
  const W = Math.max(...pts.map((p) => p.x)) + 3;
  const seg = (i: number) => {
    const a = pts[i];
    const b = pts[i + 1];
    const k = (b.y - a.y) * 0.55;
    return `M${a.x} ${a.y} C${a.x} ${a.y + k} ${b.x} ${b.y - k} ${b.x} ${b.y}`;
  };
  return (
    <svg className="map-svg" width={`${W}rem`} height={`${y}rem`} viewBox={`0 0 ${W} ${y}`} aria-hidden focusable="false">
      {pts.slice(0, -1).map((_, i) => (
        <path key={`t${i}`} d={seg(i)} className="map-track" />
      ))}
      {pts.slice(0, -1).map((p, i) =>
        p.done ? (
          <g key={`d${i}`}>
            <path d={seg(i)} className="map-trail" />
          </g>
        ) : (
          <path key={`p${i}`} d={seg(i)} className="map-dots" />
        ),
      )}
    </svg>
  );
}

function StopRow({ s, row }: { s: ContentStop; row: Row }) {
  const { Icon, label } = KIND[s.kind];
  return (
    <li className="map-row" style={{ height: `${row.h}rem`, paddingTop: `${row.extra}rem`, paddingLeft: `${row.x}rem` }}>
      <Link href={s.href} className="group flex h-full items-center gap-4" aria-label={`${label}: ${s.title}${s.done ? " (hecha)" : row.here ? " (sigue aquí)" : ""}`}>
        <span className={`map-node k-${s.kind} ${s.done ? "is-done" : row.here ? "is-here" : ""}`} aria-hidden>
          {row.here && <span className="map-bubble">Empieza aquí</span>}
          <Icon size={row.here ? 26 : 23} strokeWidth={2.2} />
          {s.done && (
            <span className="map-done">
              <Check size={12} strokeWidth={4} />
            </span>
          )}
        </span>
        <span className="min-w-0">
          <b className="line-clamp-2 block leading-snug group-hover:underline">{s.title}</b>
          <span className="mt-0.5 block text-xs font-semibold text-muted">{s.sub ?? label}</span>
        </span>
      </Link>
    </li>
  );
}

/** «Tu viaje»: todo el contenido, de A1 a C2, en islas por nivel y secciones con regalos. Ningún nivel se oculta. */
export default async function MapPage() {
  const profile = await requireProfile();
  const islands = await mapOf(profile.userId);
  const mine = Math.max(0, MAP_LEVELS.indexOf(profile.level as (typeof MAP_LEVELS)[number]));
  const next = nextStop(islands, profile.level);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold">Tu viaje</h1>
        <p className="mt-1 max-w-prose text-muted">
          Todo lo que hay en Fluye, de A1 a C2, en una isla por nivel. Cada sección mezcla lecciones, misiones, conversaciones y lecturas; al terminarla abres un cofre gratis. Puedes entrar a cualquier parada, de cualquier nivel.
        </p>
      </header>

      <nav aria-label="Niveles" className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {islands.map((isl) => (
          <a key={isl.level} href={`#isla-${isl.level}`} className={`module flex flex-col gap-1 p-3 ${MAP_LEVELS.indexOf(isl.level) === mine ? "ring-2 ring-brand" : ""}`}>
            <span className="flex items-baseline justify-between">
              <b className="font-display text-xl font-extrabold">{isl.level}</b>
              <span className="text-xs font-bold text-muted">{isl.total ? `${pct(isl.done, isl.total)} %` : "—"}</span>
            </span>
            <Bar value={isl.done} max={isl.total || 1} label={`Avance en ${isl.level}`} className="h-2" />
          </a>
        ))}
      </nav>

      {next && (
        <Link href={next.stop.href} className="hero-card flex items-center gap-4 p-5">
          <span className={`map-node k-${next.stop.kind} is-here shrink-0`} aria-hidden>
            {(() => {
              const I = KIND[next.stop.kind].Icon;
              return <I size={22} />;
            })()}
          </span>
          <span className="min-w-0">
            <span className="eyebrow">Sigue aquí · {next.island}</span>
            <b className="block text-lg leading-tight">{next.stop.title}</b>
            <span className="block text-sm text-muted">{next.stop.sub}</span>
          </span>
        </Link>
      )}

      {islands.map((isl) => {
        const st = statusOf(isl, mine);
        const isMine = MAP_LEVELS.indexOf(isl.level) === mine;
        return (
          <details key={isl.level} id={`isla-${isl.level}`} className={`map-island module overflow-hidden`} open={isMine || undefined}>
            <summary className="flex cursor-pointer list-none flex-col gap-2.5 p-5">
              <span className="flex flex-wrap items-center gap-2">
                <b className="font-display text-3xl font-extrabold">{isl.level}</b>
                <span className="text-lg font-black">{isl.name}</span>
                <ChevronDown size={20} className="map-chev ml-auto text-muted" aria-hidden />
              </span>
              <span className={`chip w-fit text-xs ${st.cls}`}>{st.text}</span>
              <Bar value={isl.done} max={isl.total || 1} label={`Paradas hechas en ${isl.level}`} />
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                <span>
                  <b className="text-text">{isl.done}</b> de {isl.total} paradas ({pct(isl.done, isl.total)} %)
                </span>
                <span>
                  <b className="text-text">{isl.words.known}</b> de {isl.words.total} expresiones {isl.level} en tus tarjetas
                </span>
              </span>
            </summary>
            <div className="flex flex-col gap-6 border-t border-line p-5">
              {isl.sections.length === 0 && <p className="text-muted">Todavía no hay lecciones de este nivel. Cuando las agreguemos aparecerán aquí; mientras, tus expresiones {isl.level} sí cuentan arriba.</p>}
              {isl.sections.map((s) => (
                <section key={s.id} aria-labelledby={`sec-${s.id}`} className="flex flex-col gap-3">
                  <h2 id={`sec-${s.id}`} className="map-section-head">
                    <span className="map-ring-mini" style={{ ["--p" as string]: pct(s.done, s.total) }} aria-hidden>
                      <span>{s.done}/{s.total}</span>
                    </span>
                    <span className="text-lg font-black">Sección {s.n}</span>
                    <span className="sr-only">
                      {s.done} de {s.total} paradas hechas
                    </span>
                  </h2>
                  {(() => {
                    const hereIdx = s.stops.findIndex((st) => next?.stop.id === st.id);
                    const rows: Row[] = [...s.stops.map((st, i) => ({ key: st.id, done: st.done, here: i === hereIdx })), { key: "repaso", done: s.chest.ready, here: false }, { key: "cofre", done: s.chest.claimed, here: false }].map((r, i) => ({ ...r, x: WAVE[i % WAVE.length], extra: r.here ? HERE_EXTRA : 0, h: ROW + (r.here ? HERE_EXTRA : 0) }));
                    const nStops = s.stops.length;
                    return (
                      <div className="map-path">
                        <SectionPath rows={rows} />
                        <ol className="relative">
                          {s.stops.map((stop, i) => (
                            <StopRow key={stop.id} s={stop} row={rows[i]} />
                          ))}
                          <li className="map-row" style={{ height: `${ROW}rem`, paddingLeft: `${rows[nStops].x}rem` }}>
                            <Link href="/repaso" className="group flex h-full items-center gap-4">
                              <span className={`map-node map-review ${s.chest.ready ? "is-done" : ""}`} aria-hidden>
                                <RotateCcw size={24} strokeWidth={2.3} />
                              </span>
                              <span>
                                <b className="block leading-snug group-hover:underline">Repaso</b>
                                <span className="mt-0.5 block text-xs font-semibold text-muted">Afianza lo que viste en esta sección</span>
                              </span>
                            </Link>
                          </li>
                          <li className="map-row flex items-center" style={{ height: `${ROW}rem`, paddingLeft: `${rows[nStops + 1].x}rem` }}>
                            <MapChest section={s.id} chestId={s.chest.chestId} ready={s.chest.ready} claimed={s.chest.claimed} n={s.n} />
                          </li>
                        </ol>
                      </div>
                    );
                  })()}
                </section>
              ))}
              {isl.total > 0 && <MapTrophy level={isl.level} gems={isl.trophy.gems} ready={isl.trophy.ready} claimed={isl.trophy.claimed} name={isl.name} />}
            </div>
          </details>
        );
      })}
    </div>
  );
}
