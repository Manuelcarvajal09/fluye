import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Nunito } from "next/font/google";
import { cookies } from "next/headers";
import { ACCENT_IDS, type AccentId } from "@/lib/look";
import { ClerkProvider } from "@clerk/nextjs";
import { esMX } from "@clerk/localizations";
import "./globals.css";

const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"], display: "swap" });
const display = Bricolage_Grotesque({ variable: "--font-display", subsets: ["latin"], display: "swap", weight: ["600", "700", "800"] });

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
    { media: "(prefers-color-scheme: light)", color: "#f7f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1017" },
  ],
};

// Aplica el tema antes de pintar para evitar parpadeo.
const themeScript = `(function(){try{var t=localStorage.getItem('theme')||'system';var d=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}})()`;

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const accent = (await cookies()).get("fluye-accent")?.value;
  return (
    <html lang="es-MX" className={`${nunito.variable} ${display.variable} h-full antialiased`} data-accent={ACCENT_IDS.includes(accent as AccentId) ? accent : "esmeralda"} suppressHydrationWarning>
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
          appearance={{ variables: { colorPrimary: "#087a56", borderRadius: "0.9rem", fontFamily: "var(--font-nunito)" } }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
