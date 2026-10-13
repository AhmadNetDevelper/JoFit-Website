import { SkeletonCardGrid, SkeletonFilterBar, SkeletonHero, SkeletonPage } from "@/components/ui";

/** The directory: the deep hero with its figures, the search panel, then the company cards. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <SkeletonFilterBar rows={0} />
      <SkeletonCardGrid media="none" />
    </SkeletonPage>
  );
}
