# Encargo para Codex: arte que falta en el armario de Fluye

Copia todo lo que está debajo de la línea y pégalo en Codex junto con estos archivos de la entrega anterior: `fluye-entrega-claude.zip` (incluye `fluye-movimiento.html`, `ilustraciones/mascots/`, `armario/nuevas-mascotas/` y `armario/modelos/`). Si Codex trabaja dentro del repositorio de Fluye, también puede leer `src/lib/armario-data.json`, `public/mascots/` y `docs/qa/`.

---

Necesito que completes el armario de mascotas de **Fluye** (app para aprender inglés). Ya me entregaste antes las 12 mascotas, sus 8 estados y el vestuario con capas para la pose **happy** (dentro de `fluye-movimiento.html`, en `art.paint.pets`). La app ya compone esas capas. Lo que falta es poder vestir a la mascota en las otras 7 poses y corregir algunos recursos con defectos. Son personajes 100 % originales de Fluye; mantén exactamente su estilo, colores, contorno y proporciones.

## Reglas técnicas para TODAS las imágenes

- PNG RGBA con transparencia real (sin fondo, sin sombra en el suelo, sin texto, sin marcas de agua).
- Las imágenes de cuerpo entero (`base` y `whole-*`) miden **1024 × 1024 px**, con los pies apoyados en la misma línea que la ilustración del estado y al menos 60 px de margen en todos los lados (nada puede tocar el borde).
- **La mascota debe tener exactamente el mismo tamaño, posición y pose que su ilustración del estado** (`ilustraciones/mascots/<especie>-<estado>.png` y `armario/nuevas-mascotas/<especie>-<estado>.png`). Aviso importante: en la entrega anterior, las imágenes con ropa de cuerpo o cuello venían dibujadas entre 10 y 20 % más grandes que la base. **No lo repitas**: con ropa o sin ella, la mascota mide lo mismo.
- Las capas parciales (`lower-*`, `top-*`, `fabric-*`, `front-*`) se recortan a su contenido. Su caja `[x, y, ancho, alto]` va en el manifiesto, en coordenadas del lienzo de 1024 de esa pose.
- La ropa no pinta nada fuera de su zona: ni manchas en los brazos, ni parches de barriga, ni trazos sueltos del contorno.
- Nombres de archivo en minúsculas, sin acentos, exactamente como se indican.

Especies (12): `zorro, gato, perro, castor, oso, panda, buho, conejo, nutria, ciervo, panda-rojo, ajolote`.
Estados que faltan (7): `cheer, think, oops, wow, sleep, encourage, proud` (happy ya existe).

Piezas:
- Cuerpo (12): `chaleco, poncho, marinera, delantal, capa, chaqueta, vestido, manto, hoodie, sweater, labcoat, suit`
- Cuello (10): `jardin-31 … jardin-38, scarf, bowtie`
- Cabeza (15): `toque, cap, santa, wizard, crown, headphones, earmuffs, jardin-11 … jardin-18`
- Pequeñas, colocadas con cajas `ink` (34): cara `glasses, jardin-21 … jardin-28`; cabello `flower, jardin-41 … jardin-48`; pecho `jardin-51 … jardin-58, racha-5, racha-10, racha-30, racha-60, racha-120, racha-360, primer-repaso, primera-amistad`.

## Tarea A — Vestuario en las 7 poses (prioridad alta)

Para cada especie y cada estado que falta, genera **el mismo sistema de capas que hiciste para happy**:

| Archivo | Qué es |
|---|---|
| `base.png` | La mascota en ese estado, sin ropa (idéntica a su ilustración) |
| `whole-<pieza>.png` | Mascota completa con UNA pieza de cuerpo, cuello o cabeza (37 por pose) |
| `lower-<pieza>.png` | Para combinar cabeza + cuerpo/cuello: todo menos la cabeza, con esa prenda de cuerpo o cuello (22 por pose) |
| `top-<pieza>.png` | Para combinar: la cabeza con esa pieza de cabeza (15 por pose) |
| `fabric-<pieza-de-cuello>.png` | La pieza de cuello sola, para dibujarla encima de cualquier prenda de cuerpo (10 por pose). Sin parches de piel ni trazos del cuerpo |
| `front-<pieza-de-cabeza>.png` | La parte del sombrero que va por delante de los lentes (ala, visera, puño) (15 por pose) |

Y en el manifiesto, para cada pose: las cajas `ink` de las 34 piezas pequeñas (lentes sobre los ojos de esa pose y siguiendo el giro de la cabeza; adornos de cabello apoyados sobre la cabeza, nunca flotando; pines en el pecho), y `feet` (la línea de pies en px para `base` y para cada `whole-*`).

Cuida especialmente lo que falló al reutilizar las cajas de happy en otras poses: orejeras con la diadema curva apoyada sobre la cabeza (no una barra plana), orejas largas del conejo y del panda rojo visibles detrás de gorros y sombreros, astas del ciervo visibles detrás de la gorra, sombreros a la misma escala que en happy, y lentes alineados con los ojos en `think` (cabeza girada hacia arriba).

