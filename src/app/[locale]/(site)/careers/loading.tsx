import { SkeletonCardGrid, SkeletonFilterBar, SkeletonHero, SkeletonPage } from "@/components/ui";

/** The board: dark hero with its stat strip, the filter rail, then the job grid. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <SkeletonFilterBar rows={5} />
      <SkeletonCardGrid media="none" />
    </SkeletonPage>
  );
}
