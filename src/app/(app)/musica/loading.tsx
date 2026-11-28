import { Skel, SkelChips, SkelGrid, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader banner />
      <SkelChips n={5} />
      <SkelGrid n={4} h="h-64" cols="lg:grid-cols-2" />
    </Skel>
  );
}