**Orden de entrega:** por especie y en este orden de estados: `cheer, oops, think, encourage, proud, wow, sleep`. Antes de seguir con la siguiente especie, muéstrame una hoja de contacto con la base de cada estado y 4 conjuntos de prueba: (1) cap + sweater + glasses + racha-5, (2) jardin-12 + chaleco + jardin-32 + jardin-21 + primera-amistad, (3) earmuffs + delantal + scarf + racha-30, (4) headphones + hoodie + bowtie + flower.

## Tarea B — Corregir recursos de la pose happy

Regenera solo estos archivos, para la pose happy, con las mismas reglas:

1. `fabric-jardin-35` (medalla) en las 12 especies: con cualquier prenda de cuerpo se pierde el disco dorado y solo queda la cinta. Debe verse la medalla completa por encima de la prenda.
2. `fabric-bowtie` y `fabric-jardin-36` del **ajolote**: borran el torso de la prenda y dejan la barriga rosa desnuda. Prioridad crítica.
3. `fabric-bowtie` y `fabric-jardin-36` de **zorro, nutria, ciervo y panda-rojo**: dibujan trazos marrones del contorno o un segundo brazo encima de la prenda.
4. `fabric-jardin-38` (perlas) de las 12 especies (confirmado en ciervo, panda-rojo y ajolote): el collar trae un parche de barriga que tapa la prenda.
5. `fabric-scarf` de **búho y nutria**: entre las puntas de la bufanda se ve el vientre por encima de la prenda.
6. **Nutria**, las 15 piezas de cabeza (`whole-*`, `top-*`, `front-*`): cada gorro pinta una banda de su color en el antebrazo que saluda. Prioridad crítica.
7. `whole-headphones`, `top-headphones` y `front-headphones` de **oso** (cuerpo distinto y un óvalo bajo los pies), **búho** (mancha negra bajo la diadema), **panda-rojo** y **ajolote** (franja gris bajo la diadema).
8. `whole-wizard` y `top-wizard` del **ciervo**: la punta del sombrero pisa el asta y deja una mancha morada.
9. Variante `lower-marinera-sin-panuelo` y `whole-marinera-sin-panuelo` para las 12 especies (la blusa marinera sin su pañuelo rojo), para combinarla con piezas de cuello sin que se apilen dos.
10. `layers/racha-360`: añade un contorno que contraste sobre pelaje o barriga de color crema.
11. Cajas `ink` corregidas (solo JSON, no imágenes) para los adornos de cabello (`flower, jardin-41…48`) de **gato, perro, búho, conejo y panda-rojo**, que hoy quedan flotando fuera de la cabeza, y para `jardin-24` y `jardin-25` del **conejo**, más anchos que su cara.

## Formato de entrega

Un ZIP `fluye-poses.zip` con esta estructura:

```
manifest.json
<especie>/<estado>/base.png
<especie>/<estado>/whole-<pieza>.png
<especie>/<estado>/lower-<pieza>.png
<especie>/<estado>/top-<pieza>.png
<especie>/<estado>/fabric-<pieza>.png
<especie>/<estado>/front-<pieza>.png
correcciones-happy/<especie>/<archivo>.png      (tarea B)
correcciones-happy/ink.json                      (tarea B, punto 11)
LEEME.txt                                        (qué falta o quedó con defectos)
```

`manifest.json` (coordenadas en px del lienzo de 1024 de cada pose):

```json
{
  "version": 1,
  "image": { "width": 1024, "height": 1024 },
  "poses": {
    "zorro": {
      "cheer": {
        "feet": { "base": 964, "sweater": 964, "cap": 964 },
        "whole": ["chaleco", "poncho", "…las 37 piezas…"],
        "lower": { "sweater": [206, 494, 553, 494] },
        "top": { "cap": [261, 53, 513, 530] },
        "fabric": { "scarf": [340, 594, 363, 187] },
        "front": { "cap": [224, 27, 579, 368] },
        "ink": { "glasses": [334, 337, 373, 157], "racha-5": [523, 629, 86, 102] },
        "badges": {}
      }
    }
  }
}
```

Para cada especie y estado: `whole` lista las piezas entregadas como imagen completa; `lower`, `top`, `fabric` y `front` mapean pieza → caja de su PNG recortado; `ink` mapea cada pieza pequeña → caja donde se coloca su capa suelta.

## Comprobación antes de entregar

- Superpón cada `base.png` sobre la ilustración del estado: deben coincidir píxel a píxel en tamaño y posición.
- Revisa cada combinación de prueba de la tarea A sobre fondo claro y sobre fondo oscuro.
- Si trabajas dentro del repositorio de Fluye, valida con `node scripts/armario/import-poses.mjs <carpeta-extraida> --check`. Debe terminar con 0 problemas.
- No regeneres lo que ya está bien. En el `LEEME.txt` anota cualquier pieza que no pudiste resolver.
