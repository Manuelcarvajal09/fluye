# Fluye frente a Duolingo (noviembre de 2026)

Fuentes: blog oficial de Duolingo (guía de Practice Hub, mini-units intermedias, DuoRadio, la serie «Covering all the bases» de escucha, habla y escritura, la actualización de octubre de 2026, Friends Quests, ligas y avatar) y documentos para inversionistas. Dos documentos (Duocon 2025 y la carta del T3 2026) devolvieron 403; lo que se cita de ellos viene del resumen del buscador y no está verificado. Las funciones de pago (Super/Max) se adaptan aquí solo si se pueden hacer sin costo.

Estado en Fluye: **Hecho 1.0** = implementado en esta rama · **Existía** = ya estaba · **Parcial** · **Pendiente** · **No aplica**.

| Funcionalidad | Duolingo | Estado actual en Fluye | Mejora propuesta / hecha | Prioridad | Estado de implementación | Pruebas |
|---|---|---|---|---|---|---|
| Banco de palabras | Fichas para ordenar o traducir; también se puede escribir | Hecho 1.0 | Fichas con toque, ratón y teclado (Tab, Enter, Retroceso), 2 palabras de distracción y corrección palabra por palabra | Alta | Hecho | E2E `v1.spec` (banco + «¿Por qué?») |
| Escritura libre | Traducir escribiendo | Existía | Se usa más en repaso y en C1+ (menos fichas a mayor nivel) | Alta | Hecho | flow.spec |
| Dictado | Escuchar y escribir | Hecho 1.0 | Dictado de la frase completa con corrección por palabras (contracciones equivalentes) | Alta | Hecho | Unitarias de alineación |
| Emparejar parejas | Match y Match Madness con tiempo | Hecho 1.0 (sin tiempo) | Práctica final con los errores del día; el reloj se descartó porque añade presión sin aportar aprendizaje | Media | Hecho | Pendiente E2E específico |
| Pares mínimos | Elegir entre sonidos parecidos | Existía | Sonidos con pares mínimos medibles | — | Existía | flow.spec |
| Flashcards con respuesta oral o escrita | Flashcards e Image Flashcards (oct. 2026) | Parcial | Repaso tipo tarjeta con autoevaluación; Image Flashcards con escenas pendiente | Media | Parcial | flow.spec |
| Explicar mi respuesta | Explain My Answer (IA, era de Max) | Hecho 1.0 | «¿Por qué?» determinista: usa solo datos del ítem (significado, definición, nota, errores típicos, confusiones y la opción elegida), con audio y un refuerzo breve. No inventa reglas | Alta | Hecho | E2E `v1.spec` |
| Práctica de errores | Practice → Mistakes | Existía + 1.0 | Lo fallado vuelve al final de la sesión y se cierra con emparejar los errores; el tutor detecta confusiones recurrentes | Alta | Hecho | Manual + E2E parcial |
| Sesiones por habilidad | Practice → Listen / Speak | Parcial | Escucha (historias, series), Pronunciación y Repaso por separado | Media | Parcial | — |
| Historias interactivas | Stories | Existía | Lecciones con historia y preguntas | — | Existía | flow.spec |
| Minipódcast / radio | DuoRadio | Pendiente | Las escenas de series cubren la escucha sin texto; minipódcast propio pendiente | Media | Pendiente | — |
| Aventuras | Adventures | No aplica en 1.0 | Los roleplays guiados y las misiones cubren el objetivo pedagógico | Baja | No aplica | — |
| Conversación con personajes | Video Call / Roleplay (IA de pago) | Existía (por reglas) | Roleplays guiados sin IA de pago, con respuestas modelo | Media | Existía | flow.spec |
| Inglés de series | No existe como tal | Hecho 1.0 | 24 microescenas B1–C2: sin subtítulos → contexto → expresiones → completar → subtítulos → intención → shadowing → respuesta | Alta | Hecho | E2E `v1.spec` |
| Retroalimentación de voz | Speak con reconocimiento | Hecho 1.0 | Sustituciones, omisiones y añadidas explicadas (p. ej. *figure out* frente a *find out*), práctica del fragmento difícil, pausas medidas; la pronunciación se marca como «no medible» en lugar de inventar porcentajes | Alta | Hecho | Unitarias de alineación |
| Shadowing | — | Existía + 1.0 | En historias, escenas y Música | Media | Hecho | — |
| Ejercicios sin pistas | Legendary | Parcial | En repaso y C1+ se pide producción libre; falta un modo «sin ayudas» explícito | Media | Parcial | — |
| Misiones diarias | Daily Quests | Existía | Retos diarios y semanales con gemas | — | Existía | — |
| Ligas | Leaderboards (10 ligas) | Hecho 3.1 | Clasificación semanal entre amistades | — | Existía | armario.spec |
| Retos y rachas con amigos | Friend Streak, Friends Quests | Parcial | Amigos, regalos y clasificación; rachas compartidas pendientes | Baja | Parcial | armario.spec |
| Vidas / energía | Vidas o energía (gratis) | Existía (3.1) | Las vidas nunca bloquean el estudio; se recuperan practicando | — | Existía | armario.spec |
| Protector de racha | Streak Freeze | Existía | Con gemas, máximo 2 | — | Existía | — |
| Personalización del personaje | Avatar, Avatar Suits | Existía + 1.0 | 12 mascotas y 71 piezas; corregida la escala y la oclusión; ropa en las 8 poses (arte de Codex) | Alta | Hecho | qa-mascotas + armario.spec |
| Recuperación tras inactividad | Repaso al volver | Existía | Sesión de regreso | — | Existía | — |
| Progreso por competencias | Duolingo Score | Parcial | Barra del idioma por nivel y estadísticas por periodo; falta una puntuación por habilidad | Media | Parcial | — |
| Controles de sonido y animación | Ajustes | Existía + 1.0 | Sonidos, celebraciones y movimiento reducido propio | — | Hecho | screens.spec (reducido) |
| Revisión de partida | Chess Game Review | No aplica | Exclusiva del curso de ajedrez | — | No aplica | — |

Las funciones que sirven sobre todo para alargar el tiempo de uso, sin aportar aprendizaje, no se copiaron: el reloj obligatorio en emparejar, las ligas con descensos y los anuncios.
