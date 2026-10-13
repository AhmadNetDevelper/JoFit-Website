import { SkeletonCardGrid, SkeletonHero, SkeletonPage } from "@/components/ui";

/** The brand's dark hero with its stats strip, then its shelf of products. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <SkeletonCardGrid />
    </SkeletonPage>
  );
}
