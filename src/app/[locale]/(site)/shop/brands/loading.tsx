import { SkeletonCardGrid, SkeletonHeading, SkeletonHero, SkeletonPage } from "@/components/ui";

/** Dark hero, then one block per brand: its heading and a three-card preview. */
export default function Loading() {
  return (
    <SkeletonPage>
      <SkeletonHero />
      <section className="bg-surface py-16 lg:py-20">
        <div className="mx-auto w-full max-w-page space-y-20 px-4 sm:px-6 lg:px-8">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index}>
              <SkeletonHeading />
              <div className="mt-10">
                <SkeletonCardGrid count={3} band={false} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
