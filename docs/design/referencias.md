# Referencias de diseño para el rediseño de Fluye

Investigación de lectura (nov 2026). Cada hallazgo se marca así: **[V]** verificado en una fuente web consultada; **[G]** conocimiento general mío, sin verificar en esta sesión. Al final hay lista de fuentes y límites.

Objetivo de marca: lúdico + premium + cálido + moderno + editorial + divertido; verde esmeralda + violeta; mascota personalizable; app para hispanohablantes mexicanos que aprenden inglés.

---

## 1. Producto por producto

### Duolingo
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** Home = un solo camino vertical de círculos; los niveles de distintas habilidades se intercalan (repaso espaciado dentro del camino). Círculos grises neutros + niveles de color; completado = dorado. Cada unidad tiene cabecera con su tema; tocar un círculo abre un popup. | Camino infinito tipo juego: Fluye ya tiene "misión recomendada" y misiones temáticas; un camino largo empuja a un tono infantil y a un contenido lineal que no existe. Tomar solo la idea "un único siguiente paso evidente". |
| **[V]** Botón flotante para volver a "donde estás" tras hacer scroll; barra inferior con Quests (cofre). | Muchas pestañas gamificadas (ligas, cofres, quests): ruido para un producto adulto con acceso por invitación. |
| **[V]** Personajes construidos con las mismas formas geométricas simples que Duo (ojos grandes, silueta distintiva); el equipo diseña "para animación desde el principio"; formas planas y geométricas facilitan animar y combinar piezas. | Estilo de personajes con humor de situaciones (pedir comida) y celebraciones largas por respuesta: cansa y no es premium. |
| **[V]** Feedback emocional con la mascota (primero se ilustró llorando al fallar); animación propia por personaje al acertar; interstitials de racha a mitad de lección y animación de cierre. | Castigo emocional (mascota triste/culpa) por fallar o romper racha: no encaja con "cálido y adulto". |
| **[G]** Tipografía redondeada propia, verde saturado, botón inferior de 3D "pegado" con borde inferior más oscuro, barra de progreso superior en la lección, banner inferior verde/rojo de acierto/error que sube desde abajo. | Copiar literal el botón 3D y la paleta verde-neón: sería clon reconocible; usar esmeralda más profunda + violeta. |

### ELSA Speak
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** Resalta por sonido/sílaba/palabra: verde = correcto, amarillo/naranja = algo off, rojo = error serio; muestra el símbolo fonético correcto y guías animadas de boca/lengua; consejos breves; porcentaje por palabra y frase y puntuación global; reproducción lado a lado del audio propio vs. nativo, con forma de onda; sonidos de campana/zumbido. | Semáforo rojo/amarillo/verde como único código: **[V]** un artículo académico de 2025 critica que color y porcentaje no dicen qué falló en la articulación. En Fluye: acompañar el color con texto ("th suena como t") y un icono, nunca solo color (accesibilidad). |
| **[V]** (secundario) El color-coding existe en reseñas; la paleta exacta varía entre fuentes. | Puntuaciones numéricas grandes y constantes: pueden desmotivar. Mostrar nivel cualitativo ("Casi", "Clara") y el número como detalle. |

### Busuu
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** Vista de curso completa; la siguiente unidad se marca con marco azul; la unidad se vuelve verde al completar todas sus tareas obligatorias (vocabulario, diálogo, escritura, conversación, repaso); niveles A1–C1 divididos en capítulos cortos con *Checkpoints*; botón "Next up" para retomar. | Estructura rígida de 5 sesiones por unidad: Fluye usa misiones temáticas y puede variar los tipos de ejercicio. |
| **[V]** Home muestra progreso por idioma y salto directo a tarea concreta. | Mostrar progreso por idioma: Fluye es un solo idioma (inglés). Reutilizar la idea como "progreso por habilidad". |
| **[G]** Ejercicios con una sola pregunta por pantalla y mucho aire; lectura clara. | Estilo corporativo/frío; Fluye quiere calidez. |

