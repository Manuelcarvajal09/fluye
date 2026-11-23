# Esquema de contenido

Todo el contenido vive en JSON versionado dentro de `content/`. El estado de cada persona (FSRS, progreso) vive en la base de datos y referencia estos `id`, así que **un `id` publicado nunca se cambia ni se reutiliza**.

Validar siempre: `node scripts/validate-content.mjs` (todo) o `node scripts/validate-content.mjs content/items/archivo.json` (un archivo).

## Ítems — `content/items/*.json`

Cada archivo es un array JSON de ítems:

```json
{
  "id": "pv-give-up",
  "type": "phrasal",
  "term": "give up",
  "ipa": "/ɡɪv ˈʌp/",
  "level": "A2",
  "topic": "daily",
  "freq": 5,
  "es": "rendirse; dejar de intentar",
  "def": "to stop trying to do something",
  "note": "Con un hábito: give up smoking = dejar de fumar. Separable: give it up.",
  "sep": true,
  "syn": ["quit"],
  "ex": [
    { "en": "I'm not going to [give up] now.", "es": "No me voy a rendir ahora." },
    { "en": "She [gave up] sugar last year.", "es": "Dejó el azúcar el año pasado." }
  ]
}
```

| Campo | Regla |
|---|---|
| `id` | Único global. Prefijo por tipo: `pv-` phrasal, `col-` collocation, `idi-` idiom, `voc-` vocab, `phr-` phrase. Después el término en minúsculas con guiones (`pv-take-off`). Si un término tiene varios sentidos importantes, un ítem por sentido: `pv-take-off` (el más frecuente), `pv-take-off-2`, `pv-take-off-3`. |
| `type` | `phrasal` \| `collocation` \| `idiom` \| `vocab` \| `phrase` |
| `term` | Forma de diccionario, en minúsculas salvo nombres propios. Sin "to" delante. Para phrasal verbs con objeto usa la forma base: `pick up`, `look forward to`. |
| `ipa` | General American, entre barras. Obligatorio en `phrasal` y `vocab`. Opcional en los demás. |
| `level` | `A1` `A2` `B1` `B2` `C1` (nivel en que conviene aprenderlo). |
| `topic` | Uno de: `daily` `work` `tech` `travel` `canada` `interview` `social` `informal` `money` `health` `feelings` `study` `home` `food`. |
| `freq` | 1–5. 5 = imprescindible en conversación real; 1 = útil pero poco frecuente. |
| `es` | Significado en español de México, natural y corto (máx. ~60 caracteres). Varias acepciones cercanas separadas por `;`. No traducción literal palabra por palabra. |
| `def` | Definición sencilla en inglés (nivel A2–B1), máx. ~90 caracteres, sin usar el propio término. |
| `note` | Opcional. Nota de uso en español: registro (informal, vulgar suave), separable o no con mini ejemplo, falso amigo, diferencia EE. UU./Canadá, error típico de hispanohablantes. Máx. ~160 caracteres. |
| `sep` | Solo `phrasal`: `true` separable, `false` inseparable, omitir si intransitivo. |
| `syn` | Opcional. Términos (no ids) casi sinónimos que NO deben usarse como distractores de este ítem. |
| `ex` | 2 ejemplos (3 como máximo). Originales, naturales, como habla la gente en EE. UU./Canadá, 5–14 palabras. `es` = traducción natural, no literal. |

### Campos opcionales nuevos (todos los tipos)

| Campo | Regla |
|---|---|
| `areas` | Array de ids de área (1–3) de `src/lib/areas.ts`: `conversacion relaciones restaurantes compras salud noticias vivienda bancos transporte viajes emergencias canada series entrevistas reuniones analisis automatizacion software devops crm datos soporte proyectos ciencia biologia`. Obligatorio en contenido nuevo; los ítems viejos se mapean desde `topic`. |
| `tags` | Array de etiquetas libres en minúsculas. Usadas por la app: `tv` (muy frecuente en series/películas de EE. UU. y Canadá), `ca` (propio de Canadá), `formal`, `informal`, `slang`. |

### Tipo `contraction` (contracciones y reducciones del habla)

Prefijo de id `con-`. Igual que los demás ítems, más:

- `full` (obligatorio): la forma completa que reemplaza, p. ej. `"want to / want a"` para *wanna*.
- `note` (obligatorio aquí): cuándo se usa y cuándo NO (registro: conversación, mensajes, canciones; nunca en correos formales, CV ni exámenes escritos), y diferencias como *wanna* solo con *want to* (no con *wants to*).
- `ipa` obligatorio (cómo suena de verdad).
- En los ejemplos, entre corchetes va la forma reducida tal como se escribiría informalmente: `I [wanna] go home.`

### Reglas de los ejemplos

- Cada `ex.en` lleva **exactamente un par de corchetes** que marca la forma del término tal como aparece en la frase (conjugada si hace falta): `She [gave up] sugar.` Los corchetes se quitan al mostrar y sirven para generar el ejercicio de completar.
- Lo que va entre corchetes debe ser contiguo. En phrasal verbs separables, usa en los ejemplos la forma junta (`[turn off] the lights`) y menciona la separada en `note` (`turn it off`).
- La frase debe dejar claro el sentido: sin los corchetes, el hueco solo debería admitir este término (evitar frases donde quepan muchos verbos).
- Los dos ejemplos usan contextos distintos y, si se puede, tiempos verbales distintos.
- Nada de nombres de marcas, personas reales, política ni contenido ofensivo. Lenguaje informal sí; groserías fuertes no.
- No copiar frases de diccionarios, libros o sitios: todo redactado desde cero.

### Duplicados y ambigüedad

