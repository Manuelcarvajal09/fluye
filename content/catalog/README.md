# Catálogo de vocabulario inglés de Fluye

Catálogo reproducible de **12 000 lemas ingleses** (13 226 entradas lema + categoría
gramatical) para hispanohablantes de México. Se genera solo con datos abiertos y
gratuitos: wordfreq, Wiktionary (vía kaikki.org) y Tatoeba. Cada entrada tiene
frecuencia, banda, sentido principal en inglés, equivalente en español, ejemplos
bilingües, IPA, formas flexionadas y procedencia.

> **Nadie lo ha revisado.** Todas las entradas llevan `"review": "auto"`. El nivel
> CEFR es una estimación por frecuencia, no una evaluación pedagógica.

## Archivos

| Archivo | Contenido |
|---|---|
| `lemmas.jsonl` | Una entrada JSON por línea, ordenada por `rank` (~12 MB). |
| `stats.json` | Recuentos: total, por POS, por banda, completas/pendientes, IPA, ejemplos, sentidos, origen del español. |
| `sample-review.csv` | Muestra estratificada de 200 entradas para revisión humana (50 de 1k, 50 de 2k, 50 de 3–5k, 50 de 6–10k; semilla fija). |
| `tatoeba-attribution.tsv` | Autor de cada oración de Tatoeba usada (requisito de CC BY 2.0 FR). |
| `build-info.json` | Versiones de paquetes, URL, tamaño, `Last-Modified` y sha256 de cada descarga. |
| `NOTICE.md` | Atribuciones y licencias de terceros. |

El código está en `scripts/catalog/`. Las descargas y los intermedios van en
`.catalog-cache/` en la raíz del repo, que no debe versionarse (~1 GB con el
virtualenv).

## Esquema de `lemmas.jsonl`

```jsonc
{
  "id": "lex-hold-verb",          // lex-<lema>-<pos>: estable, determinista, minúsculas y guiones
  "lemma": "hold",
  "pos": "verb",                  // noun|verb|adj|adv|pron|det|prep|conj|interj|num|aux|other
  "rank": 212,                    // rango por frecuencia tras lematizar (las entradas de un mismo lema lo comparten)
  "zipf": 5.65,                   // log10(frecuencia por mil millones) del lema (suma de sus formas)
  "band": "1k",                   // "1k".."10k", "10k+"
  "sense_en": "To grasp or grip.",// glosa de Wiktionary del sentido principal (máx. 160 caracteres)
  "es": "sujetar, aguantar",      // equivalentes españoles para ese sentido (máx. 60 caracteres); "" si no hay
  "explain_es": "",               // vacío: lo rellena una etapa posterior
  "ex": [{"en": "...", "es": "...", "src": "tatoeba:<idEn>-<idEs>"}],  // 0–2 ejemplos
  "ipa_us": "/hoʊld/",            // opcional: IPA de Wiktionary marcada General American / US
  "ipa_ca": "...",                // opcional: IPA marcada Canada
  "ipa": "...",                   // opcional: IPA sin acento indicado en Wiktionary (solo si falta ipa_us)
  "forms": ["holds", "held", "holding"],
  "variants": {"us": "color", "uk": "colour", "ca": "colour"},       // solo si la grafía cambia
  "tags": ["transitive"],         // marcas útiles del sentido principal (registro, región, gramática)
  "register": "neutral",          // neutral|informal|formal (informal = informal/colloquial/slang en Wiktionary)
  "level_est": "A1",              // estimado por banda: 1k→A1, 2k→A2, 3–4k→B1, 5–7k→B2, 8k+→C1
  "level_src": "estimated-from-frequency",
  "status": "complete",           // complete = tiene es y ≥1 ejemplo; pending = le falta algo
  "pending": ["es"],              // solo en pendientes: qué falta ("es", "ex")
  "review": "auto",
  "es_src": "wiktionary:main-sense", // de dónde sale "es" (ver Método, paso 6)
  "senses": [{"sense_en": "...", "es": "..."}],  // opcional: hasta 2 sentidos extra
  "provenance": {"freq": "wordfreq 3.1.1", "sense": "wiktionary/kaikki 2026-10-30", "ex": "tatoeba 2026-11-21"}
}
```

