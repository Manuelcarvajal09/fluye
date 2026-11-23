# PoC local: notas fonéticas (evaluación de pronunciación por fonema)

Estado: terminado (2026-11-23). Veredicto: **GO condicionado solo para pares mínimos; NO-GO para frases libres** (sección 5). Este documento se escribió en dos fases. La sección 1 (criterios de aceptación) se fijó **antes** de ejecutar ninguna prueba y no se ha modificado después; los resultados se añaden debajo.

Restricciones del PoC: presupuesto 0 €, sin servicios remotos de reconocimiento ni APIs en la nube (ni ELSA, ni Azure, ni similares). El audio nunca sale del equipo. Solo se descargan pesos de modelos y datos de referencia públicos.

## 1. Criterios de aceptación (fijados antes de probar)

Máquina de referencia: Intel Core i5-8500T (6 núcleos, 2,1 GHz, 35 W, 2018), 16 GB de RAM, Windows 11, Node 24, solo CPU. Se toma como aproximación de un portátil medio; un portátil actual debería ir igual o más rápido en nativo, y el navegador (WASM) es más lento que onnxruntime-node (ver sección de riesgos).

| # | Criterio | Umbral | Cómo se mide |
|---|----------|--------|--------------|
| C1 | Tamaño de descarga del modelo (cuantizado) | ≤ ~150 MB | Suma de ficheros descargados (pesos ONNX + config + vocabulario) |
| C2 | Ejecutable en el navegador fuera del hilo principal | Sí, con transformers.js / onnxruntime-web en un Web Worker, sin servidor | Formato ONNX compatible con transformers.js 3.8.1 y operadores soportados por onnxruntime-web; en el PoC se ejecuta con la misma librería en Node |
| C3 | Latencia en caliente | ≤ 2 s para una frase de 3 s | Mediana y p95 de la inferencia (extracción de características + modelo + decodificación + alineación), con el modelo ya cargado |
| C4 | Arranque en frío | Se registra; orientativo ≤ 10 s en Node con el modelo ya en disco | Tiempo de `from_pretrained` + primera inferencia |
| C5 | Memoria | Se registra; orientativo ≤ 1 GB de pico | `process.memoryUsage().rss` máximo |
| C6 | Precisión al detectar sustituciones claras | ≥ 0,80 en el conjunto de pares mínimos (EVALUACIÓN) | TP / (TP + FP) sobre el fonema en contraste |
| C7 | Tasa de correcciones falsas en muestras correctas tipo nativo | ≤ 10 % | Muestras correctas en las que se marca algún error en el fonema en contraste / total de muestras correctas |
| C8 | Licencia compatible con una app abierta MIT | Pesos y código con licencia permisiva (MIT, Apache-2.0, BSD); datos de entrenamiento sin cláusula no comercial | Página oficial del modelo / repositorio |
| C9 | Fallo controlado | Silencio, ruido o una frase distinta no producen una "nota" inventada: se devuelve "no se pudo evaluar" | Casos de prueba dedicados |

Criterios secundarios (se informan, no bloquean): sensibilidad/recall de los errores; comportamiento con variantes válidas (acento británico frente a estadounidense); omisión de una palabra; contrastes que un ASR de palabras (Whisper) transcribe igual.

Regla de decisión: GO para una función **experimental, desactivada por defecto** solo si se cumplen C1, C2, C3, C6, C7, C8 y C9 con los datos de EVALUACIÓN (no con los de ajuste). Si falla C1 o C3 pero el resto se cumple, se considera "GO condicionado" con un modelo alternativo o un plan de reducción. Si falla C6, C7, C8 o C9: NO-GO.

Aviso fijado de antemano: las muestras de prueba son voz sintética (Kokoro TTS). La voz sintética no es la de un estudiante: es limpia, sin acento, sin ruido de micrófono y muy parecida a los datos con los que se entrenan estos modelos. Cualquier cifra de este PoC **sobreestima** la precisión real con estudiantes hispanohablantes. Un GO aquí es condición necesaria, no suficiente.

## 2. Candidatos (verificados en las páginas oficiales el 2026-11-23)

