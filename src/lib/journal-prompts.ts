// Preguntas opcionales del diario, actividades y estados de ánimo.

export type Prompt = {
  id: string;
  es: string;
  en?: string;
  kind: "reflexion" | "ingles" | "motivacion" | "gratitud";
};

export const PROMPTS: Prompt[] = [
  // reflexion
  { id: "r01", kind: "reflexion", es: "¿Cómo estuvo tu día en una frase?", en: "How was your day in one sentence?" },
  { id: "r02", kind: "reflexion", es: "¿Qué fue lo más difícil de hoy?" },
  { id: "r03", kind: "reflexion", es: "¿Qué te salió bien hoy?", en: "What went well today?" },
  { id: "r04", kind: "reflexion", es: "¿Qué te hizo reír hoy?" },
  { id: "r05", kind: "reflexion", es: "¿Cómo te sentiste al estudiar hoy?" },
  { id: "r06", kind: "reflexion", es: "¿Qué harías distinto si repitieras el día?" },
  { id: "r07", kind: "reflexion", es: "¿Qué te dio energía hoy?", en: "What gave you energy today?" },
  { id: "r08", kind: "reflexion", es: "¿Qué te cansó más hoy?" },
  { id: "r09", kind: "reflexion", es: "¿Cuál fue el momento más tranquilo de tu día?", en: "What was the calmest moment of your day?" },
  { id: "r10", kind: "reflexion", es: "¿Qué aprendiste hoy, aunque no sea de inglés?" },
  { id: "r11", kind: "reflexion", es: "¿Qué te preocupa y qué puedes hacer mañana al respecto?" },
  { id: "r12", kind: "reflexion", es: "¿Qué hiciste hoy solo para ti?" },
  { id: "r13", kind: "reflexion", es: "¿Qué conversación de hoy recuerdas más?" },
  { id: "r14", kind: "reflexion", es: "Describe tu día con tres palabras.", en: "Describe your day in three words." },
  { id: "r15", kind: "reflexion", es: "¿Qué pendiente te quitaste de encima hoy?" },
  { id: "r16", kind: "reflexion", es: "¿Qué te gustaría que pasara mañana?", en: "What do you want to happen tomorrow?" },
  { id: "r17", kind: "reflexion", es: "¿Hubo algo que te sorprendió hoy?" },
  { id: "r18", kind: "reflexion", es: "¿Qué necesitas para descansar bien esta noche?" },

  // ingles
  { id: "i01", kind: "ingles", es: "Escribe una frase en inglés sobre tu día.", en: "Write one sentence about your day." },
  { id: "i02", kind: "ingles", es: "¿Qué palabra nueva usarías mañana?" },
  { id: "i03", kind: "ingles", es: "¿Qué escuchaste en inglés hoy?" },
  { id: "i04", kind: "ingles", es: "¿Qué palabra en inglés se te olvidó hoy y cuál era?" },
  { id: "i05", kind: "ingles", es: "Escribe en inglés qué comiste hoy.", en: "What did you eat today?" },
  { id: "i06", kind: "ingles", es: "¿Qué frase en inglés te gustaría decir sin pensarla?" },
  { id: "i07", kind: "ingles", es: "¿En qué momento de hoy te habría servido el inglés?" },
  { id: "i08", kind: "ingles", es: "Escribe en inglés algo que harás mañana.", en: "What will you do tomorrow?" },
  { id: "i09", kind: "ingles", es: "¿Qué error de inglés notaste hoy y cómo se dice bien?" },
  { id: "i10", kind: "ingles", es: "¿Qué palabra en inglés te suena bonita?" },
  { id: "i11", kind: "ingles", es: "Traduce al inglés algo que le dijiste a alguien hoy." },
  { id: "i12", kind: "ingles", es: "¿Qué leíste en inglés hoy, aunque fuera un letrero?" },
  { id: "i13", kind: "ingles", es: "Describe en inglés el clima de hoy.", en: "How is the weather today?" },
  { id: "i14", kind: "ingles", es: "¿Qué pregunta en inglés te gustaría poder hacer en Edmonton?" },
  { id: "i15", kind: "ingles", es: "¿Qué canción o video en inglés entendiste un poco hoy?" },
  { id: "i16", kind: "ingles", es: "Escribe en inglés cómo te sientes ahora.", en: "How do you feel right now?" },
  { id: "i17", kind: "ingles", es: "¿Qué palabra de hoy quieres repasar mañana?" },
  { id: "i18", kind: "ingles", es: "Escribe en inglés una cosa que te gusta de tu casa.", en: "Name one thing you like about your home." },

  // motivacion
  { id: "m01", kind: "motivacion", es: "¿Por qué estás aprendiendo inglés?", en: "Why are you learning English?" },
  { id: "m02", kind: "motivacion", es: "¿Qué es lo primero que quieres hacer al llegar a Edmonton?" },
  { id: "m03", kind: "motivacion", es: "¿Cómo te imaginas tu vida en Canadá dentro de un año?" },
  { id: "m04", kind: "motivacion", es: "¿Qué trabajo te gustaría tener allá?" },
  { id: "m05", kind: "motivacion", es: "¿Qué te ayudaría a practicar mañana aunque haya poco tiempo?" },
  { id: "m06", kind: "motivacion", es: "¿Qué meta pequeña te pones para esta semana?", en: "What is your small goal for this week?" },
  { id: "m07", kind: "motivacion", es: "¿Qué conversación en inglés te ilusiona tener algún día?" },
  { id: "m08", kind: "motivacion", es: "¿Qué te dirías si un día no tienes ganas de estudiar?" },
  { id: "m09", kind: "motivacion", es: "¿Qué avance notaste esta semana?" },
  { id: "m10", kind: "motivacion", es: "¿Qué lugar de Edmonton te gustaría conocer primero?", en: "What place in Edmonton do you want to see first?" },
  { id: "m11", kind: "motivacion", es: "¿Cómo se apoyan como pareja para seguir estudiando?" },
  { id: "m12", kind: "motivacion", es: "¿Qué harás cuando hables inglés con más soltura?" },

  // gratitud
  { id: "g01", kind: "gratitud", es: "¿Qué agradeces de hoy?", en: "What are you thankful for today?" },
  { id: "g02", kind: "gratitud", es: "¿Quién te hizo el día más fácil?" },
  { id: "g03", kind: "gratitud", es: "¿Qué cosa pequeña disfrutaste hoy?" },
  { id: "g04", kind: "gratitud", es: "¿Qué le agradeces hoy a tu pareja?" },
  { id: "g05", kind: "gratitud", es: "¿Qué comida de hoy te supo rica?" },
  { id: "g06", kind: "gratitud", es: "¿Qué parte de tu rutina agradeces?" },
  { id: "g07", kind: "gratitud", es: "¿Qué le agradeces hoy a tu cuerpo?" },
  { id: "g08", kind: "gratitud", es: "¿Qué recuerdo bonito te vino a la mente hoy?" },
  { id: "g09", kind: "gratitud", es: "¿Qué ayuda recibiste hoy?", en: "What help did you get today?" },
  { id: "g10", kind: "gratitud", es: "¿Qué reconoces de tu esfuerzo de esta semana?" },
  { id: "g11", kind: "gratitud", es: "¿Qué cosa de México agradeces hoy?" },
  { id: "g12", kind: "gratitud", es: "¿Qué momento de hoy te gustaría repetir?" },
];

