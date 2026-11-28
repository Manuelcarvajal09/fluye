import { Skel, SkelGrid, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader banner />
      <SkelGrid n={2} h="h-20" cols="sm:grid-cols-2" />
      <div className="skel h-14" aria-hidden />
      <SkelGrid n={9} h="h-24" />
    </Skel>
  );
}