Tamaños = ficheros de la variante indicada (API de Hugging Face). Commits fijados en `scripts/poc-phonemes/download.mjs`.

| Candidato | Qué es | Licencia (código / pesos / datos) | Tamaño descarga | Dependencias en navegador | Versión / commit |
|---|---|---|---|---|---|
| `facebook/wav2vec2-lv-60-espeak-cv-ft` | wav2vec2 large (24 capas, ~315 M parámetros) afinado con CTC para fonemas espeak (392 tokens), multilingüe, CommonVoice | Apache-2.0 / Apache-2.0 / CommonVoice CC0 | 1 264 MB (PyTorch, no apto web) | — | `ae45363` |
| `onnx-community/wav2vec2-lv-60-espeak-cv-ft-ONNX` | Conversión ONNX del anterior para transformers.js | Apache-2.0 | int8 (`model_quantized`) 318 MB · q4 242 MB · q4f16 197 MB · bnb4 223 MB | transformers.js 3.8.1 (`AutoModelForCTC`) / onnxruntime-web | `c69750f` |
| `facebook/wav2vec2-xlsr-53-espeak-cv-ft` | Igual arquitectura, preentrenado XLSR-53 | Apache-2.0 / CommonVoice | 1 264 MB (PyTorch) | — | `2c73378` |
| `qnighy/wav2vec2-xlsr-53-espeak-cv-ft-ONNX` | ONNX del anterior | Apache-2.0 | q4 241 MB · q4f16 197 MB | transformers.js | `d2987af` (no se ejecutó: mismo tamaño que lv-60 q4) |
| `air-air/xlsr-53-espeak-student-ONNX` | Destilación del xlsr-53-espeak a 8 capas, q4 | Apache-2.0 / FLEURS CC BY 4.0. **Destilado sin audio en inglés** (de, es, fr, it, ja, ko, pl, pt, ru, sv) | 77 MB | transformers.js | `5f72322` |
| `onnx-community/wav2vec2-ljspeech-gruut-ONNX` (de `bookbot/wav2vec2-ljspeech-gruut`) | wav2vec2 **base** (94 M) afinado con CTC a fonemas IPA de gruut (inglés EE. UU., 43 tokens) | Apache-2.0 / LJSpeech dominio público | q4 90 MB · q4f16 66 MB · fp16 189 MB (sin int8) | transformers.js | `263beb0` (base `7be1e6f`) |
| `onnx-community/wavlm-large-english-phoneme-ONNX` | WavLM large, fonemas ingleses | **Sin licencia declarada** en la ficha | q4 241 MB | transformers.js | `b6addee` (descartado por licencia y tamaño) |
| `ron-jo/hubert-base-phoneme-en-onnx` | HuBERT base fonemas EN, int8 | Apache-2.0 | 122 MB | ONNX suelto, sin config/vocab para transformers.js | `f3bb2cd` (descartado: sin vocabulario ni ficha verificable) |
| OpenPronounce (`github.com/OpenPronounce/OpenPronounce`, antes `Halleck45/OpenPronounce`) | Existe. Paquete Python (PyPI `openpronounce` 1.1.0): wav2vec2-lv-60-espeak + alineación CTC forzada contra CMUdict + modelos de GOP entrenados con speechocean762; además wav2vec2-large-960h para transcribir y síntesis de referencia (gTTS por defecto, con red) | **AGPL-3.0** desde 1.0 (hasta 0.4 era MIT); licencia comercial aparte | 2 × 1,2 GB + torch | Python + PyTorch + ffmpeg; **no** corre en el navegador | commit `d6bf737` (2026-11-23) |
| CMUdict (`cmusphinx/cmudict`) | Diccionario de pronunciación (ARPAbet) usado como G2P de referencia para frases | BSD-2-Clause (estilo) | 3,6 MB (texto) | ninguno | `7479086` |

Descartes de diseño: OpenPronounce no se integra (AGPL incompatible con distribuirlo dentro de una app MIT sin liberar bajo AGPL; además es Python/servidor y pesa >2 GB). Sí se toma su **método** (alineación CTC forzada + GOP), que es estándar y está descrito en la literatura. `phonemizer` (npm, ya en node_modules por kokoro-js) empaqueta espeak-ng (GPL-3.0): no se usa como G2P en cliente; la referencia sale de las transcripciones IPA ya escritas en `content/sounds/sounds.json` (contenido propio) y, para frases, de CMUdict.

