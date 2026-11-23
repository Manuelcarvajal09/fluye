"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Si cambia el día local (medianoche, viaje), vuelve a pedir la página: temporada, retos y racha se recalculan sin redeploy. */
export function DayWatch() {
  const router = useRouter();
  useEffect(() => {
    const day = () => new Date().toDateString();
    let current = day();
    const t = setInterval(() => {
      if (day() !== current) {
        current = day();
        router.refresh();
      }
    }, 60_000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}
