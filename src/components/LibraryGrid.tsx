"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, FolderPlus, Layers, Loader2, Pause, Play, Plus, X } from "lucide-react";

export type GridItem = { id: string; term: string; es: string; chips: string[]; status: "new" | "learning" | "mastered" | "suspended"; tone?: "bad" };
export type GridCollection = { id: string; name: string; n: number };

const STATUS: Record<GridItem["status"], { label: string; cls: string }> = {
  new: { label: "Disponible", cls: "" },
  learning: { label: "En estudio", cls: "bg-accent-soft text-accent" },
  mastered: { label: "Consolidada", cls: "bg-good-soft text-good" },
  suspended: { label: "En pausa", cls: "bg-fire-soft text-fire" },
};

/**
 * Lista de la biblioteca con selección múltiple. Las acciones en lote usan las entradas canónicas:
 * añadir a repasos crea sus tarjetas FSRS una sola vez; las colecciones solo las agrupan.
 */
export function LibraryGrid({ items, collections, inCollection }: { items: GridItem[]; collections: GridCollection[]; inCollection?: string }) {
  const router = useRouter();
  const [picking, setPicking] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [name, setName] = useState("");

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  async function call(body: object, done: (j: { added?: number; id?: string }) => string) {
    setBusy(true);
    const r = await fetch("/api/collections", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setMenu(false);
    setMsg(r.ok ? done(j) : (j.error ?? "No se pudo completar."));
    if (r.ok) {
      setSel(new Set());
      setPicking(false);
      router.refresh();
    }
  }
  const ids = [...sel];
  const all = items.length > 0 && items.every((i) => sel.has(i.id));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={`chip-btn ${picking ? "is-on" : ""}`} aria-pressed={picking} onClick={() => (setPicking((v) => !v), setSel(new Set()))}>
          <Check size={15} aria-hidden /> {picking ? "Cancelar selección" : "Seleccionar varias"}
        </button>
        {picking && (
          <button type="button" className="chip-btn" onClick={() => setSel(all ? new Set() : new Set(items.map((i) => i.id)))}>
            {all ? "Quitar todas" : `Seleccionar las ${items.length} de esta página`}
          </button>
        )}
        {msg && (
          <p role="status" className="text-sm font-bold text-brand-ink">
            {msg}
          </p>
        )}
      </div>

      <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 3xl:grid-cols-4">
        {items.map((i) => {
          const on = sel.has(i.id);
          const st = STATUS[i.status];
          const body = (
            <>
              <span className="flex items-center gap-1.5">
                {picking && (
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg border-2 ${on ? "border-brand bg-brand text-white" : "border-line bg-surface"}`} aria-hidden>
                    {on && <Check size={15} strokeWidth={3.5} />}
                  </span>
                )}
                {i.chips.map((c) => (
                  <span key={c} className={`chip ${i.tone === "bad" && c === i.chips[i.chips.length - 1] ? "bg-bad-soft text-bad" : ""}`}>
                    {c}
                  </span>
                ))}
                {i.status !== "new" && <span className={`chip ml-auto ${st.cls}`}>{st.label}</span>}
              </span>
              <span className="text-lg font-black leading-snug" lang="en">
                {i.term}
              </span>
              <span className="text-sm text-muted">{i.es}</span>
            </>
          );
          return (
            <li key={i.id}>
              {picking ? (
                <button type="button" role="checkbox" aria-checked={on} onClick={() => toggle(i.id)} className={`module flex h-full w-full flex-col gap-1.5 p-3.5 text-left ${on ? "!border-brand bg-brand-soft/40" : ""}`}>
                  {body}
                </button>
              ) : (
                <Link href={`/biblioteca/${i.id}`} className="module flex h-full flex-col gap-1.5 p-3.5">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {picking && sel.size > 0 && (
        <div className="selection-bar" role="region" aria-label="Acciones para la selección">
          <p className="font-black">
            {sel.size} {sel.size === 1 ? "seleccionada" : "seleccionadas"}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="btn btn-primary h-11 min-h-11" disabled={busy} onClick={() => call({ action: "activate", items: ids }, (j) => (j.added ? `${j.added} añadidas a tus repasos.` : "Ya estaban en tus repasos."))}>
              {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Layers size={16} aria-hidden />} A mis repasos
            </button>
            <div className="relative">
              <button type="button" className="btn btn-ghost h-11 min-h-11" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
                <FolderPlus size={16} aria-hidden /> A una colección
              </button>
              {menu && (
                <div className="popover" role="menu">
                  {collections
                    .filter((c) => c.id !== inCollection)
                    .map((c) => (
                      <button key={c.id} type="button" role="menuitem" className="popover-item" onClick={() => call({ action: "add", id: c.id, items: ids }, (j) => `${j.added ?? 0} añadidas a «${c.name}».`)}>
                        {c.name} <span className="text-muted">{c.n}</span>
                      </button>
                    ))}
                  <form
                    className="flex gap-2 border-t border-line p-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (name.trim()) void call({ action: "create", name: name.trim(), items: ids }, () => `Colección «${name.trim()}» creada con ${ids.length}.`);
                    }}
                  >
                    <label className="sr-only" htmlFor="newcol">
                      Nombre de la colección nueva
                    </label>
                    <input id="newcol" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Nueva colección…" className="h-10 min-w-0 flex-1 rounded-[var(--r-sm)] border border-line bg-surface px-3 text-sm font-bold" />
                    <button className="btn btn-primary h-10 min-h-10 px-3" aria-label="Crear colección con la selección">
                      <Plus size={16} aria-hidden />
                    </button>
                  </form>
                </div>
              )}
            </div>
            {inCollection && (
              <button type="button" className="btn btn-ghost h-11 min-h-11" disabled={busy} onClick={() => call({ action: "remove", id: inCollection, items: ids }, () => "Quitadas de la colección (su progreso se conserva).")}>
                <X size={16} aria-hidden /> Quitar de aquí
              </button>
            )}
            <button type="button" className="btn btn-ghost h-11 min-h-11" disabled={busy} onClick={() => call({ action: "suspend", items: ids }, () => "En pausa: no saldrán en repasos hasta que las reactives.")} aria-label="Pausar tarjetas">
              <Pause size={16} aria-hidden /> Pausar
            </button>
            <button type="button" className="btn btn-ghost h-11 min-h-11" disabled={busy} onClick={() => call({ action: "resume", items: ids }, () => "Reactivadas.")} aria-label="Reanudar tarjetas">
              <Play size={16} aria-hidden /> Reanudar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
