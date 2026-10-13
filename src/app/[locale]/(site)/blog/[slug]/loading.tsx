import { Skeleton, SkeletonHero, SkeletonPage } from "@/components/ui";

const LINES = ["w-full", "w-full", "w-11/12", "w-full", "w-5/6", "w-full", "w-3/4"];

/** The article's dark hero with its byline, then the body beside the author card. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero stats={false} />
      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto grid w-full max-w-page gap-12 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16 lg:px-8">
          <div className="max-w-[68ch] space-y-3">
            {LINES.map((width, index) => (
              <Skeleton key={index} className={`h-4 ${width}`} />
            ))}
          </div>
          <Skeleton tone="muted" className="h-44 w-full" />
        </div>
      </section>
    </SkeletonPage>
  );
}