// FNV-1a de 32 bits: determinista y sin dependencias.
const hash = (s: string): number => {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
};

/** n preguntas distintas para el día; siempre exactamente una de tipo "ingles" (la primera). */
export const promptsForDay = (day: string, n = 3): Prompt[] => {
  const ingles = PROMPTS.filter((p) => p.kind === "ingles");
  const pool = PROMPTS.filter((p) => p.kind !== "ingles");
  const count = Math.max(1, Math.min(Math.floor(n) || 1, pool.length + 1));
  const out: Prompt[] = [ingles[hash(`${day}|ingles`) % ingles.length]];
  let seed = hash(`${day}|resto`);
  while (out.length < count) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    out.push(pool.splice(seed % pool.length, 1)[0]);
  }
  return out;
};

export type Activity = { id: string; es: string };

export const ACTIVITIES: Activity[] = [
  { id: "ingles", es: "Inglés" },
  { id: "trabajo", es: "Trabajo" },
  { id: "ejercicio", es: "Ejercicio" },
  { id: "series", es: "Series" },
  { id: "cocinar", es: "Cocinar" },
  { id: "amigos", es: "Amigos" },
  { id: "pareja", es: "Pareja" },
  { id: "mascotas", es: "Mascotas" },
  { id: "leer", es: "Leer" },
  { id: "musica", es: "Música" },
  { id: "descanso", es: "Descanso" },
  { id: "compras", es: "Compras" },
  { id: "limpieza", es: "Limpieza" },
  { id: "salir", es: "Salir" },
  { id: "familia", es: "Familia" },
  { id: "viaje", es: "Viaje" },
];

export const MOODS = [
  { id: 1, es: "Muy mal" },
  { id: 2, es: "Mal" },
  { id: 3, es: "Normal" },
  { id: 4, es: "Bien" },
  { id: 5, es: "Excelente" },
] as const;
