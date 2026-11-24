import Link from "next/link";
import { IcoBolt, IcoFlame, IcoFlameOff, IcoGem } from "./Icons";

/** Contadores siempre a la vista en todas las pantallas: racha, gemas y XP. Cada uno lleva a su sección. */
export function StatBar({ streak, gems, xp }: { streak: number; gems: number; xp: number }) {
  return (
    <div className="statbar" role="group" aria-label="Tus contadores">
      <Link href="/progreso" className="stat stat-fire" aria-label={`${streak} ${streak === 1 ? "día" : "días"} de racha`}>
        {streak > 0 ? <IcoFlame size={24} className="flame" /> : <IcoFlameOff size={24} />} {streak}
      </Link>
      <Link href="/tienda" className="stat stat-gem" aria-label={`${gems} gemas. Abrir tienda`}>
        <IcoGem size={22} /> {gems}
      </Link>
      <Link href="/progreso" className="stat stat-xp" aria-label={`${xp} XP en total`}>
        <IcoBolt size={22} /> {xp.toLocaleString("es-MX")}
      </Link>
    </div>
  );
}
