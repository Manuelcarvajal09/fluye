# Encargo para Codex · Fase 3 de Fluye

Copia todo lo que está debajo de la línea y pégalo en Codex. Si Codex trabaja dentro del repositorio de Fluye, puede leer `src/lib/armario-data.json`, `src/lib/armario-poses.json`, `public/armario/`, `public/mascots/`, `docs/qa/mascotas-regeneracion-codex.md` (formato de capas de la entrega anterior), `docs/ux/STORYBOARD-CODEX.md` (reglas de marca) y `docs/qa/combinaciones.csv` (combinaciones con defectos). Entrega por lotes, en el orden indicado; no hace falta todo de una vez.

---

Necesito arte nuevo para **Fluye**, una app para aprender inglés. Todos los personajes y piezas son **100 % originales de Fluye**: mantén exactamente el estilo de las 12 mascotas actuales (contorno, colores planos con sombra suave, ojos grandes con brillo, proporciones de cabeza grande). No imites personajes, logotipos ni estilos de otras apps o marcas.

## Reglas para todo el encargo

- **Marca:** paleta esmeralda `#087a56` (oscuro `#22d3a0`), violeta `#5847d4` (oscuro `#9b8cff`), fondo `#f4f8f6` / `#101722`, tinta `#192337`, oro `#9a5b00` / `#ffd66b`. Las ilustraciones de escena son vector plano sin contornos y en tres tonos, como `public/scenes/scene-*.svg`.
- **Sin texto** dentro de las imágenes (la app pone los textos).
- **Mascotas y ropa:** PNG RGBA de **1024 × 1024 px**, con transparencia real, pies en la misma línea que la ilustración del estado y 60 px de margen. Las capas parciales se recortan a su contenido y su caja `[x, y, ancho, alto]` va en el manifiesto. Formato y nombres **idénticos** a `docs/qa/mascotas-regeneracion-codex.md` (`base`, `whole-*`, `lower-*`, `top-*`, `fabric-*`, `front-*`, cajas `ink`, `feet`).
- **Las capas `front-<sombrero>` contienen SOLO el sombrero** (ala, visera, puño): nada de pelo de la frente, orejas ni ojos. En la entrega anterior de la pose feliz venían con la cabeza repintada y tapaban la parte de arriba de los lentes.
- **Escenas, iconos y decoraciones:** SVG optimizado (sin `<script>`, sin imágenes incrustadas, sin enlaces externos, sin fuentes) con cada parte animable en `<g id="...">` y su pivote en un comentario `<!-- origen: x,y -->` justo después de abrir el grupo. Variantes `-claro` y `-oscuro` cuando se indica.
- Nombres de archivo en minúsculas, sin acentos, con guiones.

---

## Lote 1 · Correcciones de ropa (prioridad máxima)

Hoy se revisan automáticamente 59.712 combinaciones con `npx tsx scripts/qa/combinaciones.mts`. Las que fallan están en `docs/qa/combinaciones.csv`.

1. **Adornos de cabello con sombrero** en **búho** y **panda rojo** (pose feliz y donde marque el CSV): con gorra, gorros y sombreros el adorno queda casi oculto (hasta 81 %). Entrega en el manifiesto un juego de cajas `inkWithHat` por mascota: dónde va cada adorno de cabello (`flower`, `jardin-41…48`) cuando lleva cualquier pieza de cabeza, apoyado sobre el sombrero o a un lado, nunca tapado.
2. **Capas `front-*` de la pose feliz** para zorro, gato, perro, castor, oso, panda, búho, conejo, ciervo, panda rojo y ajolote (15 sombreros cada uno, 165 archivos). Ya las limpié de forma automática y los lentes se ven bien, pero si las regeneras con solo el sombrero, el borde queda más limpio. Prioridad baja dentro de este lote.

## Lote 2 · Cuatro mascotas nuevas

| id | Nombre | Rareza | Idea |
|---|---|---|---|
| `dragon` | Dragón | Legendario | Pequeño y amable, alas cortas, cuernitos redondeados, escamas verde jade con vientre crema |
| `tlacuache` | Tlacuache | Raro | Tlacuache mexicano tierno: cara blanca, orejas negras redondas, cola larga pelona y rosada |
| `mapache` | Mapache | Épico | Antifaz negro, cola con anillos, manitas expresivas |
| `unicornio` | Unicornio | Legendario | Cuerno en espiral dorado, crin pastel (lavanda, menta y rosa) |

