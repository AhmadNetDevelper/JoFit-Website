import { Skeleton, SkeletonPage, SkeletonPanel, SkeletonPortal } from "@/components/ui";

/** The portal: heading band, tab rail, four summary tiles, then panels beside an aside. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPortal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <li key={index} className="rounded-3xl border border-line bg-surface p-5 shadow-soft">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-3 h-8 w-16" />
            </li>
          ))}
        </ul>
        <div className="mt-10 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <SkeletonPanel lines={4} />
            <SkeletonPanel lines={3} />
          </div>
          <div className="space-y-6">
            <Skeleton tone="muted" className="h-48 w-full" />
            <SkeletonPanel lines={2} />
          </div>
        </div>
      </SkeletonPortal>
    </SkeletonPage>
  );
}
