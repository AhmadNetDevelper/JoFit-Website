import { SkeletonDetail, SkeletonPage } from "@/components/ui";

/** The coach's deep hero with the facts card in the end column, then the profile body. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDetail />
    </SkeletonPage>
  );
}
