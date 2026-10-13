import type { ReactNode } from "react";

/**
 * Content available to screen readers but not shown visually. Used for
 * accessible names and live-region announcements.
 */
export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
