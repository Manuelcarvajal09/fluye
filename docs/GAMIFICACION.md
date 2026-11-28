# Reglas de gamificación

Principios: premiar el **recuerdo real**, la **variedad** y la **constancia**; nunca bloquear el aprendizaje; lo cosmético jamás cambia FSRS. Todo se valida en el servidor.

## XP (práctica)

- Recuerdo en primer intento, sin ayuda: 10 · con ayuda o en segundo intento: 5 · fallo: 2 · ver la solución: 1 · expresión nueva: +5.
- Un reintento dentro de la misma sesión es práctica: no vuelve a tocar FSRS ni suma.
- Cada intento lleva un `attemptId`: si llega dos veces (recarga, red), cuenta una sola vez.

## Gemas (cosméticas)

Por eventos (tabla) y por XP de estudio (que ya premia el recuerdo y no se puede «granjear» repitiendo: los reintentos no suman):

| Evento | Gemas | Clave idempotente |
|---|---|---|
| Meta diaria | 10 | `goal:<día>` |
| Reto diario | 5 | `mission:<día>:<reto>` |
| Reto semanal | 25 | `wk:<lunes>:<reto>` |
| Pista de misión completada por primera vez | 10 | `route:<pista>` |

La tienda descuenta con una condición en la propia actualización (`gems >= precio`) y no cobra doble si ya tenías el objeto.

## Rachas

- Cuenta días con la meta cumplida, por **día local** de la persona (zona horaria del dispositivo; viajar no crea días dobles).
- **Protector de racha** (80 gemas, máximo 3; también en la pestaña principal de la Tienda): cubre días sin meta; esos días se muestran como «protegidos», no como estudiados.
- Volver tras una ausencia activa la **sesión de regreso** (más repaso, poco nuevo) sin castigos.

## Ligas (Fase 3)

- 8 ligas: Semilla, Brote, Hoja, Arce, Pino, Glaciar, Aurora y Cumbre. Semana de lunes a domingo, hora de Edmonton (`src/lib/league-rules.ts`).
- Compiten todas las cuentas de la misma liga. Con 5 o más activos sube el 30 % de arriba y baja el 20 % de abajo; con menos, sube quien pase el mínimo de XP de su liga y baja quien no llegue al de permanencia. Con 0 XP se baja (salvo en Semilla); cada semana completa sin entrar cuenta como 0 XP.
- Cierre perezoso e idempotente: la primera visita después del domingo cierra la semana para todos (`league_weeks`). Subir paga 30–120 gemas según la liga nueva (`league:<semana>` en el libro de gemas).
- La liga reemplaza al antiguo «rango de juego» en Perfil y a la clasificación semanal de Amigos.

## Diario, lecturas y noticia del día (Fase 3)

- **Diario** (`/diario`): ánimo, actividades, preguntas opcionales que rotan (`src/lib/journal-prompts.ts`), una frase en inglés, lo aprendido y hasta 3 fotos por día. Las fotos se comprimen en el navegador (WebP ≤ 1280 px, ≤ 400 KB), se guardan en la base (`journal_photos`) y solo las ve su dueño. Se incluyen en la exportación de datos. Administrar muestra el espacio usado y avisa al 70 % del límite gratuito.
- **Frases** (`src/lib/quotes.ts`): 120 frases originales en inglés y español; una por día en Hoy, el diario y al terminar la sesión.
- **Lecturas** (`content/readings/`, validadas al compilar): glosario resaltado y cualquier palabra se toca para ver su traducción con el diccionario local (`/api/dict`). Terminar una lectura da 15 XP + 5 por respuesta correcta, solo la primera vez.
- **Club de lectura**: una lectura común por semana (rota entre las marcadas como club). Las amistades ven quién la terminó, su puntuación y su reflexión, y pueden reaccionar con un emoji (`social_reactions`).
- **Noticia de Canadá**: comunicados de canada.ca por Atom, una por día (hora de Edmonton), guardada en `daily_news`. Se reproduce sin fines comerciales con título, autor y enlace al original, como piden los términos de canada.ca. Las preguntas son de vocabulario real del texto.

## Temáticas legendarias y fondos (Fase 3)

- 16 temáticas (`content/themes/themes.json`): cambian los colores de toda la app en claro y oscuro y añaden un patrón de fondo suave. `scripts/build-themes.mjs` valida el contraste WCAG AA y genera `src/app/temas.css`. Cuestan 400 gemas; con el permiso «todas las temáticas» (propietarios incluidos) están todas. La temática se pinta en el servidor desde una cookie (sin parpadeo) y, con una temática puesta, la paleta de temporada no se superpone.
- 16 fondos para la mascota (por ahora, escenas ilustradas de la app; precio por rareza). Se ven en el armario y en el perfil.
- Se compran y aplican en Tienda → Temáticas y fondos; el servidor comprueba que sean tuyos (`/api/shop` acción `appearance`).

## Regalo de registro (hasta el 31 de diciembre de 2026)

Una mascota de pago no legendaria al azar, una pieza de tienda al azar, una pieza navideña distinta y la temática Navidad (`src/lib/promo.ts`). Se entrega una sola vez al crear la cuenta y Hoy lo muestra las dos primeras semanas.