### Memrise
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** Cada palabra nueva = tarjeta + vídeo de hablante nativo; clip de escenario tras la lección con autoevaluación de comprensión; modo Immerse sin narración. Contenido real, acentos y velocidades naturales. | Vídeo: Fluye es audio/dictado/shadowing; no hay biblioteca de vídeo. Adoptar la idea de **contexto real** (frase en situación, varias voces) usando audio y mascota, no vídeo. |
| **[V]** Reseñas: muy bueno en vocabulario, débil en gramática; el plan gratuito limita funciones. | Muros de pago visibles: Fluye es por invitación; no hace falta UI de paywall. |

### Brilliant
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** Equilibra juego y concentración (ustwo): movimiento y visuales lúdicos sin romper la atención. Rutas con color y nodos animados, racha con animación sincronizada al contador, hechas en Rive con máquinas de estado. | Rive/estado complejo: coste de herramienta para un equipo pequeño; CSS + SVG/Lottie liviano bastan al inicio. |
| **[V]** (secundario) Al fallar, la explicación suele ser interactiva en vez de solo texto. | Explicaciones interactivas de matemática: no aplica; sí la idea "al fallar, mostrar el porqué manipulable" (p. ej. tocar la palabra para oírla lenta). |

### Headspace
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** (guía de terceros, no oficial) Reglas de ilustración: formas redondeadas, ojos de dos puntos y boca curva, sin nariz/orejas/dientes; la emoción viene de postura y color; sombras como capas de color, nunca grises; sin negro ni blanco puros. Contenedores con radio ~24px. | Los hex y las duraciones de esa guía son ilustraciones del autor, **no** de Headspace; no copiarlos como si fueran oficiales. |
| **[V]** (guía de terceros) Home: una sesión recomendada con un botón de inicio grande; debajo racha y cuadrícula 2×3 de categorías; barra inferior Home/Explore/Profile. | Estética de calma/siesta (movimientos de 12 s, 80px de objetivo en sueño): Fluye es activo, no meditativo. |
| **[V]** (oficial, Figma) Sistema por tokens (color, espaciado, tamaño, radio) con variables claro/oscuro; ~85 % de un archivo son tokens y componentes del sistema. | — |

### Finch
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** Bucle: tareas diarias → energía, atuendos, decoración → progreso; el widget muestra tu mascota con su ropa y entorno y cambia con evolución/estaciones; mini-barra de progreso diaria ligada a una recompensa; estado "en curso/listo" que crea cita de regreso sin notificaciones insistentes. | Aventuras con temporizador de ~6 h y eventos aleatorios: añaden complejidad y presión de volver. Quedarse con "la mascota refleja tu día" y la barra de progreso. |
| **[V]** Crítica Pratt: pantalla de creación muestra color, rasgos y nombre a la vez + autoevaluación → sobrecarga; mejor "conoce primero a tu Finch, personaliza después"; home compite con tienda, comunidad y avisos premium, sin jerarquía clara; el diario a veces no da respuesta visible tras guardar. | Presentar toda la personalización en el primer uso; hacerlo opcional y posterior. Toda acción guardada debe dar respuesta perceptible. |

### Anki / AnkiMobile
| Hace bien | No conviene en Fluye |
|---|---|
| **[V]** Navegador en 3 zonas: barra lateral (mazos, etiquetas, búsquedas), tabla de resultados, editor/vista previa; conmutador Tarjetas/Notas; columnas configurables y ordenables; selección múltiple (Ctrl/Shift) con acciones masivas (cambiar mazo, suspender, bandera, fecha, etiquetas, filtrado); el editor se oculta al seleccionar varias; color de fila = estado (bandera con su color, suspendida amarillo, marcada morado); atajos de teclado (p. ej. suspender). | Densidad "hoja de cálculo", sin jerarquía visual, vocabulario técnico (bury, reposition, filtered deck): para Fluye, ocultar lo avanzado detrás de "Más acciones" y usar lenguaje plano. |
| **[V]** Velocidad: foco en teclado y respuesta inmediata. | Estética utilitaria; Fluye debe sentirse editorial y cálido sin perder rapidez. |

---

## 2. Referencias más valiosas y lecciones concretas

