import { Skel, SkelChips, SkelGrid, SkelHeader } from "@/components/Loader";

/** Espera de Explorar: buscador, accesos directos y misiones por tema. */
export default function Loading() {
  return (
    <Skel>
      <SkelHeader sub={false} />
      <div className="skel h-12" aria-hidden />
      <SkelChips n={5} />
      <SkelGrid n={6} h="h-28" cols="sm:grid-cols-2 xl:grid-cols-3" />
    </Skel>
  );
}
