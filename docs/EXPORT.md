# Formato de exportación

`GET /api/data` devuelve un JSON con los datos de **la persona que lo pide** (nunca de otras):

- `profile`: nombre, nivel, meta, áreas, zona horaria, ajustes (incluye `look`, `season`, `explicit`, `goals`, `known`, `fragments`).
- `cards`: tarjetas FSRS por `itemId` + `mode` (`recog`, `prod`, `listen`, `speak`), con `fsrs` completo, `due`, `state`, `stability`, `reps`, `lapses`, `suspended`.
- `logs`: historial de repasos (`rating`, `stateBefore`, `stabilityAfter`, `scheduledDays`, `durationMs`, `reviewedAt`).
- `daily`, `lessons`, `sounds`.

`POST /api/data` importa el mismo formato: por cada tarjeta conserva la más avanzada (no duplica ni retrocede).

## Cambios en esta versión (compatibles hacia atrás)

- `logs` puede traer `attemptId`, `firstTry`, `hints`, `revealed` y `kind` (`graded` | `self`). Los respaldos anteriores sin estos campos se importan igual.
- Ítems del catálogo usan ids `lex-<lema>-<categoría>` (estables).
- Nuevas tablas que **no** se exportan todavía: `error_events`, `active_time`, `study_sessions`, `gem_ledger`, `inventory`, `listen_events` (se pueden reconstruir; no afectan FSRS).
