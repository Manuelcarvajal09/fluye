import type { Metadata, Viewport } from "next";
import { Nunito, Plus_Jakarta_Sans } from "next/font/google";
import { cookies } from "next/headers";
import { ACCENT_IDS, type AccentId } from "@/lib/look";
import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import "./globals.css";
import "./armario.css";
import "./amigos.css";
import "./botones.css";

// Títulos en Nunito (800–900) y cuerpo en Plus Jakarta Sans; next/font las sirve desde el propio dominio.
const display = Nunito({ variable: "--font-display", subsets: ["latin"], display: "swap", weight: ["700", "800", "900"] });
const body = Plus_Jakarta_Sans({ variable: "--font-body", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Fluye · Inglés real", template: "%s · Fluye" },
  description: "Inglés real de EE. UU. y Canadá: phrasal verbs, expresiones, escucha, pronunciación y repaso espaciado.",
  applicationName: "Fluye",
  appleWebApp: { capable: true, title: "Fluye", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f8f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101722" },
  ],
};

// Aplica el tema antes de pintar para evitar parpadeo.
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light';if(localStorage.getItem('motion')==='reduced')document.documentElement.dataset.motion='reduced'}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const accent = (await cookies()).get("fluye-accent")?.value;
  return (
    <html lang="es-MX" className={`${body.variable} ${display.variable} h-full antialiased`} data-accent={ACCENT_IDS.includes(accent as AccentId) ? accent : "esmeralda"} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <ClerkProvider
          localization={esMX}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          signInFallbackRedirectUrl="/hoy"
          signUpFallbackRedirectUrl="/bienvenida"
          appearance={{ variables: { colorPrimary: "#087a56", borderRadius: "0.9rem", fontFamily: "var(--font-body)" } }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
