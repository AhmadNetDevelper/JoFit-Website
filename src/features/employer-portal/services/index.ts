import { resolveService } from "@/services";

import type { EmployerPortalService } from "./employer-portal.contract";
import { httpEmployerPortalService } from "./employer-portal.http";
import { mockEmployerPortalService } from "./employer-portal.mock";

export const employerPortalService = resolveService<EmployerPortalService>("employer-portal", {
  mock: mockEmployerPortalService,
  http: httpEmployerPortalService,
});

export type { EmployerPortalService } from "./employer-portal.contract";
