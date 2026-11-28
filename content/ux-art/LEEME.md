# Fluye · Arte de UX para la fase 4

Abre `revision/hoja-contacto.png` para la revisión general. Las hojas P1 a P5 muestran cada variante, los recortes seguros de las cabeceras y las viñetas de celebración. Las mascotas dentro de las hojas son ejemplos de montaje.

| Entrega | Archivos SVG | Formato |
| --- | ---: | --- |
| P2 · Iconos de error | 9 | Ocho archivos de 32 × 32 y la tira `iconos-error/iconos-error.svg` |
| P1 · Estados vacíos y error | 12 | Seis piezas de 320 × 240 con variantes `-claro` y `-oscuro` |
| P4 · Celebración | 2 | `celebracion/celebracion-claro.svg` y `celebracion/celebracion-oscuro.svg`, de 600 × 600 |
| P3 · Cabeceras | 12 | Seis versiones `-escritorio` de 1200 × 360 y seis `-movil` de 780 × 360 |
| P5 · Géneros | 8 | Portadas de 160 × 160 con radio de 24 px |

## Capas y pivotes

Cada elemento animable es un `<g id="…">`. Inmediatamente después de su apertura, el comentario `origen: x,y` da el pivote en unidades del `viewBox` principal. Para animar una capa, monta el SVG en línea y selecciona el grupo dentro del SVG activo. Puedes usar el pivote con un `rotate(ángulo x y)` en ese grupo.

### Estados vacíos y error

Usa la variante del tema activo. `slot-mascota` contiene una guía no pintada de 120 px de diámetro. Su centro es `(72, 151)` y la línea inferior de apoyo es `y = 211`. La app puede montar la pose equipada centrada en `x = 72` y alinear sus pies con esa línea.

| Pieza | Grupos |
| --- | --- |
| `vacio-repasos` | `vapor`, `lazo`, `slot-mascota` |
| `vacio-busqueda` | `lupa`, `slot-mascota` |
| `vacio-colecciones` | `tarjeta-1`, `tarjeta-2`, `slot-mascota` |
| `vacio-amigos` | `globo`, `slot-mascota` |
| `vacio-buzon` | `bandera`, `hoja`, `slot-mascota` |
| `error-conexion` | `enchufe`, `chispa`, `slot-mascota` |

### Celebración

`slot-mascota` tiene su centro en `(300, 313)` y la línea de apoyo en `y = 443`. Inserta la pose `cheer` después de `tarima` y antes de las serpentinas y estrellas. `rayos` queda detrás de la mascota.

| Tiempo | Capas |
| --- | --- |
| 0–300 ms | `tarima` |
| 200–600 ms | `slot-mascota` |
| 400–900 ms | `rayos` |
| 600–1400 ms | `serpentina-1` a `serpentina-4` y `estrella-1` a `estrella-4` |
| Hasta continuar | Giro de `rayos` y parpadeo de las estrellas |

### Cabeceras

El motivo principal queda dentro del recorte central de 600 × 300. En escritorio comienza en `(300, 30)` y en móvil en `(90, 30)`. El lado izquierdo queda libre para el título de la app.

| Pieza | Grupos |
| --- | --- |
| `cab-progreso` | `banderin-1`, `banderin-2`, `banderin-3`, `nubes` |
| `cab-repaso` | `tarjetas`, `luz` |
| `cab-pronunciacion` | `ondas` |
| `cab-biblioteca` | `libro-cae` |
| `cab-musica` | `notas`, `luces` |
| `cab-ajustes` | `planta` |

## Validación

Se abrieron los 43 SVG en Chromium. Se comprobaron sus dimensiones, transparencias, identificadores, pivotes y el recorte de las cabeceras. Para el contraste visual se usaron los fondos del encargo. El arte sigue la paleta y las escenas del storyboard. La integración y la comparación con los SVG del repositorio corresponden a la revisión dentro de Fluye.
