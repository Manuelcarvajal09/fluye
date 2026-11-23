# Escenas ilustradas de Fluye

Ilustraciones SVG originales que muestran el significado de una situación (rutas temáticas) o de **un sentido concreto** de un phrasal verb. El significado debe entenderse por la imagen, sin texto dentro del SVG.

- Imágenes: `public/scenes/<id>.svg` (se sirven como `/scenes/<id>.svg`).
- Manifiesto: `content/scenes/scenes.json` (arreglo de objetos).

## Campos del manifiesto

| Campo | Uso |
|---|---|
| `id` | `scene-<ruta>` o `scene-pv-<verbo>-<sentido>`. Único. |
| `file` | Ruta pública del SVG. |
| `title_es` | Título corto. |
| `alt_es` | Una oración concreta para lectores de pantalla (atributo `alt`). Es también el `<title>` del SVG. |
| `long_es` | Descripción de 2 a 3 oraciones; variante de texto accesible. |
| `caption_en` / `caption_es` | Frase corta en inglés con el idioma meta y su traducción. |
| `route` | Id de la ruta o `null`. |
| `items` | Ids de `content/items/*.json` que ilustra la escena (sentido correcto). `[]` si no hay equivalente. |
| `sense_es` | Solo phrasal verbs: qué significado se ve. |
| `provenance`, `license` | Procedencia y licencia. |

Escenas con sentido sin item propio: `scene-pv-make-up-cosmetics` (maquillarse) y `scene-pv-get-over-fence` (cruzar un obstáculo) tienen `items: []`.

## Guía de estilo

- Plano, cálido, lúdico pero adulto. Formas redondeadas; contorno suave de 2 a 3 px en `#2a2230` al 70 % (o sin contorno en fondos y brillos).
- Paleta: esmeralda `#087a56` / `#22d3a0` / `#dcf7ec`; violeta `#5847d4` / `#ece9ff`; acentos cálidos `#ffb347` `#ff8fab` `#7cc3f5`; neutros `#f4f1ec` `#e3e6ee` `#5d6478`.
- Pieles diversas (`#f1c9a5` `#d9a07a` `#a86b45` `#6e4430`) y peinados variados. Caras simples: ojos de punto, sonrisa pequeña.
- `viewBox="0 0 400 240"`. Cada escena dibuja su propio rectángulo de fondo (`rx="24"`, tinte suave) y recorta el contenido a esa forma, para verse bien en fondos claros y oscuros.
- Sin texto ni letras, sin fuentes, sin imágenes raster, sin scripts, sin referencias externas. Máximo 9 KB por archivo. Siempre `<title>` con el texto alternativo en español.
- Para los phrasal verbs, lo que cambia entre sentidos debe ser visible (p. ej. caja levantada frente a persona recogida en auto).

## Cómo agregar una escena

1. Crear `public/scenes/<id>.svg` siguiendo la guía (envoltorio: fondo redondeado + `clipPath`, contenido en un grupo con contorno `#2a2230` al 70 %).
2. Agregar su objeto a `content/scenes/scenes.json` con todos los campos.
3. Para phrasal verbs, buscar el id del sentido correcto en `content/items/pv-*.json` (por ejemplo `pv-look-up` frente a `pv-look-up-to`).
4. Validar: el SVG debe ser XML bien formado, pesar 9 KB o menos, y el `id` no repetirse.

## Procedencia y licencia

Todas las escenas son obra original para Fluye (2026), creadas a mano en SVG; no calcan ni imitan ilustraciones, marcas ni personajes existentes. Licencia: CC BY 4.0 (mismo autor que el proyecto).
