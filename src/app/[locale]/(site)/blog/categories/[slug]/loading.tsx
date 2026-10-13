import { SkeletonCardGrid, SkeletonFilterBar, SkeletonHero, SkeletonPage } from "@/components/ui";

/** A journal category: the hero, the rail over its foot, then the article cards. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero stats={false} />
      <SkeletonFilterBar rows={1} />
      <SkeletonCardGrid count={3} />
    </SkeletonPage>
  );
}
