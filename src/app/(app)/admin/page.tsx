import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/user";
import { isOwner } from "@/lib/access";
import { AdminPanel } from "@/components/AdminPanel";

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
      <AdminPanel />
    </div>
  );
}