**1. Duolingo (estructura del lesson flow + mascota coherente)**
- Un único "siguiente paso" evidente en Hoy; los demás accesos son secundarios **[V]**.
- Construir las 7 mascotas (castor, oso, zorro, búho, panda, gato, perro) con la **misma gramática de formas** (círculos/óvalos, ojos grandes, silueta propia, extremidades simples) y diseñar para animación desde el principio (capas separadas: ojos, boca, orejas, cola) **[V]**.
- Reacción de la mascota a acierto con animación propia y breve; interstitial solo en rachas, no en cada respuesta **[V]/[G]**.
- Evitar el castigo emocional; error = tono neutral/alentador (decisión de marca, no de Duolingo).

**2. Headspace (coherencia + home de una acción)**
- Home: una recomendación grande con un botón principal; debajo racha + cuadrícula de categorías **[V, tercero]**.
- Sombras como capas tonales del color de la superficie, no grises; evitar negro/blanco puros (usar tinta cálida oscura y crema) **[V, tercero]**.
- Tokens para color/radio/espaciado con variables claro/oscuro desde el día uno **[V, oficial]**.

**3. Finch (personalización emocional)**
- La mascota con su ropa aparece en Hoy y en el resultado de misión; barra diaria ligada a una recompensa visible **[V]**.
- Personalización **después** del primer éxito, nunca como muro en el onboarding **[V, crítica Pratt]**.
- Toda acción guardada produce respuesta visible (toast + gesto de la mascota) **[V]**.

**4. ELSA Speak (resultado de pronunciación)**
- Texto de la frase con resaltado por palabra/sonido; tocar la palabra muestra símbolo, consejo corto y audio nativo vs. el tuyo con onda; nivel cualitativo + número secundario **[V]**.
- Nunca solo color: añadir icono/subrayado distinto **[G, WCAG]** y apoyarse en la crítica de que color+porcentaje no dicen qué falló **[V]**.

**5. Anki (biblioteca/mazos)**
- Tres zonas en escritorio (colecciones | lista | detalle); en móvil, pantallas apiladas con hoja inferior de acciones. Filas coloreadas por estado, selección múltiple con barra de acciones contextual, ocultar el detalle al seleccionar varias **[V]**.

---

## 3. Guía concreta

### 3.1 Navegación inferior móvil
- 4–5 destinos de igual peso (propuesta: Hoy, Misiones, Repasar, Mascota/Tienda, Tú). Etiqueta siempre visible **[G; HIG/Material coinciden en 3–5 y etiquetas cortas]**. En esta sesión no pude leer el texto oficial de HIG ni de Material 3 (páginas devolvieron solo título), así que las cifras son orientativas.
- Altura de contenido ~64 px + `env(safe-area-inset-bottom)` abajo; objetivo táctil mínimo 44×44 px **[G]**.
- Activo = icono relleno + pastilla tintada (violeta 12–16 % de opacidad) + etiqueta en peso 600; inactivo = icono de contorno, tinta suave **[G, patrón Material 3]**.
- La acción principal de estudio vive en la tarjeta héroe de Hoy, no como botón flotante sobredimensionado en la barra. Contenido con `padding-bottom` = altura de barra + safe area.
- Escritorio/ultrawide: barra lateral izquierda (rail 72–88 px con etiquetas, o expandida 240 px en ≥1280); contenido con ancho máximo ~1100–1280 px y columnas laterales opcionales; en ultrawide, no estirar: centrar y usar paneles auxiliares (racha, mascota).
- Ocultar la barra durante la lección (modo inmersivo con "X" y barra de progreso superior) **[G, patrón Duolingo/Busuu]**.

### 3.2 Tarjetas de misión/curso
- Datos: título, tema (1 línea), nº de ejercicios y minutos estimados, estado (nueva / en curso con % / completa con medalla), habilidades que trabaja (iconos pequeños). Nada más.
- Imagen/ilustración 4:3 o 16:10 arriba en grande; en móvil, lista a 1 columna (tarjeta ≥ 140 px de alto) y cuadrícula 2 col en tablet, 3–4 en escritorio.
- Estado visible sin leer: marco de color en la siguiente (como el marco azul de Busuu **[V]**), verde al completar **[V]**, resto neutro.
- Misión recomendada: tarjeta héroe a ancho completo con botón principal; las demás debajo.
- Radio 20–24 px, sombra tonal (no gris) **[V, tercero]**.

