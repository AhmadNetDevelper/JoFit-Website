import type { ReactNode } from "react";

/**
 * THE CARD: white, a hairline in the brand's own grey-green, 24px corners and
 * a soft shadow. `interactive` adds the lift a clickable card earns on hover;
 * a card that only holds information should not pretend to be clickable.
 */
export function Card({
  children,
  interactive = false,
  className = "",
}: {
  children: ReactNode;
  interactive?: boolean;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-line bg-surface p-7 shadow-soft",
        interactive
          ? "transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-lift"
          : "",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
