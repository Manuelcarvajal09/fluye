# Reglas de gamificación

Principios: premiar el **recuerdo real**, la **variedad** y la **constancia**; nunca bloquear el aprendizaje; lo cosmético jamás cambia FSRS. Todo se valida en el servidor.

## XP (práctica)

- Recuerdo en primer intento, sin ayuda: 10 · con ayuda o en segundo intento: 5 · fallo: 2 · ver la solución: 1 · expresión nueva: +5.
- Un reintento dentro de la misma sesión es práctica: no vuelve a tocar FSRS ni suma.
- Cada intento lleva un `attemptId`: si llega dos veces (recarga, red), cuenta una sola vez.

## Gemas (cosméticas)

Solo por eventos, **nunca por respuesta suelta** (no se pueden «granjear» repitiendo ejercicios):

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

## Controles

Sonidos, celebraciones, temporadas (paleta/decoración/contenido) y módulos de Hoy se pueden apagar en Ajustes.