### 3.3 Pantallas de ejercicio: distinguir modos
Misma estructura (barra de progreso arriba, enunciado, zona de respuesta, barra de acción abajo), pero cada modo con **color de acento + icono + posición de mascota** propios **[G, propuesta]**:
- **Escuchar/dictado:** acento violeta, botón de audio grande centrado (≥72 px), velocidad lenta/normal.
- **Responder (opción):** acento esmeralda, opciones como tarjetas ≥56 px.
- **Conversar/pronunciar:** acento ámbar cálido, botón de grabar con anillo que pulsa; resultado estilo ELSA **[V]**.
- **Escribir:** acento azul tinta, campo grande, teclado visible, la barra de acción sube con el teclado.
- **Repasar (FSRS):** neutro crema, tarjeta que se voltea; 4 botones (Otra vez/Difícil/Bien/Fácil) con intervalo previsto debajo de cada uno.
- Feedback: banda inferior que sube (acierto verde, "casi" ámbar, fallo tono rosado cálido, no rojo agresivo), con texto de la corrección y botón Continuar **[G, patrón Duolingo]**. Siempre texto + icono, nunca solo color. Mascota reacciona brevemente (≤600 ms).

### 3.4 Personalización de la mascota
- Vista previa grande arriba (≥40 % de la altura en móvil), fija mientras se desplaza el inventario; en escritorio, vista previa a la izquierda y armario a la derecha.
- Pestañas por categoría (Cuerpo, Cabeza, Ropa, Accesorios, Fondo) en control segmentado desplazable; cuadrícula 3 col móvil / 5–6 escritorio, celdas cuadradas con el artículo ya puesto sobre la silueta de la mascota **[G]**.
- Estados: puesto (anillo esmeralda + check), bloqueado (candado + precio en gemas), nuevo (punto). Probar antes de comprar.
- Guardar: barra inferior fija "Guardar" que aparece solo con cambios, más "Deshacer"; al guardar, la mascota hace un gesto y toast "Listo" (la crítica de Finch pide siempre respuesta visible **[V]**).
- No poner personalización en el primer uso: aparece tras la primera misión **[V]**. Las 7 especies se eligen en una pantalla simple de tarjetas grandes.

### 3.5 Panel diario ("Hoy")
Por encima del pliegue (móvil ~700 px útiles):
1. Saludo corto + mascota con su ropa + racha y gemas (una línea).
2. **Tarjeta héroe**: misión recomendada con botón principal **[V, Headspace/Busuu "Next up"]**.
3. Barra de progreso del día con la recompensa a la que apunta **[V, Finch]**.
Debajo del pliegue: repasos pendientes (n tarjetas FSRS con botón), cuadrícula de prácticas (escuchar, pronunciar, dictado…) 2×N, estadísticas semanales. Solo una acción primaria visible; el resto secundario para evitar la falta de jerarquía criticada en Finch **[V]**.

### 3.6 Biblioteca de mazos y colecciones
- Escritorio: tres paneles (colecciones | lista de tarjetas | detalle/vista previa) **[V, Anki]**; móvil: lista de colecciones → lista de tarjetas → detalle en hoja inferior.
- Selección múltiple: mantener pulsado (móvil) / casilla y Shift-clic (escritorio); aparece barra de acciones contextual con contador ("3 seleccionadas": mover, etiquetar, suspender, eliminar) **[V, patrón Anki]**. Al seleccionar varias, ocultar el detalle **[V]**.
- Estados por color de fila + icono: suspendida (ámbar), marcada (violeta), difícil (rosa) **[V, Anki usa amarillo/morado]**.
- Búsqueda con filtros rápidos (chips: Vencidas, Nuevas, Difíciles, Suspendidas). Lenguaje plano, avanzado oculto.
- Acciones destructivas con confirmación y deshacer (toast "Deshacer" 6 s) **[G]**.

