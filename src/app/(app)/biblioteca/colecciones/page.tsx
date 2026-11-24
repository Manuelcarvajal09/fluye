import Link from "next/link";
import { ArrowLeft, Layers, Play } from "lucide-react";
import { requireProfile } from "@/lib/user";
import { collectionsOf } from "@/lib/collections";
import { NewCollection } from "@/components/CollectionTools";
import { MyMascot } from "@/components/Coach";

export const metadata = { title: "Mis colecciones" };

export default async function Collections() {
  const profile = await requireProfile();
  const cols = await collectionsOf(profile.userId);
  return (
    <div className="flex flex-col gap-6">
      <header>
        <Link href="/biblioteca" className="flex items-center gap-1 text-sm font-extrabold text-muted hover:text-text">
          <ArrowLeft size={16} aria-hidden /> Biblioteca
        </Link>
        <h1 className="font-display text-4xl font-extrabold">Mis colecciones</h1>
        <p className="mt-1 max-w-prose text-muted">Junta las palabras y expresiones que tú elijas —de una canción, una serie o para una entrevista— y estudia solo esas. Usan tus mismas tarjetas: nada se duplica.</p>
      </header>
      <NewCollection />
      {cols.length ? (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {cols.map((c) => (
            <li key={c.id} className="module flex flex-col gap-3 p-5">
              <Link href={`/biblioteca/colecciones/${c.id}`} className="min-w-0">
                <span className="block truncate font-display text-2xl font-extrabold">{c.name}</span>
                <span className="text-sm text-muted">
                  {c.n} {c.n === 1 ? "entrada" : "entradas"} · {c.active} en estudio{c.due ? ` · ${c.due} repasos listos` : ""}
                </span>
              </Link>
              <div className="mt-auto flex flex-wrap gap-2">
                <Link href={`/sesion?coleccion=${c.id}`} className="btn btn-primary h-11 min-h-11 grow" aria-label={`Estudiar la colección ${c.name}`}>
                  <Play size={16} fill="currentColor" aria-hidden /> Estudiar
                </Link>
                <Link href={`/repaso?coleccion=${c.id}`} className="btn btn-ghost h-11 min-h-11" aria-label={`Repasar tarjetas de ${c.name}`}>
                  <Layers size={16} aria-hidden /> Tarjetas
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty-state">
          <MyMascot mood="think" size={110} />
          <h2 className="font-display text-2xl font-extrabold">Aún no tienes colecciones</h2>
          <p className="max-w-sm text-muted">Crea una arriba, o entra a la biblioteca, toca «Seleccionar varias» y agrúpalas.</p>
          <Link href="/biblioteca" className="btn btn-primary">
            Buscar en la biblioteca
          </Link>
        </div>
      )}
    </div>
  );
}
