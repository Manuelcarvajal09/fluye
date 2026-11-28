# Auditoría de UX · Fluye (26 nov 2026)

Método: «Cimientos de UX» (10 heurísticas de Nielsen, severidad 0–4). Se recorrieron en móvil (390×844) Hoy, Explorar, Biblioteca, Palabras, Repaso, Progreso, Perfil, Armario, Amigos, Ajustes, Rutas, Series, Música y una sesión de 5 minutos respondiendo mal a propósito, con el usuario de prueba en local (base de desarrollo). Se leyó el código de Hoy, la sesión, Ajustes, el layout y la carga.

## 1. Resumen

Se encontraron 13 problemas: ninguno crítico, 6 mayores, 6 menores y un grupo de detalles cosméticos. El más urgente es el que notaste: al fallar solo aparece «Respuesta correcta: …». La explicación existe, pero está escondida tras un enlace pequeño «¿Por qué?» que casi nadie abre, y en las frases construidas no explica qué palabra falló ni por qué.

## 2. Hallazgos priorizados

| # | Problema | Dónde | Heurística | Sev. |
|---|---|---|---|---|
| 1 | La explicación del error está escondida y no dice qué regla rompiste | Sesión, barra de corrección | 09 Recuperarse de errores | 3 |
| 2 | Dos botones de guardar; el fijo no guarda Temporadas, Experiencia ni Módulos de Hoy | Ajustes | 04 Consistencia · 05 Prevención | 3 |
| 3 | «Guardado» aparece aunque el guardado falle | Ajustes | 01 Estado · 09 Errores | 3 |
| 4 | «Aprender las siguientes 20» activa *the, be, that, to* aunque seas B1 | Biblioteca → Palabras | 02 Mundo real · 07 Eficiencia | 3 |
| 5 | Al tocar varias secciones no pasa nada visible hasta que llega la página | Biblioteca, Ajustes, Practicar, Rutas, Series, Música, Sonidos | 01 Estado | 3 |
| 6 | Arranque en frío sin pantalla de apertura; el layout encadena 4 consultas seguidas | Apertura de la app | 01 Estado | 3 |
| 7 | Hoy repite datos y abre con la misión antes que tu estado del día | Hoy | 08 Minimalismo | 2 |
| 8 | Ajustes es una sola página de 8 pantallas con 11 bloques | Ajustes | 06 Reconocer · 08 Minimalismo | 2 |
| 9 | Cinco filtros apilados empujan los resultados; la lista empieza en A1 | Biblioteca (móvil) | 07 Eficiencia · 08 | 2 |
| 10 | Música: 41 ejercicios en una lista de 22 pantallas, sin marca de hecho | Música | 06 Reconocer · 08 | 2 |
| 11 | Tres «niveles» distintos en Perfil (inglés, rango de juego, nivel de juego) | Perfil | 02 Mundo real | 2 |
| 12 | La página se desborda a lo ancho en el teléfono | Amigos | 04 Estándares | 2 |
| 13 | Cosméticos (lista abajo) | Varias | 01, 08 | 1 |

## 3. Detalle

**1 · La explicación del error está escondida**
- **Qué pasa:** al fallar ves «Respuesta correcta: eso, ese, esa» y un enlace pequeño «¿Por qué?». Dentro hay buena información (qué significa lo que elegiste, notas, errores típicos, un mini refuerzo), pero cerrada por defecto. En «Construye la frase» y «Escríbelo en inglés» solo se marca la diferencia palabra por palabra, sin decir la regla («te faltó *a* antes de *long way*»).
- **Por qué importa:** un error sin explicación no enseña; la persona repite el fallo.
- **Cómo arreglarlo:** al fallar, abrir automáticamente una explicación corta de 1–2 líneas con icono del tipo de error (significado, orden, falta, sobra, tiempo verbal, falso amigo, registro, sonido) y dejar el detalle completo plegado debajo. En frases construidas, generar la frase a partir de la diferencia: «Te faltó *a*», «Sobró *the*», «*from* va después de *way*». Al acertar, sigue plegado como ahora.
- **Prompt para tu AI:**
```
En src/components/session/SessionRunner.tsx (FeedbackBar) y Exercises.tsx (WhyPanel): cuando fb.ok es false, muestra WhyPanel abierto por defecto con una línea de resumen arriba ("Elegiste X, que significa Y" o, si hay fb.ops, una frase por operación: "Te faltó «a»", "Sobró «the»", "«from» va después de «way»"). Añade un icono por tipo de error. Mantén el detalle (definición, nota, errores frecuentes, ejemplo con audio y refuerzo) plegable debajo. Cuando fb.ok es true, conserva el comportamiento actual (plegado). No uses servicios externos: todo sale de los datos del ítem y de fb.ops.
```

