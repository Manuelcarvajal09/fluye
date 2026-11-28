import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/user";
import { isOwner } from "@/lib/access";
import { AdminPanel } from "@/components/AdminPanel";
import { storageUsage } from "@/lib/journal";

/** Límite de almacenamiento del plan gratuito de Neon (0,5 GB). Aviso al 70 %. */
const LIMIT = 512 * 1024 * 1024;
const mb = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;

export const metadata = { title: "Administrar acceso" };

/** Solo propietario (comprobado en el servidor). Para cualquier otra cuenta, la página no existe. */
export default async function AdminPage() {
  const profile = await requireProfile();
  if (!isOwner(profile.userId)) notFound();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-4xl font-extrabold">Administrar acceso</h1>
        <p className="mt-1 max-w-prose text-muted">
          Fluye es solo con invitación. Cada invitación va a un correo, caduca en 7 días y sirve una sola vez. Desactivar a alguien conserva su historial y cierra sus sesiones; revocar anula una invitación pendiente. Aquí no se ven respuestas, grabaciones ni progreso de nadie.
        </p>
      </header>
      <Link href="/admin/datos" className="module flex items-center justify-between gap-3 p-4">
        <span>
          <b className="block">Datos de uso</b>
          <span className="block text-sm text-muted">Errores más comunes, sesiones que se abandonan, expresiones que más cuestan y actividad por miembro.</span>
        </span>
        <span className="chip bg-brand-soft text-brand-ink">Abrir</span>
      </Link>
      <AdminPanel />
      <StorageCard usage={await storageUsage()} />
    </div>
  );
}

function StorageCard({ usage }: { usage: { dbBytes: number; photoBytes: number; photos: number } }) {
  const pct = Math.round((usage.dbBytes / LIMIT) * 100);
  const warn = pct >= 70;
  return (
    <section className={`module flex flex-col gap-2 p-5 ${warn ? "ring-2 ring-bad/50" : ""}`} aria-labelledby="espacio">
      <h2 id="espacio" className="text-xl font-black">
        Espacio de la base de datos
      </h2>
      <p className="text-sm text-muted">
        {mb(usage.dbBytes)} de {mb(LIMIT)} ({pct} %). Fotos del diario: {usage.photos} ({mb(usage.photoBytes)}).
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-2" role="img" aria-label={`${pct} % usado`}>
        <div className={`h-full ${warn ? "bg-bad" : "bg-brand"}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      {warn && <p className="text-sm font-bold text-bad">Te acercas al límite gratuito. Conviene revisar el plan o mover la app al VPS antes de llegar al 100 %.</p>}
    </section>
  );
}
