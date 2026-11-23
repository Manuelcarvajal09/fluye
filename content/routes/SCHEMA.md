# Rutas temáticas — `content/routes/<id>.json`

Una ruta es un tema (p. ej. «Cafeterías y restaurantes») con 2–3 **pistas** adaptadas por nivel.
Todas corren sobre el mismo motor: la pista usa una `lesson` (diálogo + comprensión, formato de `content/lessons`),
un `roleplay` final (formato de `content/roleplays`) y referencias a ítems canónicos de `content/items`.

```jsonc
{
  "id": "cafe",                         // único, minúsculas-con-guiones; NUNCA se cambia
  "title_es": "Cafeterías y restaurantes",
  "icon": "coffee",                     // nombre de icono lucide-react (coffee, plane, snowflake, gift, ...)
  "scene": "scene-cafe",                // id de escena visual (content/scenes) o null
  "areas": ["restaurantes"],            // ids de src/lib/areas.ts
  "season": null,                       // null | "navidad" | "invierno" | "primavera" | "verano" | "otono" (solo decora; disponible todo el año)
  "objective_es": "Pedir, personalizar y aclarar tu orden; pagar y dejar propina.",
  "tracks": [
    {
      "id": "cafe-a",                   // <ruta>-a (A1–A2), <ruta>-b (B1–B2), <ruta>-c (C1, opcional)
      "band": "A1-A2",                  // "A1-A2" | "B1-B2" | "C1"
      "level": "A2",                    // nivel principal de la pista
      "minutes": 12,                    // duración estimada real (8–20)
      "skills": ["listen", "read", "speak", "write"],
      "objective_es": "Pedir un café y un pan, y entender cuánto es.",
      "items": ["phr-can-i-get", "voc-receipt"],   // 6–12 ids de ítems EXISTENTES o de new_items
      "lesson": { /* Lesson completa: id "ls-<track>", level, topic, order 900+, title, title_es, intro_es, lines[8–16], items[], questions[3–5] */ },
      "production": [                   // 2–4 tareas de producción escrita/oral corta
        { "prompt_es": "Pide un latte grande con leche de avena.", "model": ["Can I get a large oat milk latte, please?"], "expect": [["latte"], ["oat"], ["large"]] }
      ],
      "repair": [                       // 2–4 estrategias de reparación (pedir repetir, aclarar, reformular)
        { "situation_es": "No entendiste el total.", "en": "Sorry, how much was that?", "es": "Perdón, ¿cuánto fue?" }
      ],
      "roleplay": { /* Roleplay completo: id "rp-<track>", area, level, title, title_es, setting_es, npc, turns[4–7], useful[] */ }
    }
  ],
  "new_items": [ /* Ítems nuevos (formato content/SCHEMA.md) que no existían. Reusa SIEMPRE los existentes primero. */ ]
}
```

## Reglas de calidad

- **Adaptación real por nivel**: la pista A1–A2 usa frases cortas, vocabulario de alta frecuencia, presente/pasado simple,
  diálogo lento y tareas guiadas; B1–B2 añade matices, phrasal verbs, problemas imprevistos, cortesía indirecta;
  C1 añade ironía, negociación, registro y lenguaje idiomático. Nunca la misma historia con otra etiqueta.
- Inglés natural de Canadá (preferente) y EE. UU.; marca diferencias en `note` de los ítems (`tags: ["ca"]`).
- Español de México natural en `*_es` y `es`.
- Ejemplos y diálogos **originales**. No copies diccionarios, cursos, series, canciones ni sitios comerciales.
- Nombres de personajes ficticios variados (p. ej. Priya, Dave, Mei, Jordan, Amira, Luc). En roleplays la persona que aprende
  es «tú»: usa `{name}` si el NPC debe decir su nombre. **No uses nombres reales de usuarios.**
- Nada de consejos médicos, migratorios o legales actuales; si el tema lo toca, es lenguaje para comunicarse, no asesoría.
- `expect` en roleplays/producción: grupos de palabras clave en minúsculas; cada grupo es «al menos una de estas»;
  acepta alternativas válidas (sinónimos, contracciones). No exijas una única frase.
- Noticias simuladas: marca la lección con `"simulated": true` y en `intro_es` di «Noticia simulada para practicar; no es real».
- Ids nuevos: `ls-<track>`, `rp-<track>`; ítems nuevos con el prefijo normal (`phr-`, `voc-`, `col-`, `pv-`, `idi-`) y que no existan ya.