## 3. Qué se ejecutó

Todo se ejecutó en local y sin conexión durante las pruebas. Solo `download.mjs` usa la red, para bajar los pesos y CMUdict. No hizo falta Python.

- **Motor**: **transformers.js 3.8.1** (`AutoFeatureExtractor` + `AutoModelForCTC`) sobre **onnxruntime-node 1.21.0**.
- **Coste en navegador**: el mismo `.onnx` se ejecutó con **onnxruntime-web (WASM)** en Node para estimarlo.

Tipo de evaluación: **reconocimiento de fonemas CTC + alineación contra fonemas de referencia**. La referencia de palabras sale del IPA ya escrito en `content/sounds/sounds.json`. La de frases sale de CMUdict (ARPAbet → IPA). No hay G2P en el cliente.

Se probaron tres maneras de decidir si hay error:

1. **Libre**: decodificación greedy y alineación de Levenshtein contra la referencia. Equivale a un "WER de fonemas".
2. **GOP genérico**: alineación CTC forzada. Para cada fonema se compara log P(referencia) con la mejor alternativa: otra vocal o consonante, un borrado o una inserción. Se marca si el LLR supera τ.
3. **Par mínimo**: LLR = log P(fonemas del compañero) − log P(fonemas del objetivo). Por ejemplo, P(/sɪŋk/) − P(/θɪŋk/). Se marca si supera τ. Solo sirve donde la app ya conoce el contraste, es decir, en los ejercicios de pares mínimos.

Antes de cualquier nota se aplican **compuertas de fallo controlado**:

- silencio: RMS < 0,003;
- sin voz: menos de k tramas que no son blanco;
- "no coincide": PER libre por encima del umbral.

Datos, todos con voz sintética Kokoro-82M (`gen-data.mjs`):

- 226 pares mínimos de `sounds.json`, en los dos sentidos.
- **AJUSTE**: los pares con índice % 4 == 0, solo con af_heart. Suman 228 muestras de pares y 72 de frases.
- **EVALUACIÓN**: el resto de pares, con af_heart y am_adam. Suman 1 336 muestras: 668 correctas y 668 "erróneas". Una muestra errónea es el audio del compañero presentado como intento de la palabra objetivo (sustitución simulada).
- Variantes válidas: 668 muestras en británico (bf_emma y bm_george).
- Frases: 72 correctas, 72 con una palabra omitida y 72 "frase distinta".
- Silencio y ruido blanco a −20 y −40 dBFS.
- `tests/fixtures/speech.wav`: es la frase de prueba de Ajustes. El repo no documenta si es voz humana o TTS.

Los umbrales τ, el PER máximo y k se eligieron **solo con AJUSTE**: el τ más bajo con falsa corrección ≤ 5 % en ajuste. Después se congelaron y se aplicaron a EVALUACIÓN.

