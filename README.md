# Fluye

**Español** · [English](#english)

Fluye es una app web para aprender inglés de Canadá y EE. UU. desde el español (de México), pensada para un grupo pequeño y privado: solo se entra con invitación. Une en una sola experiencia:

- **Misiones útiles** (pedir un café, ir al médico, una entrevista, el invierno canadiense…): escuchar, entender, recordar lo que toca, aprender lo nuevo, decir un fragmento, conversar y cerrar con evidencia.
- **Repetición espaciada FSRS** por expresión y modalidad (reconocer, producir, escuchar, hablar), con intentos idempotentes y reglas honestas (ver la solución = olvido; con pistas = como mucho «Hard»).
- **Escucha activa**: texto oculto al inicio (consultarlo queda registrado), subtítulos progresivos, repetir fragmento, dictado y sombra con comparación A/B.
- **Pronunciación sin trampas**: pares mínimos adaptativos, tu grabación lenta sin cambiar el tono, consejos articulatorios en español. Lo que entiende el reconocedor se muestra como orientativo y nunca castiga tu progreso. Las grabaciones **no salen del dispositivo**.
- **Inglés real**: slang, sarcasmo, coqueteo, groserías e insultos explicados con intención, registro, intensidad y alternativa más suave; preferencia de lenguaje explícito por persona y meta por expresión (entenderla / usarla / ambas).
- **Catálogo de 12 000 lemas** ordenado por frecuencia (wordfreq + Wiktionary + Tatoeba), activable por tandas.
- **Gamificación amable**: compañero personalizable, gemas, tienda cosmética, retos diarios y semanales, rangos de juego (distintos del nivel de inglés), protectores de racha y retos privados opcionales.
- **Temporadas** configurables (automático, elegir o sin temporadas), con fecha simulada para probar.

> El nivel CEFR que muestra la app es **orientativo** y solo sale de evidencia (el test de nivel). No es una certificación.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · Clerk (auth) · Neon Postgres + Drizzle · ts-fsrs · Kokoro-82M (voces pre-generadas, Apache-2.0) · Whisper base.en en el navegador con transformers.js · Vitest + Playwright + axe.

## Instalar

Requisitos: Node 22+ (probado con 24), una cuenta gratuita de **Clerk** y una base **Neon** (u otro Postgres).

```bash
git clone <este repo> fluye && cd fluye
npm ci
cp .env.example .env.local   # y rellena con TUS claves
npm run db:migrate           # crea las tablas
npm run dev
```

### Variables de entorno (`.env.example`)

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Conexión Postgres (Neon). |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | Tu aplicación de Clerk. |
| `OWNER_USER_IDS` | Ids de Clerk (separados por coma) de quien administra. **Nunca** se asigna «al primero que se registre». |
| `NEXT_PUBLIC_APP_URL` | URL pública (se usa en invitaciones y para aceptar solo sesiones de tu dominio en producción). |
| `PROFILE_PRESETS` | Opcional. JSON `{"correo": {name, level, topics, goalMinutes, dailyNew}}` para preconfigurar perfiles sin poner correos en el código. |

### Acceso solo con invitación

1. En Clerk → *Restrictions* → **Sign-up mode: Restricted** (o `npx clerk@latest config patch --json '{"sign_up_mode":"restricted"}'`). Así solo se puede crear cuenta con invitación.
2. Pon tu id de usuario en `OWNER_USER_IDS`.
3. Desde **Perfil → Administrar acceso** invitas por correo (caduca en 7 días, un solo uso), reenvías con límite, revocas invitaciones pendientes o desactivas miembros (conserva su historial y cierra sus sesiones). El propietario no ve respuestas, grabaciones ni progreso de nadie.
4. Además de Clerk, **cada página y cada API comprueban en el servidor** que la cuenta sea miembro activo o propietaria.

### Contenido y audio

- Todo el contenido vive en `content/` (JSON validado). `npm run content` lo valida y empaqueta (corre solo antes de `dev`/`build`).
- Las voces HD se pre-generan en local con Kokoro: `npm run audio:build` y luego `npm run audio:pack`. Los paquetes (`public/audio/`) no van en git; se despliegan junto con la app. Si faltan, la app usa la voz del dispositivo y lo indica.
- Catálogo de palabras: `python -I scripts/catalog/build.py` (ver `content/catalog/README.md`).
- Datos de demostración: `node scripts/seed-demo.mjs <userId>` crea un perfil ficticio con algo de progreso.

### Pruebas

```bash
npm run typecheck && npm run lint && npm test   # unitarias
npm run test:e2e                                # E2E con Clerk en modo prueba (requiere claves de desarrollo)
```

### Exportar e importar

`Perfil → Exportar mis datos` descarga un JSON (`GET /api/data`). Importarlo de nuevo no duplica ni retrocede tarjetas. Formato en [docs/EXPORT.md](docs/EXPORT.md).

## Licencias

- **Código**: MIT ([LICENSE](LICENSE)).
- **Datos y contenido**: ver [docs/DATA-LICENSES.md](docs/DATA-LICENSES.md) y [NOTICE.md](NOTICE.md). El catálogo deriva de Wiktionary (CC BY-SA 4.0) y Tatoeba (CC BY 2.0 FR) y conserva esas licencias y atribuciones.
- Letras de canciones: **no se incluyen**; los ejercicios de música usan líneas originales ([content/music/RIGHTS.md](content/music/RIGHTS.md)).

## Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md). No subas datos personales, grabaciones, exportaciones ni claves.

---

## English

Fluye is an invite-only web app for Spanish speakers (Mexico) learning Canadian and US English. It merges useful real-life **missions**, **FSRS spaced repetition** per modality, **active listening** (hidden transcript, progressive subtitles, dictation, shadowing with A/B comparison), **honest pronunciation practice** (recordings never leave the device), **real-world English** (slang and swearing explained by intent, register and intensity, with a per-user explicit-language setting), a **12,000-lemma frequency catalog** (wordfreq + Wiktionary + Tatoeba) and kind gamification (companion, gems, cosmetic shop, challenges, streak freezes).

**Setup:** Node 22+, a free Clerk app and a Neon (Postgres) database. `npm ci`, copy `.env.example` to `.env.local`, fill in your own keys, `npm run db:migrate`, `npm run dev`. Set Clerk's sign-up mode to **Restricted** and put your Clerk user id in `OWNER_USER_IDS` to manage invitations from *Perfil → Administrar acceso*. Every page and API also checks membership server-side.

**Licenses:** code is MIT; data and content licenses (CC BY-SA 4.0 for the Wiktionary-derived catalog, CC BY 2.0 FR for Tatoeba sentences, original content) are listed in `docs/DATA-LICENSES.md` and `NOTICE.md`. No song lyrics or commercial audio are included.
