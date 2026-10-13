import { Skeleton, SkeletonPage, SkeletonPanel, SkeletonPortal } from "@/components/ui";

/** The employer area: heading band, tab rail, the five figure tiles, then panels beside an aside. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonPortal>
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => (
            <li
              key={index}
              className={`rounded-3xl border border-line bg-surface p-5 shadow-soft sm:p-6 ${index === 4 ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="mt-5 h-8 w-14" />
              <Skeleton className="mt-3 h-3 w-24" />
            </li>
          ))}
        </ul>
        <div className="mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <SkeletonPanel lines={4} />
            <SkeletonPanel lines={3} />
          </div>
          <div className="space-y-6">
            <SkeletonPanel lines={2} />
            <div className="rounded-3xl bg-deep p-6 sm:p-7">
              <Skeleton tone="dark" className="h-5 w-40" />
              <Skeleton tone="dark" className="mt-5 h-4 w-full" />
              <Skeleton tone="dark" className="mt-2.5 h-4 w-2/3" />
              <Skeleton tone="dark" className="mt-6 h-11 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </SkeletonPortal>
    </SkeletonPage>
  );
}
