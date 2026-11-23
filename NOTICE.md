# Avisos de terceros (NOTICE)

## Datos

- **wordfreq 3.1.1** — Robyn Speer y colaboradores. Código Apache-2.0; datos de frecuencia **CC BY-SA 4.0**. Se usó para ordenar el catálogo por frecuencia (mezcla de corpus; no es un ranking canadiense ni universal). https://github.com/rspeer/wordfreq
- **Wiktionary** (vía kaikki.org / wiktextract, extracción 2026-10-30 del volcado 2026-10-01) — **CC BY-SA 4.0** y GFDL. Sentidos, categorías, IPA y equivalencias en español del catálogo. https://en.wiktionary.org · https://kaikki.org
- **Tatoeba** (exportación 2026-11-21) — oraciones y traducciones **CC BY 2.0 FR**. Cada ejemplo conserva su id y sus autores en `content/catalog/tatoeba-attribution.tsv` y se muestran en la app. https://tatoeba.org
- **lemminflect 0.2.3** — MIT (datos del SPECIALIST Lexicon, NIH). Lematización del catálogo.
- Detalle completo del catálogo: `content/catalog/NOTICE.md` y `content/catalog/README.md`.

## Modelos y voces

- **Kokoro-82M** (hexgrad) y **kokoro-js** — Apache-2.0. Genera en local el audio que se despliega con la app. kokoro-js usa `phonemizer` (Apache-2.0), que incluye datos de espeak-ng (GPL-3.0); solo se usa como herramienta de desarrollo para generar audio y **no** se distribuye con la app.
- **Whisper base.en** (OpenAI) — MIT. Se descarga en el navegador desde Hugging Face y corre en el dispositivo con **transformers.js** (Apache-2.0).
- Las voces son de inglés de EE. UU. (Kokoro no ofrece voces canadienses); la app no las presenta como canadienses.

## Software

Next.js, React, Clerk SDK, @neondatabase/serverless, zod, motion, ts-fsrs (MIT) · drizzle-orm, TypeScript, Playwright (Apache-2.0) · lucide-react (ISC) · dotenv (BSD-2-Clause) · @axe-core/playwright (MPL-2.0, solo pruebas).

## Tipografías

Nunito y Bricolage Grotesque — SIL Open Font License 1.1 (Google Fonts, servidas con `next/font`).

## Ilustraciones

Escenas en `public/scenes/` y mascotas en `src/components/Mascot.tsx`: originales para Fluye, CC BY 4.0.
