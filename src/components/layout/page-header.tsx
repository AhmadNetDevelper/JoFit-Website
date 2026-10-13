import type { ReactNode } from "react";

/**
 * Every page renders exactly one `<h1>` through this component, which keeps the
 * heading hierarchy correct across the whole site by construction.
 */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p aria-hidden="true" className="mb-3 block h-0.5 w-8 rounded-full bg-accent" />
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-[15px] text-body">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
