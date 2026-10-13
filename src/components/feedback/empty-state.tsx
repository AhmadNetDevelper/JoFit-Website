import type { ReactNode } from "react";

import { StateMessage } from "./state-message";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return <StateMessage title={title} description={description} action={action} />;
}
