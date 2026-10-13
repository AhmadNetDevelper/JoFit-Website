import { SkeletonDarkBand, SkeletonHeroText, SkeletonPage, SkeletonPanel } from "@/components/ui";

/** The application: the compact deep hero, then the form card beside the job's summary and the deep "next" panel. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDarkBand innerClassName="py-12 lg:py-14">
        <SkeletonHeroText />
      </SkeletonDarkBand>
      <section className="bg-surface py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-page items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-10 lg:px-8">
          <SkeletonPanel lines={9} />
          <div className="space-y-6">
            <SkeletonPanel lines={4} />
            <div aria-hidden="true" className="h-56 w-full animate-pulse rounded-[2rem] bg-deep motion-reduce:animate-none" />
          </div>
        </div>
      </section>
    </SkeletonPage>
  );
}
