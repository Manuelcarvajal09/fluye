import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { Brain, AudioLines, Map, Sparkles, Mail } from "lucide-react";
import { Logo } from "@/components/Nav";
import { Mascot } from "@/components/Mascot";
import { ITEMS, ROUTES, SOUNDS } from "@/lib/content";

export default async function Landing() {
  const { userId } = await auth();
  if (userId) redirect("/hoy");
  const tracks = ROUTES.reduce((a, r) => a + r.tracks.length, 0);
  const features = [
    { icon: <Map size={24} aria-hidden />, title: "Misiones de la vida real", text: `${ROUTES.length} temas con ${tracks} misiones por nivel: pedir un café, ir al médico, una entrevista, el invierno canadiense…` },
    { icon: <Brain size={24} aria-hidden />, title: "Memoria que dura", text: `Repetición espaciada FSRS por modalidad sobre ${ITEMS.length.toLocaleString("es-MX")} expresiones de Canadá y EE. UU.` },
    { icon: <AudioLines size={24} aria-hidden />, title: "Oído y voz, honestos", text: `${SOUNDS.length} sonidos, dictado y voz en tu dispositivo. Nadie más escucha tus grabaciones.` },
    { icon: <Sparkles size={24} aria-hidden />, title: "Inglés de verdad", text: "Slang, sarcasmo, groserías explicadas con su intención, y el inglés de tus series." },
  ];
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col px-5 py-[max(env(safe-area-inset-top),1.5rem)]">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-2xl font-extrabold">
          <Logo /> Fluye
        </span>
        <Link href="/sign-in" className="btn btn-ghost h-11 min-h-11">
          Entrar
        </Link>
      </header>
      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col gap-6">
          <h1 className="font-display text-5xl font-extrabold leading-[1.02] sm:text-6xl 2xl:text-7xl">El inglés que se habla allá afuera.</h1>
          <p className="max-w-xl text-xl text-muted">Una sesión corta al día con misiones reales, repaso que recuerda lo que olvidas y un compañero que te acompaña.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/sign-in" className="btn btn-primary h-14 px-8 text-lg">
              Entrar
            </Link>
            <p className="flex items-center gap-2 text-sm font-bold text-muted">
              <Mail size={16} aria-hidden /> Solo con invitación: ábrela desde tu correo.
            </p>
          </div>
        </div>
        <div className="hero-card relative grid place-items-center p-8">
          <div className="flex items-end justify-center gap-1">
            <Mascot species="zorro" color="#e8782f" accessory="glasses" mood="happy" size={120} decorative />
            <Mascot species="castor" color="#a8693b" accessory="toque" mood="cheer" size={168} decorative />
            <Mascot species="panda" color="#2f2a33" accessory="headphones" mood="happy" size={120} decorative />
          </div>
          <p className="mt-4 rounded-full bg-surface/85 px-4 py-2 font-black">«Can I get a large latte, please?» ☕</p>
        </div>
      </section>
      <ul className="grid gap-4 pb-10 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <li key={f.title} className="module flex flex-col gap-2 p-5">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand-ink">{f.icon}</span>
            <h2 className="font-black">{f.title}</h2>
            <p className="text-sm text-muted">{f.text}</p>
          </li>
        ))}
      </ul>
      <footer className="py-4 text-center text-xs text-muted">App privada, solo con invitación. Las grabaciones de voz nunca salen de tu dispositivo.</footer>
    </main>
  );
}
