// Áreas de interés (basadas en content/source/plan-edmonton-24-areas.md + biología).
// Cada persona elige las suyas; las sesiones priorizan expresiones de esas áreas.

export type AreaGroup = "vida" | "trabajo" | "ciencia" | "extra";

export const AREAS = [
  { id: "conversacion", label: "Conversaciones cotidianas", group: "vida" },
  { id: "relaciones", label: "Amigos, pareja y familia", group: "vida" },
  { id: "restaurantes", label: "Restaurantes y cafeterías", group: "vida" },
  { id: "compras", label: "Supermercado y compras", group: "vida" },
  { id: "salud", label: "Médico, farmacia y salud", group: "vida" },
  { id: "noticias", label: "Noticias y actualidad", group: "vida" },
  { id: "vivienda", label: "Vivienda y renta en Canadá", group: "vida" },
  { id: "bancos", label: "Bancos y trámites", group: "vida" },
  { id: "transporte", label: "Transporte, clima e invierno", group: "vida" },
  { id: "viajes", label: "Viajes y aeropuertos", group: "vida" },
  { id: "emergencias", label: "Emergencias y problemas diarios", group: "vida" },
  { id: "canada", label: "Inglés canadiense", group: "vida" },
  { id: "series", label: "Entender series y películas", group: "extra" },
  { id: "entrevistas", label: "Entrevistas de trabajo", group: "trabajo" },
  { id: "reuniones", label: "Inglés profesional y reuniones", group: "trabajo" },
  { id: "analisis", label: "Análisis de sistemas empresariales", group: "trabajo" },
  { id: "automatizacion", label: "Automatizaciones e integraciones", group: "trabajo" },
  { id: "software", label: "Desarrollo web y software", group: "trabajo" },
  { id: "devops", label: "Servidores, nube y DevOps", group: "trabajo" },
  { id: "crm", label: "CRM, ventas y marketing", group: "trabajo" },
  { id: "datos", label: "Bases de datos e inventarios", group: "trabajo" },
  { id: "soporte", label: "Atención al cliente y soporte", group: "trabajo" },
  { id: "proyectos", label: "Gestión de proyectos", group: "trabajo" },
  { id: "ciencia", label: "Ciencia, física y datos", group: "ciencia" },
  { id: "biologia", label: "Biología y trabajo de campo", group: "ciencia" },
] as const satisfies readonly { id: string; label: string; group: AreaGroup }[];

export type AreaId = (typeof AREAS)[number]["id"];
export const AREA_IDS = AREAS.map((a) => a.id) as AreaId[];
export const AREA_LABEL = Object.fromEntries(AREAS.map((a) => [a.id, a.label])) as Record<string, string>;
export const GROUP_LABEL: Record<AreaGroup, string> = { vida: "Vida diaria en Canadá", trabajo: "Trabajo y tecnología", ciencia: "Ciencia", extra: "Extra" };

/** Áreas implícitas para ítems antiguos que solo tienen `topic`. */
export const TOPIC_AREAS: Record<string, AreaId[]> = {
  daily: ["conversacion"],
  work: ["reuniones"],
  tech: ["software"],
  travel: ["viajes"],
  canada: ["canada"],
  interview: ["entrevistas"],
  social: ["relaciones"],
  informal: ["conversacion", "series"],
  money: ["bancos"],
  health: ["salud"],
  feelings: ["relaciones"],
  study: ["ciencia"],
  home: ["vivienda"],
  food: ["restaurantes"],
};
