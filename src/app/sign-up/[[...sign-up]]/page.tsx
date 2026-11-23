import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/Nav";

export const metadata = { title: "Crear cuenta" };

export default function Page() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo size={56} />
      <SignUp />
    </main>
  );
}
