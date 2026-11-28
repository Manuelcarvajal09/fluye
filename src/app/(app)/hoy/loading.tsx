import { Skel, SkelGrid, SkelHeader } from "@/components/Loader";

/** Espera de Hoy: misma estructura que la página (meta, misión, accesos y columna lateral). */
export default function Loading() {
  return (
    <Skel>
      <SkelHeader />
      <div className="grid gap-5 lg:grid-cols-12 lg:gap-6" aria-hidden>
        <div className="flex flex-col gap-5 lg:col-span-8">
          <div className="skel h-80 max-lg:order-1" />
          <div className="skel h-36 max-lg:order-2" />
          <div className="max-lg:order-3">
            <SkelGrid n={4} h="h-36" cols="grid-cols-2 sm:grid-cols-4" />
          </div>
        </div>
        <div className="flex flex-col gap-5 lg:col-span-4">
          <div className="skel h-40" />
          <div className="skel h-48" />
        </div>
      </div>
    </Skel>
  );
}