**2 · Dos botones de guardar en Ajustes**
- **Qué pasa:** «Guardar cambios» va fijo abajo y parece guardar todo, pero Temporadas, Experiencia y Módulos de Hoy tienen su propio botón «Guardar estas preferencias» al final. Si cambias un interruptor de esos bloques y pulsas el botón fijo, el cambio se pierde sin aviso.
- **Por qué importa:** dos botones parecidos con alcances distintos llevan a perder cambios.
- **Cómo arreglarlo:** guardado automático por control (al soltar el interruptor o el control deslizante) con un aviso «Guardado» junto al control, o un único botón que guarde todo. Recomendación: guardado automático, porque Ajustes son preferencias sueltas.
- **Prompt para tu AI:**
```
Unifica el guardado de Ajustes: SettingsForm.tsx y ExtraSettings.tsx hoy tienen dos botones y dos llamadas a /api/profile. Cambia a guardado automático con debounce de 600 ms por cambio, un indicador por bloque ("Guardando…" → "Guardado" o "No se pudo guardar · Reintentar") y elimina la barra fija y el botón "Guardar estas preferencias". Comprueba res.ok antes de mostrar "Guardado". No pierdas ningún ajuste existente.
```

**3 · «Guardado» aunque falle**
- **Qué pasa:** `save()` no comprueba la respuesta del servidor; sin conexión, igual dice «Guardado».
- **Cómo arreglarlo:** comprobar `res.ok`, mostrar «No se pudo guardar. Revisa tu conexión y vuelve a intentarlo» con botón Reintentar y conservar lo cambiado. Queda resuelto con el prompt del #2.

**4 · «Siguientes 20 palabras» ignora tu nivel**
- **Qué pasa:** el botón del catálogo activa las 20 palabras más frecuentes sin filtrar por nivel. Una persona B1 recibe *the, be, that, to, for*. En la sesión de prueba salieron «that» y «to» para B1. Hoy sí filtra por nivel; este botón no.
- **Por qué importa:** gasta repasos en lo que ya sabes y hace sentir la app básica.
- **Cómo arreglarlo:** en `/api/learn` (learn-next), filtrar desde el nivel del perfil hacia arriba y excluir determinantes y pronombres, como hace la palabra sugerida de Hoy. Añadir un control «Desde: mi nivel / desde A1».
- **Prompt para tu AI:**
```
En src/app/api/learn/route.ts (action "learn-next"), aplica el mismo filtro que la palabra sugerida de Hoy (src/app/(app)/hoy/page.tsx): nivel >= profile.level, sin pos "det" ni "pron", respetando s.explicit para el registro. Acepta un parámetro opcional from: "level" | "a1" (por defecto "level") y añade el selector en CatalogBatch.tsx. No borres tarjetas existentes.
```

**5 · Secciones sin estado de carga**
- **Qué pasa:** solo Hoy, Explorar, Repaso, Progreso, Perfil, Armario, Amigos y Sesión tienen pantalla de carga. En Biblioteca, Ajustes, Practicar, Rutas, Series, Música y Sonidos, al tocar no cambia nada hasta que llega la página (en local 0,4–1 s; en producción más). Los esqueletos que existen son bloques genéricos que no se parecen al contenido.
- **Cómo arreglarlo:** un `loading.tsx` por sección con un esqueleto que imite su estructura real (título, filtros, tarjetas); marcar al instante la pestaña pulsada; transición suave entre pestañas.
- **Prompt para tu AI:**
```
Crea loading.tsx para biblioteca, biblioteca/palabras, ajustes, practicar, rutas, series, musica y sonidos dentro de src/app/(app)/. Cada uno debe imitar la estructura real de su página (título, chips o filtros, tarjetas con su altura aproximada) usando la clase .skel existente. La barra de navegación debe marcar la pestaña pulsada al instante (estado optimista con useLinkStatus o similar). Respeta prefers-reduced-motion.
```

