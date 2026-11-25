// Iconos ilustrados de Fluye: rellenos, a color, con sombra y brillo (sin contornos), a juego con las mascotas.
// Cada sección y cada contador tiene el suyo. Son decorativos: el texto accesible va en el elemento que los contiene.
import type { ReactNode } from "react";

type P = { size?: number; className?: string };
const Svg = ({ size = 28, className = "", children }: P & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={`shrink-0 ${className}`}>
    {children}
  </svg>
);

/** Racha */
export const IcoFlame = (p: P) => (
  <Svg {...p}>
    <path d="M16 2C17 8 24 11 24 19A8 8 0 0 1 8 19C8 15 10 13 11 10C12 13 14 13 14 10C14 7 15 4 16 2Z" fill="#ff8a1f" />
    <path d="M16 2C17 8 24 11 24 19A8 8 0 0 1 16 27Z" fill="#f2670f" />
    <path d="M16 14C17 17 20 18 20 21.500A4 4 0 0 1 12 21.500C12 19 14 17.500 16 14Z" fill="#ffd34d" />
  </Svg>
);
/** Racha apagada (sin días seguidos) */
export const IcoFlameOff = (p: P) => (
  <Svg {...p}>
    <path d="M16 2C17 8 24 11 24 19A8 8 0 0 1 8 19C8 15 10 13 11 10C12 13 14 13 14 10C14 7 15 4 16 2Z" fill="#c9c3d6" />
    <path d="M16 14C17 17 20 18 20 21.500A4 4 0 0 1 12 21.500C12 19 14 17.500 16 14Z" fill="#e6e1ef" />
  </Svg>
);
/** Gemas */
export const IcoGem = (p: P) => (
  <Svg {...p}>
    <path d="M9 5h14l6 8-13 15L3 13z" fill="#7c6cf0" />
    <path d="M9 5h14l-7 8z" fill="#a99dff" />
    <path d="M3 13h26L16 28z" fill="#5b4bd6" />
    <path d="M9 5l7 8-13 0zM23 5l-7 8h13z" fill="#8f81f7" />
    <path d="M16 13L3 13l13 15z" fill="#6a5ae6" />
    <path d="M11 7.500l3 3.500" stroke="#fff" strokeOpacity=".7" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** XP */
export const IcoBolt = (p: P) => (
  <Svg {...p}>
    <path d="M18 2L6 18h8l-2 12 14-17h-9z" fill="#ffc21a" />
    <path d="M18 2l-1 11h9L12 30l2-12z" fill="#ffab00" />
    <path d="M16 6l-6 9" stroke="#fff" strokeOpacity=".6" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** Ánimo / aciertos seguidos */
export const IcoHeart = (p: P) => (
  <Svg {...p}>
    <path d="M16 28C4 20 2 12 6 7.500C9 4 14 5 16 9C18 5 23 4 26 7.500C30 12 28 20 16 28Z" fill="#ff5a79" />
    <path d="M16 28C28 20 30 12 26 7.500C23 4 18 5 16 9Z" fill="#ea3d60" />
    <ellipse cx="10" cy="11" rx="3" ry="2" fill="#fff" opacity=".55" transform="rotate(-30 10 11)" />
  </Svg>
);
/** Hoy */
export const IcoHome = (p: P) => (
  <Svg {...p}>
    <path d="M4 15L16 4l12 11v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#ffb347" />
    <path d="M16 4l12 11v11a2 2 0 0 1-2 2H16z" fill="#f59a1c" />
    <path d="M2 16L16 3l14 13" fill="none" stroke="#e8495a" strokeWidth="3.600" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="12.500" y="18" width="7" height="10" rx="2" fill="#7a4a2a" />
  </Svg>
);
/** Explorar */
export const IcoCompass = (p: P) => (
  <Svg {...p}>
    <circle cx="16" cy="16" r="13" fill="#22c79a" />
    <path d="M16 3a13 13 0 0 1 0 26z" fill="#0a8f65" />
    <circle cx="16" cy="16" r="9" fill="#fff" />
    <path d="M21.500 10.500L18 18l-7.500 3.500L14 14z" fill="#e8495a" />
    <path d="M10.500 21.500L14 14l4 4z" fill="#c9ced8" />
    <circle cx="16" cy="16" r="1.800" fill="#2b2238" />
  </Svg>
);
/** Progreso */
export const IcoChart = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="26" height="26" rx="7" fill="#e9e5ff" />
    <rect x="7.500" y="17" width="4.500" height="8" rx="2" fill="#b9adf7" />
    <rect x="13.800" y="12" width="4.500" height="13" rx="2" fill="#7c6cf0" />
    <rect x="20" y="7" width="4.500" height="18" rx="2" fill="#5b4bd6" />
  </Svg>
);
/** Tienda */
export const IcoShop = (p: P) => (
  <Svg {...p}>
    <path d="M5 13h22v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z" fill="#fff3e2" />
    <path d="M3 6h26l1 6a4.400 4.400 0 0 1-8.700 0a4.400 4.400 0 0 1-8.600 0A4.400 4.400 0 0 1 2 12z" fill="#e8495a" />
    <path d="M11.700 6h8.600l1 6a4.400 4.400 0 0 1-8.600 0z" fill="#fff" />
    <rect x="13" y="18" width="6" height="10" rx="1.500" fill="#7c6cf0" />
    <rect x="7" y="17" width="4" height="5" rx="1" fill="#8fd0f7" />
    <rect x="21" y="17" width="4" height="5" rx="1" fill="#8fd0f7" />
  </Svg>
);
/** Biblioteca */
export const IcoBook = (p: P) => (
  <Svg {...p}>
    <path d="M4 6a3 3 0 0 1 3-3h7v24H7a3 3 0 0 0-3 2z" fill="#58b4f5" />
    <path d="M28 6a3 3 0 0 0-3-3h-7v24h7a3 3 0 0 1 3 2z" fill="#3597e0" />
    <path d="M14 3h4v24h-4z" fill="#fff" opacity=".9" />
    <path d="M7 9h4M7 13h4M21 9h4M21 13h4" stroke="#fff" strokeOpacity=".8" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** Repaso / tarjetas */
export const IcoCards = (p: P) => (
  <Svg {...p}>
    <rect x="9" y="4" width="18" height="22" rx="4" fill="#b9adf7" transform="rotate(8 18 15)" />
    <rect x="5" y="6" width="18" height="22" rx="4" fill="#7c6cf0" />
    <path d="M10 13h8M10 17h5" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" />
    <circle cx="18" cy="23" r="2" fill="#ffd34d" />
  </Svg>
);
/** Conversaciones */
export const IcoChat = (p: P) => (
  <Svg {...p}>
    <path d="M12 12h14a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-1v4l-5-4h-8a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z" fill="#ffb347" />
    <path d="M6 3h13a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 4v-4H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z" fill="#22c79a" />
    <circle cx="9" cy="10" r="1.600" fill="#fff" />
    <circle cx="13" cy="10" r="1.600" fill="#fff" />
    <circle cx="17" cy="10" r="1.600" fill="#fff" />
  </Svg>
);
/** Pronunciación */
export const IcoMic = (p: P) => (
  <Svg {...p}>
    <rect x="11" y="2" width="10" height="17" rx="5" fill="#ff8fa8" />
    <path d="M16 2a5 5 0 0 1 5 5v7a5 5 0 0 1-5 5z" fill="#f06a8a" />
    <path d="M7 14a9 9 0 0 0 18 0" fill="none" stroke="#5a6072" strokeWidth="3" strokeLinecap="round" />
    <path d="M16 23v5M11 29h10" stroke="#5a6072" strokeWidth="3" strokeLinecap="round" />
    <path d="M14 6v4" stroke="#fff" strokeOpacity=".7" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** Música */
export const IcoMusic = (p: P) => (
  <Svg {...p}>
    <path d="M12 6l15-3v17" fill="none" stroke="#5b4bd6" strokeWidth="3.400" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 6v17" stroke="#5b4bd6" strokeWidth="3.400" strokeLinecap="round" />
    <ellipse cx="8.500" cy="24" rx="5" ry="4" fill="#7c6cf0" />
    <ellipse cx="23.500" cy="21" rx="5" ry="4" fill="#7c6cf0" />
  </Svg>
);
/** Retos / meta */
export const IcoTarget = (p: P) => (
  <Svg {...p}>
    <circle cx="15" cy="17" r="12" fill="#22c79a" />
    <circle cx="15" cy="17" r="8" fill="#fff" />
    <circle cx="15" cy="17" r="4" fill="#e8495a" />
    <path d="M15 17L26 6" stroke="#5a6072" strokeWidth="2.600" strokeLinecap="round" />
    <path d="M23 3l1 5 5 1-4 3-3-3z" fill="#ffc21a" />
  </Svg>
);
/** Logros */
export const IcoTrophy = (p: P) => (
  <Svg {...p}>
    <path d="M9 4h14v8a7 7 0 0 1-14 0z" fill="#ffc21a" />
    <path d="M16 4h7v8a7 7 0 0 1-7 7z" fill="#f5a400" />
    <path d="M9 6H4c0 6 3 8 6 8M23 6h5c0 6-3 8-6 8" fill="none" stroke="#f5a400" strokeWidth="2.800" strokeLinecap="round" />
    <rect x="14" y="19" width="4" height="5" fill="#f5a400" />
    <rect x="9" y="24" width="14" height="4" rx="2" fill="#7a4a2a" />
    <path d="M12 7v5" stroke="#fff" strokeOpacity=".65" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** Misiones por tema */
export const IcoMap = (p: P) => (
  <Svg {...p}>
    <path d="M3 8l8-3 10 3 8-3v19l-8 3-10-3-8 3z" fill="#bfe9d6" />
    <path d="M11 5l10 3v19l-10-3z" fill="#22c79a" />
    <path d="M7 19c3-4 7 2 10-3s5-2 8-5" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="2.500 3" strokeLinecap="round" />
    <path d="M22 5.500a4 4 0 0 1 4 4c0 3-4 6.500-4 6.500s-4-3.500-4-6.500a4 4 0 0 1 4-4z" fill="#e8495a" />
    <circle cx="22" cy="9.500" r="1.500" fill="#fff" />
  </Svg>
);
/** Perfil genérico (cuando no se muestra la mascota) */
export const IcoProfile = (p: P) => (
  <Svg {...p}>
    <circle cx="16" cy="16" r="13" fill="#ece9ff" />
    <circle cx="16" cy="12.500" r="5" fill="#7c6cf0" />
    <path d="M6.500 25a10 10 0 0 1 19 0a13 13 0 0 1-19 0z" fill="#7c6cf0" />
  </Svg>
);
/** Corregir / escribir */
export const IcoPencil = (p: P) => (
  <Svg {...p}>
    <path d="M21 3l8 8-16 16-9 2 1-10z" fill="#ffc21a" />
    <path d="M25 7l4 4-16 16-4-4z" fill="#f5a400" />
    <path d="M21 3l8 8-3 3-8-8z" fill="#ff8fa8" />
    <path d="M5 19l8 8-9 2z" fill="#f3d9b8" />
    <path d="M4 29l1.200-4.500 3.300 3.300z" fill="#2b2238" />
  </Svg>
);
/** Gramática */
export const IcoPuzzle = (p: P) => (
  <Svg {...p}>
    <path d="M4 9a2 2 0 0 1 2-2h6a3.500 3.500 0 1 1 6 0h6a2 2 0 0 1 2 2v6a3.500 3.500 0 1 0 0 6v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#22c79a" />
    <path d="M15 7h9a2 2 0 0 1 2 2v6a3.500 3.500 0 1 0 0 6v5a2 2 0 0 1-2 2h-9z" fill="#0a8f65" />
    <path d="M8 12h5" stroke="#fff" strokeOpacity=".7" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** Series */
export const IcoTv = (p: P) => (
  <Svg {...p}>
    <path d="M11 3l5 5 5-5" fill="none" stroke="#5a6072" strokeWidth="2.600" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="3" y="8" width="26" height="18" rx="5" fill="#5b4bd6" />
    <rect x="6" y="11" width="16" height="12" rx="3" fill="#8fd0f7" />
    <path d="M6 20l5-5 4 4 3-2 4 4v-1a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#58b4f5" />
    <circle cx="25.500" cy="14" r="1.500" fill="#ffd34d" />
    <circle cx="25.500" cy="19" r="1.500" fill="#fff" opacity=".7" />
    <path d="M9 29h14" stroke="#5a6072" strokeWidth="2.600" strokeLinecap="round" />
  </Svg>
);
/** Inglés real (picante) */
export const IcoPepper = (p: P) => (
  <Svg {...p}>
    <path d="M19 9c7 1 9 8 5 14s-12 7-20 5c7-2 10-6 11-11s1-8 4-8z" fill="#e8495a" />
    <path d="M22 10c5 2 6 8 2 13s-12 7-20 5c9-1 14-4 16-9s2-7 2-9z" fill="#c9304a" />
    <path d="M18 10c0-3 1-5 4-7" fill="none" stroke="#0a8f65" strokeWidth="3" strokeLinecap="round" />
    <path d="M15 9c2-2 6-2 9 1-3 1-6 1-9-1z" fill="#22c79a" />
    <path d="M17 14c-1 4-3 7-6 9" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** Protector de racha */
export const IcoIce = (p: P) => (
  <Svg {...p}>
    <path d="M16 2l11 4v9c0 7-5 12-11 15C10 27 5 22 5 15V6z" fill="#8fd0f7" />
    <path d="M16 2l11 4v9c0 7-5 12-11 15z" fill="#58b4f5" />
    <path d="M16 9v12M10.800 12l10.400 6M21.200 12l-10.400 6" stroke="#fff" strokeWidth="2.200" strokeLinecap="round" />
  </Svg>
);
/** Nuevo / destacado */
export const IcoStar = (p: P) => (
  <Svg {...p}>
    <path d="M16 2l4.300 8.800 9.700 1.400-7 6.800 1.700 9.600L16 24l-8.700 4.600L9 19l-7-6.800 9.700-1.400z" fill="#ffc21a" />
    <path d="M16 2l4.300 8.800 9.700 1.400-7 6.800 1.700 9.600L16 24z" fill="#f5a400" />
    <path d="M12 12l-4 .600" stroke="#fff" strokeOpacity=".7" strokeWidth="1.800" strokeLinecap="round" />
  </Svg>
);
/** Reloj / minutos */
export const IcoClock = (p: P) => (
  <Svg {...p}>
    <circle cx="16" cy="16" r="13" fill="#58b4f5" />
    <path d="M16 3a13 13 0 0 1 0 26z" fill="#3597e0" />
    <circle cx="16" cy="16" r="9.500" fill="#fff" />
    <path d="M16 10v6l4 3" fill="none" stroke="#2b2238" strokeWidth="2.400" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
/** Misiones: regalo (Navidad) */
export const IcoGift = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="13" width="24" height="16" rx="3" fill="#e8495a" />
    <rect x="16" y="13" width="12" height="16" fill="#c9304a" />
    <rect x="2" y="8" width="28" height="7" rx="2.500" fill="#ff7184" />
    <rect x="13.500" y="8" width="5" height="21" fill="#ffc21a" />
    <path d="M16 8C12 1 5 3 8 7c2 2 6 1 8 1zM16 8c4-7 11-5 8-1c-2 2-6 1-8 1z" fill="#ffc21a" />
  </Svg>
);
/** Misiones: invierno */
export const IcoSnow = (p: P) => (
  <Svg {...p}>
    <circle cx="16" cy="16" r="14" fill="#dff1fd" />
    <path d="M16 5v22M6.500 10.500l19 11M25.500 10.500l-19 11" stroke="#3597e0" strokeWidth="2.800" strokeLinecap="round" />
    <path d="M13 7l3 3 3-3M13 25l3-3 3 3" fill="none" stroke="#58b4f5" strokeWidth="2.200" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="16" cy="16" r="3" fill="#fff" />
  </Svg>
);
/** Misiones: aeropuerto */
export const IcoPlane = (p: P) => (
  <Svg {...p}>
    <path d="M29 4c-3-1-6 0-8 2l-4 4L5 7l-3 3 10 5-4 5-5-1-2 2 6 3 3 6 2-2-1-5 5-4 5 10 3-3-3-12 4-4c2-2 3-5 4-6z" fill="#58b4f5" />
    <path d="M29 4c-1 3-2 5-4 7l-4 4 3 12-3 3-5-10-5 4 1 5-2 2-3-6z" fill="#3597e0" />
  </Svg>
);
/** Misiones: cafetería */
export const IcoCoffee = (p: P) => (
  <Svg {...p}>
    <path d="M23 13h3a4 4 0 0 1 0 9h-3" fill="none" stroke="#c98d52" strokeWidth="3" />
    <path d="M5 11h19v9a8 8 0 0 1-8 8h-3a8 8 0 0 1-8-8z" fill="#fff3e2" />
    <path d="M14.500 11H24v9a8 8 0 0 1-8 8h-1.500z" fill="#f1dcc0" />
    <rect x="5" y="11" width="19" height="4" fill="#7a4a2a" />
    <path d="M10 7q-2-2 0-4M15 7q-2-2 0-4M20 7q-2-2 0-4" fill="none" stroke="#c9c3d6" strokeWidth="2.200" strokeLinecap="round" />
  </Svg>
);
/** Misiones: supermercado */
export const IcoCart = (p: P) => (
  <Svg {...p}>
    <path d="M2 4h4l1.500 5" fill="none" stroke="#5a6072" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 8h23l-3 12H10z" fill="#22c79a" />
    <path d="M18 8h12l-3 12h-9z" fill="#0a8f65" />
    <path d="M13 12v4M19 12v4M25 12v4" stroke="#fff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="26" r="3" fill="#2b2238" />
    <circle cx="25" cy="26" r="3" fill="#2b2238" />
  </Svg>
);
/** Misiones: entrevistas / trabajo */
export const IcoBriefcase = (p: P) => (
  <Svg {...p}>
    <path d="M11 9V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v3" fill="none" stroke="#7a4a2a" strokeWidth="3" />
    <rect x="3" y="9" width="26" height="19" rx="4" fill="#c98d52" />
    <path d="M16 9h9a4 4 0 0 1 4 4v11a4 4 0 0 1-4 4h-9z" fill="#a8703c" />
    <path d="M3 16c8 4 18 4 26 0" fill="none" stroke="#7a4a2a" strokeWidth="2.400" />
    <rect x="13.500" y="15" width="5" height="6" rx="1.500" fill="#ffc21a" />
  </Svg>
);
/** Misiones: transporte */
export const IcoBus = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="3" width="24" height="23" rx="5" fill="#ffc21a" />
    <path d="M16 3h7a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5h-7z" fill="#f5a400" />
    <rect x="7" y="7" width="18" height="9" rx="2.500" fill="#cfeaff" />
    <rect x="15" y="7" width="2" height="9" fill="#f5a400" />
    <circle cx="9.500" cy="21" r="2" fill="#fff" />
    <circle cx="22.500" cy="21" r="2" fill="#fff" />
    <rect x="7" y="25" width="5" height="5" rx="2" fill="#2b2238" />
    <rect x="20" y="25" width="5" height="5" rx="2" fill="#2b2238" />
  </Svg>
);
/** Misiones: médico y farmacia */
export const IcoMedic = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="7" width="26" height="21" rx="5" fill="#fff" />
    <path d="M16 7h8a5 5 0 0 1 5 5v11a5 5 0 0 1-5 5h-8z" fill="#f1f3f7" />
    <path d="M11 7V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2" fill="none" stroke="#e8495a" strokeWidth="2.800" />
    <path d="M13.500 12h5v3.500H22v5h-3.500V24h-5v-3.500H10v-5h3.500z" fill="#e8495a" />
  </Svg>
);
/** Misiones: ciencia */
export const IcoMicroscope = (p: P) => (
  <Svg {...p}>
    <path d="M12 3h8v3h-2v5l7 12a3.500 3.500 0 0 1-3 5H10a3.500 3.500 0 0 1-3-5l7-12V6h-2z" fill="#dff1fd" />
    <path d="M10.500 19h11l3.500 4a3.500 3.500 0 0 1-3 5H10a3.500 3.500 0 0 1-3-5z" fill="#22c79a" />
    <path d="M16 19h5.500l3.500 4a3.500 3.500 0 0 1-3 5h-6z" fill="#0a8f65" />
    <circle cx="13" cy="23" r="1.600" fill="#fff" />
    <circle cx="18" cy="25" r="1.200" fill="#fff" opacity=".8" />
    <rect x="11" y="2" width="10" height="3.500" rx="1.700" fill="#5a6072" />
  </Svg>
);
/** Misiones: amistades / reuniones */
export const IcoPeople = (p: P) => (
  <Svg {...p}>
    <circle cx="22" cy="10" r="5" fill="#ffb347" />
    <path d="M13 27a9 9 0 0 1 18 0v1H13z" fill="#ffb347" />
    <circle cx="11" cy="11" r="6" fill="#7c6cf0" />
    <path d="M1 28a10 10 0 0 1 20 0v1H1z" fill="#7c6cf0" />
    <path d="M11 18a10 10 0 0 1 10 10v1H11z" fill="#5b4bd6" />
  </Svg>
);
/** Misiones: sistemas y automatización */
export const IcoFlow = (p: P) => (
  <Svg {...p}>
    <path d="M9 9h8a4 4 0 0 1 4 4v3M9 23h14" fill="none" stroke="#c9ced8" strokeWidth="2.800" strokeLinecap="round" />
    <rect x="2" y="3" width="12" height="11" rx="3.500" fill="#22c79a" />
    <rect x="2" y="18" width="12" height="11" rx="3.500" fill="#ff8fa8" />
    <rect x="18" y="16" width="12" height="13" rx="3.500" fill="#7c6cf0" />
    <path d="M5 8h6M5 23h6M21 22h6" stroke="#fff" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);
/** Monedas */
export const IcoCoin = (p: P) => (
  <Svg {...p}>
    <circle cx="16" cy="17" r="12" fill="#d48a12" />
    <circle cx="16" cy="15.500" r="12" fill="#ffc53d" />
    <circle cx="16" cy="15.500" r="8.500" fill="#f5a623" />
    <path d="M16 9.500l1.800 3.700 4 .6-2.900 2.800.7 4-3.600-1.900-3.600 1.900.7-4-2.900-2.800 4-.6z" fill="#ffe28a" />
    <ellipse cx="10.500" cy="9.500" rx="2.600" ry="1.500" fill="#fff" opacity=".6" transform="rotate(-35 10.500 9.500)" />
  </Svg>
);
/** Protección de vida */
export const IcoShield = (p: P) => (
  <Svg {...p}>
    <path d="M16 3l11 4v8c0 7-5 12-11 14C10 27 5 22 5 15V7z" fill="#4aa8ff" />
    <path d="M16 3l11 4v8c0 7-5 12-11 14z" fill="#2f86e0" />
    <path d="M16 21c-4-2.700-5.500-5.200-4-7 1-1.200 3-1 4 .7 1-1.700 3-1.900 4-.7 1.500 1.800 0 4.300-4 7z" fill="#ff5a79" />
    <ellipse cx="10" cy="9" rx="2.500" ry="1.400" fill="#fff" opacity=".55" transform="rotate(-30 10 9)" />
  </Svg>
);
/** Cofre */
export const IcoChest = (p: P) => (
  <Svg {...p}>
    <rect x="4" y="14" width="24" height="13" rx="3" fill="#a8693d" />
    <path d="M4 15c0-6 2-9 6-9h12c4 0 6 3 6 9z" fill="#d9925a" />
    <path d="M9 7v19M23 7v19" stroke="#ffd36b" strokeWidth="2.400" />
    <rect x="13" y="13" width="6" height="6" rx="2" fill="#ffd36b" />
    <circle cx="16" cy="16" r="1" fill="#8a5428" />
  </Svg>
);
/** Sobre / buzón */
export const IcoMail = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="8" width="26" height="18" rx="3" fill="#ffd9a8" />
    <path d="M3 10l13 9 13-9" fill="none" stroke="#e9a35f" strokeWidth="2.200" strokeLinejoin="round" />
    <circle cx="16" cy="18" r="3.200" fill="#ff5a79" />
    <path d="M16 19.600c-1.400-.9-1.900-1.800-1.300-2.400.4-.4 1-.3 1.300.2.300-.5.900-.6 1.300-.2.600.6.1 1.500-1.300 2.400z" fill="#fff" />
  </Svg>
);
/** Potenciador (doble XP) */
export const IcoBoost = (p: P) => (
  <Svg {...p}>
    <path d="M16 3c5 3 8 8 8 13l-3 6H11l-3-6c0-5 3-10 8-13z" fill="#ff7a59" />
    <circle cx="16" cy="13" r="3.200" fill="#bde7ff" />
    <path d="M11 22l-4 5 6-2zM21 22l4 5-6-2z" fill="#f5a623" />
    <path d="M13 24h6l-3 6z" fill="#ffc53d" />
  </Svg>
);
