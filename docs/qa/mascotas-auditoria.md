# Auditoría de mascotas y armario (Fluye 1.0)

Fecha: 25-nov-2026 · rama `fluye-1.0`.

## Alcance

- 12 especies: zorro, gato, perro, castor, oso, panda, búho, conejo, nutria, ciervo, panda rojo, ajolote. El repositorio no tiene otras.
- 8 estados: happy, cheer, think, oops, wow, sleep, encourage, proud. No hay estados adicionales.
- 71 piezas por especie en 6 zonas: cuerpo 12, cuello 10, pecho 16, cara 9, cabeza 15, cabello 9.

## Combinaciones

Con una pieza por zona (o ninguna), cada especie admite 13 × 11 × 17 × 10 × 16 × 10 = **3.889.600** conjuntos. En total son **46.675.200**, o **373.401.600** contando las 8 poses. Renderizarlas todas no es viable ni útil. Se renderizaron con el componente real `<Mascot>` (página `/qa/mascotas`, solo con `FLUYE_QA=1`) las combinaciones que pueden chocar entre sí:

| Hoja | Qué cubre | Celdas por especie | Total (12 especies) |
|---|---|---|---|
| pieces (claro y oscuro) | base + cada pieza sola | 72 × 2 | 1.728 |
| poses (claro y oscuro) | 8 estados × (sin ropa + 4 conjuntos de referencia) | 40 × 2 | 960 |
| headface | cada pieza de cabeza × cada pieza de cara (con «nada») | 160 | 1.920 |
| bodyneck | cada prenda de cuerpo × cada pieza de cuello (+ pin racha-30) | 143 | 1.716 |
| chest | cada prenda de cuerpo × cada pin | 208 | 2.496 |
| hair | cada pieza de cabeza × cada adorno de cabello | 144 | 1.728 |
| **Total** | | **839** | **10.548** |

Cubre todos los pares de zonas que se tocan: cabeza–cara, cabeza–cabello, cuerpo–cuello, cuerpo–pecho y cuello–pecho (mediante el pin fijo en `bodyneck`). No cubre tríos completos, salvo los 4 conjuntos de referencia en las 8 poses.

## Comprobaciones automáticas

`node scripts/qa/mascotas-integridad.mjs` revisó **1.438 archivos**: 0 faltantes, 0 corruptos, 0 sin transparencia, 0 capas vacías y 0 cajas fuera del lienzo. Las miniaturas del catálogo están recortadas a su contenido a propósito. Resultado en `docs/qa/mascotas-integridad.json`.

## Inspección visual

La hicieron 4 revisores independientes, 3 especies cada uno, sobre las 120 hojas. Cada uno dejó constancia de su cobertura real:

- **Revisadas completas (celda por celda o con zoom)**: pieces y poses en claro de las 12 especies; headface y bodyneck de la mayoría; todas las hojas del castor y del zorro.
- **Revisadas por muestreo**: varias hojas `chest` y `hair` (entre 18 y 64 celdas ampliadas por hoja) y algunas hojas oscuras (conejo, nutria, panda rojo y ajolote).
- **No abiertas**: `poses-dark` de gato, panda rojo y ajolote.

Por eso **no se declara una inspección visual completa**: de las 10.548 celdas, unas 6.500 se revisaron una por una y el resto por muestreo. Los defectos encontrados son sistemáticos (se repiten igual en toda una columna o especie). Las celdas sin revisar pertenecen a esas mismas columnas, así que el muestreo probablemente bastó para detectarlos, aunque no es seguro.

## Resultados

Registro completo en `docs/qa/mascotas-defectos.csv` (21 defectos agrupados).

**Corregidos por código** (verificado en hojas regeneradas de zorro, nutria, oso y ciervo):

- **Escala:** la mascota vestida medía y se apoyaba distinto que en sus poses. Ahora tiene una calibración por especie (`scripts/armario/calibrar.mjs`) y otra por pieza (`scripts/armario/calibrar-piezas.mjs`).
- **Pines:** usan un ancla común en el pecho y se apartan si hay pieza de cuello.
- **Lentes y adornos de cabello:** quedan bajo el ala del sombrero mediante una máscara de oclusión con la silueta del sombrero.
- **Gorros defectuosos:** los de la nutria y los audífonos del oso y del búho se dibujan como pieza suelta (mitigación hasta que llegue el arte corregido).
- **Panda en modo oscuro:** tiene un contorno claro sutil.

**Pendientes de arte** (encargo en `docs/qa/mascotas-regeneracion-codex.md`):

- La ropa de cuerpo, cuello y pecho, y las piezas de cabeza ajustadas, en las 7 poses que no son «feliz». Es la limitación más importante.
- Las capas `fabric` defectuosas: medalla, lazos, perlas y bufanda.
- La marinera sin pañuelo.
- Los audífonos del panda rojo y del ajolote.
- La punta del sombrero de mago del ciervo.
- El pin racha-360.
- Las cajas de los adornos de cabello en 5 especies.

## Sistema de apariencia

- **Fuente única de verdad**: `settings.look.sets[especie]` en el perfil (servidor), validado contra el inventario en `/api/shop` (equipar) y `/api/profile`.
- **Mismo render en todas partes**: Hoy, sesión, perfil, armario, amigos, cofres, regalos y cargas usan `<Mascot>` o `<MyMascot>` con `wear` = el conjunto equipado. Las previsualizaciones del armario usan un estado local (`trial`) que no se guarda hasta pulsar «Guardar conjunto».
- **Poses**: en la pose feliz se ve el conjunto completo. En las demás se ven las piezas de cabeza, cara y cabello mientras falte el arte por pose. En cuanto se importe el paquete de Codex (`node scripts/armario/import-poses.mjs <carpeta>`), el mismo componente usa el conjunto completo en esa pose sin más cambios.
- **Capas, no combinaciones**: no se genera un archivo por combinación. Se componen capas con anclas por especie y pose, máscaras de oclusión y un orden de dibujo documentado (cuerpo → cuello → pecho → cara → cabeza → cabello; lentes bajo el ala).

## Cómo regenerar las hojas

```
npm run build
FLUYE_QA=1 npx playwright test --project=qa-mascotas
# solo algunas: FLUYE_QA=1 QA_PETS=zorro,gato QA_SHEETS=pieces,poses npx playwright test --project=qa-mascotas
```

Las hojas se guardan en `docs/qa/hojas/<especie>/` (unos 60 MB). No se versionan; se regeneran con el comando de arriba.