- No repetir un mismo `term` con el mismo sentido. Antes de añadir, buscar el término en `content/items/`.
- Si dos ítems significan casi lo mismo (`give up` / `quit`), declarar `syn` en ambos.
- Un ítem = un sentido. Si `es` necesita "o" entre ideas distintas, son dos ítems.

## Lecciones — `content/lessons/*.json`

Array de lecciones con historia (input comprensible):

```json
{
  "id": "les-a2-coffee-run",
  "level": "A2",
  "topic": "daily",
  "order": 12,
  "title": "Coffee run",
  "title_es": "Por un café",
  "intro_es": "Maya y Leo salen por café antes de una junta.",
  "lines": [
    { "who": "Maya", "en": "I [ran out of] coffee at home.", "es": "Se me acabó el café en casa.", "item": "pv-run-out-of" }
  ],
  "items": ["pv-run-out-of", "pv-pick-up", "col-grab-a-coffee"],
  "questions": [
    { "q": "Why does Maya want to go out?", "options": ["She has no coffee", "She is late", "She is hungry"], "answer": 0, "why_es": "Dice que se le acabó el café." }
  ]
}
```

- 6–10 líneas, vocabulario mayormente del nivel o inferior; 3–5 ítems objetivo, cada uno aparece al menos una vez entre corchetes con `item` apuntando a su id.
- 2–3 preguntas de comprensión en inglés sencillo, 3 opciones, `answer` = índice correcto.
- `items` solo contiene ids que existen en `content/items/`.

## Roleplays guiados — `content/roleplays/*.json`

Array de escenarios. La app interpreta al otro personaje (voz TTS), te dice en español qué tienes que comunicar, tú respondes hablando o escribiendo y se evalúa con reglas (sin IA): elementos obligatorios, errores típicos y respuestas modelo naturales.

```json
{
  "id": "rp-cafe-order",
  "area": "restaurantes",
  "level": "A2",
  "title": "Coffee to go",
  "title_es": "Un café para llevar",
  "setting_es": "Es tu primera mañana en Edmonton. Entras a una cafetería del centro.",
  "npc": "Barista",
  "turns": [
    {
      "npc": "Hi there! What can I get started for you?",
      "npc_es": "¡Hola! ¿Qué te preparo?",
      "task_es": "Pide un flat white mediano para llevar, con cortesía.",
      "expect": [["flat white"], ["medium"], ["to go", "takeout", "take out"]],
      "model": ["Could I get a medium flat white to go, please?", "Can I have a medium flat white to go?"],
      "tips": [{ "wrong": "\\bfor (to )?carry\\b", "fix": "to go", "why_es": "«Para llevar» es *to go* (o *takeout* en Canadá), no *for carry*." }]
    }
  ],
  "useful": ["What can I get started for you?", "to go", "Could I get…?"]
}
```

- 5–8 turnos por escenario; el personaje responde de forma coherente con lo que se esperaba en el turno anterior.
- `expect`: lista de grupos; cada grupo es una lista de alternativas aceptadas (texto en minúsculas, sin puntuación). La respuesta es correcta si contiene al menos una alternativa de cada grupo. Pocos grupos (1–3) y alternativas generosas: no castigar variantes correctas.
- `model`: 2–3 respuestas naturales distintas (registro adecuado).
- `tips`: errores típicos de hispanohablantes en ese turno. `wrong` es una expresión regular (sin barras, se aplica en minúsculas) y `fix` la forma natural.
- `useful`: 3–6 expresiones para el resumen final.

## Banco de errores — `content/errors.json`

Errores frecuentes de hispanohablantes para el ejercicio "Corrige la frase" y para detectar fallos en roleplays.

```json
{ "id": "err-have-years", "category": "verbos", "level": "A2",
  "wrong": "I have 30 years.", "right": ["I'm 30.", "I'm 30 years old."],
  "pattern": "\\bi have \\d+ years\\b", "why_es": "La edad se dice con *be*: I'm 30 (years old)." }
```

`category`: `tiempos preposiciones articulos verbos orden falsos-amigos colocaciones preguntas plurales pronombres registro`. `right`: 1–3 versiones aceptadas. `pattern`: regex en minúsculas que detecta el error en texto libre (opcional si es difícil de detectar).

## Test de nivel — `content/placement/test.json`

```json
{ "id": "pt-g-001", "section": "grammar", "level": "B1",
  "prompt": "She ___ in Edmonton since 2022.", "options": ["lives", "has lived", "is living", "lived"],
  "answer": 1, "why_es": "*since* + tiempo que continúa → present perfect." }
```

`section`: `grammar vocab reading listening`. Lectura: `passage` (texto en inglés, 80–220 palabras según nivel) repetido en sus preguntas con el mismo `group`. Escucha: `audio` (guion en inglés que la app leerá con TTS; diálogos con `A:`/`B:`), mismo `group` para varias preguntas. Siempre 4 opciones.

## Gramática — `content/grammar/tenses.json`

```json
{ "id": "gr-present-perfect", "order": 3, "name_en": "Present perfect", "title_es": "Presente perfecto",
  "use_es": "...", "form": { "aff": "I have worked", "neg": "I haven't worked", "q": "Have you worked?" },
  "signals": ["since", "for", "already", "yet", "ever", "never"],
  "examples": [{ "en": "I've lived here for two years.", "es": "Llevo dos años viviendo aquí." }],
  "mistakes_es": "...", "practice": [{ "q": "I ___ (know) her since 2019.", "options": ["know", "have known", "knew", "am knowing"], "answer": 1 }] }
```

## Sonidos — `content/sounds/*.json`

Ver `content/sounds/README.md` (lo define quien escribe ese módulo): fonemas, pares mínimos, acento, ritmo, entonación y linking.
