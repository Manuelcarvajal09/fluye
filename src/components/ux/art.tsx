/** Monta un SVG del arte de UX en línea (contenido propio, generado y validado por scripts/build-ux-art.mjs). */
export function UxArt({ svg, className = "" }: { svg?: string; className?: string }) {
  if (!svg) return null;
  return <span className={`ux-art ${className}`} dangerouslySetInnerHTML={{ __html: svg }} />;
}

/** Variante clara y oscura: el CSS muestra la del tema activo. */
export function UxThemed({ light, dark, className = "" }: { light?: string; dark?: string; className?: string }) {
  return (
    <>
      <UxArt svg={light} className={`ux-light ${className}`} />
      <UxArt svg={dark ?? light} className={`ux-dark ${className}`} />
    </>
  );
}
