import { Skeleton, SkeletonPage, SkeletonPanel, SkeletonPortal } from "@/components/ui";

/** One order: the five-step tracker, then the lines beside the totals aside. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPortal>
        <div className="mb-8 grid grid-cols-5 gap-1.5">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-2" />
          ))}
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <SkeletonPanel lines={6} />
          <div className="space-y-6">
            <SkeletonPanel lines={4} muted />
            <SkeletonPanel lines={2} />
          </div>
        </div>
      </SkeletonPortal>
    </SkeletonPage>
  );
}