28 muestras quedan fuera porque su contraste desaparece al normalizar (ə/ɪ átonas, como en Rosa's/roses).

## 4. Resultados (EVALUACIÓN)

### 4.1 Rendimiento (i5-8500T, CPU, equipo en reposo salvo el navegador abierto)

| | gruut q4 (elegido) | student q4 | lv-60 int8 |
|---|---|---|---|
| Descarga | **89,8 MB** | 76,8 MB | 317,7 MB |
| Carga en frío, Node nativo (modelo ya en disco) | 0,84–1,5 s | 0,6–3,1 s | 1,5–3,3 s |
| Crear la sesión WASM | 0,6 s | 0,5 s | 1,0 s |
| 3 s de audio, nativo, todos los hilos (mediana) | 0,16–0,93 s (mucha varianza) | 0,32 s | 0,93 s |
| 3 s, nativo, 1 hilo | 0,60 s | 0,75 s | 1,39 s |
| **3 s, WASM 1 hilo** (navegador sin COOP/COEP, como la app hoy) | **2,20–2,29 s** | 2,58 s | 3,38 s |
| 3 s, WASM 4 hilos (requiere aislamiento de origen) | 0,61 s | 0,74 s | 1,12 s |
| 1 s (palabra suelta), WASM 1 hilo | 0,85 s | — | — |
| Puntuación en JS, método par | despreciable (< 5 ms) | | |
| Puntuación en JS, GOP de una frase de ~3 s | 0,26–0,42 s | 0,45 s | 0,48 s |
| Pico de RSS nativo (benchmark / corpus completo) | 301 / 481 MB | 338 / 406 MB | 812 / 966 MB |
| Pico de RSS en WASM | 178–216 MB | 164–203 MB | 407–441 MB |
| Errores de ejecución | 0 de 1 493 audios | 0 | 0 |

Nota de medición: durante la primera pasada, otro proceso ajeno al PoC (`npm run audio:build`, 6 hilos de Kokoro) saturaba la CPU. Esas cifras se descartaron (por ejemplo, 6 s en WASM) y las de la tabla se repitieron con el equipo en reposo. Aun así, las cifras nativas multihilo varían hasta ×5 entre repeticiones. Las de 1 hilo son estables.

### 4.2 Detección en pares mínimos (gruut q4)

Umbrales congelados tras el AJUSTE: τ_par = 4,5, τ_GOP = 10,75, PER máximo = 0,70.

| Método | Precisión | Recall | Falsa corrección (correctas marcadas) | No evaluables (correctas / erróneas) |
|---|---|---|---|---|
| **Par mínimo** | **0,960** (386/402) | **0,704** | **2,6 %** (16/607) | 61/668 (9,1 %) / 120/668 |
| GOP genérico | 0,884 | 0,334 | 6,6 % (cualquier fonema) | ídem |
| Libre (Levenshtein) | 0,714 | 0,951 | **64 %** | ídem |

Método par, desglose por voz y por conjunto:

| Conjunto | Precisión | Recall | Falsa corrección | Correctas no evaluables |
|---|---|---|---|---|
| EVALUACIÓN, af_heart | 0,953 | 0,633 | 2,8 % | 49 |
| EVALUACIÓN, am_adam | 0,965 | 0,768 | 2,5 % | 12 |
| AJUSTE | 0,923 | 0,608 | 4,6 % | — |

La evaluación no salió peor que el ajuste.

Los otros candidatos, con método par en EVALUACIÓN:

- **lv-60 int8**: P 0,906, R 0,778, FC 7,6 %, 65 correctas no evaluables. Con GOP: P 0,882, R 0,382, FC 7,1 %. Es el mejor en recall, pero pesa 318 MB y tarda 3,4 s en WASM con 1 hilo.
- **student q4**: P 0,935, R 0,326, FC 2,1 %, pero 139 correctas no evaluables (21 %). Se destiló sin inglés y confunde /ɪ/ con /i/ y /ʃ/ con /ɕ/. Descartado.

Sonidos débiles con gruut (recall del par < 0,6 o FC > 10 %):

| Contraste | Resultado |
|---|---|
| ʌ (cut/cot) | recall 0,48 |
| sh/ch | recall 0,25 |
| j/dʒ | recall 0,40 |
| grupos s- (estate) | recall 0,44, FC 12,5 % |
| -s/-z final | FC 12,5 % |
| eɪ/ɛ | recall 0,53 |
| oʊ/ɔ | recall 0,53 |
| ʊ/u | recall 0,57 |
| h | recall 0,56 |

Los mejores: th/s, v/b, r/l, -ed, ŋ, ai/ɪ y la aspiración.

Confianza del método par: la precisión medida crece con el margen sobre τ.

| Margen sobre τ | Precisión (gruut) | Precisión (lv-60) |
|---|---|---|
| [0, 2) | 0,93 | 0,87 |
| [2, 5) | 0,95 | 0,89 |
| ≥ 5 | 0,98 | 1,00 |

La sigmoide del LLR **no** sirve como probabilidad: con gruut sale > 0,9999 en todas las marcas.

### 4.3 Casos de fallo controlado y otros (gruut)

| Caso | Resultado |
|---|---|
| Silencio (2) | 2/2 "no se pudo evaluar" (silencio) |
| Ruido blanco −20 / −40 dBFS (4) | 4/4 "no se pudo evaluar" (sin voz) |
| Frase completamente distinta (72) | 70/72 rechazadas; **2 pasaron** como evaluables |
| Omisión de una palabra (72) | detectada por el método libre en 71/72 y por el GOP en 66/72 |
| Frases correctas (72) | ninguna rechazada, pero el **GOP marcó algo en 32/72 (44 %)** y el método libre en 50/72. En frases, el GOP genérico **no** cumple C7 |
| Variantes válidas, británico (668) | 175 no evaluables (26 %). El par marca 24/493 (4,9 %); el GOP marca algo en 39/493 (7,9 %) |
| Contrastes que el ASR de palabras da por buenos | Whisper base.en, el ASR que ya usa la app, transcribió como la palabra objetivo 38 de 676 muestras erróneas. De las 33 evaluables, el par detectó 19 (P 1,0, R 0,58). Con palabras correctas sueltas, Whisper solo acertó 464/676 (69 %) |
| `tests/fixtures/speech.wav` ("I'm looking forward to catching up with you this weekend.") | Evaluable, PER 0,11. El GOP marcó "to" u→ə, que es una reducción **válida** (falsa corrección), y "with" ð→θ |

Probado y descartado: añadir 0,25 s de silencio alrededor de cada clip, porque los mp3 de la app vienen recortados al ras. La prueba se decidió **después** de ver los fallos en EVALUACIÓN. No mejoró: 74 correctas no evaluables, P 0,933, FC 4,7 %. Se documenta pero no se adopta.

### 4.4 Criterios

| # | gruut q4 + método par | Cumple |
|---|---|---|
| C1 ≤ ~150 MB | 89,8 MB | Sí |
| C2 navegador, fuera del hilo principal | ONNX estándar de transformers.js; ejecutado con onnxruntime-web WASM. **No** se probó en un navegador real ni en un Web Worker real | Probable; falta comprobarlo |
| C3 ≤ 2 s para 3 s | WASM 1 hilo: 2,2–2,3 s (**no**). WASM 4 hilos: 0,61 s (sí). Palabra de 1 s con 1 hilo: 0,85 s (sí) | Parcial |
| C4 arranque en frío ≤ 10 s | < 1,5 s con el modelo en disco; la descarga de 90 MB va aparte | Sí |
| C5 memoria ≤ 1 GB | 180–480 MB | Sí |
| C6 precisión ≥ 0,8 | 0,960 | Sí, con voz sintética |
| C7 falsa corrección ≤ 10 % | 2,6 % en pares (4,9 % con acento británico). GOP en frases: 44 % | Sí en pares; **no** en frases |
| C8 licencia | Apache-2.0 (código y pesos), LJSpeech de dominio público, CMUdict BSD, transformers.js Apache-2.0 | Sí |
| C9 fallo controlado | silencio 2/2, ruido 4/4, frase distinta 70/72 | Sí, salvo 2 frases que se colaron (ver riesgos) |

## 5. Recomendación

**GO condicionado** para un modo experimental, **desactivado por defecto**, de notas fonéticas en los **ejercicios de pares mínimos**:

- solo una palabra o frase corta, de hasta ~1,5 s;
- con `onnx-community/wav2vec2-ljspeech-gruut-ONNX` q4;
- con el método par.

No es un GO pleno porque, según la regla de la sección 1, C3 falla con 1 hilo para 3 s.

**NO-GO** para:

- notas fonéticas en frases libres, con GOP genérico o con el método libre: marcan errores en el 44–69 % de las frases correctas;
- cualquier puntuación global.

Condiciones antes de enseñarlo a nadie fuera de pruebas internas:

1. Validar con voz real de estudiantes hispanohablantes: un conjunto pequeño, grabado con consentimiento, guardado en local y etiquetado a mano (correcto / sustituido). Las cifras de este PoC salen de TTS y **están infladas**.
2. Mientras la app no tenga aislamiento de origen, limitar los clips a ~1,5 s. La alternativa es activar COOP/COEP solo en la ruta de práctica; antes hay que comprobar que no rompe Clerk ni los recursos de terceros. Con aislamiento, WASM multihilo baja a ~0,6 s para 3 s.
3. Descargar el modelo solo cuando el usuario lo pida: 90 MB, con progreso y botón de cancelar. Guardarlo en Cache Storage y ejecutarlo en un Web Worker propio, sin bloquear la UI.
4. Ocultar los sonidos con recall < 0,6 o FC > 10 %: sh/ch, j/dʒ, grupos s-, -s/-z final, ʌ/ɑ, eɪ/ɛ, oʊ/ɔ, ʊ/u y h. Volver a medirlos con voz real.
5. Tratar "no se pudo evaluar" como un resultado de primera clase: ocurre en ~9 % de los intentos correctos.

Lo que debe decir la UI:

- Etiqueta visible "Experimental" y el texto "Se analiza en tu dispositivo; la grabación no sale de él".
- **Nunca** una puntuación 0–100 ni un porcentaje de pronunciación sacado del WER o de la confianza.
- Lenguaje de posibilidad, nunca de veredicto. Por ejemplo: "Puede que sonara más a *sheep* que a *ship* (confianza media)". La confianza va en tres niveles (baja, media, alta) según el margen sobre τ, y cada nivel muestra su precisión medida.
- Sin marca: "No detectamos la confusión ship/sheep". Nunca "pronunciación perfecta".
- Si falla una compuerta: "No pudimos evaluar esta grabación (no se oye bien / no parece la palabra esperada). Prueba otra vez más cerca del micrófono". En ese caso no se muestra ninguna nota.
- Aviso permanente: "Es una herramienta automática y se equivoca, sobre todo con acentos distintos del estadounidense. Un acento británico u otro no es un error".
- Opción para desactivarlo y para borrar el modelo descargado.

## 6. Riesgos y limitaciones

- **Voz sintética**: el habla de Kokoro es limpia, sin acento español y sin ruido de micrófono. No es habla de estudiantes. Además, algunas palabras sueltas salen mal (por ejemplo, "Betty" se oye /bæɹi/), y eso ensucia las etiquetas en los dos sentidos.
- gruut se entrenó con **una sola hablante** (LJSpeech). Con voz masculina funcionó incluso mejor, pero no se ha medido con voces reales, niños ni micrófonos malos.
- La compuerta "no coincide" dejó pasar 2 de 72 frases distintas. Hay que reforzarla, por ejemplo exigiendo además una verosimilitud mínima por trama.
- C2 no se ha comprobado en un navegador real. Quedan pendientes la descarga, Cache Storage, el Worker, Safari/iOS y la memoria en móvil.
- La latencia nativa multihilo varía mucho. Hoy las cifras relevantes son las de WASM con 1 hilo.
- La normalización IPA y las equivalencias (t/ɾ/d, ə/ɪ/ʌ átonas, ɑ/ɔ, ɚ/ɝ) se fijaron a priori por fonología y no se tocaron después de ver la evaluación.

## 7. Cómo reproducir (un comando por paso)

```
node scripts/poc-phonemes/download.mjs              # única fase con red: modelos fijados por commit y CMUdict → .poc-cache/
node scripts/poc-phonemes/gen-data.mjs              # audio local (Kokoro + .audio-cache) y manifiesto AJUSTE/EVALUACIÓN
node scripts/poc-phonemes/run-model.mjs gruut       # emisiones + carga/latencia/memoria (también lv60, lv60q4, student; --bench, --threads N, --pad S)
node scripts/poc-phonemes/whisper.mjs               # opcional: Whisper base.en, para los contrastes que el ASR da por buenos
node scripts/poc-phonemes/evaluate.mjs gruut        # ajusta con AJUSTE, mide en EVALUACIÓN → .poc-cache/out/eval-gruut.json
node scripts/poc-phonemes/bench-wasm.mjs gruut 1 3  # coste aproximado en navegador: onnxruntime-web WASM, <hilos> <segundos>
```

Toda la salida queda en `.poc-cache/` (`models/`, `cmudict/`, `data/` y `out/`), unos 810 MB. Ese directorio **no** está en `.gitignore`. La lógica que iría en el Worker está en `scripts/poc-phonemes/score.mjs` y no depende de Node.
