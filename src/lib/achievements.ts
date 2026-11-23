// Logros: se calculan al vuelo con los datos reales (sin tabla propia), así nunca se desincronizan.

export type AchStats = { bestStreak: number; reviews: number; learned: number; mastered: number; roleplays: number; lessons: number; recordings: number; level: number; placement: number };

export type Achievement = { id: string; title: string; desc: string; icon: "star" | "flame" | "book" | "trophy" | "mic" | "chat" | "target" | "crown"; goal: number; value: (s: AchStats) => number };

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", title: "Primer paso", desc: "Completa tu primer ejercicio", icon: "star", goal: 1, value: (s) => s.reviews },
  { id: "reviews100", title: "En marcha", desc: "100 ejercicios hechos", icon: "target", goal: 100, value: (s) => s.reviews },
  { id: "reviews500", title: "Constante", desc: "500 ejercicios hechos", icon: "target", goal: 500, value: (s) => s.reviews },
  { id: "reviews2000", title: "Imparable", desc: "2 000 ejercicios hechos", icon: "target", goal: 2000, value: (s) => s.reviews },
  { id: "learned25", title: "Vocabulario vivo", desc: "Aprende 25 expresiones", icon: "book", goal: 25, value: (s) => s.learned },
  { id: "learned100", title: "Coleccionista", desc: "Aprende 100 expresiones", icon: "book", goal: 100, value: (s) => s.learned },
  { id: "learned300", title: "Diccionario andante", desc: "Aprende 300 expresiones", icon: "book", goal: 300, value: (s) => s.learned },
  { id: "mastered10", title: "Dominadas", desc: "10 expresiones dominadas", icon: "trophy", goal: 10, value: (s) => s.mastered },
  { id: "mastered50", title: "Memoria de elefante", desc: "50 expresiones dominadas", icon: "trophy", goal: 50, value: (s) => s.mastered },
  { id: "streak3", title: "Racha de 3", desc: "3 días seguidos con meta cumplida", icon: "flame", goal: 3, value: (s) => s.bestStreak },
  { id: "streak7", title: "Semana perfecta", desc: "7 días seguidos", icon: "flame", goal: 7, value: (s) => s.bestStreak },
  { id: "streak30", title: "Hábito de hierro", desc: "30 días seguidos", icon: "flame", goal: 30, value: (s) => s.bestStreak },
  { id: "roleplay1", title: "Primera conversación", desc: "Termina una conversación guiada", icon: "chat", goal: 1, value: (s) => s.roleplays },
  { id: "roleplay10", title: "Buen conversador", desc: "10 conversaciones guiadas", icon: "chat", goal: 10, value: (s) => s.roleplays },
  { id: "lessons10", title: "Lector de historias", desc: "Completa 10 historias", icon: "book", goal: 10, value: (s) => s.lessons },
  { id: "voice25", title: "Con voz propia", desc: "25 grabaciones de pronunciación", icon: "mic", goal: 25, value: (s) => s.recordings },
  { id: "placement", title: "Conoce tu nivel", desc: "Haz el test de nivel completo", icon: "target", goal: 1, value: (s) => s.placement },
  { id: "level5", title: "Nivel 5", desc: "Llega al nivel 5", icon: "crown", goal: 5, value: (s) => s.level },
  { id: "level10", title: "Leyenda", desc: "Llega al nivel 10", icon: "crown", goal: 10, value: (s) => s.level },
];

export const unlockedCount = (s: AchStats) => ACHIEVEMENTS.filter((a) => a.value(s) >= a.goal).length;
