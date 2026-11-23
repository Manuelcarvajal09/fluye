# Contribuir

1. Abre un issue antes de cambios grandes.
2. `npm ci`, configura **tus propias** claves en `.env.local` (ver `.env.example`) y `npm run db:migrate`.
3. Antes de un PR: `npm run typecheck && npm run lint && npm test`. Si tocas contenido: `npm run content` (lo valida).
4. Contenido nuevo: sigue `content/SCHEMA.md` y `content/routes/SCHEMA.md`. Escribe ejemplos **originales**; no copies diccionarios, cursos, series ni canciones. Los ids publicados nunca cambian.
5. No subas: datos de personas, correos, grabaciones, exportaciones, respaldos, `.env*` ni capturas con información privada.

El CI de pull requests solo ejecuta lint, tipos y pruebas unitarias, sin secretos ni despliegues.
