import { SkeletonDetail, SkeletonPage } from "@/components/ui";

/** The light split hero (media beside the buy column), the facts band, the body. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonDetail />
    </SkeletonPage>
  );
}
