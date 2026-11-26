# Fluye 1.0 — respaldo, despliegue y reversión

Nada de esto se ejecuta sin la aprobación explícita de Manuel.

## Qué cambia en la base de datos

La rama `fluye-1.0` **no añade migraciones**: la última sigue siendo `0005_solo_gemas`, que ya está aplicada en producción. Las escenas de series guardan su resultado en `lesson_progress`, con ids `ser-…`, y los consejos del tutor solo leen datos. Por eso el despliegue no requiere migrar, y revertirlo tampoco exige tocar la base.

## Antes de desplegar

1. Respaldo de producción (solo lectura):
   ```
   (set -a; . .private/.env.prod; set +a; node scripts/db-dump.mjs C:/Users/Admin/FluyeBackups/<fecha>-pre-1.0)
   ```
2. Anotar los contadores de control: XP de cada cuenta, número de `cards`, `review_logs` e `inventory`.
3. Compilación limpia: `npm run content && npm run typecheck && npm run lint && npm test && npm run build`.
4. E2E completa contra la base de desarrollo: `npm run test:e2e`. Opcional: `FLUYE_QA=1 npx playwright test --project=flujo tests/e2e/v1.spec.ts`.
5. Audio: `npm run audio:build`, después `npm run audio:pack` y `node scripts/audio/verify.mjs`, que debe dar 100 % del contenido publicado.

## Desplegar

```
git checkout main && git merge --ff-only fluye-1.0
npx vercel deploy --prod --yes --archive=tgz
```

`--archive=tgz` es necesario: con el vestuario por pose, `public/` tiene unos 10.100 archivos (321 MB), y Vercel recomienda comprimir la subida cuando hay miles de archivos para no chocar con el límite de archivos.

Si Vercel responde «Running Checks: canceled» o «temporarily throttled», no hay que tocar nada en la base: basta con esperar unos minutos y repetir el comando.

## Verificar después

- `get_runtime_errors` del proyecto `fluye` en los últimos 15 minutos.
- Los mismos contadores del paso 2 deben coincidir: el despliegue no escribe datos.
- Con la sesión de Manuel: Hoy, una sesión corta, una escena de series, Música, Armario y Amigos, en el móvil y en la computadora.

## Revertir

- **Código**: en Vercel, promover el despliegue anterior (Deployments → el anterior → Promote) o `npx vercel rollback`. Como no hay migración, la versión anterior funciona con la base tal cual.
- **Datos**: no hace falta en el caso normal. Ante un daño real, restaurar desde el respaldo del paso 1 tabla por tabla. Es una operación destructiva: requiere aprobación explícita y avisar antes de cualquier interrupción del servicio.
