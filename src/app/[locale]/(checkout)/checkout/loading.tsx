import { SkeletonDarkBand, SkeletonHeroText, SkeletonPage, SkeletonPanel } from "@/components/ui";

/** The checkout: the compact deep hero, then the form cards beside the deep money panel. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDarkBand innerClassName="py-12 lg:py-14">
        <SkeletonHeroText />
      </SkeletonDarkBand>
      <section className="bg-canvas py-10 sm:py-12 lg:py-14">
        <div className="mx-auto grid w-full max-w-page items-start gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10 lg:px-8">
          <div className="space-y-6">
            <SkeletonPanel lines={4} />
            <SkeletonPanel lines={3} />
          </div>
          <div className="h-[420px] animate-pulse rounded-3xl bg-deep/90 motion-reduce:animate-none" />
        </div>
      </section>
    </SkeletonPage>
  );
}
