import { Skeleton, SkeletonHeading, SkeletonHero, SkeletonPage } from "@/components/ui";

/** The sport's deep hero with its four figures, then the four door panels. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <section className="bg-surface py-16 sm:py-20 lg:py-24">
        <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
          <SkeletonHeading />
          <ul className="mt-12 grid gap-6 lg:grid-cols-2">
            {Array.from({ length: 4 }, (_, panel) => (
              <li key={panel} className="rounded-3xl border border-line bg-surface p-6 sm:p-7">
                <div className="flex items-center gap-4">
                  <Skeleton tone="muted" className="size-12 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="mt-6 space-y-4">
                  {Array.from({ length: 3 }, (_, row) => (
                    <Skeleton key={row} className="h-10 w-full" />
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </SkeletonPage>
  );
}
