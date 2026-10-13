import { VisuallyHidden } from "@/components/ui";

/**
 * Placeholder shown while a Suspense boundary resolves. The final skeleton
 * shapes come with the design; the accessible announcement does not change.
 */
export function PendingState({ label, rows = 3 }: { label: string; rows?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-2">
      <VisuallyHidden>{label}</VisuallyHidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} aria-hidden="true" className="h-16 animate-pulse rounded-2xl bg-canvas motion-reduce:animate-none" />
      ))}
    </div>
  );
}
