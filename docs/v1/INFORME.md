# Fluye 1.0 — informe de la versión candidata

Rama `fluye-1.0` · 25-nov-2026 · **No está fusionada ni desplegada.** Producción sigue en 3.2 y no se migró nada.

## Veredicto

**Fluye queda como versión CANDIDATA, lista para tu revisión visual.** Con la entrega de Codex (`fluye-poses.zip`) se cerraron los dos bloqueos de arte, aunque falta tu aprobación visual:

1. **Ropa en todas las emociones: integrada.** 84 poses y 8.400 capas validadas con el importador: 0 problemas, misma base y misma línea de pies que cada ilustración, sin reescalado. Revisé a mano las hojas de zorro, conejo y ciervo: la ropa se conserva y el tamaño es constante. Detalle de calidad que debes juzgar tú: en algunas poses con los brazos arriba (p. ej. el conejo al celebrar), el suéter se ve sin mangas, como una prenda corta. La revisión de Codex se limitó a 4 conjuntos por pose.
2. **Defectos de arte de la pose feliz: corregidos por Codex.** Son los 120 archivos del encargo: medalla, lazos, perlas, bufanda, gorros de la nutria, audífonos, mago del ciervo, marinera sin pañuelo, racha-360 y cajas de cabello. Se quitaron las mitigaciones por código.
3. **Pendiente: no hay una auditoría visual completa.** Las hojas por pose solo se revisaron en 3 especies. Las combinaciones de todas las especies tras las correcciones deben verse en las hojas regeneradas (`docs/qa/hojas/`).

Todo lo demás de los criterios del encargo se cumple (detalle abajo), con los riesgos residuales indicados.

## Criterios obligatorios

| Criterio | Estado | Evidencia |
|---|---|---|
| 500 phrasal verbs nuevos, sin duplicados | **Cumple: 520** (B1 78 · B2 208 · C1 184 · C2 50) | `content/items/pv-v1-*.json`; validador con 0 errores; comprobación de id y de sentido frente a los 944 existentes |
| Contenido B1–C2 integrado | Cumple | C2 en tipos, validador, audio, barras de progreso y selección (ventana nivel ±1) |
| Ejercicios interactivos | Cumple | Banco de palabras, dictado, «¿Por qué?», emparejar errores, series (8 pasos) y práctica en Música |
| Compatibilidad con FSRS | Cumple | El formato no cambia la modalidad acreditada; el emparejar es práctica y no toca FSRS; intentos idempotentes sin cambios |
| Cobertura HD del contenido estático | **Cumple: 15.791/15.791 (100 %)** | `node scripts/audio/verify.mjs`: bytes MP3 válidos, duración razonable y sin silencio; detalle en `docs/v1/audio-cobertura.json` |
| Combinaciones de mascotas auditadas | Parcial | `docs/qa/mascotas-auditoria.md` |
| Defectos gráficos críticos corregidos | Cumple, pendiente de tu revisión visual | 4 por código y el resto con el arte nuevo de Codex (120 archivos) |
| Apariencia consistente entre pantallas y emociones | Cumple, pendiente de tu revisión visual | 8 poses con ropa; hojas revisadas en 3 especies (ver el punto 1) |
| Retroalimentación oral útil y honesta | Cumple | Sustituciones, omisiones y añadidas explicadas; pronunciación marcada como «no medible» |
| Dashboard optimizado | Cumple (alcance acotado) | Misión primero en móvil, accesos según datos y consejos del tutor con datos reales |
| Sin pérdida de datos | Cumple | Sin migraciones nuevas; la rama no toca producción |
| Sin vulnerabilidades críticas conocidas | Sin hallazgos nuevos (no es una certificación) | Rutas nuevas autenticadas y validadas con zod; `/qa/mascotas` solo con `FLUYE_QA=1` |
| Sin errores funcionales críticos o altos pendientes | Ver «Pruebas» | |
| Pruebas automatizadas satisfactorias | Ver «Pruebas» | |
| Compilación de producción | Cumple | `npm run build` correcto |

## Qué se incorporó

- **Contenido**
  - 520 phrasal verbs con ficha ampliada: sentido, registro, transitividad, separabilidad, formas, confusiones, errores típicos, 3–5 ejemplos y frecuencia marcada como «estimación».
  - 24 escenas originales de series.
  - Música: traducción completa, desglose, enlaces, intención, uso cotidiano, ejemplos y género en los 41 ejercicios.
