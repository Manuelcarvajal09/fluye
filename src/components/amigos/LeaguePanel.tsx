import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Mascot } from "../Mascot";
import { IcoTrophy } from "../Icons";

export type LeagueEntry = { name: string; species: string; wear: string[]; xp: number; me: boolean; friend: boolean; zone: "up" | "stay" | "down" };
export type LeagueData = {
  tier: number;
  name: string;
  week: string;
  endsAt: string;
  entries: LeagueEntry[];
  last: { tier: number; result: "up" | "stay" | "down"; rank: number | null; size: number | null; gems: number; seen: boolean; week: string } | null;
};

export const LEAGUE_NAMES = ["Semilla", "Brote", "Hoja", "Arce", "Pino", "Glaciar", "Aurora", "Cumbre"];
/** Color de cada liga (de madera clara a cristal y oro) mientras llegan las insignias de Codex. */
export const LEAGUE_TINT = ["#b08a5a", "#6aa84f", "#3d9a5b", "#c8541f", "#2f6f5e", "#5aa9d6", "#8a6cf0", "#d4a017"];

const ZONE = {
  up: { label: "Subes", cls: "bg-good-soft text-good", icon: ArrowUp },
  stay: { label: "Te mantienes", cls: "bg-surface-2 text-muted", icon: Minus },
  down: { label: "Bajas", cls: "bg-bad-soft text-bad", icon: ArrowDown },
} as const;

function daysLeft(endsAt: string) {
  const end = Date.parse(`${endsAt}T23:59:59-07:00`);
  const d = Math.ceil((end - Date.now()) / 86_400_000);
  return d <= 0 ? "Termina hoy" : d === 1 ? "Termina mañana" : `Quedan ${d} días`;
}

/** Liga semanal: nivel, tabla del grupo con zonas de subida y bajada, amigos destacados y el resultado de la semana pasada. */
export function LeaguePanel({ league }: { league: LeagueData }) {
  const top = Math.max(1, ...league.entries.map((e) => e.xp));
  const last = league.last;
  return (
    <div className="module flex flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl" style={{ background: `color-mix(in oklab, ${LEAGUE_TINT[league.tier]} 22%, transparent)`, color: LEAGUE_TINT[league.tier] }}>
          <IcoTrophy size={30} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-2xl font-black">Liga {league.name}</h2>
          <p className="text-xs font-bold text-muted">
            {daysLeft(league.endsAt)} · Compites con todas las cuentas de tu liga
          </p>
        </div>
      </div>
      {last && (
        <p className={`rounded-[var(--r-md)] px-3 py-2 text-sm font-bold ${last.result === "up" ? "bg-good-soft text-good" : last.result === "down" ? "bg-bad-soft text-bad" : "bg-surface-2"}`}>
          La semana pasada {last.result === "up" ? `subiste de ${LEAGUE_NAMES[last.tier]} a ${league.name} (+${last.gems} gemas)` : last.result === "down" ? `bajaste de ${LEAGUE_NAMES[last.tier]} a ${league.name}` : `te mantuviste en ${league.name}`}
          {last.rank && last.size ? ` · quedaste ${last.rank}.º de ${last.size}` : ""}.
        </p>
      )}
      <ol className="flex flex-col gap-2">
        {league.entries.map((r, i) => {
          // Con 0 XP la zona es "bajas", pero a mitad de semana se dice en positivo: aún puede estudiar.
          const z = r.zone === "down" && r.xp === 0 ? { ...ZONE.down, label: "Sin XP aún" } : ZONE[r.zone];
          const Icon = z.icon;
          return (
            <li key={`${r.name}-${i}`} className={`flex items-center gap-3 rounded-[var(--r-md)] p-2 ${r.me ? "bg-brand-soft" : r.friend ? "bg-accent-soft/50" : ""}`}>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full font-black ${i === 0 ? "bg-[var(--gold)] text-white" : "bg-surface-2"}`}>{i + 1}</span>
              <Mascot species={r.species} wear={r.wear} size={44} decorative />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-black">
                  {r.me ? `${r.name} (tú)` : r.name}
                  {r.friend && !r.me && <span className="chip text-xs">Amistad</span>}
                </p>
                <div className="rank-bar" aria-hidden>
                  <span style={{ width: `${(r.xp / top) * 100}%`, animationDelay: `${i * 80}ms` }} />
                </div>
              </div>
              <span className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="font-black tabular-nums">{r.xp} XP</span>
                <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 text-xs font-black ${z.cls}`}>
                  <Icon size={11} aria-hidden /> {z.label}
                </span>
              </span>
            </li>
          );
        })}
      </ol>
      <p className="text-xs text-muted">
        Cada domingo se cierra la semana. Con 5 o más activos sube el 30 % de arriba y baja el 20 % de abajo; con menos, sube quien pase el mínimo de XP de la liga. Sin estudiar en toda la semana, bajas. Subir da gemas.
      </p>
    </div>
  );
}
