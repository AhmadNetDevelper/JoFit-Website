import { SkeletonCardGrid, SkeletonFilterBar, SkeletonHero, SkeletonPage } from "@/components/ui";

/** Dark hero with the stats strip, the filter band, then the card grid. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <SkeletonFilterBar rows={2} />
      <SkeletonCardGrid media="4/3" />
    </SkeletonPage>
  );
}