**6 · Arranque en frío**
- **Qué pasa:** al abrir la app no hay pantalla de apertura propia; el layout espera `requireProfile` → `applyFreezes` → `dailyLife` → `dueCount`, una tras otra, y luego la página vuelve a pedir el perfil (no está en caché por petición). Hoy hace 9 consultas más en paralelo.
- **Cómo arreglarlo:** (a) pantalla de apertura con el isotipo animado; (b) `cache()` de React en la carga del perfil; (c) lanzar `dueCount` en paralelo con lo demás; (d) cargar en streaming los módulos secundarios de Hoy (semana, retos, logro) con `Suspense`, de modo que la meta y la misión salgan primero.

**7 · Hoy: orden y repeticiones**
- **Qué pasa:** en móvil sale primero la misión y después la meta. Los repasos aparecen tres veces (etiqueta de la misión, mosaico «34 repasos pendientes» y gráfica «Próximos repasos»), los retos en dos bloques y las colecciones en dos. Son unas 14 tarjetas, 4 pantallas de desplazamiento.
- **Cómo arreglarlo (lo que pediste):** arriba una franja de estado del día (anillo de meta, repasos pendientes y racha, tocables); debajo la tarjeta «Continúa tu sesión / Tu siguiente misión» con el botón grande; después un solo bloque de retos (hoy y semana en pestañas) y los accesos rápidos; al final, lo opcional. Quitar los duplicados.

**8 · Ajustes demasiado larga**
- **Qué pasa:** 11 bloques en 8 pantallas; la lista de áreas de interés ocupa casi 2 pantallas.
- **Cómo arreglarlo:** pestañas o índice fijo: *Estudio* (nivel, meta, nuevas por día, FSRS, áreas) · *Voz y sonido* · *Compañero y apariencia* · *Recordatorio* · *Temporadas y experiencia* · *Datos y cuenta*. Áreas de interés como chips plegados («5 elegidas · Editar»).

