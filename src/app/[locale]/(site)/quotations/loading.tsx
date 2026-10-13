import { SkeletonCardGrid, SkeletonHeading, SkeletonHero, SkeletonPage } from "@/components/ui";

/** The dark hero (no stats strip), then the subjects a quote can cover. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero stats={false} />
      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
          <SkeletonHeading />
          <div className="mt-12">
            <SkeletonCardGrid count={3} media="none" band={false} />
          </div>
        </div>
      </section>
    </SkeletonPage>
  );
}
