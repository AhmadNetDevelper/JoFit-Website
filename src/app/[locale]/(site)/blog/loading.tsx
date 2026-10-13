import { SkeletonCardGrid, SkeletonFilterBar, SkeletonHero, SkeletonPage } from "@/components/ui";

/** The journal: the hero with its figures, the rail over its foot, then the article cards. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <SkeletonFilterBar rows={1} />
      <SkeletonCardGrid count={3} />
    </SkeletonPage>
  );
}