Campos añadidos al esquema pedido: `pending`, `es_src` e `ipa` (IPA sin acento
indicado). Son opcionales y la app puede ignorarlos.

## Fuentes, versiones y licencias

Licencias comprobadas en sus páginas oficiales el 2026-11-23.

| Fuente | Versión / fecha | Licencia | Uso |
|---|---|---|---|
| [wordfreq](https://github.com/rspeer/wordfreq) | 3.1.1 (PyPI, 2023-11-21), lista `best`, `en` | Código Apache-2.0; datos CC BY-SA 4.0 | Frecuencia y rango |
| [LemmInflect](https://github.com/bjascob/LemmInflect) | 0.2.3 | MIT (datos derivados del SPECIALIST Lexicon, NIH) | Lematización e inflexiones |
| Wiktionary inglés vía [kaikki.org](https://kaikki.org/dictionary/English/) | Extracción del 2026-10-30, volcado de enwiktionary del 2026-10-01, wiktextract `19f9a30` | CC BY-SA 4.0 + GFDL ([Wiktionary:Copyrights](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)) | Sentidos, POS, IPA, traducciones, formas, variantes |
| Entradas españolas del Wiktionary inglés vía [kaikki.org](https://kaikki.org/dictionary/Spanish/) | Extracción del 2026-10-30 | CC BY-SA 4.0 + GFDL | Índice inverso de candidatos (último recurso) |
| [Tatoeba](https://tatoeba.org/es/downloads) | Exportación por idioma del 2026-11-21 | CC BY 2.0 FR (hay que citar al autor) | Ejemplos eng–spa, autores, hablantes nativos |

Sobre la frecuencia: wordfreq **mezcla varios corpus** (Wikipedia, subtítulos de
OpenSubtitles 2018 y SUBTLEX, noticias de NewsCrawl 2014 y GlobalVoices, Google
Books Ngrams 2012, web OSCAR, Twitter y Reddit). **No es un ranking canadiense ni
universal**, ni un corpus de inglés hablado en México.

El archivo `kaikki.org-dictionary-English.jsonl` aparece en kaikki.org como
*deprecated*. Se usa su versión `.jsonl.gz` (534 MB), que es la vigente a
2026-11-23. Si desaparece, la alternativa es `raw-wiktextract-data.jsonl.gz`
(2,9 GB, todos los idiomas), filtrando por `lang_code == "en"`. Para eso hay que
cambiar la URL en `scripts/catalog/common.py`.

Atribuciones completas en [`NOTICE.md`](NOTICE.md). Como incluye datos CC BY-SA, el
catálogo derivado se distribuye bajo **CC BY-SA 4.0**.

## Cómo reconstruir

Requisitos: Python 3.11 (probado con 3.11.9 en Windows), unos 2 GB libres y
conexión para la primera descarga (~690 MB).

```powershell
# desde la raíz del repo
python -I scripts/catalog/build.py
```

Ese comando hace todo:

1. Crea `.catalog-cache/venv` e instala las versiones fijadas en
   `scripts/catalog/requirements.txt` (wordfreq 3.1.1, lemminflect 0.2.3 y sus
   dependencias). Después se relanza dentro de ese entorno con `python -I`.
2. Ejecuta las etapas en orden. Cada una escribe su resultado en
   `.catalog-cache/work/` y se salta si ese archivo ya existe, así que una ejecución
   interrumpida se reanuda donde quedó.

| # | Etapa (archivo) | Salida en `.catalog-cache/` |
|---|---|---|
| 1 | descarga (`s01_download.py`), reanudable, con sha256 | `raw/kaikki/`, `raw/kaikki-es/`, `raw/tatoeba/`, `manifest.json` |
| 2 | lista de frecuencias (`s02_wordfreq.py`) | `work/wordfreq_words.jsonl` |
| 3 | filtrado del Wiktionary inglés en streaming (`s03_kaikki.py`) | `work/kaikki_subset.jsonl` |
| 4 | índice inverso de entradas españolas (`s03b_kaikki_es.py`) | `work/es_reverse.json` |
| 5 | lematización, ranking y entradas base (`s04_lemmas.py`) | `work/entries_skeleton.jsonl` |
| 6 | pares eng–spa de Tatoeba (`s05_tatoeba.py`) | `work/tatoeba_pairs.jsonl` |
| 7 | español y ejemplos (`s06_enrich.py`) | `work/entries_enriched.jsonl` |
| 8 | salidas finales (`s07_output.py`) | `content/catalog/*` |

- Rehacer desde una etapa: `python -I scripts/catalog/build.py --from 5` borra las
  salidas de la 5 en adelante y las regenera.
- Forzar una nueva descarga: borra `.catalog-cache/raw/` y `.catalog-cache/manifest.json`.
  Las fuentes publican versiones nuevas, así que el resultado cambiará. La fecha de
  cada fuente queda en `provenance` y en `build-info.json`.
- Parámetros (rango máximo, palabras por ejemplo, semilla…): `scripts/catalog/common.py`.
- Con las mismas descargas, la salida es determinista: se reconstruyó dos veces y
  dio el mismo sha256.

Tiempo medido en este equipo (Windows 11), reconstruyendo desde cero con las
descargas en caché: 8 min 9 s. Las etapas más lentas son el streaming de kaikki
(~3,5 min), la lematización (~2 min) y el enriquecimiento (~1,5 min). La primera
vez se suman unos 2 minutos de descarga (depende de la conexión) y la instalación
del virtualenv (menos de 1 min).

Seguridad: lo descargado se trata solo como datos. Cada fuente va en su propio
directorio dentro de `.catalog-cache/raw/` y no se ejecuta nada de ahí. Python
siempre corre con `-I` (aislado).

## Método

1. **Frecuencia.** `top_n_list('en', 80000, wordlist='best')` y `word_frequency`.
   Se descartan tokens no léxicos: números, letras sueltas salvo *a* e *I*,
   contracciones (`don't`) y una lista corta de ruido (abreviaturas como `mr`, `etc`,
   `tv`; palabras extranjeras como `de`, `la`, `que`; restos de tokenización como
   `ll`, `ve`).
2. **Lematización.** La frecuencia de cada forma se suma a su lema, así que las
   formas flexionadas nunca son entradas. Las relaciones vienen de LemmInflect
   (`went → go`, `children → child`). Si LemmInflect no conoce la palabra, se usan los
   sentidos *form of* de Wiktionary. Una forma ambigua que además es lema (*left*:
   adjetivo, y pasado de *leave*) reparte su frecuencia a partes iguales. Una forma
   flexionada solo cuenta como lema propio si tiene al menos 3 sentidos y alguno con
   traducción (*building* sí; *going* o *things* no). Los modales (*could*, *would*,
   *might*…) son lemas propios con `pos: "aux"`.
3. **Variantes.** Las glosas "British / Commonwealth / Canadian … spelling of X"
   suman su frecuencia al lema estadounidense (*color*) y se guardan en `variants`.
   `ca` solo se rellena cuando Wiktionary menciona Canadá o la Commonwealth. Ejemplo:
   *colour* → `ca: "colour"`; *realise* (solo británico) → sin `ca`.
4. **Exclusiones.** Quedan fuera los nombres propios (POS `name` de Wiktionary),
   salvo meses, días, *Christmas*, *Easter*, *Halloween*, *God* e *Internet*. También
   las palabras que en Tatoeba aparecen en mayúscula a mitad de frase al menos el 75 %
   de las veces (*john*, *japan*, *trump*), las siglas en mayúsculas y los sentidos
   obsoletos, arcaicos, raros, dialectales, de ortografía alternativa o regionales
   ajenos a EE. UU. o Canadá. Las palabras funcionales se mantienen.
5. **Entradas por POS.** Una entrada por lema + POS, hasta 3 por lema. Las
   categorías secundarias se aceptan solo si tienen sentidos suficientes y señales de
   uso real en Tatoeba (determinante delante para sustantivos; *to*, modal, pronombre
   o pasado para verbos; *very*, *is*… delante para adjetivos). Así se descartan
   verbos como *to cat* o *to sky*. El **sentido principal** es el primer sentido
   apto en el orden de Wiktionary, que suele poner primero el más común. Se añaden
   hasta 2 sentidos extra en `senses`.
6. **Español** (`es_src` indica el origen; nunca se inventa):
   - `wiktionary:main-sense`: traducciones de la tabla del sentido principal. Las
     tablas que wiktextract no asignó a ningún sentido se asignan por coincidencia de
     palabras entre su etiqueta y la glosa.
   - `wiktionary:other-sense+tatoeba-evidence`: traducción de otro sentido u otra
     tabla del mismo lema y POS, aceptada solo si aparece en las traducciones
     españolas de Tatoeba de oraciones con el lema (≥1 coincidencia en el top 2000,
     ≥2 en el resto, y ≥5 % de la muestra). Si es posible, ese sentido pasa a ser el
     principal para que glosa y traducción coincidan.
   - `wiktionary:other-pos+tatoeba-evidence`: traducción de otra categoría del mismo
     lema, con ≥10 % de evidencia y forma compatible (un sustantivo no recibe un
     infinitivo, ni al revés).
   - `wiktionary-es-entries+tatoeba-evidence`: palabra española cuya entrada en
     Wiktionary la glosa con el lema (*merecer* → "to deserve"), con la misma
     evidencia.
   - `wiktionary:sense-2/3`: sin evidencia, se usa el siguiente sentido que sí tiene
     traducciones, y ese sentido pasa a ser el principal.

   Orden de los equivalentes: México, Latinoamérica o sin marca antes que solo
   España, y después por frecuencia en Tatoeba. Se dan 1 a 3 equivalentes. Del
   segundo en adelante, solo los que confirma Tatoeba.
7. **Ejemplos.** Pares Tatoeba eng→spa con enlace directo, de 4 a 14 palabras, con
   puntuación final y sin cifras ni URL. Deben contener el lema o una de sus formas.
   La puntuación favorece:
   - vocabulario frecuente en el resto de la oración;
   - longitud de unas 8 palabras;
   - autores nativos según `user_languages`, nivel 5;
   - traducción española que contiene el equivalente elegido;
   - contexto compatible con la categoría gramatical;
   - pocos nombres propios.

   Penaliza el voseo, las formas de *vosotros* y algunos términos peninsulares
   (*coche*, *ordenador*, *coger*…). Se evita repetir oraciones entre lemas. Se dan
   1 o 2 ejemplos por entrada y sus ids se guardan en `src`.
8. **IPA.** Solo de Wiktionary. `ipa_us` es la transcripción marcada General
   American / US y `ipa_ca` la marcada Canada. Se prefiere la fonémica `/…/` y la
   que coincide con la categoría (*record* sustantivo o verbo). Si no hay ninguna de
   EE. UU., `ipa` guarda la transcripción sin acento indicado. No se genera IPA.
9. **Nivel.** `level_est` depende solo de la banda. Es orientativo.

## Estadísticas (build del 2026-11-23)

| | Total | Top 2000 (rango ≤ 2000) | Top 5000 |
|---|---|---|---|
| Entradas (lema+POS) | 13 226 | 2 518 | 5 885 |
| `complete` | 9 878 (74,7 %) | 2 475 (98,3 %) | 5 521 (93,8 %) |
| `pending` | 3 348 | 43 | 364 |

- **Lemas distintos:** 12 000. De los 2 002 lemas del top 2000, 1 984 tienen al
  menos una entrada completa.
- **Entradas por POS:** noun 7 644, adj 2 379, verb 2 344, adv 598, interj 69,
  prep 58, pron 48, det 28, conj 23, num 19, aux 9, other 7.
- **Español y ejemplos:** 12 009 entradas con `es`. 10 410 con al menos un ejemplo
  (8 818 con dos); 19 228 ejemplos en total.
- **Pendientes:** 2 131 por falta de ejemplo, 532 por falta de `es` y 685 por ambas.
- **IPA:** 12 496 entradas con alguna IPA. 8 154 tienen `ipa_us` (1 834 de las 2 518
  del top 2000), 2 584 tienen `ipa_ca` y 4 330 solo `ipa` sin acento.
- **Otros:** 121 entradas con `variants` y 34 647 sentidos (principal más extras).

Las cifras exactas, actualizadas en cada build, están en `stats.json`.

## Limitaciones conocidas

- **Frecuencia mezclada y no local.** wordfreq combina corpus de varios géneros y
  variedades. No representa el inglés de Canadá, ni el de EE. UU. en particular, ni
  lo que ve un estudiante mexicano. Los subtítulos y Twitter suben palabras
  coloquiales, y Wikipedia sube términos enciclopédicos.
- **El rango es por lema, no por sentido ni por POS.** Las entradas de un mismo lema
  comparten `rank`. Una forma ambigua reparte su frecuencia a partes iguales, lo que
  es una aproximación.
- **CEFR estimado.** `level_est` depende solo de la frecuencia. No es CEFR oficial ni
  sustituye listas como el English Vocabulary Profile.
- **Sentido principal.** Wiktionary ordena los sentidos por historia o etimología, no
  siempre por uso. A veces la glosa elegida es poco habitual (por ejemplo, *pipe* →
  instrumento de viento). Hay que revisar sobre todo el top 2000.
- **Los ejemplos no se desambiguan por sentido.** Contienen la palabra, pero pueden
  usar otro sentido u otra categoría (un ejemplo de *decrease* sustantivo puede usar
  el verbo). La calidad de Tatoeba varía: hay erratas, traducciones libres, mucho
  "Tom" y "Mary", y variantes regionales del español (voseo, España) que se penalizan
  pero no se eliminan.
- **Equivalentes españoles.** Salen de tablas de traducción hechas por voluntarios.
  Pueden ser arcaicos, regionales o raros (*alacre* para *joyous*) o venir de un
  sentido vecino. La evidencia de Tatoeba compara raíces (*banc-* coincide con
  *banco*), así que puede dar falsos positivos.
- **Pendientes.** No hay `es` cuando Wiktionary no tiene traducciones para el sentido
  (por ejemplo los modales *will*, *could*, *shall*, o el artículo *a*). No hay `ex`
  cuando Tatoeba no tiene oraciones de 4 a 14 palabras con traducción española que
  contengan la palabra (términos técnicos o raros).
- **IPA.** No hay `ipa_us` cuando Wiktionary solo da la británica (RP) o una sin
  marcar. `ipa` no indica acento y la variante canadiense es escasa.
- **Variantes `ca`.** Solo cuando Wiktionary menciona Canadá o la Commonwealth. Por
  ejemplo, *favourite* no tiene `ca` aunque en Canadá se usa.
- **Nombres propios.** El filtro es heurístico. Pueden colarse lemas inflados por
  nombres (*max*, *ray*) o faltar sustantivos que en Tatoeba se escriben con
  mayúscula (*congress*).

## Revisión humana

`sample-review.csv` (UTF-8 con BOM, se abre en Excel) tiene las columnas
`id,lemma,pos,es,ex_en,ex_es,reviewer,verdict,notes`, más `stratum`, `rank` y
`sense_en` como contexto. Las columnas `reviewer`, `verdict` y `notes` están vacías.
Valores sugeridos para `verdict`: `ok`, `fix-es`, `fix-sense`, `fix-ex`, `drop`. Al
revisar una entrada en el catálogo, cambia `review` de `auto` a otro valor (por
ejemplo `human`) para no perder la distinción.

## Atribución en la app

Al mostrar ejemplos hay que poder acreditar al autor de Tatoeba (ver
`tatoeba-attribution.tsv`). Las definiciones y traducciones requieren el aviso
CC BY-SA de Wiktionary. Hay un texto de créditos listo en `NOTICE.md`.
