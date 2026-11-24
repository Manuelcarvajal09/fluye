import { SignOutButton } from "@clerk/nextjs";
import { Logo } from "@/components/Nav";
import { Mascot } from "@/components/Mascot";

export const metadata = { title: "Acceso solo con invitación" };

export default function Page() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-5 px-4 text-center">
      <Logo size={48} />
      <Mascot species="zorro" mood="think" size={120} decorative />
      <h1 className="text-3xl font-black">Fluye es solo con invitación</h1>
      <p className="text-muted">
        Esta cuenta no tiene una invitación activa. Si alguien te invitó, entra con el mismo correo al que llegó la invitación. Si tu acceso fue desactivado, pide a quien administra la app que lo revise.
      </p>
      <SignOutButton redirectUrl="/">
        <button type="button" className="btn btn-primary w-full">
          Cerrar sesión
        </button>
      </SignOutButton>
    </main>
  );
}
