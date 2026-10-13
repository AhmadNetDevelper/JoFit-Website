import { SkeletonDetail, SkeletonPage } from "@/components/ui";

/** A job: the deep hero with the apply card in its end column, then the role beside its aside. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDetail />
    </SkeletonPage>
  );
}
