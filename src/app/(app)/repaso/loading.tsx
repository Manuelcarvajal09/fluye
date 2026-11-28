import { Skel, SkelChips, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <Skel>
      <SkelHeader banner />
      <SkelChips n={4} />
      <div className="skel h-80 w-full max-w-2xl" aria-hidden />
    </Skel>
  );
}
