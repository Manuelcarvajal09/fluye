# Fluye · Escenas e ilustraciones pendientes (encargo paralelo)

Encargo independiente del armario: puede hacerse en otra conversación de Codex mientras sigue la regeneración de mascotas (`docs/ux/CODEX-FASE3-REGENERACION.md`). Sustituye los lotes 6 a 9 de `docs/ux/CODEX-FASE3.md`.

## Reglas comunes

- **Original y nuevo**: nada reciclado de otras escenas de la app, ni personajes, logos, texto legible o marcas reales (pantallas con líneas o bloques abstractos, libros con lomos lisos, carteles sin letras).
- **Estilo**: el de las escenas actuales (`public/scenes/scene-cafe.webp`, `scene-entrevistas.webp`): cartoon limpio, contornos suaves, luz cálida, colores armónicos. Las personas, si aparecen, son genéricas y diversas, sin parecerse a nadie real.
- **Formato de escenas**: PNG 1536 × 960 sin transparencia (la app las pasa a 960 × 600). Zona segura: el tercio central sin elementos cortados; nada importante en el 8 % de cada borde.
- Cada tanda en un ZIP en Descargas, `fluye-escenas-tanda<N>.zip`, con `manifest.json` (id → archivo, título y descripción en español para el texto alternativo) y `LEEME.md`. **Detente al terminar cada tanda** para revisión.

## Tanda A · Entrevistas y vida en casa (8 escenas) · prioridad alta

Cada escena acompaña una ruta que hoy sale sin imagen.

| id | Ruta | Idea |
|---|---|---|
| `scene-entrevista-soporte-ti` | Entrevista: soporte de TI | Mesa de ayuda con dos monitores, audífonos con micrófono, una persona entrevistadora amable al otro lado |
| `scene-entrevista-implementacion` | Entrevista: implementación y CRM | Sala de juntas, pizarra con diagrama de flujo abstracto (cajas y flechas, sin texto), laptop |
| `scene-entrevista-desarrollo` | Entrevista: desarrollo de software | Oficina luminosa, pantalla con bloques de código abstractos de colores, tazas, post-its sin texto |
| `scene-entrevista-marketing` | Entrevista: marketing | Pizarra con gráficas de barras y círculos, tableta con cuadrícula de publicaciones sin texto |
| `scene-entrevista-clientes` | Entrevista: atención al cliente | Estación con audífonos, pantalla de chat con burbujas sin letras, planta |
| `scene-entrevista-biologia` | Entrevista: laboratorio y campo | Laboratorio con microscopio y probetas; por la ventana, campo con río y botas de campo junto a la puerta |
| `scene-entrevista-inventarios` | Entrevista: inventarios y almacén | Almacén con estantes de cajas, escáner de mano, carrito y montacargas al fondo |
| `scene-en-casa` | Un día en casa | Sala y cocina abiertas: platos en el fregadero, arenero de gatos limpio en una esquina, dos gatos, sofá con control remoto |

## Tanda B · Portadas de lecturas (12) · prioridad media

PNG 1200 × 750 sin transparencia, misma estética, sin texto (el título lo pone la app encima).

`lectura-edmonton-invierno`, `lectura-primer-empleo`, `lectura-transporte-ets`, `lectura-rentar-depa`, `lectura-cultura-canadiense`, `lectura-trabajo-remoto`, `lectura-ia-y-trabajo`, `lectura-series-favoritas`, `lectura-parques-nacionales`, `lectura-hockey`, `lectura-comida-canada`, `lectura-voluntariado`. El tema de cada una está en `content/readings/<id>.json` (`title`, `intro_es`).

## Tanda C · Mapa «Tu viaje» (6 cabeceras + iconos) · prioridad media

- **Cabecera de cada isla** (PNG 1500 × 500 sin transparencia, se muestra arriba del bloque de cada nivel en `/mapa`): `isla-a1` playa de llegada con muelle, `isla-a2` pueblo con mercado, `isla-b1` ciudad con oficinas y café, `isla-b2` montañas y lago, `isla-c1` bosque boreal con aurora, `isla-c2` cumbre nevada con bandera.
- **Iconos de parada** (SVG o PNG RGBA 192 × 192, se ven a 52 px dentro de un círculo): `parada-leccion` (libro), `parada-mision` (bandera de ruta), `parada-conversacion` (dos burbujas), `parada-entrevista` (maletín), `parada-lectura` (periódico o libro abierto), `parada-repaso` (flechas en círculo). Una sola versión por icono; el estado (pendiente, «sigue aquí», hecha) lo pone la app con el color del círculo.
- **Cofre y trofeo** (PNG RGBA 384 × 384): `cofre-mapa-cerrado`, `cofre-mapa-abierto`, `trofeo-isla`.

## Tanda D · Ligas y diario · prioridad baja

- **8 insignias de liga** (PNG RGBA 512 × 512): `liga-semilla`, `liga-brote`, `liga-hoja`, `liga-arce`, `liga-pino`, `liga-glaciar`, `liga-aurora`, `liga-cumbre`. Más valiosas al subir (de madera clara a cristal y oro). Forma propia de Fluye, no escudos de otras apps.
- **5 caritas de ánimo** (PNG RGBA 256 × 256): `animo-1` (muy mal) … `animo-5` (excelente). Gotas o semillas con cara; nada de frijoles ni personajes conocidos.
- **Estado vacío del diario** (PNG RGBA 960 × 720): libreta abierta con pluma y taza, con espacio para la mascota a la derecha.

## Comprobación antes de entregar

1. Dimensiones y opacidad correctas; RGBA real solo donde se pide.
2. Hoja de contacto de la tanda.
3. Sin texto legible, logos ni personajes reconocibles.
4. Los ids del manifiesto coinciden exactamente con los de este documento.
