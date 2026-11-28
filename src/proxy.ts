import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/owner";
import { accessFor } from "@/lib/access";

// Solo propietario: se responde 404 aquí, antes de que la página empiece a enviarse (con streaming ya no podría cambiar el código).
const isAdmin = createRouteMatcher(["/admin(.*)", "/api/admin(.*)"]);
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)", "/manifest.webmanifest", "/icon(.*)", "/apple-icon(.*)", "/audio/(.*)"]);

// En producción solo se aceptan sesiones emitidas para el dominio de la app.
const authorizedParties = process.env.VERCEL_ENV === "production" && process.env.NEXT_PUBLIC_APP_URL ? [process.env.NEXT_PUBLIC_APP_URL] : undefined;

export default clerkMiddleware(
  async (auth, req) => {
    if (!isPublic(req)) await auth.protect();
    if (isAdmin(req)) {
      const { userId } = await auth();
      if (!isOwner(userId)) {
        // Igual que en el resto de la app: sin acceso → /sin-acceso; con acceso pero sin ser propietario → no existe.
        const page = !req.nextUrl.pathname.startsWith("/api/");
        if (page && (await accessFor(userId!)) === "denied") return NextResponse.redirect(new URL("/sin-acceso", req.url));
        return new NextResponse("No encontrado", { status: 404 });
      }
    }
  },
  { authorizedParties, signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export const config = {
  matcher: ["/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)", "/(api|trpc)(.*)"],
};
