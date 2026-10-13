import type { ReactNode } from "react";

/**
 * The page's one measure. Its width is a theme value, so an operator can run the
 * site wide or narrow without a component knowing.
 */
export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>
  );
}
