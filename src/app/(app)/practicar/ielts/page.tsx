import Link from "next/link";
import { ArrowLeft, BookOpen, Ear, MessagesSquare, PenLine } from "lucide-react";
import { requireProfile } from "@/lib/user";

export const metadata = { title: "Guía del IELTS" };

/**
 * Guía del IELTS: estructura, calificación y qué practicar en Fluye. Solo datos generales y estables del examen;
 * los requisitos de migración cambian, así que se remite a la fuente oficial.
 */
const PARTS = [
  {
    icon: Ear,
    name: "Listening",
    es: "Comprensión auditiva",
    facts: "Unos 30 minutos · 4 partes · 40 preguntas. Igual en Academic y General Training.",
    what: "Conversaciones y monólogos de la vida diaria y académica, con acentos variados. Se escucha una sola vez.",
    tips: ["Lee las preguntas antes de cada parte y subraya qué tipo de dato buscas (número, nombre, lugar).", "Cuidado con las «trampas»: el hablante corrige lo que dijo («Tuesday… no, sorry, Thursday»).", "La ortografía cuenta: practica deletrear nombres y números."],
    fluye: [
      { href: "/sesion", label: "Sesión diaria (ejercicios de escuchar)" },
      { href: "/series", label: "Inglés de series sin subtítulos" },
      { href: "/practicar", label: "Conversaciones" },
    ],
  },
  {
    icon: BookOpen,
    name: "Reading",
    es: "Comprensión de lectura",
    facts: "60 minutos · 3 secciones · 40 preguntas. Los textos cambian según la versión.",
    what: "Academic: textos largos de revistas, libros y periódicos. General Training: anuncios, avisos, documentos de trabajo y un texto general más largo.",
    tips: ["Primero lee rápido para entender de qué va (skimming); luego busca el dato (scanning).", "En True / False / Not Given, «Not Given» significa que el texto no lo dice: no uses lo que tú sabes.", "Las respuestas suelen estar parafraseadas: busca sinónimos, no las mismas palabras."],
    fluye: [
      { href: "/lecturas", label: "Lecturas con glosario (A2–C2)" },
      { href: "/noticias", label: "Noticia de Canadá del día" },
      { href: "/biblioteca", label: "Biblioteca de expresiones" },
    ],
  },
  {
    icon: PenLine,
    name: "Writing",
    es: "Expresión escrita",
    facts: "60 minutos · 2 tareas. Tarea 1: al menos 150 palabras. Tarea 2: al menos 250 palabras y vale más que la 1.",
    what: "Academic, tarea 1: describir una gráfica, tabla, mapa o proceso. General Training, tarea 1: una carta (formal, semiformal o informal). En ambas, tarea 2: un ensayo de opinión o argumentación.",
    tips: ["Dedica unos 20 minutos a la tarea 1 y 40 a la tarea 2.", "Responde exactamente a lo que preguntan y da tu postura clara en la introducción y la conclusión.", "Usa conectores variados, pero sin forzarlos: la coherencia pesa tanto como la gramática."],
    fluye: [
      { href: "/practicar/gramatica", label: "Gramática: bloque de escritura" },
      { href: "/practicar/corrige", label: "Corrige la frase (errores típicos)" },
      { href: "/diario", label: "Diario: una frase en inglés al día" },
    ],
  },
  {
    icon: MessagesSquare,
    name: "Speaking",
    es: "Expresión oral",
    facts: "11 a 14 minutos · 3 partes · entrevista con una persona examinadora.",
    what: "Parte 1: preguntas sobre ti (casa, trabajo, gustos). Parte 2: hablas 1–2 minutos de un tema con un minuto para preparar. Parte 3: discusión más abstracta sobre el tema de la parte 2.",
    tips: ["Amplía tus respuestas: contesta, explica por qué y da un ejemplo.", "Si no sabes una palabra, explícala con otras (parafrasear también suma).", "Corregirte con naturalidad está bien; quedarte en silencio largo, no."],
    fluye: [
      { href: "/practicar", label: "Conversaciones (juego de rol con voz)" },
      { href: "/sonidos", label: "Pronunciación" },
      { href: "/practicar/gramatica", label: "Gramática: bloque de conversación" },
    ],
  },
];

