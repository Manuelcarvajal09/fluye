# Storyboard de arte para Codex · Fluye

Encargo de imágenes y piezas animables para la fase 4 de la auditoría de UX (`docs/ux/AUDITORIA-UX.md`). Las animaciones las programa Claude en el código; Codex entrega el arte en capas con nombres, listo para animar.

## Reglas de marca (obligatorias en todas las piezas)

- **Estilo:** vector plano original, **sin contornos**, cada forma en tres tonos (base, sombra y luz). Esquinas suaves. Mismo lenguaje que `public/scenes/scene-*.svg` y las mascotas de `public/mascots/*.webp`.
- **Paleta clara:** fondo `#f4f8f6` · superficie `#ffffff` · tinta `#192337` · marca esmeralda `#087a56` · acento violeta `#5847d4` · fuego `#a1470a` · oro `#9a5b00` · degradado héroe `#dff5ea → #ebe6ff`.
- **Paleta oscura** (cuando se pida versión oscura): fondo `#101722` · superficie `#192337` · esmeralda `#22d3a0` · violeta `#9b8cff` · oro `#ffd66b`.
- **Tipografía:** las piezas no llevan texto. Los textos los pone la app (Nunito 800–900).
- **Mascotas:** 12 especies (zorro, gato, perro, castor, oso, panda, búho, conejo, nutria, ciervo, panda rojo, ajolote) con 8 poses ya hechas (happy, cheer, encourage, oops, proud, sleep, think, wow). **No pedir poses nuevas de mascota:** cada pose nueva obliga a redibujar las capas de las 71 prendas (~850 capas). Donde aparezca una mascota, la pieza deja un **hueco** (`slot-mascota`) y la app pone la mascota de cada persona con su ropa.
- **Nada protegido:** sin personajes, logos ni estilos reconocibles de otras apps.
- **Accesibilidad:** contraste suficiente sobre los dos fondos; nada que dependa solo del color.

## Formato de entrega

- SVG optimizado (sin metadatos de editor, sin `<image>` incrustadas, sin fuentes) + WebP de respaldo cuando se indique.
- Cada parte animable va en un `<g id="...">` con el nombre exacto que se indica abajo. El origen de giro de cada grupo se marca con un comentario `<!-- origen: x,y -->`.
- Carpeta de entrega: `art-inbox/ux-v1/<id-pieza>/`. Claude la revisa con hoja de contacto antes de integrarla.

---

## Pantalla de apertura (la hace Claude, no Codex)

El isotipo actual son dos ondas blancas sobre un cuadrado esmeralda en SVG (`Logo` en `src/components/Nav.tsx`). Se anima directamente en código: las ondas se dibujan (0–450 ms), el cuadrado entra con escala (300–600 ms), las ondas ondulan en bucle mientras cargan los datos y el isotipo se encoge hacia la esquina cuando aparece Hoy. No requiere arte nuevo.

## P1 · Ilustraciones de estados vacíos y de error (prioridad alta)

**Para qué:** sustituir textos sueltos por una ilustración pequeña que explique el estado y ponga a la mascota en contexto.

Formato: 320×240, fondo transparente, versión clara y oscura, con `slot-mascota` (círculo guía de 120 px, a la izquierda o abajo).

| id | Pantalla | Escena (sin texto) | Grupos animables |
|---|---|---|---|
| `vacio-repasos` | Repaso: «Estás al día» | Mesa ordenada con un mazo de tarjetas atado con un lazo y una taza humeante | `vapor`, `lazo` |
| `vacio-busqueda` | Biblioteca sin resultados | Lupa grande sobre tarjetas en blanco, una tarjeta volteada | `lupa` |
| `vacio-colecciones` | Mis colecciones vacías | Carpeta abierta con tarjetas a punto de entrar | `tarjeta-1`, `tarjeta-2` |
| `vacio-amigos` | Amigos sin amistades | Dos sillas en un banco de parque, una vacía, globo de diálogo sin texto | `globo` |
| `vacio-buzon` | Buzón de regalos vacío | Buzón con la bandera bajada, una hoja que cae | `bandera`, `hoja` |
| `error-conexion` | Sin conexión o error al guardar | Nube con un enchufe desconectado y unas chispas suaves (no alarmante) | `enchufe`, `chispa` |

## P2 · Iconos para el panel «Por qué estuvo mal» (prioridad alta)

