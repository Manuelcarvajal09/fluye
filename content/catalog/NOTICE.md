# Avisos y atribuciones de terceros — catálogo de vocabulario de Fluye

`content/catalog/` es una obra derivada que combina datos de terceros con licencias
abiertas. Los datos de Wiktionary están bajo CC BY-SA 4.0 (*ShareAlike*), así que
el catálogo (`lemmas.jsonl`, `sample-review.csv`, `stats.json`) debe distribuirse
bajo **CC BY-SA 4.0**, conservando estas atribuciones. El material de Tatoeba
(CC BY 2.0 FR) puede integrarse en una obra CC BY-SA 4.0 siempre que se mantenga
la atribución a cada autor.

Este aviso describe obligaciones de atribución y no es asesoría legal.

---

## 1. Wiktionary (vía kaikki.org / Wiktextract)

- **Qué aporta:** definiciones en inglés (`sense_en`, `senses`), categoría
  gramatical, IPA (`ipa_us`, `ipa_ca`, `ipa`), equivalentes en español (`es`), formas
  y variantes ortográficas.
- **Fuente:** English Wiktionary, https://en.wiktionary.org/ , extraído por
  kaikki.org (Wiktextract):
  - https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl.gz
  - https://kaikki.org/dictionary/Spanish/kaikki.org-dictionary-Spanish.jsonl.gz
    (entradas de palabras españolas del Wiktionary en inglés; solo se usa como
    índice inverso de candidatos)
- **Versión:** extracción de kaikki.org del 2026-10-30, a partir del volcado de
  enwiktionary del 2026-10-01 (commit de wiktextract `19f9a30`).
- **Licencia:** doble licencia, **Creative Commons Attribution-ShareAlike 4.0
  International (CC BY-SA 4.0)** y **GNU Free Documentation License (GFDL) 1.1 o
  posterior**, sin secciones invariantes (según
  https://en.wiktionary.org/wiki/Wiktionary:Copyrights). Fluye reutiliza el
  contenido bajo la opción CC BY-SA 4.0.
  https://creativecommons.org/licenses/by-sa/4.0/
- **Atribución requerida:**
  > Definiciones, pronunciaciones y traducciones: colaboradores de Wiktionary
  > (https://en.wiktionary.org/), bajo CC BY-SA 4.0. Datos extraídos por kaikki.org
  > (Tatu Ylonen, Wiktextract).
  Para cada entrada, el historial de autores está en
  `https://en.wiktionary.org/wiki/<lema>`.
- **Cita que pide kaikki.org** (uso académico): Tatu Ylonen, *Wiktextract:
  Wiktionary as Machine-Readable Structured Data*, Proceedings of the 13th
  Conference on Language Resources and Evaluation (LREC), pp. 1317–1325,
  Marsella, 2022. kaikki.org también agradece un enlace a https://kaikki.org/ .
- **Cambios realizados:** selección de sentidos, recorte de glosas a 160
  caracteres, filtrado y reordenación de traducciones, normalización de categorías
  gramaticales.

## 2. Tatoeba

- **Qué aporta:** oraciones de ejemplo en inglés con su traducción al español
  (`ex[]`). Cada ejemplo lleva `src: "tatoeba:<idInglés>-<idEspañol>"`.
- **Fuente:** https://tatoeba.org/ , exportaciones por idioma en
  https://downloads.tatoeba.org/exports/per_language/ (`eng_sentences_detailed`,
  `spa_sentences_detailed`, `eng-spa_links`, `*_user_languages`).
- **Versión:** exportación del 2026-11-21.
- **Licencia:** **Creative Commons Attribution 2.0 France (CC BY 2.0 FR)**,
  https://creativecommons.org/licenses/by/2.0/fr/ . Los términos de uso de Tatoeba
  exigen citar el nombre del autor de cada oración.
- **Atribución requerida:** el autor (usuario de Tatoeba) de cada oración inglesa y
  de cada traducción española está en **`content/catalog/tatoeba-attribution.tsv`**
  (columnas `src, en_sentence_id, en_author, es_sentence_id, es_author, license`).
  Si la app muestra un ejemplo, debe poder mostrar o enlazar su crédito, por ejemplo:
  > Ejemplo: Tatoeba, oración #<id> de <autor>, traducción #<id> de <autor>,
  > CC BY 2.0 FR — https://tatoeba.org/es/sentences/show/<id>
- **Cambios realizados:** ninguno en el texto de las oraciones; solo selección.

## 3. wordfreq

- **Qué aporta:** frecuencias y orden de frecuencia (`rank`, `zipf`, `band`,
  `level_est`).
- **Versión:** wordfreq **3.1.1** (PyPI, publicada el 2023-11-21), lista `best`
  para `en`.
- **Licencias:** código bajo **Apache License 2.0**; los datos de frecuencia pueden
  redistribuirse bajo **CC BY-SA 4.0**.
- **Atribución:** Robyn Speer (2022). *rspeer/wordfreq: v3.0*. Zenodo.
  https://doi.org/10.5281/zenodo.7199437 — https://github.com/rspeer/wordfreq
- wordfreq pide acreditar a sus fuentes. Para inglés mezcla Wikipedia, subtítulos
  (OPUS OpenSubtitles 2018, http://www.opensubtitles.org/ , y SUBTLEX, de Marc
  Brysbaert et al.: "SUBTLEX is freely available data"), noticias (NewsCrawl 2014,
  GlobalVoices), libros (Google Books Ngrams 2012, http://books.google.com/ngrams ),
  web (OSCAR), Twitter y Reddit. wordfreq no redistribuye contenido de Twitter; las
  cifras son estadísticas agregadas.

## 4. LemmInflect

- **Qué aporta:** lematización e inflexiones (`forms`). Se ejecuta al construir el
  catálogo; no se redistribuye su código.
- **Versión:** lemminflect **0.2.3**. **Licencia:** MIT. Su diccionario deriva del
  SPECIALIST Lexicon de la U.S. National Library of Medicine (NIH).
  https://github.com/bjascob/LemmInflect

---

Texto de atribución breve para la app o la página de créditos:

> El vocabulario de Fluye usa datos de Wiktionary (colaboradores de Wiktionary,
> CC BY-SA 4.0, extraídos por kaikki.org), oraciones de ejemplo de Tatoeba
> (tatoeba.org, CC BY 2.0 FR; autores en tatoeba-attribution.tsv) y frecuencias de
> wordfreq (Robyn Speer, CC BY-SA 4.0). El catálogo derivado se distribuye bajo
> CC BY-SA 4.0.
