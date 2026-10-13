import { resolveService } from "@/services";

import type { SupportService } from "./support.contract";
import { httpSupportService } from "./support.http";
import { mockSupportService } from "./support.mock";

export const supportService = resolveService<SupportService>("support", {
  mock: mockSupportService,
  http: httpSupportService,
});

export type { SupportService } from "./support.contract";
