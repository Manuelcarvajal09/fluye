"use client";
import { useEffect } from "react";
import { EmptyArt } from "@/components/ux/EmptyArt";

/** Si una sección no carga (sin conexión o fallo del servidor): qué pasó y cómo seguir, sin perder la navegación. */
export default function SectionError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="empty-state">
      <EmptyArt kind="error-conexion" mood="oops" />
      <h1 className="font-display text-2xl font-extrabold">No pudimos cargar esta sección</h1>
      <p className="max-w-sm text-muted">Puede ser la conexión. Tu progreso está guardado; vuelve a intentarlo en un momento.</p>
      <button type="button" className="btn btn-primary" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
