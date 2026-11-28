# Fluye · Fase 3 · Regeneración del armario y fondos propios (por tandas)

Encargo para Codex. Sustituye los puntos 1, 2 y 3 de `docs/ux/CODEX-FASE3-SEGUIMIENTO.md` (ese documento queda como diagnóstico).

## Por qué

En la entrega anterior, las prendas de las 4 mascotas nuevas y de la colección navideña se **pegaron encima** de la mascota sin redibujarla. Medido sobre los archivos: en una imagen `whole-<pieza>` cambia el 12–37 % de la figura; en el arte original, donde la mascota se redibujó con la prenda puesta, cambia el 60–70 %. Por eso hay pijamas planas, una bufanda que parece un tubo, gorros flotando junto al cuerno del unicornio y el sombrero del dragón tapándole un ojo.

Además, los **fondos de la mascota** eran escenas recicladas de las lecciones (cafetería, súper, aeropuerto…). Se quieren fondos propios, pensados para la mascota.

## Regla principal: generar la mascota con la pieza, no pegar la pieza

Para cada mascota, pose y pieza:

1. **Genera una sola imagen de la mascota llevando la pieza** con la herramienta de imágenes. Usa como referencia de identidad la base aprobada de esa pose (`mascotas/<id>/<estado>/base.png`) y, como referencia de diseño, la miniatura de la pieza (`public/armario/items/<pieza>.webp`). La mascota se redibuja con la prenda: los brazos entran en las mangas, las alas y la cola quedan por fuera o por dentro según la anatomía, el gorro se apoya en la cabeza entre orejas o cuernos, los lentes se apoyan en el hocico o pico.
2. **Conserva la identidad y el registro**: misma cara, colores, proporciones, línea de pies, tamaño y posición que la base. Solo cambian la prenda y lo que la prenda tapa.
3. **Nunca pegues ni deformes** la miniatura sobre la base. Si al comparar con la base solo cambia la zona de la prenda, está mal hecho.
4. Del resultado **deriva las capas por recorte** (no las redibujes por separado), con el mismo formato de siempre:
   - `whole-<pieza>.png` (1024 × 1024): la imagen completa.
   - Cuerpo y cuello: `lower-<pieza>.png`, la mascota con la prenda desde los pies hasta la línea del cuello.
   - Cabeza: `top-<pieza>.png` (cabeza con el gorro, sobre la línea del cuello) y `front-<pieza>.png` (solo las partes del gorro que van delante de los lentes: ala, visera, banda).
   - Cuello sobre ropa: `fabric-<pieza>.png`, solo la prenda de cuello, para montarla sobre cualquier prenda de cuerpo.
   - **Cara y cabello (nuevo)**: `ink-<pieza>.png`, solo la pieza tal como quedó dibujada en esa mascota y pose, recortada con su caja. Sustituye a la capa compartida de `public/armario/layers/`, que se usará solo como respaldo.
   - Cajas `inkWithHat[gorro][pieza]` cuando un adorno de cabello deba moverse por un gorro.
5. **Los pines no se generan**: siguen como capa compartida encima de todo (`public/armario/layers/<pin>.webp`), con su caja `ink` por pose y los puntos `badges` sobre prendas que lo necesiten.

Las combinaciones no se dibujan: la app compone `lower` + `top` + `fabric` + `ink` + `front` + pines. Por eso basta con **cada pieza sola** en cada mascota y pose.

## Piezas por mascota y pose

| Zona | Piezas |
|---|---|
| Cuerpo (13) | `chaleco`, `poncho`, `marinera` (+ `marinera-sin-panuelo`), `delantal`, `capa`, `chaqueta`, `vestido`, `manto`, `hoodie`, `sweater`, `labcoat`, `suit`, `pijama-navidad` |
| Cuello (11) | `jardin-31`…`jardin-38`, `scarf`, `bowtie`, `bufanda-luces` |
| Cabeza (16) | `toque`, `cap`, `santa`, `wizard`, `crown`, `headphones`, `earmuffs`, `jardin-11`…`jardin-18`, `gorro-reno` |
| Cara (10) | `glasses`, `jardin-21`…`jardin-28`, `lentes-estrella` |
| Cabello (11) | `flower`, `jardin-41`…`jardin-48`, `mono-regalo`, `diadema-copos` |
| Pines (no se generan) | `jardin-51`…`jardin-58`, `racha-*`, `primer-repaso`, `primera-amistad`, `pin-baston`, `pin-galleta` |

Estados: `happy`, `cheer`, `think`, `oops`, `wow`, `sleep`, `encourage`, `proud`.

### Notas por pieza (lo que falló antes)

- **`pijama-navidad`**: ajustada al torso de cada especie, con mangas que siguen los brazos de la pose y el cuello redondeado bajo la barbilla. El búho la lleva bajo las alas y el dragón con las alas por fuera.
- **`bufanda-luces`**: enrollada al cuello, apoyada en los hombros, con una o dos puntas colgando al frente y los foquitos siguiendo la tela. Nunca se ve el hueco interior.
- **`gorro-reno`**: la banda va sobre la cabeza, entre las orejas, no en la frente. El ciervo lleva solo la banda con cascabel, sin cuernos extra.
- **`diadema-copos`**: en el nacimiento de las orejas; no tapa las cejas.
- **`mono-regalo`** con gorro: sobre el gorro o a un lado del ala, nunca en la frente.
- **`wizard`** en el dragón: recto, entre los cuernos, con los dos ojos libres.
- **Unicornio**: todos los gorros centrados sobre la cabeza; el cuerno sale por delante o atraviesa el gorro.
- **Mangas**: en el brazo levantado, una sola manga que contiene el brazo. Hoy el `sweater` del panda y del panda rojo muestran la manga dibujada dos veces.
- **Mapache · `glasses`**: deben distinguirse sobre el antifaz oscuro (montura más gruesa o con borde claro).
- **`jardin-24`** (antifaz): con gorros o audífonos, el borde superior queda visible (el `front-<gorro>` no lo tapa).

