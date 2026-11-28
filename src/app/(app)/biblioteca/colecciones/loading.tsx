import { Skel, SkelGrid, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader />
      <div className="skel h-14 max-w-xl" aria-hidden />
      <SkelGrid n={4} h="h-24" cols="sm:grid-cols-2" />
    </Skel>
  );
}
