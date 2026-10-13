import { SkeletonCardGrid, SkeletonHero, SkeletonPage } from "@/components/ui";

/** Dark hero with the stats strip, then the grid of sport cards (icon, no photo). */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <SkeletonCardGrid media="none" />
    </SkeletonPage>
  );
}
