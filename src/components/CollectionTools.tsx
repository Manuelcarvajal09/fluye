"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, FolderPlus, Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";

const post = (body: object) => fetch("/api/collections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** Crear una colección vacía o importar una desde archivo (solo nombre e ids de entradas; sin datos personales). */
export function NewCollection() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  async function importFile(f: File) {
    setBusy(true);
    let data: unknown = null;
    try {
      data = JSON.parse(await f.text());
    } catch {}
    const r = await post({ action: "import", data });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setMsg(r.ok ? `Importada: ${j.added} entradas${j.skipped ? ` (${j.skipped} no existen en esta versión y se omitieron)` : ""}.` : "El archivo no es una colección de Fluye válida.");
    router.refresh();
  }
  return (
    <div className="module flex flex-col gap-3 p-4">
      <form
        className="flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          setBusy(true);
          const r = await post({ action: "create", name: name.trim() });
          const j = await r.json().catch(() => ({}));
          setBusy(false);
          if (r.ok) router.push(`/biblioteca/colecciones/${j.id}`);
          else setMsg(j.error ?? "No se pudo crear.");
        }}
      >
        <label className="sr-only" htmlFor="colname">
          Nombre de la colección
        </label>
        <input id="colname" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Nombre: Entrevista, Suits, Viaje a Banff…" className="h-12 min-w-0 flex-1 rounded-[var(--r-md)] border border-line bg-surface px-4 font-bold outline-none focus:border-accent" />
        <button className="btn btn-primary" disabled={busy || !name.trim()}>
          {busy ? <Loader2 size={18} className="animate-spin" aria-hidden /> : <Plus size={18} aria-hidden />} Crear
        </button>
      </form>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" className="chip-btn" onClick={() => file.current?.click()}>
          <Upload size={15} aria-hidden /> Importar colección (.json)
        </button>
        <input ref={file} type="file" accept="application/json,.json" className="hidden" onChange={(e) => e.target.files?.[0] && importFile(e.target.files[0])} />
        {msg && (
          <p role="status" className="font-bold text-brand-ink">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}

/** Renombrar, exportar o borrar una colección (borrar no elimina tarjetas ni historial). */
export function CollectionActions({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(name);
  return (
    <div className="flex flex-wrap items-center gap-2">
      {editing ? (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            await post({ action: "rename", id, name: v.trim() || name });
            setEditing(false);
            router.refresh();
          }}
        >
          <label className="sr-only" htmlFor="rename">
            Nuevo nombre
          </label>
          <input id="rename" value={v} onChange={(e) => setV(e.target.value)} maxLength={60} className="h-10 rounded-[var(--r-sm)] border border-line bg-surface px-3 font-bold" />
          <button className="chip-btn is-on">
            <Check size={15} aria-hidden /> Guardar
          </button>
        </form>
      ) : (
        <button type="button" className="chip-btn" onClick={() => setEditing(true)}>
          <Pencil size={15} aria-hidden /> Renombrar
        </button>
      )}
      <a className="chip-btn" href={`/api/collections?export=${id}`} download>
        <Download size={15} aria-hidden /> Exportar
      </a>
      <button
        type="button"
        className="chip-btn"
        onClick={async () => {
          if (!confirm(`¿Borrar la colección «${name}»? Tus tarjetas y su progreso se conservan.`)) return;
          await post({ action: "delete", id });
          router.push("/biblioteca/colecciones");
          router.refresh();
        }}
      >
        <Trash2 size={15} aria-hidden /> Borrar
      </button>
    </div>
  );
}

/** En la ficha de una entrada: en qué colecciones está y añadirla o quitarla con un toque. */
export function AddToCollection({ itemId, collections, mine }: { itemId: string; collections: { id: string; name: string }[]; mine: string[] }) {
  const router = useRouter();
  const [inside, setInside] = useState(new Set(mine));
  const [name, setName] = useState("");
  async function toggle(id: string) {
    const has = inside.has(id);
    setInside((s) => {
      const n = new Set(s);
      if (has) n.delete(id);
      else n.add(id);
      return n;
    });
    await post({ action: has ? "remove" : "add", id, items: [itemId] });
    router.refresh();
  }
  return (
    <div className="flex flex-col gap-2 rounded-[var(--r-md)] bg-surface-2 p-4">
      <p className="flex items-center gap-2 font-black">
        <FolderPlus size={18} aria-hidden /> Mis colecciones
      </p>
      <div className="flex flex-wrap gap-2">
        {collections.map((c) => (
          <button key={c.id} type="button" aria-pressed={inside.has(c.id)} className={`chip-btn ${inside.has(c.id) ? "is-on" : ""}`} onClick={() => toggle(c.id)}>
            {inside.has(c.id) && <Check size={14} aria-hidden />} {c.name}
          </button>
        ))}
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!name.trim()) return;
            await post({ action: "create", name: name.trim(), items: [itemId] });
            setName("");
            router.refresh();
          }}
        >
          <label className="sr-only" htmlFor="quickcol">
            Nueva colección
          </label>
          <input id="quickcol" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Nueva colección…" className="h-10 w-44 rounded-full border border-line bg-surface px-4 text-sm font-bold" />
          <button className="chip-btn" aria-label="Crear colección con esta entrada">
            <Plus size={15} aria-hidden />
          </button>
        </form>
      </div>
      <p className="text-xs text-muted">Una entrada puede estar en varias colecciones; su progreso es uno solo.</p>
    </div>
  );
}