**Para qué:** la explicación al equivocarse muestra el tipo de error con un icono, para que se reconozca de un vistazo.

Mismo sistema que `src/components/Icons.tsx`: viewBox 32×32, relleno a color con sombra y brillo, sin contornos.

| id | Tipo de error que señala |
|---|---|
| `ico-significado` | Elegiste una palabra con otro significado |
| `ico-orden` | Orden de las palabras |
| `ico-falta` | Te faltó una palabra (artículo, preposición) |
| `ico-sobra` | Sobró una palabra |
| `ico-tiempo` | Tiempo verbal |
| `ico-falso-amigo` | Falso amigo (parece español y no lo es) |
| `ico-registro` | Registro: formal frente a coloquial |
| `ico-sonido` | Pronunciación o sonido |

Entrega: un SVG por icono y una hoja `iconos-error.svg` con los 8 alineados.

## P3 · Cabeceras de sección (prioridad media)

**Para qué:** las secciones sin arte (Progreso, Repaso, Pronunciación, Biblioteca, Música, Ajustes) se ven como formularios; una cabecera ilustrada las identifica y da sensación de lugar.

Formato: escritorio 1200×360 y móvil 780×360 (recorte seguro centrado en 600×300). Mismo lenguaje que `public/scenes/`. Sin texto. Lado izquierdo despejado para el título que pone la app.

| id | Escena | Grupos animables |
|---|---|---|
| `cab-progreso` | Sendero que sube por colinas con banderines; al fondo una montaña con cima | `banderin-1..3`, `nubes` |
| `cab-repaso` | Escritorio con fichero de tarjetas abierto y una lámpara | `tarjetas`, `luz` |
| `cab-pronunciacion` | Estudio pequeño con micrófono de pie y ondas de sonido flotando | `ondas` |
| `cab-biblioteca` | Estantería alta con libros y tarjetas, escalera con ruedas | `libro-cae` |
| `cab-musica` | Escenario íntimo con amplificador, notas flotando y luces de tira | `notas`, `luces` |
| `cab-ajustes` | Mesa de taller con herramientas ordenadas y una planta | `planta` |

## P4 · Escena de celebración (prioridad media)

**Para qué:** al cumplir la meta del día o subir de nivel. Hoy hay confeti y rayos genéricos.

| Cuadro | Tiempo | Qué se ve | Grupo |
|---|---|---|---|
| 1 | 0–300 ms | Tarima redonda esmeralda con brillo; entra desde abajo | `tarima` |
| 2 | 200–600 ms | `slot-mascota` sobre la tarima (la app pone la pose `cheer`) | `slot-mascota` |
| 3 | 400–900 ms | Abanico de rayos violeta y oro detrás, girando despacio | `rayos` |
| 4 | 600–1400 ms | Serpentinas y estrellas que caen (8 piezas sueltas) | `serpentina-1..4`, `estrella-1..4` |
| 5 | bucle | Rayos girando y estrellas parpadeando hasta pulsar «Continuar» | `rayos`, `estrella-*` |

Formato: 600×600, transparente, versión clara y oscura.

## P5 · Portadas de géneros de Música (prioridad baja)

**Para qué:** que cada ejercicio de Música se reconozca por su género y la lista larga sea más fácil de recorrer.

Formato: 160×160, esquinas redondeadas de 24 px, un objeto central y fondo de color plano por género.

`gen-pop` (micrófono con destellos) · `gen-rnb` (vinilo y luna) · `gen-rap` (gorra y altavoz) · `gen-rock` (guitarra eléctrica) · `gen-indie` (casete) · `gen-electronica` (mesa de mezclas) · `gen-funk` (bola de espejos) · `gen-otros` (nota musical).

---

## Lo que NO hace falta pedir (lo programa Claude)

- La pantalla de apertura con el isotipo, los esqueletos de carga y las transiciones entre pestañas.
- Anillo de progreso de la meta, cuenta animada de XP, la animación del panel «Por qué estuvo mal».
- Micromovimientos de iconos de la barra inferior y del botón Comenzar.
- Animación de las mascotas existentes (salto, parpadeo, respiración): ya se hace por partes con CSS.

## Orden de entrega sugerido

1. P2 iconos de error · 2. P1 estados vacíos · 3. P4 celebración · 4. P3 cabeceras · 5. P5 géneros.