**9 · Biblioteca en móvil**
- **Qué pasa:** buscador más 5 selectores apilados (Tipo, Nivel, Área, Etiqueta, Estado) antes del primer resultado; la lista empieza por A1 («'kay», «a table for two»).
- **Cómo arreglarlo:** buscador y un botón «Filtros (n)» que abre una hoja inferior; chips rápidos «Mi nivel · Aprendiendo · Phrasal verbs · De series»; por defecto, tu nivel.

**10 · Música en una sola lista**
- **Qué pasa:** 41 ejercicios en una sola lista de unas 22 pantallas; no se distingue lo hecho de lo pendiente.
- **Cómo arreglarlo:** tarjetas compactas (título, género, estado) que abren el ejercicio; marca de hecho; «Siguiente pendiente» arriba; agrupar por género con portada (P5 del storyboard).

**11 · Tres niveles en Perfil**
- **Qué pasa:** «Inglés B1 (orientativo)», «Rango de juego: Brote» y «Nivel de juego 2 · Curioso». Cuesta saber cuál importa.
- **Cómo arreglarlo:** un solo indicador de juego (rango con su nivel dentro) y el nivel de inglés separado y explicado («Tu nivel de inglés: B1, según tu test»). Quitar el punto suelto tras «(orientativo)».

**12 · Amigos se desborda**
- **Qué pasa:** a 390 px la página mide 450 px de ancho: se puede arrastrar de lado.
- **Cómo arreglarlo:** revisar el ancho mínimo de la columna de Buzón y Amistades; añadirla a la prueba de pantallas (hoy `/amigos` no está en `screens.spec.ts`).

**13 · Cosméticos (severidad 1)**
- En una sesión, «Paso 1 de 15» pasa a «Paso 2 de 16» sin explicar que se añadió el repaso de lo fallado. Basta un aviso breve: «+1 para repasar lo que fallaste».
- El texto de ejemplo del buscador de Explorar se corta («give u»).
- La gráfica «XP por día» de Perfil con un solo día con datos se ve como un bloque verde lleno.
- La barra de corrección tapa la última opción; la elegida se ve a medias.

## Lo que está bien (conservar)

- Navegación inferior de 5 destinos con etiqueta y «Estudiar» al centro con el número de repasos.
- Barra de corrección clara: color, icono, la respuesta, diferencia palabra por palabra, Intro para continuar, y «Me costó / Fácil» para calibrar FSRS.
- Estados vacíos con texto útil (Amigos, Colecciones) y la explicación de privacidad del micrófono.
- La mascota que acompaña la carga y los consejos.
- Repaso explica cada botón y cuándo vuelve la tarjeta.

## 4. Checklist

| | Heurística | Estado |
|---|---|---|
| 01 | ¿Siempre sabe qué está pasando? | ⚠️ Secciones sin carga, «Guardado» falso, arranque sin pantalla de apertura |
| 02 | ¿Habla su idioma? | ⚠️ Tres niveles en Perfil; palabras A1 para B1 |
| 03 | ¿Puede deshacer y salir? | ✅ Salir de la sesión, suspender o reanudar tarjetas, «Otra vez» |
| 04 | ¿Es consistente? | ⚠️ Dos botones de guardar; Amigos se desborda |
| 05 | ¿Previene errores? | ⚠️ Cambios en Ajustes que se pierden |
| 06 | ¿Muestra en vez de hacer recordar? | ⚠️ Música sin marca de hecho; Ajustes sin índice |
| 07 | ¿Hay atajos para el uso diario? | ✅ Elegir minutos, Práctica rápida e Intro para continuar · ⚠️ filtros de Biblioteca |
| 08 | ¿Está despejada? | ⚠️ Hoy con duplicados; Ajustes y Música muy largas |
| 09 | ¿Ayuda a recuperarse de errores? | ⚠️ La explicación existe pero está escondida |
| 10 | ¿Hay ayuda en contexto? | ✅ Consejos del compañero, textos de Repaso y FSRS |

## 5. Plan por fases

**Fase 1 · Aprender del error y no perder cambios (1–2 días).** Hallazgos 1, 2, 3, 4 y 12. Incluye la explicación automática al fallar con frase por operación.

**Fase 2 · Que se sienta rápida (1–2 días).** Hallazgos 5 y 6: pantalla de apertura con el isotipo animado, esqueletos a medida en todas las secciones, pestaña marcada al instante, perfil en caché, consultas del layout en paralelo, módulos secundarios de Hoy en streaming, transiciones de vista entre pestañas y precarga de la sesión desde Hoy.

**Fase 3 (nueva) · Progreso, ligas, diario y contenido de la mudanza.** Plan en lotes (A–F): niveles sin repasar lo básico, contenido A1 para quien lo necesita, contracciones, vida diaria, entrevistas por puesto, economía equilibrada, arreglo de la ropa con control automático (`scripts/qa/combinaciones.mts`), permisos y vidas, ligas, regalo de registro, diario con fotos, frases motivacionales, lecturas y club de lectura, noticia de Canadá del día, mapa «Tu viaje», temáticas legendarias, fondos y cuatro mascotas nuevas. Encargo de arte en `docs/ux/CODEX-FASE3.md`.

**Hecho (27 nov) · Fase 4 (antes Fase 3) · Jerarquía y limpieza.** Hallazgos 7, 8, 9, 10, 11 y 13: Hoy con el estado primero y sin duplicados, Ajustes por pestañas, filtros de Biblioteca en una hoja, Música por tarjetas con estado, un solo nivel de juego en Perfil.

**Hecho · Arte y animación con Codex (antes Fase 4).** Encargo en `docs/ux/STORYBOARD-CODEX.md`: iconos de tipo de error, ilustraciones de estados vacíos y de error, escena de celebración, cabeceras de sección y portadas de géneros. Las animaciones las programa Claude sobre las capas entregadas.

## 6. Siguiente paso

Empezar por la Fase 1, hallazgo 1: que al equivocarte la explicación salga abierta y diga qué regla fallaste. Es lo que pediste y donde más se aprende.

*Las heurísticas no sustituyen probar con personas: cuando esté la Fase 1, conviene ver a otra persona usar una sesión sin ayuda.*