const CRITERIA = [
  { skill: "Writing", items: ["Task Achievement / Task Response: respondes a todo lo que pide la tarea.", "Coherence and Cohesion: ideas ordenadas, párrafos claros y buenos conectores.", "Lexical Resource: vocabulario variado y preciso.", "Grammatical Range and Accuracy: estructuras variadas y con pocos errores."] },
  { skill: "Speaking", items: ["Fluency and Coherence: hablas con fluidez y tus ideas se siguen bien.", "Lexical Resource: vocabulario variado, incluidas expresiones naturales.", "Grammatical Range and Accuracy: variedad de estructuras y precisión.", "Pronunciation: se te entiende sin esfuerzo (no se pide acento nativo)."] },
];

const PLAN = [
  { level: "B1", text: "Asegura los tiempos verbales, artículos, preposiciones y preguntas. Lee y escucha a diario 15 minutos." },
  { level: "B2", text: "Conectores, cláusulas relativas, condicionales, pasiva y describir gráficas. Escribe un párrafo por semana y compáralo con los modelos." },
  { level: "C1", text: "Lenguaje prudente, nominalización, inversión y cláusulas de participio. Practica las partes 2 y 3 del speaking con tiempo." },
];

export default async function IeltsGuide() {
  await requireProfile();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/practicar" className="flex items-center gap-1 font-bold text-muted hover:text-text">
        <ArrowLeft size={18} aria-hidden /> Practicar
      </Link>
      <header>
        <h1 className="font-display text-4xl font-extrabold">Guía del IELTS</h1>
        <p className="mt-1 text-muted">El IELTS mide tu inglés en cuatro habilidades. Cada una se califica en bandas de 0 a 9 (incluidas medias bandas) y la nota global es el promedio de las cuatro.</p>
      </header>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="version">
        <h2 id="version" className="text-xl font-black">
          ¿Academic o General Training?
        </h2>
        <p>
          <b>General Training</b> es la versión para trabajar y migrar: es la que suele pedirse para la residencia permanente en Canadá. <b>Academic</b> es para estudiar en la universidad o registrarte en algunas profesiones. Listening y Speaking son iguales en las dos; cambian Reading y la tarea 1 de Writing.
        </p>
        <p className="rounded-2xl bg-sky-soft p-3 text-sm">
          Para migrar a Canadá, el resultado se convierte a niveles CLB (Canadian Language Benchmarks) y cada programa pide un mínimo distinto en cada habilidad. También se acepta el CELPIP, un examen canadiense equivalente. Los requisitos cambian: revísalos siempre en el sitio oficial del Gobierno de Canadá (IRCC) antes de inscribirte.
        </p>
      </section>

      {PARTS.map((p) => (
        <section key={p.name} className="card flex flex-col gap-3 p-5" aria-labelledby={`p-${p.name}`}>
          <h2 id={`p-${p.name}`} className="flex items-center gap-2 text-xl font-black">
            <p.icon size={22} className="text-brand-ink" aria-hidden /> <span lang="en">{p.name}</span> <span className="text-base font-bold text-muted">· {p.es}</span>
          </h2>
          <p className="font-bold">{p.facts}</p>
          <p>{p.what}</p>
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {p.tips.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            {p.fluye.map((l) => (
              <Link key={l.label} href={l.href} className="chip-btn">
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="criterios">
        <h2 id="criterios" className="text-xl font-black">
          Cómo se califican Writing y Speaking
        </h2>
        <p className="text-sm text-muted">Cuatro criterios con el mismo peso. Las unidades de gramática indican en cuál te ayudan.</p>
        {CRITERIA.map((c) => (
          <div key={c.skill}>
            <p className="mb-1 font-black" lang="en">
              {c.skill}
            </p>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
              {c.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="card flex flex-col gap-3 p-5" aria-labelledby="plan">
        <h2 id="plan" className="text-xl font-black">
          Un camino posible en Fluye
        </h2>
        <ol className="flex flex-col gap-2">
          {PLAN.map((s) => (
            <li key={s.level} className="flex gap-3 rounded-2xl bg-surface-2 p-3">
              <span className="chip h-fit shrink-0">{s.level}</span>
              <span className="text-sm">{s.text}</span>
            </li>
          ))}
        </ol>
        <p className="text-sm text-muted">Fluye no es un curso oficial del IELTS ni simula el examen completo; te prepara en las habilidades que evalúa. Antes de presentarlo, haz al menos un examen de práctica cronometrado con materiales oficiales.</p>
      </section>
    </div>
  );
}
