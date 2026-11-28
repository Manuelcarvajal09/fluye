// Reglas puras de la economía (sin base de datos), para poder probarlas y simularlas.
// Equilibrio (nov. 2026, segunda vuelta): un día normal de estudio ≈ 45 gemas (estudio + meta + retos), ≈ 375 por semana con
// los retos semanales. Con eso: 1–2 cofres aurora por semana, una mascota rara en ~2 semanas y una legendaria en más de un mes.

/** Gemas por estudiar: 1 por cada 16 XP del día, con un tope diario. Se calcula sobre el total del día (no por respuesta). */
export const STUDY_GEMS = { xpPerGem: 16, dailyCap: 25 } as const;

export const studyGemsFor = (dayXp: number) => Math.max(0, Math.min(STUDY_GEMS.dailyCap, Math.floor(dayXp / STUDY_GEMS.xpPerGem)));
