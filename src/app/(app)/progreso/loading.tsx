import { Skel, SkelChips, SkelGrid, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader banner sub={false} />
      <SkelChips n={4} />
      <SkelGrid n={4} h="h-28" cols="grid-cols-2 lg:grid-cols-4" />
      <SkelGrid n={2} h="h-56" cols="lg:grid-cols-2" />
    </Skel>
  );
}