Para cada una, con el mismo sistema que las 12 actuales:
- **8 ilustraciones de estado** (512 px): `<id>-happy`, `-cheer`, `-think`, `-oops`, `-wow`, `-sleep`, `-encourage`, `-proud`.
- **Pose feliz completa por capas:** `base`, `whole-<pieza>` de las 37 piezas de cuerpo, cuello y cabeza, `lower-*` (22), `top-*` (15), `fabric-*` (10), `front-*` (15, solo el sombrero), variante `marinera-sin-panuelo`, cajas `ink` de las 34 piezas pequeñas, `feet`, `boxes` (caja de cada pieza suelta medida sobre la ilustración) y la caja de recorte de cabeza (`x` del centro en %).
- **Las 7 poses restantes** con el mismo sistema (100 archivos por pose).
- **Cuidado con la anatomía:** el cuerno del unicornio y los cuernitos del dragón deben verse **por detrás** de gorros, coronas y audífonos (no atravesarlos). Las alas del dragón no se tapan con capas ni ponchos: la ropa se ajusta alrededor. La cola del tlacuache y la del mapache, visibles con cualquier prenda.
- **Hoja de contacto por mascota antes de seguir:** base de los 8 estados y 4 conjuntos de prueba: (1) cap + sweater + glasses + racha-5; (2) jardin-12 + chaleco + jardin-32 + jardin-21 + primera-amistad; (3) earmuffs + delantal + scarf + racha-30; (4) headphones + hoodie + bowtie + flower.

## Lote 3 · Ocho piezas navideñas (para las 16 mascotas)

| id | Zona | Rareza | Pieza |
|---|---|---|---|
| `gorro-reno` | cabeza | Raro | Diadema de cuernos de reno con cascabel |
| `bufanda-luces` | cuello | Raro | Bufanda verde con una tira de foquitos de colores |
| `pijama-navidad` | cuerpo | Épico | Pijama roja con estampado de copos y galletas |
| `lentes-estrella` | cara | Normal | Lentes con forma de estrella dorada |
| `mono-regalo` | cabello | Normal | Moño rojo de regalo |
| `pin-baston` | pecho | Normal | Pin de bastón de caramelo |
| `pin-galleta` | pecho | Raro | Pin de galleta de jengibre |
| `diadema-copos` | cabello | Épico | Diadema con copos de nieve brillantes |

Las piezas de cabeza, cuello y cuerpo necesitan `whole`, `lower`, `top`, `fabric` y `front` (según la zona) en las **16 mascotas × 8 poses**. Las pequeñas necesitan su capa suelta (`layers/<id>.png`, mitad de resolución), miniatura de catálogo (`items/<id>.png`, un cuarto de resolución) y cajas `ink` en las 16 mascotas × 8 poses.

## Lote 4 · Fondos del personaje (16)

Escenarios cuadrados de **1024 × 1024** (PNG o SVG) para poner **detrás** de la mascota en el armario, el perfil y las tarjetas de liga. Sin personajes; el centro inferior (donde está la mascota) despejado; horizonte a un 70 % de la altura.

| id | Rareza | Fondo |
|---|---|---|
| `bg-parque` | Normal | Parque con pasto y árboles |
| `bg-cuarto` | Normal | Cuarto acogedor con ventana |
| `bg-cafeteria` | Normal | Cafetería cálida |
| `bg-biblioteca` | Normal | Biblioteca con estantes |
| `bg-playa` | Raro | Playa al atardecer |
| `bg-montana` | Raro | Montañas Rocosas con lago turquesa |
| `bg-ciudad-noche` | Raro | Ciudad de noche con luces |
| `bg-nieve` | Raro | Bosque nevado |
| `bg-aurora` | Épico | Aurora boreal sobre pinos |
| `bg-espacio` | Épico | Espacio con planetas |
| `bg-bajo-el-mar` | Épico | Arrecife submarino |
| `bg-mercado-mx` | Épico | Mercado mexicano con papel picado |
| `bg-castillo` | Legendario | Castillo de fantasía en las nubes |
| `bg-volcan` | Legendario | Volcán con cristales brillantes |
| `bg-jardin-japones` | Legendario | Jardín con cerezos |
| `bg-edmonton` | Legendario | Silueta del centro de Edmonton y el río en invierno |

