import { SkeletonDetail, SkeletonPage } from "@/components/ui";

/** A company: the deep hero with its register card in the end column, then about + contact. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDetail />
    </SkeletonPage>
  );
}
