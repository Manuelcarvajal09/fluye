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
- **Protector de racha** (50 gemas, máximo 2): cubre días sin meta; esos días se muestran como «protegidos», no como estudiados.
- Volver tras una ausencia activa la **sesión de regreso** (más repaso, poco nuevo) sin castigos.

## Rango de juego vs nivel de inglés

El rango (Brote → Diamante) y el nivel de juego miden XP acumulada. **No** son el nivel CEFR, que solo sale de evidencia (test de nivel) y es orientativo.

## Retos con amistades

Desactivados por defecto. Solo entre miembros que lo activen. Se comparte únicamente el nombre y cuántos días de la semana cada quien cumplió **su propia** meta (justo para distintos minutos). Nada es público.

## Armario (3.1)

Código: `src/lib/wardrobe.ts` (catálogo, composición, cofres), `src/lib/economy.ts` (saldos), `src/lib/social.ts` (amistades y regalos). Cada movimiento queda en `wallet_events` con una clave única: repetir una petición no cobra ni paga dos veces.

- **Una sola moneda: las gemas** (desde 3.2; el saldo de monedas de cada cuenta pasó íntegro a gemas). Compran prendas, accesorios, mascotas, cofres, potenciadores, la protección de vida (5) y el protector de racha (50).
- Se ganan con la tabla de arriba (meta, retos, misiones) y además estudiando: 1 por cada 4 XP (un movimiento agrupado por día, `study-gems:<día>`). Saldo inicial de cuentas nuevas: 120.
- **Rarezas y precios directos**: Normal 35 · Raro 65 · Épico 105 · Legendario 160 gemas. Mascotas nuevas: +25 (conejo 60, nutria y ciervo 90, panda rojo 130, ajolote 185). Las 7 mascotas originales son gratis.
- **Inicio**: todas las cuentas tienen la flor y los lentes redondos. Las cuentas que ya existían conservan además el gorro, los audífonos y la bufanda (antes gratuitos) y todo lo comprado con gemas.
- **Logros** (solo se ganan, una vez cada uno): rachas de 5, 10, 30, 60, 120 y 360 días (mejor racha de meta cumplida), primer repaso y primera amistad.
- **Conjuntos**: una pieza por zona (cuerpo, cuello, pecho, cara, cabeza, cabello) y un conjunto guardado por mascota. Todo se puede probar antes de tenerlo; solo se guarda lo que es tuyo (validado en el servidor).

## Cofres

| Cofre | Precio | Vacío | Normal | Raro | Épico | Legendario |
|---|---|---|---|---|---|---|
| Semilla | 20 | 20 % | 51 % | 21 % | 7 % | 1 % |
| Brote | 28 | 12 % | 35 % | 32 % | 17 % | 4 % |
| Aurora | 34 | 6 % | 22 % | 32 % | 28 % | 12 % |

- Todos cuestan menos que la pieza más barata (35), así que abrir siempre es más barato que comprar directo.
- Primero se elige la rareza y luego un premio al azar de esa rareza (piezas de tienda y mascotas de pago; nunca piezas de logro).
- **Repetido**: se conserva una sola copia y se devuelve la **mitad del precio del cofre** (redondeado hacia abajo). Así un cofre nunca deja ganancia neta.
- **Modo de prueba** (Armario → Cofres): reproduce cualquier resultado sin cobrar ni entregar nada.

## Vidas

- Cada cuenta parte de 5. Un error en una lección resta una vida; una protección activa se consume en su lugar. Las autoevaluaciones no restan.
- **Nunca bloquean**: con 0 vidas se puede seguir estudiando igual; la app indica cómo recuperarlas.
- Recuperación: +1 diaria al entrar (puede llegar a 7), +1 por el primer regalo abierto del día (`life-gift:<día>`), +1 por cada 8 aciertos en Repaso hasta 3 al día (sin pasar de 5).

## Amistades y regalos

- Se agrega con un código de 6 caracteres; la amistad queda pendiente hasta que la otra persona acepta. Las amistades ven nombre, mascota, racha, XP de la semana y último día de estudio.
- Clasificación semanal por XP de estudio desde el lunes.
- Regalos: **carta** (gratis, hasta 280 caracteres), **gemas** (1–20, se descuentan al enviar) y **potenciador** (uno de los tuyos). Hasta 5 regalos al día.
- Se cobra al enviar (clave `gift:<id>` y `client_key` única por envío) y se entrega al abrir (`opened_at` condicional + `gift-in:<id>`): repetir el envío o abrir otra vez no duplica nada. Un agradecimiento por regalo; el remitente lo ve en «Enviados».
- **Potenciador**: doble XP durante 15 minutos (40 gemas). No cambia FSRS ni los repasos.

## Controles

Sonidos, celebraciones, temporadas (paleta/decoración/contenido) y módulos de Hoy se pueden apagar en Ajustes. «Reducir movimiento» (Perfil) quita saltos, destellos y animaciones de mascotas, cofres y regalos, además de respetar el ajuste del sistema.
