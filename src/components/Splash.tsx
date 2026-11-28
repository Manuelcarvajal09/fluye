/**
 * Pantalla de apertura: el isotipo se dibuja (las dos ondas fluyen) mientras llegan los datos del día.
 * Sin JavaScript ni datos: se envía con el primer byte. El texto solo aparece si la espera se alarga.
 */
export function Splash() {
  return (
    <div className="splash" role="status" aria-live="polite">
      <svg className="splash-logo" width="88" height="88" viewBox="0 0 64 64" aria-hidden="true">
        <rect className="splash-base" width="64" height="64" rx="18" fill="var(--brand)" />
        <path className="splash-wave splash-wave-2" d="M14 24c6-10 12-10 18 0s12 10 18 0" stroke="#fff" strokeOpacity=".55" strokeWidth="6" fill="none" strokeLinecap="round" pathLength={1} />
        <path className="splash-wave splash-wave-1" d="M14 38c6-10 12-10 18 0s12 10 18 0" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" pathLength={1} />
      </svg>
      <span className="splash-name">Fluye</span>
      <span className="splash-hint">Preparando tu día…</span>
    </div>
  );
}
