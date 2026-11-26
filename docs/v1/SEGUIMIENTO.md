# Fluye 1.0 — seguimiento

Rama: `fluye-1.0` (desde `main` = 3.2 en producción, commit 36504eb). Nada de esta rama está en producción.

## Fase 0 · Línea base (25-nov-2026)

| Comprobación | Resultado |
|---|---|
| `npm run content` | 3.366 ítems, 48 lecciones · 0 errores, 0 avisos |
| `npm run typecheck` | sin errores |
| `npm run lint` (src, tests) | sin errores (1 aviso conocido de dependencias en SessionRunner) |
| `npm test` | 49/49 |
| `npm run build` | correcto |
| `npm run test:e2e` | 21/21 funcionales (24-nov); `pantallas` 1/1 tras corregir contraste; la prueba de invitación vigente es intermitente (Clerk de pruebas), pasa al repetir |
| Audio HD | 13.471 clips requeridos · 13.451 generados · **20 faltantes** |

### Contenido existente

| Tipo | A1 | A2 | B1 | B2 | C1 | C2 |
|---|---|---|---|---|---|---|
| phrasal | 14 | 116 | 290 | 410 | 114 | 0 |
| collocation | 28 | 178 | 259 | 211 | 58 | 0 |
| idiom | 0 | 10 | 79 | 127 | 43 | 0 |
| phrase | 43 | 173 | 207 | 173 | 43 | 0 |
| vocab | 32 | 147 | 206 | 224 | 103 | 0 |
| contraction | 13 | 20 | 31 | 10 | 4 | 0 |

944 phrasal verbs (825 términos distintos). El sistema de niveles llegaba hasta C1.

### Matriz de funcionalidades (estado al empezar)

| Área | Estado | Notas |
|---|---|---|
| Sesión diaria / misiones / regreso | Completa | `src/lib/session.ts`; pasos intro, recog, prod, listen, speak, story, question, repair, task |
| FSRS (4 modalidades) | Completa | recog / prod / listen / speak; intentos idempotentes |
| Repaso tipo tarjetas | Completa | autoevaluación; devuelve vidas |
| Pronunciación (sonidos, pares mínimos, prosodia) | Completa | percepción medible; producción autoevaluada |
| Roleplays guiados | Completa | evaluación por reglas |
| Dictado local (Whisper) | Completa | en el dispositivo |
| Retroalimentación oral detallada (omisiones, sustituciones) | **Ausente** | Fase 7 |
| Banco de palabras, emparejar, ordenar, dictado escrito, etc. | **Ausente** | Fase 3 |
| «¿Por qué?» explicación de la respuesta | **Ausente / parcial** | solo nota de error |
| Inglés de series (microescenas sin subtítulos) | **Parcial** | hay ítems `tv` y escucha de historias; no hay modo dedicado |
| Música | Parcial | 41 ejercicios; explicación sin traducción natural completa ni desglose (Fase 5/8) |
| Mascotas y armario | Completa con defectos | ver auditoría de mascotas |
| Ropa en poses distintas de «feliz» | **Defecto alto** | el arte solo existe para la pose feliz |
| Cofres, amigos, regalos, gemas, vidas | Completa | 3.1/3.2 |
| Escenas | Parcial | 37 imágenes estáticas; motor declarativo SVG pendiente (Fase 5) |
| C2 | **Ausente** | Fase 4 |

## Fase 1 · Auditoría de mascotas (en curso)

- Página `/qa/mascotas` (solo con `FLUYE_QA=1`) y prueba `qa-mascotas` generan hojas de contacto con el componente real.
- `scripts/qa/mascotas-integridad.mjs`: 1.438 archivos revisados, 0 faltantes, 0 corruptos, 0 sin transparencia, 0 cajas fuera del lienzo.
- **Corregido por código**: la mascota vestida se dibujaba ~30 % más pequeña y desplazada respecto a sus poses → calibración por especie (`scripts/armario/calibrar.mjs`, campo `fit`). Margen superior común para sombreros.
- **Preparado**: renderizador por pose (`armario-poses.json`) + importador `scripts/armario/import-poses.mjs` para el arte que falta.
- Inspección visual de 120 hojas: en curso.

## Decisiones

- C2 se admite en contenido, validador, audio y barras de progreso. El perfil de la persona sigue llegando a C1 como máximo: no hay evidencia (test) que permita etiquetar a alguien como C2.
- «Música y rap» pasa a «Música» en todas las interfaces.
