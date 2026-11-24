# Sistema de diseño de Fluye (v2)

Dirección: **lúdico + premium + cálido + editorial**. Papel crema, tinta berenjena, esmeralda como marca y violeta como acento. Referencias y lo que se adoptó de cada una: [referencias.md](referencias.md).

## Decisiones adoptadas (y de dónde vienen)

| Decisión | Referencia |
|---|---|
| Un solo «siguiente paso» evidente en Hoy; el resto son módulos secundarios | Duolingo, Headspace |
| Sombras tonales cálidas, sin negro ni blanco puros | Headspace |
| Barra inferior de 5 destinos iguales con etiqueta; Estudiar en línea y con color, sin botón flotante sobresaliente | patrón general de navegación inferior |
| Biblioteca con selección múltiple y barra de acciones contextual; colecciones como agrupación, no copia | Anki |
| Mascota con ropa combinable y respuesta visible a cada cambio | Finch |
| En voz: resaltar por palabra y comparar audio propio/modelo; nunca solo color ni una nota única | ELSA (y sus críticas) |

## Tokens (`src/app/globals.css`)

- **Color (claro):** `--bg #faf6ef` · `--surface #fffdf9` · `--surface-2 #f3ede2` · `--line #e7dece` · `--text #1d1a2b` · `--muted #635d70` · `--brand #087a56` · `--accent #5847d4` · `--fire #c2410c`.
- **Color (oscuro):** `--bg #13111c` · `--surface #1c1928` · `--surface-2 #252133` · `--line #353047` · `--text #f4effc` · `--muted #a9a2bb`.
- **Forma:** `--r-xl 1.75rem` (protagonista) · `--r-lg 1.35rem` (módulos) · `--r-md 1rem` (controles) · `--r-sm .75rem`.
- **Movimiento:** `--dur-1 120ms` (presión) · `--dur-2 180ms` (hover, pestañas) · `--dur-3 240ms` (entradas) · `--ease-out` · `--ease-spring`. Solo `transform` y `opacity`. `prefers-reduced-motion` quita lo decorativo.
- **Tipografía:** Bricolage Grotesque (títulos, `.font-display`) + Nunito (texto).

## Componentes compartidos

`.btn` (+ `-primary`, `-accent`, `-ghost`, `-bad`) · `.module` / `.module-quiet` / `.hero-card` · `.chip` (etiqueta) · `.chip-btn` (filtro accionable, `.is-on`) · `.seg` (pestañas segmentadas) · `.pick` (opción visual) · `.option` (respuesta de ejercicio) · `.empty-state` · `.selection-bar` · `.popover` · `.save-bar` · `.tabbar`.

Regla: una pantalla no define estilos propios para estos patrones; si falta una variante, se añade aquí.

## Registro de regresiones (auditoría contra la versión anterior en Git)

| Función | Estado encontrado | Acción |
|---|---|---|
| Repaso, Practicar, Biblioteca, Sonidos como pestañas directas | Reubicadas dentro de Explorar (2 toques) | Accesos directos arriba en Explorar |
| Selector de minutos (5/10/15/20) en Hoy | **Eliminado** en el rediseño | Recuperado |
| Nivel y título de juego en Hoy | Reubicado a Perfil | Se mantiene en Perfil |
| Personalización de mascota, voz, audio, FSRS, recordatorio, exportar/importar | Siguen en Ajustes | Mascota reorganizada en pestañas |
| Botón de guardar en Ajustes | Dos botones fijos superpuestos | Una sola barra, encima de la navegación |
| Suspender/reanudar tarjeta, intervalos por botón | Siguen (ficha y Repaso) | Añadido en lote |
| Colecciones, selección múltiple, estudiar un subconjunto, practicar por modalidad | **Nunca existieron** | Construidas sobre las mismas tarjetas FSRS |

## Ilustración (v3): mascotas y personas

Todo el arte es **vector original hecho en el proyecto**, sin contornos, con el mismo lenguaje:

- **Mascotas** (`src/lib/mascotSvg.ts`): 6 especies (zorro, gato, perro, oso, panda, búho). Cabeza grande, ojos blancos con pupila y dos brillos, rubor, extremidades cortas; forma por silueta y tres tonos (base, sombra, luz). 6 emociones (feliz, celebra, piensa, sorpresa, ánimo, descansa). Por ser vector por capas: color libre, accesorios combinables (cabeza + cara + cuello + atuendo) y animación por partes (orejas, cola, parpadeo, brazos).
- **Personas** (`scripts/scenes/people.mjs`): cabeza grande, peinados variados (corto, afro, largo, chongo, melena, rizado), 4 tonos de piel, brazos y piernas con volumen, 4 expresiones, de pie o sentadas.
- **Escenas** (`scripts/scenes/build.mjs` → `public/scenes/scene-<ruta>.svg`): fondo por capas (pared, suelo, objetos), sin texto.
- **Revisión visual obligatoria:** `node scripts/mascots/sheet.mjs` y `node scripts/scenes/build.mjs --sheet <png>` renderizan hojas de contacto para mirar el resultado antes de integrar.

Pendiente: las 23 escenas de sentidos de phrasal verbs siguen con el estilo anterior.
