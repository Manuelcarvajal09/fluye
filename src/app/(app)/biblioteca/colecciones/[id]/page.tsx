import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, Play, Search } from "lucide-react";
import { requireProfile, settingsOf } from "@/lib/user";
import { collectionOf, collectionsOf } from "@/lib/collections";
import { getItem } from "@/lib/content";
import { itemStatus } from "@/lib/stats";
import { TYPE_LABEL } from "@/lib/types";
import { maskExplicit } from "@/lib/realtalk";
import { LibraryGrid } from "@/components/LibraryGrid";
import { CollectionActions } from "@/components/CollectionTools";

export const metadata = { title: "Colección" };

export default async function CollectionPage({ params }: PageProps<"/biblioteca/colecciones/[id]">) {
  const profile = await requireProfile();
  const col = await collectionOf(profile.userId, (await params).id);
  if (!col) notFound();
  const [statuses, cols] = await Promise.all([itemStatus(profile.userId), collectionsOf(profile.userId)]);
  const explicit = settingsOf(profile).explicit === true;
  const items = col.items.map(getItem).filter((x) => !!x);
  const active = items.filter((i) => statuses.has(i.id)).length;
  return (
    <div className="flex flex-col gap-5">
      <Link href="/biblioteca/colecciones" className="flex items-center gap-1 text-sm font-extrabold text-muted hover:text-text">
        <ArrowLeft size={16} aria-hidden /> Mis colecciones
      </Link>
      <header className="hero-card flex flex-col gap-4 p-6">
        <div>
          <h1 className="font-display text-4xl font-extrabold">{col.name}</h1>
          <p className="text-muted">
            {items.length} {items.length === 1 ? "entrada" : "entradas"} · {active} en estudio · {items.length - active} disponibles sin activar
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/sesion?coleccion=${col.id}`} className="btn btn-primary">
            <Play size={18} fill="currentColor" aria-hidden /> Estudiar esta colección
          </Link>
          <Link href={`/repaso?coleccion=${col.id}`} className="btn btn-ghost">
            <Layers size={18} aria-hidden /> Repasar en tarjetas
          </Link>
          <Link href={`/repaso?coleccion=${col.id}&adelantar=1`} className="btn btn-ghost">
            Practicar aunque no venzan
          </Link>
        </div>
        <CollectionActions id={col.id} name={col.name} />
      </header>
      {items.length ? (
        <LibraryGrid
          inCollection={col.id}
          collections={cols.map((c) => ({ id: c.id, name: c.name, n: c.n }))}
          items={items.map((i) => ({ id: i.id, term: maskExplicit(i.term, explicit), es: maskExplicit(i.es, explicit), chips: [TYPE_LABEL[i.type], i.level], status: statuses.get(i.id) ?? "new" }))}
        />
      ) : (
        <div className="empty-state">
          <h2 className="font-display text-2xl font-extrabold">Colección vacía</h2>
          <p className="max-w-sm text-muted">Busca palabras o expresiones y añádelas desde su ficha, o selecciona varias en la biblioteca.</p>
          <Link href="/biblioteca" className="btn btn-primary">
            <Search size={18} aria-hidden /> Buscar para añadir
          </Link>
        </div>
      )}
    </div>
  );
}