- **Ejercicios**
  - Banco de palabras (táctil, ratón y teclado) y dictado.
  - «¿Por qué?» con refuerzo breve y emparejar los errores del día.
  - El formato se elige según el estado FSRS y el nivel: más producción libre a mayor nivel.
- **Inglés de series**: itinerario B1–C2 con comprensión medida por respuestas reales.
- **Voz**: alineación por palabras, práctica del fragmento difícil, pausas medidas y dimensiones separadas. Todo el procesamiento ocurre en el dispositivo.
- **Mascotas**
  - Calibración de escala por especie y por pieza, y ancla común de pines.
  - Máscara de oclusión (lentes y adornos bajo el ala) y gorros sueltos donde el arte falla.
  - Contorno del panda en modo oscuro.
  - Hojas de QA con el componente real e importador para las poses.
- **Personalización**: desde B1 lo nuevo sale de [nivel−1, nivel+1]; lo elemental solo entra si es idiomático. Esto corrige que un B2 recibiera contenido de A1.
- **Tutor**: consejos con datos reales (habilidad más débil, escucha pendiente, confusiones recurrentes, registro), sin culpabilizar.
- **Explorar**: «Música y rap» pasa a «Música» y el rap es un género más. Se añadió el acceso a «Inglés de series».

## Pruebas ejecutadas

Base de desarrollo (Neon `dev`), navegadores simulados (Chromium de Playwright). **No hubo pruebas en dispositivos físicos reales**: queda pendiente revisar en iPhone, Android y Safari.

| Comando | Resultado |
|---|---|
| `npm run content` | 3.886 ítems, 0 errores |
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin errores |
| `npm test` | 52/52 |
| `npm run build` | Correcto |
| `FLUYE_QA=1 npx playwright test` (completa, tras integrLas 2 sesiones largas que fallaban antes (`flow` y misión temática) ya pasan: el ayudante de prueba no sabía resolver el banco de palabras ni el emparejar. Los avisos «Clerk Testing FAPI request failed» del registro salen al cerrar cada prueba y no son fallos. y se están repitiendo esas dos pruebas.

Pantallas: la prueba `pantallas` revisa 6 tamaños (iPhone, iPad vertical y horizontal, PC Full HD, ultrawide de 29″ y 34″) sin desbordes y con axe (sin violaciones graves). Android y laptop solo se cubren por tamaños equivalentes, no por separado.

## Rendimiento y tamaño

| | Antes (3.2) | Ahora |
|---|---|---|
| Audio HD | 110 MB · 13.471 clips | 130 MB · 15.791 clips (se piden por rango, nunca todos al iniciar) |
| Armario + mascotas + escenas | 28 MB | 191 MB (163 MB son las capas por pose; solo se descargan las del conjunto y la pose que se muestran) |
| Contenido empaquetado | 3.366 ítems | 3.886 ítems + 24 escenas |

Las mascotas cargan solo las capas del conjunto que se muestra. El índice de términos para la retroalimentación oral (64 KB) se carga bajo demanda.

## Limitaciones pendientes

1. Revisión visual tuya del vestuario por pose (mangas simplificadas en poses con brazos arriba).
2. Motor declarativo de escenas en SVG (sección 10 del encargo): no se hizo. Las escenas siguen siendo las 37 ilustraciones existentes y las de series no tienen imagen.
3. Minipódcast, aventuras, tarjetas con imagen y modo «sin ayudas» explícito.
4. Instrucciones en inglés para usuarios avanzados.
5. Revisión manual del clip «get out of here» (0,58 s; puede estar recortado).
6. No hay voz canadiense: ninguna voz gratuita de Kokoro lo es y no se etiquetó ninguna como tal.
7. Pruebas en dispositivos físicos (iOS Safari, Android).
8. Auditoría de calidad lingüística de las 3.366 entradas existentes (sección 23): no se hizo una revisión entrada por entrada. Se corrigió la selección por nivel, que era el síntoma principal.

## Documentos

- Seguimiento: `docs/v1/SEGUIMIENTO.md`
- Matriz Duolingo: `docs/v1/DUOLINGO.md`
- Auditoría de mascotas, defectos y encargo a Codex: `docs/qa/`
- Cobertura de audio: `docs/v1/audio-cobertura.json`
- Respaldo, despliegue y reversión: `docs/v1/DESPLIEGUE.md`
