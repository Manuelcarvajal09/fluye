"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, Loader2, Trash2 } from "lucide-react";
import { ACTIVITIES, MOODS, type Prompt } from "@/lib/journal-prompts";

type Entry = { day: string; mood: number | null; activities: string[]; answers: Record<string, string>; englishLine: string; learned: string; photos: { id: string; w: number; h: number }[] };
export const MOOD_FACE = ["", "😞", "🙁", "😐", "🙂", "😄"];

/** Comprime en el navegador: WebP de 1280 px como máximo y ≤ 400 KB (baja la calidad si hace falta). */
async function compress(file: File): Promise<{ data: string; w: number; h: number; mime: "image/webp" }> {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.drawImage(bmp, 0, 0, w, h);
  let blob: Blob | null = null;
  for (const q of [0.82, 0.7, 0.55, 0.4]) {
    blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", q));
    if (blob && blob.size <= 400_000) break;
  }
  if (!blob || blob.size > 400_000) throw new Error("La foto es demasiado grande incluso comprimida.");
  const data = await new Promise<string>((res) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result).split(",")[1]);
    fr.readAsDataURL(blob!);
  });
  return { data, w, h, mime: "image/webp" };
}

/** Entrada del diario de un día: ánimo, actividades, preguntas opcionales, inglés, lo aprendido y fotos. Se guarda sola. */
export function JournalToday({ initial, prompts, studied, readOnly = false }: { initial: Entry; prompts: Prompt[]; studied: string; readOnly?: boolean }) {
  const router = useRouter();
  const [e, setE] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [photoMsg, setPhotoMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const first = useRef(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<Entry>) => setE((x) => ({ ...x, ...p }));

  async function persist() {
    setStatus("saving");
    try {
      const r = await fetch("/api/journal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "save", day: e.day, mood: e.mood, activities: e.activities, answers: e.answers, englishLine: e.englishLine, learned: e.learned }) });
      if (!r.ok) throw new Error();
      setStatus("saved");
    } catch {
      setStatus("error");
    }
  }
  useEffect(() => {
    if (readOnly) return;
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => void persist(), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [e.mood, e.activities, e.answers, e.englishLine, e.learned]);

  async function addPhoto(file: File) {
    setPhotoMsg(null);
    setUploading(true);
    try {
      const p = await compress(file);
      const r = await fetch("/api/journal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "photo", day: e.day, ...p }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error ?? "No se pudo subir la foto.");
      set({ photos: [...e.photos, { id: j.id, w: p.w, h: p.h }] });
      router.refresh();
    } catch (err) {
      setPhotoMsg(err instanceof Error ? err.message : "No se pudo subir la foto.");
    } finally {
      setUploading(false);
    }
  }
  async function removePhoto(id: string) {
    await fetch("/api/journal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "delete-photo", id }) });
    set({ photos: e.photos.filter((p) => p.id !== id) });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="module flex flex-col gap-3 p-5" aria-labelledby="animo">
        <h2 id="animo" className="text-lg font-black">¿Cómo estuvo tu día?</h2>
        <div className="flex justify-between gap-1" role="radiogroup" aria-label="Ánimo">
          {MOODS.map((m) => (
            <button key={m.id} type="button" role="radio" aria-checked={e.mood === m.id} disabled={readOnly} onClick={() => set({ mood: e.mood === m.id ? null : m.id })} className={`flex flex-1 flex-col items-center gap-1 rounded-[var(--r-md)] p-2 text-xs font-bold transition-transform active:scale-95 ${e.mood === m.id ? "bg-brand-soft text-brand-ink ring-2 ring-brand" : "bg-surface-2 text-muted"}`}>
              <span className="text-3xl" aria-hidden>
                {MOOD_FACE[m.id]}
              </span>
              {m.es}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Qué hiciste">
          {ACTIVITIES.map((a) => {
            const on = e.activities.includes(a.id);
            return (
              <button key={a.id} type="button" disabled={readOnly} aria-pressed={on} onClick={() => set({ activities: on ? e.activities.filter((x) => x !== a.id) : [...e.activities, a.id] })} className={`chip-btn ${on ? "is-on" : ""}`}>
                {a.es}
              </button>
            );
          })}
        </div>
      </section>

      <section className="module flex flex-col gap-3 p-5" aria-labelledby="ingles">
        <h2 id="ingles" className="text-lg font-black">Tu inglés de hoy</h2>
        <p className="rounded-[var(--r-md)] bg-surface-2 px-3 py-2 text-sm font-bold">{studied}</p>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">Una frase en inglés sobre tu día</span>
          <input lang="en" value={e.englishLine} disabled={readOnly} onChange={(x) => set({ englishLine: x.target.value })} maxLength={400} placeholder="Today I…" className="h-12 rounded-[var(--r-md)] border border-line bg-surface px-3 font-semibold outline-none focus:border-accent" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">¿Qué aprendiste o qué te costó?</span>
          <textarea value={e.learned} disabled={readOnly} onChange={(x) => set({ learned: x.target.value })} maxLength={600} rows={2} className="rounded-[var(--r-md)] border border-line bg-surface p-3 font-semibold outline-none focus:border-accent" />
        </label>
      </section>

      {prompts.length > 0 && (
        <section className="module flex flex-col gap-3 p-5" aria-labelledby="preguntas">
          <h2 id="preguntas" className="text-lg font-black">
            Preguntas de hoy <span className="text-sm font-bold text-muted">(opcionales)</span>
          </h2>
          {prompts.map((p) => (
            <label key={p.id} className="flex flex-col gap-1.5">
              <span className="text-sm font-bold">
                {p.es}
                {p.en && (
                  <span className="block text-xs text-muted" lang="en">
                    {p.en}
                  </span>
                )}
              </span>
              <input value={e.answers[p.id] ?? ""} disabled={readOnly} onChange={(x) => set({ answers: { ...e.answers, [p.id]: x.target.value } })} maxLength={400} className="h-11 rounded-[var(--r-md)] border border-line bg-surface px-3 font-semibold outline-none focus:border-accent" />
            </label>
          ))}
        </section>
      )}

      <section className="module flex flex-col gap-3 p-5" aria-labelledby="fotos">
        <h2 id="fotos" className="text-lg font-black">Fotos del día</h2>
        <p className="text-xs text-muted">Hasta 3. Se comprimen en tu teléfono antes de subir y solo tú puedes verlas.</p>
        <div className="grid grid-cols-3 gap-2">
          {e.photos.map((p) => (
            <figure key={p.id} className="relative overflow-hidden rounded-[var(--r-md)] bg-surface-2" style={{ aspectRatio: `${p.w} / ${p.h}` }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- foto privada servida por la API */}
              <img src={`/api/journal/photo/${p.id}`} alt="Foto del diario" className="h-full w-full object-cover" loading="lazy" />
              {!readOnly && (
                <button type="button" onClick={() => void removePhoto(p.id)} className="absolute right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-surface/90" aria-label="Quitar foto">
                  <Trash2 size={15} aria-hidden />
                </button>
              )}
            </figure>
          ))}
          {!readOnly && e.photos.length < 3 && (
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="grid aspect-square place-items-center rounded-[var(--r-md)] border-2 border-dashed border-line text-muted">
              {uploading ? <Loader2 size={24} className="animate-spin" aria-hidden /> : <Camera size={26} aria-hidden />}
              <span className="sr-only">Añadir foto</span>
            </button>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(x) => {
            const f = x.target.files?.[0];
            x.target.value = "";
            if (f) void addPhoto(f);
          }}
        />
        {photoMsg && (
          <p role="alert" className="text-sm font-bold text-bad">
            {photoMsg}
          </p>
        )}
      </section>

      {!readOnly && (
        <p role="status" aria-live="polite" className={`flex items-center gap-2 text-sm font-bold ${status === "error" ? "text-bad" : "text-muted"}`}>
          {status === "saving" && "Guardando…"}
          {status === "saved" && (
            <>
              <Check size={16} aria-hidden /> Guardado
            </>
          )}
          {status === "error" && (
            <>
              No se pudo guardar. Revisa tu conexión.
              <button type="button" className="btn btn-ghost h-9 px-3 text-sm" onClick={() => void persist()}>
                Reintentar
              </button>
            </>
          )}
        </p>
      )}
    </div>
  );
}
