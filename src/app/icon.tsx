import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Mark size={512} />, size);
}

export function Mark({ size }: { size: number }) {
  return (
    <div style={{ width: size, height: size, background: "#087a56", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size * 0.7} height={size * 0.7} viewBox="0 0 64 64">
        <path d="M10 40c7-12 14-12 22 0s15 12 22 0" stroke="#fff" strokeWidth="7" fill="none" strokeLinecap="round" />
        <path d="M10 24c7-12 14-12 22 0s15 12 22 0" stroke="#fff" strokeOpacity="0.55" strokeWidth="7" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}