## Rango de juego vs nivel de inglés

El rango (Brote → Diamante) y el nivel de juego miden XP acumulada. **No** son el nivel CEFR, que solo sale de evidencia (test de nivel) y es orientativo.

## Retos con amistades

Desactivados por defecto. Solo entre miembros que lo activen. Se comparte únicamente el nombre y cuántos días de la semana cada quien cumplió **su propia** meta (justo para distintos minutos). Nada es público.

## Armario (3.1)

Código: `src/lib/wardrobe.ts` (catálogo, composición, cofres), `src/lib/economy.ts` (saldos), `src/lib/social.ts` (amistades y regalos). Cada movimiento queda en `wallet_events` con una clave única: repetir una petición no cobra ni paga dos veces.

- **Una sola moneda: las gemas** (desde 3.2; el saldo de monedas de cada cuenta pasó íntegro a gemas). Compran prendas, accesorios, mascotas, cofres, potenciadores, la protección de vida (5) y el protector de racha (80).
- Se ganan con la tabla de arriba (meta, retos, misiones) y además estudiando: 1 por cada 12 XP del total del día, con tope de 40 diarias (un movimiento agrupado por día, `study-gems:<día>`; reglas en `src/lib/economy-rules.ts`). Los logros pagan 15 gemas una sola vez. Saldo inicial de cuentas nuevas: 120.
- **Rarezas y precios directos** (subidos en la Fase 3): Normal 60 · Raro 110 · Épico 180 · Legendario 280 gemas. Mascotas nuevas: +40 (conejo 100, nutria y ciervo 150, panda rojo 220, ajolote 320). Las 7 mascotas originales son gratis.
- **Inicio**: todas las cuentas tienen la flor y los lentes redondos. Las cuentas que ya existían conservan además el gorro, los audífonos y la bufanda (antes gratuitos) y todo lo comprado con gemas.
- **Logros** (solo se ganan, una vez cada uno): rachas de 5, 10, 30, 60, 120 y 360 días (mejor racha de meta cumplida), primer repaso y primera amistad.
- **Conjuntos**: una pieza por zona (cuerpo, cuello, pecho, cara, cabeza, cabello) y un conjunto guardado por mascota. Todo se puede probar antes de tenerlo; solo se guarda lo que es tuyo (validado en el servidor).

## Cofres

| Cofre | Precio | Vacío | Normal | Raro | Épico | Legendario |
|---|---|---|---|---|---|---|
| Semilla | 34 | 20 % | 51 % | 21 % | 7 % | 1 % |
| Brote | 48 | 12 % | 35 % | 32 % | 17 % | 4 % |
| Aurora | 58 | 6 % | 22 % | 32 % | 28 % | 12 % |

- Todos cuestan menos que la pieza más barata (35), así que abrir siempre es más barato que comprar directo.
- Primero se elige la rareza y luego un premio al azar de esa rareza (piezas de tienda y mascotas de pago; nunca piezas de logro).
- **Repetido**: se conserva una sola copia y se devuelve la **mitad del precio del cofre** (redondeado hacia abajo). Así un cofre nunca deja ganancia neta.
- **Modo de prueba** (Armario → Cofres): reproduce cualquier resultado sin cobrar ni entregar nada.

## Vidas

- Cada cuenta parte de 5. Un error en una lección resta una vida; una protección activa se consume en su lugar. Las autoevaluaciones no restan.
- **Con 0 vidas se bloquea lo nuevo** (Fase 3): no hay lecciones ni expresiones nuevas, pero el repaso y la práctica siguen abiertos; en el repaso sin vidas, cada 8 aciertos devuelve una (máx. 3 al día) y cada día llega una más.
- **Vidas ilimitadas**: permiso por cuenta que concede el propietario en Administrar (tabla `member_perks`); los propietarios lo tienen siempre. El contador muestra ∞.
- Recuperación: +1 diaria al entrar (puede llegar a 7), +1 por el primer regalo abierto del día (`life-gift:<día>`), +1 por cada 8 aciertos en Repaso hasta 3 al día (sin pasar de 5).

## Amistades y regalos

- Se agrega con un código de 6 caracteres; la amistad queda pendiente hasta que la otra persona acepta. Las amistades ven nombre, mascota, racha, XP de la semana y último día de estudio.
- Clasificación semanal por XP de estudio desde el lunes.
- Regalos: **carta** (gratis, hasta 280 caracteres), **gemas** (1–20, se descuentan al enviar) y **potenciador** (uno de los tuyos). Hasta 5 regalos al día.
- Se cobra al enviar (clave `gift:<id>` y `client_key` única por envío) y se entrega al abrir (`opened_at` condicional + `gift-in:<id>`): repetir el envío o abrir otra vez no duplica nada. Un agradecimiento por regalo; el remitente lo ve en «Enviados».
- **Potenciador**: doble XP durante 15 minutos (60 gemas). No cambia FSRS ni los repasos.

## Controles

Sonidos, celebraciones, temporadas (paleta/decoración/contenido) y módulos de Hoy se pueden apagar en Ajustes. «Reducir movimiento» (Perfil) quita saltos, destellos y animaciones de mascotas, cofres y regalos, además de respetar el ajuste del sistema.
