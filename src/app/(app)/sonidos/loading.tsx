import { Skel, SkelGrid, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader banner />
      <div className="skel h-20 max-w-3xl" aria-hidden />
      <SkelGrid n={6} h="h-32" />
    </Skel>
  );
}