## Fondos para la mascota (nuevos)

16 fondos originales, pensados para que la mascota se vea encima. Sin personajes, sin texto, sin logos, sin reciclar escenas de las lecciones.

- **Formato**: PNG 1600 × 1200 (4:3) sin transparencia, más una versión cuadrada 1200 × 1200 del mismo fondo (`<id>-cuadrado.png`).
- **Composición**: suelo o superficie en el tercio inferior. La mascota va de pie, abajo y al centro, ocupando ≈45 % del ancho: deja esa zona central despejada y con poco detalle. Profundidad suave, colores algo apagados en el fondo para que la mascota destaque.
- **Estilo**: el mismo de las mascotas (cartoon limpio, contorno suave, luz cálida).

| id | Nombre | Rareza | Idea |
|---|---|---|---|
| `habitacion` | Habitación acogedora | Normal | Cama, cojines, lámpara cálida, alfombra |
| `jardin` | Jardín soleado | Normal | Pasto, flores, cerca de madera |
| `parque` | Parque en otoño | Normal | Hojas de arce en el suelo, banca al fondo |
| `cafe` | Rincón de café | Normal | Mesa pequeña, tazas, ventana con lluvia suave |
| `biblioteca` | Biblioteca | Raro | Libreros, escalera, luz de ventana |
| `playa` | Playa al atardecer | Raro | Arena, olas suaves, cielo naranja |
| `cocina` | Cocina casera | Raro | Barra, ollas, especias, plantas |
| `estudio` | Estudio de música | Raro | Audífonos colgados, vinilos, alfombra |
| `bosque` | Bosque canadiense | Épico | Pinos, musgo, rayos de luz |
| `lago` | Lago en las Rocosas | Épico | Agua turquesa, montañas, muelle de madera |
| `ciudad` | Edmonton de noche | Épico | Puente iluminado y río al fondo, desde un parque |
| `nieve` | Día de nieve | Épico | Suelo nevado, muñeco de nieve pequeño al fondo |
| `aurora` | Aurora boreal | Legendario | Cielo verde y violeta, pinos en silueta, nieve |
| `navidad` | Navidad junto al árbol | Legendario | Árbol con esferas, regalos, chimenea |
| `estrellas` | Noche estrellada | Legendario | Colina, cielo profundo con constelaciones |
| `feria` | Feria mexicana | Legendario | Papel picado, luces, puestos de colores al fondo |

## Tandas (una por entrega, en este orden)

Cada tanda es un ZIP independiente en Descargas: `fluye-regeneracion-tanda<N>.zip`, con `manifest.json` (mismo formato que el Lote 2, más `inkPet[pieza] = [x, y, ancho, alto]` para las capas `ink-`), `LEEME.md` y las carpetas `mascotas/<id>/<estado>/`. Al terminar cada tanda, **detente y avisa** para revisarla antes de seguir.

| Tanda | Contenido | Imágenes aprox. |
|---|---|---|
| 1 | Los 16 fondos (4:3 y cuadrado) y sus miniaturas 320 × 240 | 48 |
| 2 | Dragón: las 61 piezas generables × 8 poses | 488 + capas |
| 3 | Unicornio: ídem | 488 + capas |
| 4 | Mapache: ídem | 488 + capas |
| 5 | Tlacuache: ídem | 488 + capas |
| 6 | Colección navideña en las 12 mascotas originales: `pijama-navidad`, `bufanda-luces`, `gorro-reno`, `lentes-estrella`, `mono-regalo` y `diadema-copos` × 8 poses | 576 + capas |
| 7 | Mangas: revisar las 13 prendas de cuerpo en las 12 originales (las 8 poses) y regenerar las que muestren manga doble o brazo y manga a la vez. Lista en el `LEEME.md` | según revisión |
| 8 | Lentes y cabello en las 12 originales: las 9 piezas de cara anteriores (`glasses`, `jardin-21`…`jardin-28`) y las 9 de cabello anteriores (`flower`, `jardin-41`…`jardin-48`) × 8 poses, como `whole-` + `ink-` | 1 728 + capas |

## Comprobación antes de entregar cada tanda

1. Para cada `whole-`, compara con la base de esa pose: la mascota debe estar redibujada (no idéntica fuera de la prenda) y mantener cara, colores, línea de pies y tamaño.
2. Revisa una hoja de contacto por mascota, en claro y oscuro, con estas combinaciones: suéter + gorro navideño + lentes; sudadera + gorra + flor; traje + corona + moño; pijama + bufanda de luces + diadema de reno + lentes de estrella + pin de galleta.
3. Mangas: ninguna doble. Gorros: centrados y apoyados. Lentes: sobre los ojos y visibles. Cabello: no tapa los ojos.
4. `node scripts/armario/import-poses.mjs <carpeta> --check` sin problemas, y PNG RGBA con transparencia real (los fondos sin transparencia).
5. Nada de personajes, logotipos ni texto de otras marcas o apps.