## Lote 5 · Temáticas legendarias (16)

> **Actualización (27 nov):** las 16 temáticas ya funcionan en la app con paletas validadas y una decoración propia hecha en código (guirnalda arriba, partículas que caen o flotan y un adorno de esquina en Hoy, con motivos SVG simples en `src/components/theme/motifs.tsx`). Tu arte **sustituye** esos motivos por versiones ilustradas: no hace falta paleta nueva salvo que propongas mejoras. Prioridad baja frente a los lotes 1 a 4.

Cada temática cambia toda la interfaz. Por cada una, en claro y oscuro:
- **Motivos sueltos** (SVG 64 × 64, uno por archivo, `motivo-<temática>-<nombre>.svg`): los mismos de la tabla. Se usan en la guirnalda y como partículas, así que deben leerse a 18–28 px.
- **Decoración de esquina** (SVG 360 × 240) para la esquina superior derecha de Hoy, con 2 o 3 grupos animables.
- **Patrón de fondo suave** (SVG en mosaico de 240 × 240, opacidad baja, que no compita con el texto).
- **Miniatura** para la tienda (SVG 320 × 200).
- **Paleta propuesta:** fondo, superficie, marca, acento y degradado de cabecera, con contraste AA. Pasa la paleta en `paleta.json`; yo la valido.

| id | Temática | Motivos |
|---|---|---|
| `halloween` | Halloween | Calabazas, murciélagos, luna |
| `navidad` | Navidad | Pino, esferas, nieve |
| `reyes` | Reyes Magos | Rosca de Reyes, coronas, tamales y una olla de tamales humeante, estrella |
| `san-valentin` | 14 de febrero | Corazones, cartas, flores |
| `dia-de-muertos` | Día de Muertos | Cempasúchil, papel picado, velas, calaveritas sonrientes |
| `mexico` | México (15 de septiembre) | Papel picado verde, blanco y rojo, nopal, fuegos artificiales |
| `otono` | Otoño | Hojas de arce, calabazas pequeñas |
| `invierno` | Invierno | Copos, gorros, chocolate caliente |
| `primavera` | Primavera | Flores, brotes, mariposas |
| `verano` | Verano | Sol, sandía, olas |
| `chill` | Chill | Plantas, lámpara cálida, vinilo |
| `coffee-time` | Coffee time | Tazas, granos de café, vapor |
| `neon` | Neón | Líneas brillantes y cuadrícula sobre fondo oscuro (solo variante oscura) |
| `aurora` | Aurora boreal | Aurora verde y violeta, pinos, estrellas |
| `noche-estrellada` | Noche estrellada | Estrellas, luna, constelaciones |
| `bosque` | Bosque canadiense | Pinos, alce a lo lejos, arce |

## Lote 6 · Mapa de progreso «Tu viaje»

- **6 islas** (SVG 600 × 400, claro y oscuro), una por nivel, con un camino que las une: `isla-a1` (playa de llegada), `isla-a2` (pueblo con mercado), `isla-b1` (ciudad con oficinas y café), `isla-b2` (montañas y lago), `isla-c1` (bosque boreal con aurora), `isla-c2` (cumbre nevada).
- **Iconos de parada** (SVG 96 × 96; en pantalla se ven a 52 px dentro de un círculo), en 3 estados cada uno: **pendiente**, **«sigue aquí»** (con brillo) y **hecha**. No hay estado bloqueado: en Fluye todas las paradas se pueden abrir. Tipos: `lección`, `misión` (bandera de ruta temática), `conversación`, `entrevista`, `lectura`, `repaso`, `cofre` (cerrado, listo para abrir y abierto) y `trofeo` de isla (pendiente, listo y recogido).
- **Piezas de camino** en mosaico (curva, recta, puente).

> **Actualización (27 nov):** el mapa ya está en producción en `/mapa` con iconos provisionales. Estructura real: cada isla es un bloque plegable con su cabecera (nivel, nombre, barra de avance), dividido en secciones de 6 paradas seguidas de una parada de repaso y un cofre; el camino va en zigzag vertical (desplazamientos de 0 a 4 rem). La ilustración de cada isla irá como cabecera del bloque (recórtala bien a 600 × 200 también, `isla-a1-cabecera.svg`). Nombres usados en la app: A1 «Isla Primeros pasos», A2 «Isla Día a día», B1 «Isla Conversación», B2 «Isla Mundo real», C1 «Isla Fluidez», C2 «Isla Cumbre».

