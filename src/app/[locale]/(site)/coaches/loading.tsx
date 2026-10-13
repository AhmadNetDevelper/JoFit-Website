import { SkeletonCardGrid, SkeletonFilterBar, SkeletonHero, SkeletonPage } from "@/components/ui";

/** The deep hero with its figures, the filter panel over its foot, then the card grid. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <SkeletonFilterBar rows={2} />
      <SkeletonCardGrid media="3/2" />
    </SkeletonPage>
  );
}
