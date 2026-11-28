# Fase 3 · Seguimiento de la entrega de Codex (lotes 1, 2 y 3)

Integrados en la app con `scripts/armario/import-fase3.mjs` y recalibrados con `scripts/armario/calibrar-piezas.mjs`.
Revisión hecha con el mismo motor de la app (`scripts/qa/render-look.mts`) sobre las 16 mascotas, en la pose feliz y en otras poses, más el control automático `scripts/qa/combinaciones.mts`.

## Lo que quedó bien

- **4 mascotas nuevas** (dragón, tlacuache, mapache, unicornio): las 32 ilustraciones son coherentes y las 37 prendas actuales les ajustan bien, sin cortes.
- **Lote 1**: las 165 capas `front-<gorro>` ya son solo gorro (sin pelo ni orejas) y los lentes no se cortan con ningún gorro. Las cajas `inkWithHat` resolvieron los adornos bajo sombrero del búho y el panda rojo.
- **Lentes de estrella, pin de bastón y pin de galleta**: bien en todas las mascotas y poses.
- `node scripts/qa/mascotas-integridad.mjs`: 0 problemas.

## 1 · Rehacer (prioridad alta)

Retiradas del catálogo hasta tener arte nuevo (`ART_PENDING` en `src/lib/wardrobe.ts`).

- **`pijama-navidad`**: es el mismo rectángulo rojo pegado sobre todas las mascotas. No sigue la silueta: tapa alas (búho, dragón), deja brazos sueltos y se ve plana, sin volumen. Debe dibujarse como el `sweater`: ajustada al torso de cada especie, mangas que siguen los brazos de la pose, cuello redondeado bajo la barbilla; el búho la lleva bajo las alas y el dragón con las alas por fuera.
- **`bufanda-luces`**: parece un tubo visto desde arriba, con el hueco interior a la vista. Debe ir como la `scarf`: enrollada al cuello, apoyada en los hombros, una o dos puntas colgando al frente y los foquitos siguiendo la tela.

Entregar en 16 mascotas × 8 poses (`whole`, `lower` y, la bufanda, `fabric`), mismas cajas y línea de pies.

## 2 · Corregir (prioridad alta): mangas dobles en la ropa de las mascotas originales

En la pose feliz, el brazo levantado muestra **la manga dibujada dos veces** (o manga y brazo a la vez). Se ve claro en el **`sweater`** del **panda** y el **panda rojo**, y hay que revisar las demás prendas de cuerpo (`hoodie`, `suit`, `labcoat`, `chaqueta`, `chaleco`, `poncho`, `marinera`, `delantal`, `capa`, `vestido`, `manto`) en las 12 mascotas originales (zorro, gato, perro, castor, oso, panda, búho, conejo, nutria, ciervo, panda rojo, ajolote). Las 4 nuevas están bien. Archivos: `whole-<prenda>` y `lower-<prenda>` de `mascotas/<id>/happy/`.

## 3 · Ajustar (prioridad media)

1. **Dragón · sombrero de mago**: en las 8 poses queda inclinado y bajo; tapa un ojo y corta los lentes (80 de los 115 avisos del control). Más recto y entre los cuernos, como se hizo con el unicornio.
2. **Unicornio · gorros corridos**: `toque`, `cap`, `santa`, `jardin-11`, `jardin-12`, `jardin-14`, `jardin-15`, `jardin-16` y `jardin-18` quedan desplazados a un lado y se ven flotando junto al cuerno. Centrarlos sobre la cabeza, con el cuerno saliendo por delante o a través.
3. **Diadema de reno (`gorro-reno`)**: la banda queda muy baja, sobre la frente, casi tocando los ojos; debe ir sobre la cabeza, entre las orejas. En el ciervo, los cuernos de la diadema se encimen con los suyos: mejor solo la banda con cascabel.
4. **Diadema de copos (`diadema-copos`)**: también baja; tapa las cejas. Subirla al nacimiento de las orejas.
5. **Moño de regalo con gorro (`mono-regalo` + `santa`/`cap`)**: con `inkWithHat` queda en la frente, bajo el ala. Mejor sobre el gorro o a un lado del ala.
6. **Antifaz `jardin-24` con gorros o audífonos** (≈30 avisos, 25–35 % tapado): zorro, gato, castor, panda, ciervo y búho. Una capa `front-<gorro>` o cajas `inkWithHat` para caras que dejen libre el borde del antifaz.
7. **Nutria con gorro y ropa a la vez** (`top-<gorro>` + `lower-<prenda>`): el conjunto sale más grande que la nutria sola; las capas `top-*` de la nutria están a otra escala que sus `lower-*`. Ya estaba así antes de esta entrega.
8. **Mapache · lentes**: los `glasses` casi no se ven sobre el antifaz oscuro (sugerencia: borde claro o variante).

## Arreglos hechos en el código (no hace falta arte)

- Con solo un gorro puesto, la app no aplicaba la escala de esa imagen: con audífonos, oso, búho, panda rojo y ajolote salían ≈20 % más grandes, y la nutria con cualquier gorro. Ya se corrige (y la calibración de piezas de cabeza calculaba la escala al revés).
- Las piezas sueltas (lentes, pines, adornos) con solo gorro se colocan sobre la base, sin la escala del gorro.

Detalle de combinaciones: `docs/qa/combinaciones.csv`.
