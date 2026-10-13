import { Skeleton, SkeletonDarkBand, SkeletonHeroText, SkeletonPage } from "@/components/ui";

/** The compact hero, then the reservation card beside the deep "what happens next" panel. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDarkBand innerClassName="py-12 lg:py-14">
        <SkeletonHeroText />
      </SkeletonDarkBand>
      <section className="bg-surface py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-page items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-10 lg:px-8">
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-soft sm:p-8 lg:p-10">
            <Skeleton className="h-8 w-64" />
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} tone="muted" className="h-18 w-full rounded-2xl" />
              ))}
              <Skeleton tone="muted" className="h-18 w-full rounded-2xl sm:col-span-2" />
            </div>
            <Skeleton className="mt-6 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-3/4" />
            <Skeleton className="mt-7 h-13 w-full rounded-full" />
          </div>
          <Skeleton tone="muted" className="h-136 w-full rounded-[2rem]" />
        </div>
      </section>
    </SkeletonPage>
  );
}