## Lote 7 · Ligas

- **8 insignias** (SVG 160 × 160, con brillo animable `g#brillo`): `liga-semilla`, `liga-brote`, `liga-hoja`, `liga-arce`, `liga-pino`, `liga-glaciar`, `liga-aurora`, `liga-cumbre`. Deben verse más valiosas a medida que se sube (de madera clara a cristal y oro). Forma propia de Fluye, no escudos de otras apps.
- **Escena de ascenso** (SVG 600 × 600): podio, la insignia nueva subiendo y confeti en grupos, con un hueco para la mascota (`slot-mascota`) igual que `celebracion` del encargo anterior.

## Lote 8 · Diario

- **5 caritas de ánimo propias de Fluye** (SVG 96 × 96, claro y oscuro): `animo-1` (muy mal) … `animo-5` (excelente). Pueden ser gotas o semillas con cara, pero no frijoles ni ningún personaje conocido.
- **16 iconos de actividad** (SVG 48 × 48): estudié inglés, trabajo, ejercicio, series, cocinar, amigos, pareja, mascotas, leer, música, descanso, compras, limpieza, salir, familia y viaje.
- **Estado vacío** del diario (SVG 320 × 240 con `slot-mascota`): libreta abierta con una pluma y una taza.

## Lote 9 · Escenas

Mismo estilo que `public/scenes/scene-*.svg` (960 × 600, sin texto):
- **Entrevistas (7):** `scene-entrevista-soporte-ti` (mesa de ayuda con dos monitores), `scene-entrevista-implementacion` (sala de juntas con diagrama de procesos), `scene-entrevista-desarrollo` (oficina con código en pantalla), `scene-entrevista-marketing` (pizarra con gráficas y redes), `scene-entrevista-clientes` (estación con audífonos), `scene-entrevista-biologia` (laboratorio con microscopio y, al fondo, campo con río) y `scene-entrevista-inventarios` (almacén con estantes y escáner).
- **Vida diaria (5):** `scene-casa-quehaceres` (cocina con platos y arenero de gatos), `scene-super` (pasillo del supermercado con carrito), `scene-pedido` (repartidor en la puerta con bolsa de comida), `scene-sofa-series` (sala con sofá, palomitas y TV) y `scene-gatos` (dos gatos jugando en casa).
- **Portadas de lecturas (12, 480 × 300):** `lectura-edmonton-invierno`, `lectura-primer-empleo`, `lectura-transporte-ets`, `lectura-rentar-depa`, `lectura-cultura-canadiense`, `lectura-trabajo-remoto`, `lectura-ia-y-trabajo`, `lectura-series-favoritas`, `lectura-parques-nacionales`, `lectura-hockey`, `lectura-comida-canada` y `lectura-voluntariado`.

---

## Formato de entrega

Un ZIP por lote: `fluye-fase3-lote<N>.zip`.

```
manifest.json            (cajas, feet, ink, inkWithHat, boxes, paletas: mismo esquema que la entrega anterior)
mascotas/<id>/<estado>/...          (lotes 1–3, mismo árbol que fluye-poses.zip)
mascotas/ilustraciones/<id>-<estado>.png
piezas/layers/<id>.png  piezas/items/<id>.png
fondos/<id>.png|svg
temas/<id>/{decor-claro,decor-oscuro,patron-claro,patron-oscuro,miniatura}.svg + paleta.json
mapa/... ligas/... diario/... escenas/...
revision/hoja-contacto-*.png
LEEME.md                 (qué contiene, pivotes y lo que no pudiste resolver)
```

## Comprobación antes de entregar

- Cada `base.png` coincide píxel a píxel con la ilustración del estado.
- Si trabajas dentro del repositorio: `node scripts/armario/import-poses.mjs <carpeta> --check` sin problemas, y `npx tsx scripts/qa/combinaciones.mts --pet <id>` sin casos por encima del umbral.
- Revisa los 4 conjuntos de prueba de cada mascota sobre fondo claro y oscuro.
- Los SVG se abren en Chromium sin errores y sin recursos externos.
