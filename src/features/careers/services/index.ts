import { resolveService } from "@/services";

import type { CareersService } from "./careers.contract";
import { httpCareersService } from "./careers.http";
import { mockCareersService } from "./careers.mock";

export const careersService = resolveService<CareersService>("careers", {
  mock: mockCareersService,
  http: httpCareersService,
});

export type { CareersService } from "./careers.contract";
