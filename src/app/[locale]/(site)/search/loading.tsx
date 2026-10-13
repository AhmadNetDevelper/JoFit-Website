import { Skeleton, SkeletonDarkBand, SkeletonHeading, SkeletonPage } from "@/components/ui";

/** The compact search hero (crumbs, title, the pill field, scope pills), then the five doors. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDarkBand innerClassName="py-12 lg:py-14">
        <Skeleton tone="dark" className="mb-6 h-3.5 w-32" />
        <Skeleton tone="dark" className="h-3.5 w-24" />
        <Skeleton tone="dark" className="mt-4 h-9 w-[min(100%,24rem)] sm:h-10" />
        <Skeleton tone="dark" className="mt-5 h-4 w-[min(100%,34rem)]" />
        <Skeleton tone="dark" className="mt-10 h-14 w-full max-w-2xl rounded-full" />
        <div className="mt-5 flex max-w-3xl flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} tone="dark" className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </SkeletonDarkBand>
      <section className="bg-canvas py-16 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
          <SkeletonHeading />
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, index) => (
              <li key={index} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 lg:flex-col lg:items-start lg:p-6">
                <Skeleton tone="muted" className="size-12 shrink-0 rounded-full" />
                <Skeleton className="h-5 w-28" />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SkeletonPage>
  );
}