### 3.7 Sistema de movimiento
Valores **[G]** (no verificados en fuente oficial; transitions.dev solo da tokens `--duration-quick`/`--ease-out` y avisa de no codificar `0.3s` a mano **[V]**):
- Tokens: `--dur-fast` 120 ms (hover, press), `--dur-base` 200–240 ms (cambios de estado, chips), `--dur-slow` 360–420 ms (hojas, páginas), `--dur-celebrate` 700–900 ms (completar misión).
- Easings: `ease-out` cúbica (0.22, 1, 0.36, 1) para entrar; `ease-in` (0.4, 0, 1, 1) para salir (más corto: ~70 % de la entrada); resorte suave solo para la mascota y el "pop" de recompensas.
- Animar solo `transform` y `opacity` (el resto causa layout) **[G]**.
- Qué animar: feedback de respuesta, mascota (reacciones), contador de gemas/racha (número que sube), progreso, hojas inferiores, transición Hoy→ejercicio (continuidad de la tarjeta). No animar: listas largas, fondos continuos, nada que compita con la lectura.
- Un solo elemento "protagonista" por momento; stagger de 30–40 ms máx. entre elementos.
- `prefers-reduced-motion: reduce`: quitar efectos decorativos, parallax, bucles de mascota, confeti y revelados llamativos; mantener cambios de estado esenciales como fundidos instantáneos o muy cortos; no desactivar animaciones de las que depende la lógica (acortarlas) **[V, web.dev]**. Los bucles JS necesitan un listener del cambio de preferencia **[V]**.
- Patrones útiles de transitions.dev para inspirar (no copiar código): error con sacudida, check de éxito, contador numérico, tabs deslizantes, toast, skeleton **[V, nombres]**; la licencia no figura en la página principal; revisar su Términos antes de reutilizar código.

---

## 4. Fuentes y honestidad

### Fuentes realmente consultadas (lectura directa)
- https://blog.duolingo.com/new-duolingo-home-screen-design/
- https://blog.duolingo.com/building-character/
- https://blakecrosley.com/guides/design/headspace (terceros, no oficial; sus datos son ilustrativos)
- https://www.figma.com/blog/building-a-design-system-that-breathes-with-headspace/
- https://www.deconstructoroffun.com/blog/x0hd2ssr80y5n7gv0w967pg7hwd7tl (Finch)
- https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/
- https://rive.app/blog/how-brilliant-org-motivates-learners-with-rive-animations
- https://blog.elsaspeak.com/en/advantage-of-elsa-feedback
- https://docs.ankiweb.net/browsing.html
- https://web.dev/articles/prefers-reduced-motion
- https://transitions.dev, https://godly.design, https://mobbin.com, https://www.animos.app (ver estado abajo)

### Solo vistas en resultados de búsqueda (no leídas completas)
Creative Bloq / Design Week (rediseño de Duo), arXiv 2507.06202 (crítica de color en pronunciación), ustwo.com/work/brilliant, blog.busuu.com (rediseño del curso; las fechas del blog no son fiables), FluentU/Memrise reseñas, foros de Anki.

### Accesos
- **transitions.dev:** accesible. Lista ~43 transiciones; no encontré licencia en la página principal; sin duraciones concretas salvo nombres de tokens.
- **godly.design:** accesible; galería curada; no vi términos de uso en la página. Se usa como inspiración, no para copiar.
- **mobbin.com:** accesible solo la portada (marketing). Biblioteca de >600 000 pantallas, gratuito limitado, Pro de pago; términos de uso de capturas no indicados en la portada. No pude ver capturas de Duolingo/Finch/Headspace en Mobbin, ni se mencionan en la portada.
- **animos.app:** solo obtuve el lema "Motion templates for design showcases"; sin detalle ni licencia. No inventé más.
- **Duolingo brand guidelines / design.duolingo.com y headspace.com/design-systems:** devolvieron 404.
- **Apple HIG (tab bars) y Material 3 (navigation bar):** la página devolvió solo título; las cifras de navegación inferior son **conocimiento general**, no verificadas aquí.

### Verificado vs. general
- Verificado en la web: estructura de camino y mascotas de Duolingo (blog oficial), resultados de ELSA (blog oficial), navegador de Anki (manual oficial), crítica de Finch (Pratt), uso de Rive en Brilliant, reduced-motion (web.dev), sistema de tokens de Headspace (Figma).
- Conocimiento general (marcado [G]): estilo visual exacto de Duolingo (botón 3D, banner inferior), medidas de navegación, duraciones/easings, acentos por modo, patrones de personalización, dimensiones de cuadrícula. Son propuestas de diseño, no hechos sobre los productos.
- Nada de Mobbin, Godly, Animos ni Transitions.dev se ha copiado; solo nombres de patrones. Antes de reutilizar cualquier código/captura, leer sus términos.
