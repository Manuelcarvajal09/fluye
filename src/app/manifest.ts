import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Fluye · Inglés real",
    short_name: "Fluye",
    description: "Phrasal verbs, expresiones, escucha, pronunciación y repaso espaciado.",
    start_url: "/hoy",
    display: "standalone",
    orientation: "any",
    background_color: "#f7f8fb",
    theme_color: "#087a56",
    lang: "es-MX",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
