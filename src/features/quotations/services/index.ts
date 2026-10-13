import { resolveService } from "@/services";

import type { QuotationsService } from "./quotations.contract";
import { httpQuotationsService } from "./quotations.http";
import { mockQuotationsService } from "./quotations.mock";

export const quotationsService = resolveService<QuotationsService>("quotations", {
  mock: mockQuotationsService,
  http: httpQuotationsService,
});

export type { QuotationsService } from "./quotations.contract";
