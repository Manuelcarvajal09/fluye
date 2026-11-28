// Reglas puras de la economía (sin base de datos), para poder probarlas y simularlas.
// Equilibrio de la Fase 3: ~2 sesiones al día ≈ 40–60 gemas en total (estudio + meta + retos); una pieza rara cada 2–3 días.

/** Gemas por estudiar: 1 por cada 12 XP del día, con un tope diario. Se calcula sobre el total del día (no por respuesta). */
export const STUDY_GEMS = { xpPerGem: 12, dailyCap: 40 } as const;

export const studyGemsFor = (dayXp: number) => Math.max(0, Math.min(STUDY_GEMS.dailyCap, Math.floor(dayXp / STUDY_GEMS.xpPerGem)));
