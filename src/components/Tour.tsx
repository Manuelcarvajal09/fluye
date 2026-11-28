"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MyMascot, useLook } from "./Coach";
import { IcoCards, IcoFlame, IcoGem, IcoHeart, IcoPeople, IcoShop } from "./Icons";
import { MapIcon, Play } from "lucide-react";
import type { Mood } from "@/lib/wardrobe";

/**
 * Recorrido de bienvenida: cinco tarjetas cortas la primera vez que alguien llega a Hoy (después de las preguntas
 * iniciales). Se puede saltar en cualquier momento y volver a ver desde el Perfil. No bloquea nada: es un diálogo.
 */
type Slide = { mood: Mood; title: string; text: string; points: { icon: React.ReactNode; text: string }[] };

export function Tour({ auto, minutes = 5 }: { auto: boolean; minutes?: number }) {
  const router = useRouter();
  const look = useLook();
  const [open, setOpen] = useState(auto);
  const [i, setI] = useState(0);
  const next = useRef<HTMLButtonElement>(null);
  const slides: Slide[] = [
    {
      mood: "happy",
      title: `¡Hola! Soy ${look.name}`,
      text: "Te acompaño a aprender inglés para la vida real. En un minuto te enseño cómo funciona Fluye.",
      points: [{ icon: <Play size={18} fill="currentColor" aria-hidden />, text: "El botón verde «Estudiar» siempre abre tu sesión del día. Con 5 o 10 minutos basta." }],
    },
    {
      mood: "think",
      title: "Tu sesión diaria",
      text: "Cada sesión mezcla expresiones nuevas con repasos. Lo que fallas vuelve pronto; lo que dominas, cada vez más espaciado.",
      points: [
        { icon: <IcoCards size={20} />, text: "Los repasos pendientes aparecen solos: no tienes que organizarlos." },
        { icon: <IcoHeart size={20} />, text: "Cada error en algo nuevo cuesta una vida. Las recuperas repasando o al día siguiente." },
      ],
    },
    {
      mood: "cheer",
      title: "Racha, gemas y liga",
      text: "La constancia cuenta más que la perfección.",
      points: [
        { icon: <IcoFlame size={20} />, text: "Cumple tu meta diaria para mantener la racha." },
        { icon: <IcoGem size={20} />, text: "Ganas gemas al estudiar y cumplir retos; con ellas abres cofres y vistes a tu mascota." },
        { icon: <IcoPeople size={20} />, text: "Cada semana compites en una liga y puedes mandar regalos a tus amistades." },
      ],
    },
    {
      mood: "wow",
      title: "Tu viaje y Explorar",
      text: "Todo el contenido está ordenado por nivel, de A1 a C2.",
      points: [
        { icon: <MapIcon size={18} aria-hidden />, text: "«Tu viaje» es el mapa: lecciones, misiones, conversaciones y lecturas, con un cofre al final de cada sección." },
        { icon: <IcoShop size={20} />, text: "En Explorar hay entrevistas de trabajo, pronunciación, gramática, lecturas, tu diario y más." },
      ],
    },
    {
      mood: "proud",
      title: "¡Listo para empezar!",
      text: "La campana de arriba te avisa de regalos, la liga y recordatorios. Si algo no queda claro, este recorrido está en tu Perfil.",
      points: [{ icon: <Play size={18} fill="currentColor" aria-hidden />, text: "Empieza con tu primera sesión: hoy tienes doble XP durante 15 minutos." }],
    },
  ];
  const s = slides[i];
  const last = i === slides.length - 1;

  useEffect(() => {
    if (open) next.current?.focus();
  }, [open, i]);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && finish(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function finish(start: boolean) {
    setOpen(false);
    void fetch("/api/profile", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ settings: { tour: true } }) }).catch(() => {});
    if (start) router.push(`/sesion?min=${minutes}`);
    else router.replace("/hoy");
  }

  if (!open) return null;
  return (
    <div className="scene-backdrop" role="dialog" aria-modal="true" aria-labelledby="tour-title">
      <div className="tour-card">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex gap-1.5" aria-label={`Paso ${i + 1} de ${slides.length}`}>
            {slides.map((_, n) => (
              <li key={n} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-brand" : n < i ? "w-3 bg-brand/50" : "w-3 bg-line"}`} />
            ))}
          </ol>
          {!last && (
            <button type="button" className="text-sm font-extrabold text-muted underline-offset-4 hover:underline" onClick={() => finish(false)}>
              Saltar
            </button>
          )}
        </div>
        <div key={i} className="fade-up flex flex-col items-center gap-3 text-center">
          <MyMascot size={120} mood={s.mood} />
          <h2 id="tour-title" className="font-display text-2xl font-extrabold">
            {s.title}
          </h2>
          <p className="max-w-sm text-muted">{s.text}</p>
          <ul className="flex w-full flex-col gap-2 text-left">
            {s.points.map((p) => (
              <li key={p.text} className="flex items-start gap-3 rounded-[var(--r-md)] bg-surface-2 p-3 text-sm">
                <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-ink">{p.icon}</span>
                <span>{p.text}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2">
          {i > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setI(i - 1)}>
              Atrás
            </button>
          )}
          {last ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => finish(false)}>
                Ver la app
              </button>
              <button ref={next} type="button" className="btn btn-primary flex-1" onClick={() => finish(true)}>
                Empezar mi primera sesión
              </button>
            </>
          ) : (
            <button ref={next} type="button" className="btn btn-primary flex-1" onClick={() => setI(i + 1)}>
              Siguiente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
