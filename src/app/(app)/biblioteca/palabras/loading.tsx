import { Skel, SkelGrid, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader />
      <div className="skel h-24" aria-hidden />
      <div className="skel h-14" aria-hidden />
      <SkelGrid n={12} h="h-20" cols="sm:grid-cols-2 xl:grid-cols-3" />
    </Skel>
  );
}
