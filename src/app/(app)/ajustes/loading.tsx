import { Skel, SkelHeader } from "@/components/Loader";

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skel>
        <SkelHeader banner sub={false} />
        <div className="skel h-72" aria-hidden />
        <div className="skel h-56" aria-hidden />
        <div className="skel h-64" aria-hidden />
      </Skel>
    </div>
  );
}
