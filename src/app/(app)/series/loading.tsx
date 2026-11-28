import { Skel, SkelChips, SkelGrid, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader />
      <SkelChips n={3} />
      <SkelGrid n={6} h="h-32" />
    </Skel>
  );
}
