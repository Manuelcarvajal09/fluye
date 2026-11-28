// Motivos vectoriales originales de las temáticas (planos, sin contornos, en 2–3 tonos como el resto del arte de Fluye).
// Cada uno se dibuja en un lienzo de 32×32 y es decorativo (aria-hidden).
import type { ReactNode } from "react";

const M = ({ children, size = 32 }: { children: ReactNode; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden focusable="false">
    {children}
  </svg>
);

export const MOTIFS: Record<string, (p: { size?: number }) => ReactNode> = {
  snow: (p) => (
    <M {...p}>
      <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M16 4v24M5.6 10l20.8 12M5.6 22l20.8-12" />
        <path d="M13 6.5l3 2.5 3-2.5M13 25.5l3-2.5 3 2.5M6.5 13.5l3.6 1.2-1-3.6M25.5 18.5l-3.6-1.2 1 3.6M6.5 18.5l3.6-1.2-1 3.6M25.5 13.5l-3.6 1.2 1-3.6" />
      </g>
    </M>
  ),
  bauble: (p) => (
    <M {...p}>
      <rect x="13" y="3" width="6" height="5" rx="1.5" fill="#d9a520" />
      <circle cx="16" cy="19" r="11" fill="#d62f3f" />
      <path d="M5.5 17c6 3 15 3 21 0" stroke="#ffd166" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="14" r="2.6" fill="#ff8a95" />
    </M>
  ),
  baubleGreen: (p) => (
    <M {...p}>
      <rect x="13" y="3" width="6" height="5" rx="1.5" fill="#d9a520" />
      <circle cx="16" cy="19" r="11" fill="#1f8a4c" />
      <path d="M5.5 21c6-3 15-3 21 0" stroke="#ffd166" strokeWidth="2.2" fill="none" />
      <circle cx="12" cy="14" r="2.6" fill="#6fd39a" />
    </M>
  ),
  bell: (p) => (
    <M {...p}>
      <path d="M16 4c-6 0-9 5-9 11v6l-3 4h24l-3-4v-6c0-6-3-11-9-11z" fill="#f2b632" />
      <path d="M16 4c-3 1-5 5-5 11v6l-2 4h7z" fill="#ffd36b" />
      <circle cx="16" cy="27.5" r="3" fill="#c98a12" />
      <path d="M11 6c-3 1-4 3-4 3M21 6c3 1 4 3 4 3" stroke="#d62f3f" strokeWidth="2.6" strokeLinecap="round" />
    </M>
  ),
  star: (p) => (
    <M {...p}>
      <path d="M16 3l3.8 8 8.7 1-6.4 6 1.7 8.6L16 22.4 8.2 26.6 9.9 18 3.5 12l8.7-1z" fill="#ffd166" />
      <path d="M16 3l3.8 8 8.7 1-6.4 6z" fill="#ffe7a3" />
    </M>
  ),
  sparkle: (p) => (
    <M {...p}>
      <path d="M16 3c1 7 3 9 10 10-7 1-9 3-10 10-1-7-3-9-10-10 7-1 9-3 10-10z" fill="#fff6cf" />
    </M>
  ),
  pine: (p) => (
    <M {...p}>
      <path d="M16 2l-8 11h4l-6 8h5l-5 7h20l-5-7h5l-6-8h4z" fill="#1f7a45" />
      <path d="M16 2l-8 11h4l-6 8h5l-5 7h10z" fill="#2c9a5a" />
      <rect x="14" y="27" width="4" height="4" fill="#8a5a2b" />
    </M>
  ),
  gift: (p) => (
    <M {...p}>
      <rect x="5" y="12" width="22" height="16" rx="2" fill="#5847d4" />
      <rect x="4" y="9" width="24" height="5" rx="1.5" fill="#7b6cf0" />
      <rect x="14" y="9" width="4" height="19" fill="#ffd166" />
      <path d="M16 9c-3-6-9-4-6 0M16 9c3-6 9-4 6 0" stroke="#ffd166" strokeWidth="2.4" fill="none" />
    </M>
  ),
  candy: (p) => (
    <M {...p}>
      <path d="M12 29V12a5 5 0 0 1 10 0" stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M12 29V12a5 5 0 0 1 10 0" stroke="#e23b4e" strokeWidth="5" strokeDasharray="3 3" fill="none" strokeLinecap="round" />
    </M>
  ),
  pumpkin: (p) => (
    <M {...p}>
      <path d="M16 7c-1-3 1-5 3-5" stroke="#4d7a2a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <ellipse cx="16" cy="19" rx="13" ry="10" fill="#f07a1a" />
      <ellipse cx="16" cy="19" rx="5" ry="10" fill="#ff9a3c" />
      <path d="M10 17l2.5-2.5L15 17zM17 17l2.5-2.5L22 17zM10 22c3 2 9 2 12 0l-2 1-2-1-2 1-2-1-2 1z" fill="#3a1f0a" />
    </M>
  ),
  bat: (p) => (
    <M {...p}>
      <path d="M16 12c-2 0-3 2-3 2-3-4-8-5-12-3 3 1 4 4 3 7 2-1 4-1 5 1 1-2 3-2 4 0 1 2 3 2 3 2s2 0 3-2c1-2 3-2 4 0 1-2 3-2 5-1-1-3 0-6 3-7-4-2-9-1-12 3 0 0-1-2-3-2z" fill="#3a2a4a" />
      <circle cx="14.5" cy="15" r=".9" fill="#ffd166" />
      <circle cx="17.5" cy="15" r=".9" fill="#ffd166" />
    </M>
  ),
  moon: (p) => (
    <M {...p}>
      <path d="M21 3a13 13 0 1 0 8 22A11 11 0 0 1 21 3z" fill="#ffe7a3" />
      <circle cx="13" cy="14" r="2" fill="#f5d27a" />
      <circle cx="17" cy="22" r="1.5" fill="#f5d27a" />
    </M>
  ),
  marigold: (p) => (
    <M {...p}>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="16" cy="8" rx="4" ry="6" fill="#ff9d1c" transform={`rotate(${a} 16 16)`} />
      ))}
      {[22, 67, 112, 157, 202, 247, 292, 337].map((a) => (
        <ellipse key={a} cx="16" cy="10" rx="3" ry="4.5" fill="#ffc23d" transform={`rotate(${a} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="3.5" fill="#d96a00" />
    </M>
  ),
  skull: (p) => (
    <M {...p}>
      <path d="M16 3C9 3 5 8 5 14c0 4 2 6 4 7v4c0 2 2 3 3 3h8c1 0 3-1 3-3v-4c2-1 4-3 4-7 0-6-4-11-11-11z" fill="#fff8f0" />
      <circle cx="11.5" cy="15" r="3.4" fill="#d1478f" />
      <circle cx="20.5" cy="15" r="3.4" fill="#3aa9d6" />
      <path d="M16 18l-1.6 3h3.2z" fill="#3a2030" />
      <path d="M12 25v-2M14.7 25v-2M17.3 25v-2M20 25v-2" stroke="#3a2030" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M16 5l1.4 2.6 2.6.4-1.9 1.8.5 2.7L16 11l-2.6 1.5.5-2.7L12 8l2.6-.4z" fill="#ffb02e" />
    </M>
  ),
  candle: (p) => (
    <M {...p}>
      <rect x="11" y="13" width="10" height="16" rx="2" fill="#fff4dc" />
      <path d="M16 3c3 4 3 7 0 9-3-2-3-5 0-9z" fill="#ffb02e" />
      <path d="M16 6c1.5 2 1.5 3.5 0 4.5-1.5-1-1.5-2.5 0-4.5z" fill="#fff1a8" />
    </M>
  ),
  heart: (p) => (
    <M {...p}>
      <path d="M16 28S3 20 3 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 3.5C29 20 16 28 16 28z" fill="#e23b6a" />
      <path d="M9 8.5a4 4 0 0 0-3 4" stroke="#ff9ab8" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </M>
  ),
  letter: (p) => (
    <M {...p}>
      <rect x="3" y="8" width="26" height="18" rx="2.5" fill="#fff6f8" />
      <path d="M3.5 9.5l12.5 9 12.5-9" stroke="#f0b8c8" strokeWidth="2" fill="none" />
      <path d="M16 21s-4-2.4-4-5a2 2 0 0 1 4-1 2 2 0 0 1 4 1c0 2.6-4 5-4 5z" fill="#e23b6a" />
    </M>
  ),
  maple: (p) => (
    <M {...p}>
      <path d="M16 2l2.5 5 3-1.5-.8 6 4.8-3.2.8 2.6 3.2.4-3 4 1.2 1.6-6 1.2 1 3.2-4.5-1.2V30h-1.4v-5.9L12.3 25.3l1-3.2-6-1.2 1.2-1.6-3-4 3.2-.4.8-2.6 4.8 3.2-.8-6 3 1.5z" fill="#d6431c" />
    </M>
  ),
  leafGold: (p) => (
    <M {...p}>
      <path d="M6 26C6 12 14 5 27 4c-1 13-8 21-21 22z" fill="#e8a317" />
      <path d="M6 26C12 19 17 13 24 7" stroke="#b77a0a" strokeWidth="1.8" fill="none" />
    </M>
  ),
  flower: (p) => (
    <M {...p}>
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="16" cy="9" rx="5" ry="6.5" fill="#ff8fbf" transform={`rotate(${a} 16 16)`} />
      ))}
      <circle cx="16" cy="16" r="4" fill="#ffd166" />
    </M>
  ),
  petal: (p) => (
    <M {...p}>
      <path d="M16 4c6 4 8 12 0 24C8 16 10 8 16 4z" fill="#ffb3d1" />
    </M>
  ),
  butterfly: (p) => (
    <M {...p}>
      <path d="M16 16C12 6 4 6 4 12c0 4 5 5 12 4zM16 16c4-10 12-10 12-4 0 4-5 5-12 4zM16 16c-6 1-9 5-7 8 2 2 6 0 7-8zM16 16c6 1 9 5 7 8-2 2-6 0-7-8z" fill="#8a6cf0" />
      <rect x="15" y="9" width="2" height="15" rx="1" fill="#3a2a4a" />
    </M>
  ),
  sun: (p) => (
    <M {...p}>
      <g stroke="#ffb02e" strokeWidth="2.6" strokeLinecap="round">
        <path d="M16 2v4M16 26v4M2 16h4M26 16h4M6 6l2.8 2.8M23.2 23.2L26 26M6 26l2.8-2.8M23.2 8.8L26 6" />
      </g>
      <circle cx="16" cy="16" r="7.5" fill="#ffd166" />
    </M>
  ),
  watermelon: (p) => (
    <M {...p}>
      <path d="M3 10a13 13 0 0 0 26 0z" fill="#2c9a5a" />
      <path d="M5.5 10a10.5 10.5 0 0 0 21 0z" fill="#ff5a6e" />
      <g fill="#2a1a1a">
        <ellipse cx="11" cy="14" rx="1" ry="1.6" />
        <ellipse cx="16" cy="16" rx="1" ry="1.6" />
        <ellipse cx="21" cy="14" rx="1" ry="1.6" />
      </g>
    </M>
  ),
  cup: (p) => (
    <M {...p}>
      <path d="M12 3c-2 2 2 3 0 5M17 3c-2 2 2 3 0 5" stroke="#c9b3a3" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M5 11h18v8a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8z" fill="#f4ede6" />
      <path d="M23 13h2a4 4 0 0 1 0 8h-2" stroke="#f4ede6" strokeWidth="2.6" fill="none" />
      <rect x="5" y="11" width="18" height="3.5" fill="#7a4a2a" />
    </M>
  ),
  bean: (p) => (
    <M {...p}>
      <ellipse cx="16" cy="16" rx="8" ry="11" fill="#6b3f22" transform="rotate(-25 16 16)" />
      <path d="M12 7c4 6 4 12 8 18" stroke="#3e2210" strokeWidth="2" fill="none" />
    </M>
  ),
  plant: (p) => (
    <M {...p}>
      <path d="M10 20h12l-2 9h-8z" fill="#c26b3a" />
      <path d="M16 20c0-6-6-8-9-7 0 4 4 7 9 7zM16 20c0-7 5-10 9-9 0 5-4 9-9 9zM16 20V9" fill="#5f9a4e" stroke="#4a7d3c" strokeWidth="1.4" />
    </M>
  ),
  vinyl: (p) => (
    <M {...p}>
      <circle cx="16" cy="16" r="13" fill="#2a2a2a" />
      <circle cx="16" cy="16" r="9" fill="none" stroke="#444" strokeWidth="1" />
      <circle cx="16" cy="16" r="4.5" fill="#e0b08f" />
      <circle cx="16" cy="16" r="1.2" fill="#2a2a2a" />
    </M>
  ),
  neonBolt: (p) => (
    <M {...p}>
      <path d="M18 3L7 18h7l-2 11 11-15h-7z" fill="none" stroke="#ff4fd8" strokeWidth="2.2" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 3px #ff4fd8)" }} />
    </M>
  ),
  neonRing: (p) => (
    <M {...p}>
      <circle cx="16" cy="16" r="10" fill="none" stroke="#3ee8ff" strokeWidth="2.2" style={{ filter: "drop-shadow(0 0 3px #3ee8ff)" }} />
    </M>
  ),
  aurora: (p) => (
    <M {...p}>
      <path d="M2 20c6-10 10 4 15-6s9-2 13-8" stroke="#45e3b5" strokeWidth="3.4" fill="none" strokeLinecap="round" opacity=".85" />
      <path d="M2 25c6-8 11 2 16-5s8-2 12-6" stroke="#b79bff" strokeWidth="2.6" fill="none" strokeLinecap="round" opacity=".75" />
    </M>
  ),
  crown: (p) => (
    <M {...p}>
      <path d="M4 24l2-14 6 6 4-9 4 9 6-6 2 14z" fill="#f2b632" />
      <rect x="4" y="24" width="24" height="4" rx="1" fill="#d9951a" />
      <circle cx="16" cy="18" r="2" fill="#d62f3f" />
      <circle cx="9" cy="20" r="1.5" fill="#3aa9d6" />
      <circle cx="23" cy="20" r="1.5" fill="#3aa9d6" />
    </M>
  ),
  rosca: (p) => (
    <M {...p}>
      <ellipse cx="16" cy="17" rx="13" ry="9" fill="#d8954a" />
      <ellipse cx="16" cy="17" rx="6" ry="3.6" fill="var(--bg, #fbf6ec)" />
      <rect x="6" y="11" width="5" height="2.4" rx="1" fill="#e23b4e" transform="rotate(-20 8 12)" />
      <rect x="20" y="10" width="5" height="2.4" rx="1" fill="#2c9a5a" transform="rotate(15 22 11)" />
      <rect x="23" y="18" width="4" height="2.2" rx="1" fill="#ffd166" />
      <rect x="5" y="19" width="4" height="2.2" rx="1" fill="#2c9a5a" />
    </M>
  ),
  tamal: (p) => (
    <M {...p}>
      <path d="M8 6c8-3 16 2 18 9-2 8-10 12-18 10-4-6-4-13 0-19z" fill="#d9c27a" />
      <path d="M12 10c5-1 9 2 10 6-1 4-5 7-10 6-2-4-2-8 0-12z" fill="#f2dd94" />
      <path d="M8 6l-3-2M8 25l-3 3" stroke="#b39a52" strokeWidth="2.2" strokeLinecap="round" />
    </M>
  ),
  papel: (p) => (
    <M {...p}>
      <path d="M2 2h28v20l-3.5 4-3.5-4-3.5 4-3.5-4-3.5 4-3.5-4-3.5 4L2 22z" fill="currentColor" />
      <path d="M10 9h4v4h-4zM18 9h4v4h-4zM14 15l2-2 2 2-2 2z" fill="var(--bg, #fff)" opacity=".85" />
    </M>
  ),
  moose: (p) => (
    <M {...p}>
      <path d="M8 6c-3 0-4 3-2 5 2 1 4 0 5-1M24 6c3 0 4 3 2 5-2 1-4 0-5-1" stroke="#7a4a2a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M11 10h10c2 3 1 8-2 11l-1 7h-4l-1-7c-3-3-4-8-2-11z" fill="#8a5a3a" />
      <circle cx="13.5" cy="14" r="1" fill="#2a1a10" />
      <circle cx="18.5" cy="14" r="1" fill="#2a1a10" />
    </M>
  ),
  light: (p) => (
    <M {...p}>
      <rect x="14" y="2" width="4" height="5" rx="1" fill="#6b6b6b" />
      <path d="M16 6c-5 4-6 11-1 18 5-7 6-14 1-18z" fill="currentColor" />
    </M>
  ),
};
